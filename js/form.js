// ============================================================
// TRAINING FORM — Main logic
// ============================================================

(function() {
    'use strict';
    
    // ========================================================
    // STATE & SESSION
    // ========================================================
    
    let session = null;
    
    function loadSession() {
        const raw = localStorage.getItem('training_session');
        if (!raw) {
            window.location.href = 'index.html';
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            localStorage.removeItem('training_session');
            window.location.href = 'index.html';
            return null;
        }
    }
    
    session = loadSession();
    if (!session) return;
    
    // Populate header
    document.getElementById('userName').textContent = session.name || '—';
    document.getElementById('userId').textContent = `ID: ${session.empId}`;
    
    // Populate digital signature with session info
    function updateSignaturePreview() {
        const $sigName = document.getElementById('signatureName');
        const $sigMeta = document.getElementById('signatureMeta');
        const $sigDate = document.getElementById('signatureDate');
        const $sigTime = document.getElementById('signatureTime');
        
        if ($sigName) {
            $sigName.textContent = session.name || 'Unknown';
        }
        if ($sigMeta) {
            const role = session.job_title || 'Production Line Supervisor';
            $sigMeta.textContent = `ID ${session.empId} · ${role} · ${session.location || 'Plant'}`;
        }
        
        // Update time every second
        function tick() {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', minute: '2-digit', second: '2-digit', 
                hour12: false, timeZone: 'Asia/Riyadh' 
            });
            if ($sigDate) $sigDate.textContent = dateStr;
            if ($sigTime) $sigTime.textContent = timeStr + ' KSA';
        }
        tick();
        setInterval(tick, 1000);
    }
    updateSignaturePreview();
    
    // ========================================================
    // DOM REFERENCES
    // ========================================================
    
    const $form = document.getElementById('trainingForm');
    
    // Session fields
    const $date = document.getElementById('dateInput');
    const $plant = document.getElementById('plantSelect');
    const $line = document.getElementById('lineSelect');
    
    // People fields
    const $userId = document.getElementById('userIdInput');
    const $userInfoPreview = document.getElementById('userInfoPreview');
    const $empName = document.getElementById('empNameInput');
    const $supervisorId = document.getElementById('supervisorIdInput');
    const $trainerId = document.getElementById('trainerIdInput');
    const $trainerPreview = document.getElementById('trainerPreview');
    
    // Training details
    const $model = document.getElementById('modelSelect');
    const $grade = document.getElementById('gradeSelect');
    const $process = document.getElementById('processSelect');
    const $reqHours = document.getElementById('reqHoursInput');
    const $prevHours = document.getElementById('prevHoursInput');
    const $remaining = document.getElementById('remainingInput');
    
    // Performance
    const $trainedCars = document.getElementById('trainedCarsInput');
    const $trainedHours = document.getElementById('trainedHoursInput');
    const $learningRate = document.getElementById('learningRateSelect');
    
    // Quality
    const $needMore = document.getElementById('needMoreSelect');
    const $fiveS = document.getElementById('fiveSSelect');
    const $takt = document.getElementById('taktSelect');
    const $quality = document.getElementById('qualitySelect');
    const $checkFinish = document.getElementById('checkFinishSelect');
    
    // Remarks
    const $remark1 = document.getElementById('remark1Select');
    const $remark2 = document.getElementById('remark2Select');
    const $remark3 = document.getElementById('remark3Select');
    
    // Actions
    const $submitBtn = document.getElementById('submitBtn');
    const $submitText = document.getElementById('submitText');
    const $resetBtn = document.getElementById('resetBtn');
    const $logoutBtn = document.getElementById('logoutBtn');
    
    // Modal
    const $modal = document.getElementById('successModal');
    const $modalDetails = document.getElementById('successDetails');
    const $modalCloseBtn = document.getElementById('modalCloseBtn');
    const $modalNewBtn = document.getElementById('modalNewBtn');
    
    // ========================================================
    // UTILITIES
    // ========================================================
    
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    function showToast(title, message, type = 'success') {
        const $container = document.getElementById('toastContainer');
        const $toast = document.createElement('div');
        $toast.className = `toast ${type === 'error' ? 'is-error' : type === 'warning' ? 'is-warning' : ''}`;
        $toast.innerHTML = `
            <div class="toast-icon">${type === 'error' ? '⚠' : type === 'warning' ? '⚡' : '✓'}</div>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
        `;
        $container.appendChild($toast);
        setTimeout(() => {
            $toast.classList.add('is-leaving');
            setTimeout(() => $toast.remove(), 300);
        }, 4000);
    }
    
    function populateSelect($el, options, placeholder, valueKey, labelKey) {
        const currentValue = $el.value;
        $el.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(opt => {
            const $option = document.createElement('option');
            if (typeof opt === 'object') {
                $option.value = opt[valueKey];
                $option.textContent = opt[labelKey];
            } else {
                $option.value = opt;
                $option.textContent = opt;
            }
            $el.appendChild($option);
        });
        if (currentValue) $el.value = currentValue;
    }
    
    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    
    function showEmpPreview($container, employee, badgeText = '') {
        if (!employee) {
            $container.classList.add('hidden');
            $container.innerHTML = '';
            return;
        }
        
        const initials = (employee.name || '?')
            .split(' ')
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase();
        
        $container.innerHTML = `
            <div class="emp-preview">
                <div class="emp-preview-icon">${initials}</div>
                <div class="emp-preview-info">
                    <div class="emp-preview-name">${escapeHtml(employee.name)}${badgeText ? ` <span class="text-subtle" style="font-weight:400">· ${badgeText}</span>` : ''}</div>
                    <div class="emp-preview-meta">${escapeHtml(employee.location || '—')}</div>
                </div>
            </div>
        `;
        $container.classList.remove('hidden');
    }
    
    function showEmpError($container, message) {
        $container.innerHTML = `<div class="form-error">⚠ ${escapeHtml(message)}</div>`;
        $container.classList.remove('hidden');
    }
    
    // ========================================================
    // INITIALIZATION — Populate dropdowns
    // ========================================================
    
    async function initialize() {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        $date.value = today;
        $date.max = today; // Can't pick future date
        
        // Plants
        populateSelect($plant, CONFIG.PLANTS, 'Select Plant…');
        
        // Pre-select user's plant if available
        if (session.location && CONFIG.PLANTS.includes(session.location)) {
            $plant.value = session.location;
            await loadLinesForPlant(session.location);
        }
        
        // Learning rate
        populateSelect($learningRate, CONFIG.LEARNING_RATES, 'Select rate…', 'value', 'label');
        
        // Load models and remarks in parallel
        try {
            const [models, remarks] = await Promise.all([
                API.getModels(),
                API.getRemarksOptions()
            ]);
            
            populateSelect($model, models, 'Select Model…');
            
            populateSelect($remark1, remarks, 'None');
            populateSelect($remark2, remarks, 'None');
            populateSelect($remark3, remarks, 'None');
            
        } catch (err) {
            console.error('Init error:', err);
            showToast('Connection error', 'Failed to load dropdowns. Please refresh.', 'error');
        }
    }
    
    // ========================================================
    // CASCADING DROPDOWNS
    // ========================================================
    
    async function loadLinesForPlant(plant) {
        if (!plant) {
            $line.disabled = true;
            $line.innerHTML = '<option value="">Select Plant first</option>';
            return;
        }
        
        try {
            const lines = await API.getLinesForPlant(plant);
            populateSelect($line, lines, 'Select Line…');
            $line.disabled = false;
        } catch (err) {
            console.error('Error loading lines:', err);
            showToast('Error', 'Failed to load lines for ' + plant, 'error');
        }
    }
    
    async function loadGradesForModel(model) {
        if (!model) {
            $grade.disabled = true;
            $grade.innerHTML = '<option value="">Select Model first</option>';
            $process.disabled = true;
            $process.innerHTML = '<option value="">Select Grade first</option>';
            return;
        }
        
        try {
            const grades = await API.getGradesForModel(model);
            populateSelect($grade, grades, 'Select Grade…');
            $grade.disabled = false;
            
            // Reset process
            $process.disabled = true;
            $process.innerHTML = '<option value="">Select Grade first</option>';
            $reqHours.value = '';
            $prevHours.value = '';
            $remaining.value = '';
        } catch (err) {
            console.error('Error loading grades:', err);
            showToast('Error', 'Failed to load grades', 'error');
        }
    }
    
    async function loadProcessesForGrade(grade) {
        if (!grade) {
            $process.disabled = true;
            $process.innerHTML = '<option value="">Select Grade first</option>';
            return;
        }
        
        try {
            const processes = await API.getProcessesForGrade(grade);
            populateSelect($process, processes, 'Select Process…');
            $process.disabled = false;
            
            $reqHours.value = '';
            $prevHours.value = '';
            $remaining.value = '';
        } catch (err) {
            console.error('Error loading processes:', err);
            showToast('Error', 'Failed to load processes', 'error');
        }
    }
    
    async function loadComputedValues() {
        const model = $model.value;
        const process = $process.value;
        const grade = $grade.value;
        const userId = parseInt($userId.value, 10);
        
        if (!model || !process) return;
        
        try {
            // Get required hours
            const reqHours = await API.getRequiredHours(model, process);
            $reqHours.value = reqHours !== null ? reqHours : '';
            
            // Get previous hours if we have a valid user
            if (userId && grade) {
                const prevHours = await API.getPreviousHours(userId, grade, process);
                $prevHours.value = prevHours || 0;
            }
            
            updateRemaining();
        } catch (err) {
            console.error('Error computing values:', err);
        }
    }
    
    function updateRemaining() {
        const req = parseFloat($reqHours.value) || 0;
        const prev = parseFloat($prevHours.value) || 0;
        const current = parseFloat($trainedHours.value) || 0;
        
        const remaining = Math.max(0, req - prev - current);
        $remaining.value = req > 0 ? remaining.toFixed(2) + ' hrs' : '';
    }
    
    // ========================================================
    // EMPLOYEE VERIFICATION (Trainee + Trainer)
    // ========================================================
    
    const verifyTrainee = debounce(async (empId) => {
        if (!empId || empId.length < 3) {
            $userInfoPreview.classList.add('hidden');
            $empName.value = '';
            $supervisorId.value = '';
            return;
        }
        
        try {
            const emp = await API.verifyEmployee(parseInt(empId, 10));
            if (emp) {
                showEmpPreview($userInfoPreview, emp, 'Trainee');
                $empName.value = emp.name;
                $supervisorId.value = emp.supervisor_id || '';
                $userId.classList.remove('is-error');
                
                // Reload previous hours if we have grade+process
                if ($grade.value && $process.value) {
                    const prev = await API.getPreviousHours(parseInt(empId, 10), $grade.value, $process.value);
                    $prevHours.value = prev || 0;
                    updateRemaining();
                }
            } else {
                showEmpError($userInfoPreview, 'Trainee ID not found');
                $empName.value = '';
                $supervisorId.value = '';
                $userId.classList.add('is-error');
            }
        } catch (err) {
            console.error('Trainee verify error:', err);
        }
    }, 500);
    
    const verifyTrainer = debounce(async (empId) => {
        if (!empId || empId.length < 3) {
            $trainerPreview.classList.add('hidden');
            return;
        }
        
        try {
            const emp = await API.verifyEmployee(parseInt(empId, 10));
            if (emp) {
                showEmpPreview($trainerPreview, emp, 'Trainer');
                $trainerId.classList.remove('is-error');
            } else {
                showEmpError($trainerPreview, 'Trainer ID not found');
                $trainerId.classList.add('is-error');
            }
        } catch (err) {
            console.error('Trainer verify error:', err);
        }
    }, 500);
    
    // ========================================================
    // EVENT LISTENERS
    // ========================================================
    
    $plant.addEventListener('change', (e) => loadLinesForPlant(e.target.value));
    $model.addEventListener('change', (e) => loadGradesForModel(e.target.value));
    $grade.addEventListener('change', async (e) => {
        await loadProcessesForGrade(e.target.value);
    });
    $process.addEventListener('change', () => loadComputedValues());
    
    $trainedHours.addEventListener('input', updateRemaining);
    
    $userId.addEventListener('input', (e) => {
        // Digits only
        const val = e.target.value.replace(/\D/g, '');
        if (val !== e.target.value) e.target.value = val;
        verifyTrainee(val);
    });
    
    $trainerId.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val !== e.target.value) e.target.value = val;
        verifyTrainer(val);
    });
    
    // ========================================================
    // FORM SUBMISSION
    // ========================================================
    
    function collectFormData() {
        const now = new Date().toISOString();
        return {
            training_date: $date.value,
            plant: $plant.value,
            line: $line.value,
            user_id: parseInt($userId.value, 10),
            emp_name: $empName.value,
            trainer_id: parseInt($trainerId.value, 10),
            supervisor_id: $supervisorId.value ? parseInt($supervisorId.value, 10) : null,
            model: $model.value,
            grade: $grade.value,
            process_name: $process.value,
            req_training_hr: parseFloat($reqHours.value) || null,
            trained_cars: parseInt($trainedCars.value, 10),
            trained_hours: parseFloat($trainedHours.value),
            previous_training_hours: parseFloat($prevHours.value) || 0,
            learning_rate: parseFloat($learningRate.value),
            need_more_training: $needMore.value,
            five_s: $fiveS.value,
            in_takt_time: $takt.value,
            quality: $quality.value,
            check_after_finish: $checkFinish.value,
            remark_1: $remark1.value || null,
            remark_2: $remark2.value || null,
            remark_3: $remark3.value || null,
            submitted_by_emp_id: session.empId,
            // Digital signature fields
            signed_by_supervisor_id: session.empId,
            signed_by_supervisor_name: session.name,
            signed_at: now,
            approval_status: 'pending_manager_approval'
        };
    }
    
    function validateForm() {
        const errors = [];
        
        if (!$date.value) errors.push('Date is required');
        if (!$plant.value) errors.push('Plant is required');
        if (!$line.value) errors.push('Line is required');
        if (!$userId.value || !$empName.value) errors.push('Valid Trainee ID is required');
        if (!$trainerId.value) errors.push('Trainer ID is required');
        if (!$model.value) errors.push('Model is required');
        if (!$grade.value) errors.push('Grade is required');
        if (!$process.value) errors.push('Process is required');
        if (!$trainedCars.value && $trainedCars.value !== '0') errors.push('Trained Cars is required');
        if (!$trainedHours.value) errors.push('Trained Hours is required');
        if (!$learningRate.value) errors.push('Learning Rate is required');
        if (!$needMore.value) errors.push('Need More Training is required');
        if (!$fiveS.value) errors.push('5S is required');
        if (!$takt.value) errors.push('In Takt Time is required');
        if (!$quality.value) errors.push('Quality is required');
        if (!$checkFinish.value) errors.push('Check After Finish is required');
        
        // Self-training check
        if ($userId.value && $trainerId.value && $userId.value === $trainerId.value) {
            errors.push('Trainee and Trainer cannot be the same person');
        }
        
        return errors;
    }
    
    $form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (errors.length > 0) {
            showToast('Please complete the form', errors[0], 'error');
            return;
        }
        
        // Disable submit, show loading
        $submitBtn.disabled = true;
        $submitText.innerHTML = '<span class="spinner"></span> Submitting...';
        
        const data = collectFormData();
        
        try {
            const result = await API.submitTraining(data);
            
            // Log audit
            API.logAudit(
                'FORM_SUBMITTED',
                'employee',
                session.empId,
                { si: result.si, record_uuid: result.record_uuid, trainee_id: data.user_id, model: data.model }
            );
            
            // Show success modal
            $modalDetails.innerHTML = `
                <div class="modal-detail-row">
                    <span class="modal-detail-label">Record SI</span>
                    <span class="modal-detail-value">#${result.si}</span>
                </div>
                <div class="modal-detail-row">
                    <span class="modal-detail-label">Trainee</span>
                    <span class="modal-detail-value" style="font-family: var(--font-sans)">${escapeHtml(data.emp_name)}</span>
                </div>
                <div class="modal-detail-row">
                    <span class="modal-detail-label">Score</span>
                    <span class="modal-detail-value">${(result.training_score * 100).toFixed(0)}%</span>
                </div>
                <div class="modal-detail-row">
                    <span class="modal-detail-label">Result</span>
                    <span class="modal-detail-value" style="font-family: var(--font-sans); color: ${result.training_result === 'Passed' ? 'var(--color-success)' : 'var(--color-warning)'}">${escapeHtml(result.training_result)}</span>
                </div>
            `;
            
            $modal.classList.remove('hidden');
            
        } catch (err) {
            console.error('Submit error:', err);
            showToast('Submission failed', err.message || 'Please try again', 'error');
            
            API.logAudit('FORM_FAILED', 'employee', session.empId, { error: String(err) }, 'failure');
        } finally {
            $submitBtn.disabled = false;
            $submitText.textContent = 'Submit Training Record';
        }
    });
    
    // ========================================================
    // FORM ACTIONS
    // ========================================================
    
    function resetForm(keepSessionInfo = true) {
        const datePart = $date.value;
        const plantPart = $plant.value;
        const linePart = $line.value;
        
        $form.reset();
        
        // Clear previews
        $userInfoPreview.classList.add('hidden');
        $trainerPreview.classList.add('hidden');
        
        // Clear computed
        $reqHours.value = '';
        $prevHours.value = '';
        $remaining.value = '';
        
        // Reset cascades
        $grade.disabled = true;
        $grade.innerHTML = '<option value="">Select Model first</option>';
        $process.disabled = true;
        $process.innerHTML = '<option value="">Select Grade first</option>';
        
        // Keep date + plant + line if requested (saves re-entry)
        if (keepSessionInfo) {
            $date.value = datePart;
            $plant.value = plantPart;
            if (plantPart) {
                loadLinesForPlant(plantPart).then(() => {
                    $line.value = linePart;
                });
            }
        } else {
            $date.value = new Date().toISOString().split('T')[0];
        }
    }
    
    $resetBtn.addEventListener('click', () => {
        if (confirm('Reset the form? Any unsaved data will be lost.')) {
            resetForm(false);
        }
    });
    
    $logoutBtn.addEventListener('click', () => {
        if (confirm('Sign out of the system?')) {
            API.logAudit('LOGOUT', 'employee', session.empId, {});
            localStorage.removeItem('training_session');
            window.location.href = 'index.html';
        }
    });
    
    // Modal actions
    $modalCloseBtn.addEventListener('click', () => {
        $modal.classList.add('hidden');
    });
    
    $modalNewBtn.addEventListener('click', () => {
        $modal.classList.add('hidden');
        resetForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // ========================================================
    // INIT
    // ========================================================
    
    initialize();
})();
