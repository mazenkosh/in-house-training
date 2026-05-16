// ============================================================
// ADMIN LOGIN — Manager authentication with password
// ============================================================

(function() {
    'use strict';
    
    const $form = document.getElementById('adminLoginForm');
    const $empId = document.getElementById('empIdInput');
    const $password = document.getElementById('passwordInput');
    const $error = document.getElementById('loginError');
    const $btn = document.getElementById('signInBtn');
    const $btnText = document.getElementById('signInText');
    
    function showError(msg) {
        $error.textContent = msg;
        $error.classList.remove('hidden');
        $empId.classList.add('is-error');
        $password.classList.add('is-error');
    }
    
    function clearError() {
        $error.classList.add('hidden');
        $empId.classList.remove('is-error');
        $password.classList.remove('is-error');
    }
    
    $empId.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val !== e.target.value) e.target.value = val;
        clearError();
    });
    
    $password.addEventListener('input', clearError);
    
    $form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const empId = parseInt($empId.value, 10);
        const password = $password.value;
        
        if (!empId || !password) {
            showError('Please enter both Employee ID and password');
            return;
        }
        
        $btn.disabled = true;
        $btnText.innerHTML = '<span class="spinner"></span> Signing in...';
        
        try {
            // Call the verify_admin_login function via RPC
            const url = `${CONFIG.SUPABASE_URL}/rest/v1/rpc/verify_admin_login`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_employee_id: empId,
                    p_password: password
                })
            });
            
            if (!res.ok) {
                throw new Error('Login service unavailable');
            }
            
            const result = await res.json();
            const data = Array.isArray(result) && result.length > 0 ? result[0] : null;
            
            if (!data || !data.success) {
                showError(data?.message || 'Invalid credentials');
                $btn.disabled = false;
                $btnText.textContent = 'Sign In';
                return;
            }
            
            // Store admin session
            const session = {
                empId: data.employee_id,
                name: data.name,
                location: data.location,
                job_title: data.job_title,
                can_approve: data.can_approve,
                isAdmin: true,
                loginAt: new Date().toISOString()
            };
            
            localStorage.setItem('admin_session', JSON.stringify(session));
            
            // Log audit
            API.logAudit(
                'ADMIN_LOGIN',
                'admin',
                data.employee_id,
                { name: data.name, location: data.location }
            );
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
            
        } catch (err) {
            console.error('Admin login error:', err);
            showError('Sign-in failed. Please try again.');
            $btn.disabled = false;
            $btnText.textContent = 'Sign In';
        }
    });
})();
