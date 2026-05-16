// ============================================================
// ADMIN API — Functions for admin dashboard
// ============================================================

const AdminAPI = {
    _headers() {
        return {
            'apikey': CONFIG.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    /**
     * Get all pending approval records
     */
    async getPendingApprovals(plantFilter = null) {
        let url = `${CONFIG.SUPABASE_URL}/rest/v1/training_records?approval_status=eq.pending_manager_approval&order=submitted_at.desc&limit=100`;
        if (plantFilter) {
            url += `&plant=eq.${encodeURIComponent(plantFilter)}`;
        }
        
        const res = await fetch(url, { headers: this._headers() });
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        return res.json();
    },

    /**
     * Get KPI summary
     */
    async getKPIs(managerPlant = null) {
        // Get total records
        const baseUrl = `${CONFIG.SUPABASE_URL}/rest/v1/training_records`;
        const plantFilter = managerPlant ? `&plant=eq.${encodeURIComponent(managerPlant)}` : '';
        
        const requests = [
            fetch(`${baseUrl}?select=count${plantFilter}`, { 
                headers: { ...this._headers(), 'Prefer': 'count=exact' }
            }),
            fetch(`${baseUrl}?approval_status=eq.pending_manager_approval&select=count${plantFilter}`, { 
                headers: { ...this._headers(), 'Prefer': 'count=exact' }
            }),
            fetch(`${baseUrl}?approval_status=eq.approved&select=count${plantFilter}`, { 
                headers: { ...this._headers(), 'Prefer': 'count=exact' }
            }),
            fetch(`${baseUrl}?training_result=eq.Passed&select=count${plantFilter}`, { 
                headers: { ...this._headers(), 'Prefer': 'count=exact' }
            }),
        ];
        
        const responses = await Promise.all(requests);
        const counts = await Promise.all(responses.map(async (r) => {
            const range = r.headers.get('content-range');
            if (range) {
                const match = range.match(/\/(\d+|\*)/);
                if (match && match[1] !== '*') return parseInt(match[1], 10);
            }
            const data = await r.json();
            return data?.[0]?.count || 0;
        }));
        
        return {
            total: counts[0],
            pending: counts[1],
            approved: counts[2],
            passed: counts[3]
        };
    },

    /**
     * Approve or reject a training record
     */
    async approveRecord(recordId, managerId, managerName, action, reason = null) {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/rpc/approve_training_record`;
        const res = await fetch(url, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({
                p_record_id: recordId,
                p_manager_id: managerId,
                p_manager_name: managerName,
                p_action: action,
                p_reason: reason
            })
        });
        
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        const result = await res.json();
        return Array.isArray(result) && result.length > 0 ? result[0] : null;
    }
};
