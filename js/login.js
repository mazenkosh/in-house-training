// ============================================================
// LOGIN PAGE — Employee ID verification flow
// ============================================================

(function() {
    'use strict';
    
    const $form = document.getElementById('loginForm');
    const $input = document.getElementById('empIdInput');
    const $preview = document.getElementById('empPreview');
    const $error = document.getElementById('empError');
    const $button = document.getElementById('continueBtn');
    const $btnText = document.getElementById('continueText');
    
    let verifiedEmployee = null;
    let verifyTimer = null;
    
    // ========================================================
    // UTILITIES
    // ========================================================
    
    function showError(msg) {
        $error.textContent = msg;
        $error.classList.remove('hidden');
        $input.classList.add('is-error');
        $preview.classList.add('hidden');
        $button.disabled = true;
    }
    
    function clearError() {
        $error.classList.add('hidden');
        $input.classList.remove('is-error');
    }
    
    function showPreview(employee) {
        const initials = (employee.name || '?')
            .split(' ')
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase();
        
        $preview.innerHTML = `
            <div class="emp-preview">
                <div class="emp-preview-icon">${initials}</div>
                <div class="emp-preview-info">
                    <div class="emp-preview-name">${escapeHtml(employee.name)}</div>
                    <div class="emp-preview-meta">${escapeHtml(employee.location || '—')} · ${escapeHtml(employee.company_name || '—')}</div>
                </div>
            </div>
        `;
        $preview.classList.remove('hidden');
        clearError();
        $button.disabled = false;
    }
    
    function hidePreview() {
        $preview.classList.add('hidden');
        $button.disabled = true;
        verifiedEmployee = null;
    }
    
    function escapeHtml(str) {
        if (!str) return '';
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
    
    // ========================================================
    // VERIFICATION LOGIC
    // ========================================================
    
    async function verifyEmployee(empId) {
        if (!empId || !/^\d+$/.test(empId)) {
            hidePreview();
            return;
        }
        
        try {
            const employee = await API.verifyEmployee(parseInt(empId, 10));
            
            if (employee) {
                verifiedEmployee = employee;
                showPreview(employee);
            } else {
                showError('Employee ID not found. Please check the number and try again.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            showError('Connection error. Please check your internet and try again.');
        }
    }
    
    // ========================================================
    // EVENT HANDLERS
    // ========================================================
    
    // Real-time verification with debounce
    $input.addEventListener('input', (e) => {
        // Allow only digits
        const val = e.target.value.replace(/\D/g, '');
        if (val !== e.target.value) {
            e.target.value = val;
        }
        
        clearError();
        
        if (val.length < 3) {
            hidePreview();
            return;
        }
        
        // Debounce
        clearTimeout(verifyTimer);
        verifyTimer = setTimeout(() => verifyEmployee(val), 500);
    });
    
    // Form submission
    $form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!verifiedEmployee) {
            const empId = $input.value.trim();
            if (empId) {
                await verifyEmployee(empId);
            }
            return;
        }
        
        // Show loading state
        $button.disabled = true;
        $btnText.innerHTML = '<span class="spinner"></span> Signing in...';
        
        try {
            // Log the login event
            API.logAudit(
                'LOGIN_SUCCESS',
                'employee',
                verifiedEmployee.employee_id,
                { name: verifiedEmployee.name, location: verifiedEmployee.location }
            );
            
            // Store session in localStorage
            const session = {
                empId: verifiedEmployee.employee_id,
                name: verifiedEmployee.name,
                location: verifiedEmployee.location,
                company: verifiedEmployee.company_name,
                supervisor_id: verifiedEmployee.supervisor_id,
                supervisor_name: verifiedEmployee.supervisor_name,
                loginAt: new Date().toISOString()
            };
            
            localStorage.setItem('training_session', JSON.stringify(session));
            
            // Redirect to form
            window.location.href = 'form.html';
            
        } catch (err) {
            console.error('Login error:', err);
            showToast('Sign-in failed', 'Please try again', 'error');
            $button.disabled = false;
            $btnText.textContent = 'Continue';
        }
    });
    
    // Check if already logged in
    const existingSession = localStorage.getItem('training_session');
    if (existingSession) {
        try {
            const session = JSON.parse(existingSession);
            // Auto-fill but don't redirect — let user confirm
            if (session.empId) {
                $input.value = session.empId;
                verifyEmployee(String(session.empId));
            }
        } catch (e) {
            localStorage.removeItem('training_session');
        }
    }
})();
