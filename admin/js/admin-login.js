// ============================================================
// ADMIN LOGIN — Direct password verification (browser SHA-256)
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
    
    async function sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }
    
    $empId.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
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
            // Step 1: Fetch employee record
            const res = await fetch(
                `${CONFIG.SUPABASE_URL}/rest/v1/manpower?employee_id=eq.${empId}&select=employee_id,name,location,job_title,can_approve,password_hash,is_active`,
                {
                    headers: {
                        'apikey': CONFIG.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            
            const rows = await res.json();
            const emp = rows && rows.length > 0 ? rows[0] : null;
            
            if (!emp) {
                showError('Employee ID not found.');
                return;
            }
            if (!emp.is_active) {
                showError('Account is inactive.');
                return;
            }
            if (!emp.can_approve) {
                showError('Access denied. Only plant managers can access this area.');
                return;
            }
            if (!emp.password_hash) {
                showError('Password not configured. Contact system administrator.');
                return;
            }
            
            // Step 2: Hash the entered password in browser
            const enteredHash = await sha256(password);
            
            if (enteredHash !== emp.password_hash) {
                showError('Incorrect password. Please try again.');
                return;
            }
            
            // Step 3: Login successful — save session
            const session = {
                empId: emp.employee_id,
                name: emp.name,
                location: emp.location,
                job_title: emp.job_title || 'Plant Manager',
                can_approve: emp.can_approve,
                isAdmin: true,
                loginAt: new Date().toISOString()
            };
            
            localStorage.setItem('admin_session', JSON.stringify(session));
            
            // Log audit (best effort)
            try {
                await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/audit_log`, {
                    method: 'POST',
                    headers: {
                        'apikey': CONFIG.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        action: 'ADMIN_LOGIN',
                        actor_type: 'admin',
                        actor_id: String(emp.employee_id),
                        details: { name: emp.name, location: emp.location },
                        status: 'success'
                    })
                });
            } catch (_) {}
            
            // Redirect
            window.location.href = 'dashboard.html';
            
        } catch (err) {
            console.error('Admin login error:', err);
            showError('Connection error. Please try again.');
        } finally {
            $btn.disabled = false;
            $btnText.textContent = 'Sign In';
        }
    });
})();
