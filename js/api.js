// ============================================================
// API LAYER — Supabase REST API wrapper
// All database calls go through these functions
// ============================================================

const API = {
    // Base headers for every request
    _headers() {
        return {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    // Generic GET request
    async _get(path) {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/${path}`;
        const res = await fetch(url, { headers: this._headers() });
        if (!res.ok) {
            throw new Error(`API Error (${res.status}): ${await res.text()}`);
        }
        return res.json();
    },

    // Generic POST request
    async _post(path, body) {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/${path}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            throw new Error(`API Error (${res.status}): ${await res.text()}`);
        }
        return res.json();
    },

    // ========================================================
    // EMPLOYEE / MANPOWER
    // ========================================================
    
    /**
     * Verify employee by ID and return their info
     * @param {number} empId Employee ID
     * @returns {Object|null} Employee object or null if not found
     */
    async verifyEmployee(empId) {
        const data = await this._get(`manpower?employee_id=eq.${empId}&is_active=eq.true&select=*`);
        return data.length > 0 ? data[0] : null;
    },

    /**
     * Get trainer info (same as employee lookup, but explicit)
     */
    async getTrainerInfo(trainerId) {
        return this.verifyEmployee(trainerId);
    },

    // ========================================================
    // DROPDOWNS
    // ========================================================

    /**
     * Get all lines for a given plant
     */
    async getLinesForPlant(plant) {
        const data = await this._get(
            `lines?plant=eq.${encodeURIComponent(plant)}&is_active=eq.true&select=line&order=display_order`
        );
        return data.map(r => r.line);
    },

    /**
     * Get all active models
     */
    async getModels() {
        const data = await this._get(`models?is_active=eq.true&select=model_name&order=display_order`);
        return data.map(r => r.model_name);
    },

    /**
     * Get all grades for a given model
     */
    async getGradesForModel(model) {
        const data = await this._get(
            `grades?model_name=eq.${encodeURIComponent(model)}&is_active=eq.true&select=grade_name&order=display_order`
        );
        return data.map(r => r.grade_name);
    },

    /**
     * Get all processes for a given grade
     */
    async getProcessesForGrade(grade) {
        const data = await this._get(
            `processes?grade_name=eq.${encodeURIComponent(grade)}&is_active=eq.true&select=process_name&order=display_order`
        );
        return data.map(r => r.process_name);
    },

    /**
     * Get required hours for a model + process combination
     */
    async getRequiredHours(model, processName) {
        const data = await this._get(
            `avg_hours?model_name=eq.${encodeURIComponent(model)}&process_name=eq.${encodeURIComponent(processName)}&select=average_hours`
        );
        return data.length > 0 ? Number(data[0].average_hours) : null;
    },

    /**
     * Get sum of previous training hours for an employee on this grade+process
     */
    async getPreviousHours(userId, grade, processName) {
        // Use RPC function (more efficient than client-side sum)
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_previous_training_hours`;
        const res = await fetch(url, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({
                p_user_id: userId,
                p_grade: grade,
                p_process: processName
            })
        });
        if (!res.ok) return 0;
        const result = await res.json();
        return Number(result) || 0;
    },

    /**
     * Get remarks options for dropdown
     */
    async getRemarksOptions() {
        const data = await this._get(`remarks_options?is_active=eq.true&select=remark_text&order=display_order`);
        return data.map(r => r.remark_text);
    },

    // ========================================================
    // TRAINING RECORD SUBMISSION
    // ========================================================

    /**
     * Submit a new training record
     * Returns the inserted record with computed fields filled
     */
    async submitTraining(record) {
        // Add system fields
        const payload = {
            ...record,
            submitted_at: new Date().toISOString(),
            user_agent: navigator.userAgent.substring(0, 200),
            schema_version: '1.0'
        };
        
        const data = await this._post('training_records', payload);
        return data[0];
    },

    /**
     * Log an audit entry (best-effort, doesn't block on failure)
     */
    async logAudit(action, actorType, actorId, details, status = 'success') {
        try {
            await this._post('audit_log', {
                action,
                actor_type: actorType,
                actor_id: String(actorId),
                details: details,
                status
            });
        } catch (e) {
            console.warn('Audit log failed:', e);
        }
    }
};
