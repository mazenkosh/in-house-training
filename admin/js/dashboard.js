// ============================================================
// ADMIN DASHBOARD — Main logic
// ============================================================

(function() {
    'use strict';
    
    // ========================================================
    // SESSION CHECK
    // ========================================================
    
    let session = null;
    
    function loadSession() {
        const raw = localStorage.getItem('admin_session');
        if (!raw) {
            window.location.href = 'login.html';
            return null;
        }
        try {
            const s = JSON.parse(raw);
            if (!s.isAdmin || !s.can_approve) {
                localStorage.removeItem('admin_session');
                window.location.href = 'login.html';
                return null;
            }
            return s;
        } catch (e) {
            localStorage.removeItem('admin_session');
            window.location.href = 'login.html';
            return null;
        }
    }
    
    session = loadSession();
    if (!session) return;
    
    // Populate header
    document.getElementById('userName').textContent = session.name || '—';
    document.getElementById('userRole').textContent = `${session.job_title || 'Manager'} · ${session.location || ''}`;
    document.getElementById('welcomeName').textContent = (session.name || 'Manager').split(' ')[0];
    
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
    
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toISOString().split('T')[0];
        } catch (e) {
            return dateStr;
        }
    }
    
    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            return d.toISOString().split('T')[0] + ' ' + 
                   d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) {
            return dateStr;
        }
    }
    
    // ========================================================
    // NAVIGATION
    // ========================================================
    
    window.navigateToSection = function(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dash-section').forEach(s => s.classList.add('hidden'));
        // Show target
        const target = document.getElementById(`section-${sectionId}`);
        if (target) target.classList.remove('hidden');
        // Update nav
        document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
        const navLink = document.querySelector(`.dash-nav-link[data-section="${sectionId}"]`);
        if (navLink) navLink.classList.add('active');
        // Load data for section
        if (sectionId === 'approvals') {
            loadPendingApprovals();
        } else if (sectionId === 'overview') {
            loadKPIs();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    document.querySelectorAll('.dash-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            navigateToSection(section);
        });
    });
    
    // ========================================================
    // KPIs
    // ========================================================
    
    async function loadKPIs() {
        try {
            // Managers see only their plant's data
            const managerPlant = session.location;
            const kpis = await AdminAPI.getKPIs(managerPlant);
            
            document.getElementById('kpiTotal').textContent = kpis.total.toLocaleString();
            document.getElementById('kpiTotalTrend').textContent = `${session.location || 'All plants'}`;
            
            document.getElementById('kpiPending').textContent = kpis.pending.toLocaleString();
            
            document.getElementById('kpiApproved').textContent = kpis.approved.toLocaleString();
            document.getElementById('kpiApprovedTrend').textContent = 
                kpis.total > 0 ? `${Math.round(kpis.approved / kpis.total * 100)}% of total` : '—';
            
            const passRate = kpis.total > 0 ? Math.round(kpis.passed / kpis.total * 100) : 0;
            document.getElementById('kpiPassRate').textContent = `${passRate}%`;
            
            // Update pending badge in nav
            const $badge = document.getElementById('pendingCount');
            $badge.textContent = kpis.pending;
            $badge.setAttribute('data-count', kpis.pending);
            
        } catch (err) {
            console.error('KPI load error:', err);
            showToast('Error', 'Failed to load statistics', 'error');
        }
    }
    
    // ========================================================
    // PENDING APPROVALS
    // ========================================================
    
    let currentApprovalRecord = null;
    
    window.loadPendingApprovals = async function() {
        const $list = document.getElementById('pendingList');
        $list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><span class="spinner spinner-lg"></span></div>
                <div class="empty-state-title">Loading pending approvals…</div>
            </div>
        `;
        
        try {
            const plantFilter = document.getElementById('filterPlant').value || null;
            // Managers default to their own plant unless they filter
            const effectiveFilter = plantFilter || session.location;
            
            const records = await AdminAPI.getPendingApprovals(effectiveFilter);
            
            if (records.length === 0) {
                $list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">✓</div>
                        <div class="empty-state-title">All caught up!</div>
                        <div class="empty-state-desc">No pending approvals at the moment.</div>
                    </div>
                `;
                return;
            }
            
            $list.innerHTML = records.map(r => `
                <div class="pending-card">
                    <div class="pending-info">
                        <div class="pending-header">
                            <span class="pending-si">SI #${r.si}</span>
                            <span class="pending-plant">${escapeHtml(r.plant)} · ${escapeHtml(r.line)}</span>
                            <span class="pending-date">${formatDate(r.training_date)}</span>
                        </div>
                        <div class="pending-title">${escapeHtml(r.emp_name || 'Trainee #' + r.user_id)} — ${escapeHtml(r.model)} / ${escapeHtml(r.process_name)}</div>
                        <div class="pending-meta">
                            <div class="pending-meta-item">
                                <span class="pending-meta-label">Grade:</span> ${escapeHtml(r.grade)}
                            </div>
                            <div class="pending-meta-item">
                                <span class="pending-meta-label">Score:</span> ${Math.round((r.training_score || 0) * 100)}%
                            </div>
                            <div class="pending-meta-item">
                                <span class="pending-meta-label">Result:</span> ${escapeHtml(r.training_result || '—')}
                            </div>
                            <div class="pending-meta-item">
                                <span class="pending-meta-label">Signed by:</span> ${escapeHtml(r.signed_by_supervisor_name || '—')}
                            </div>
                        </div>
                    </div>
                    <div class="pending-actions">
                        <button class="btn btn-primary" onclick='openApprovalModal(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                            Review →
                        </button>
                    </div>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('Pending load error:', err);
            $list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠</div>
                    <div class="empty-state-title">Failed to load</div>
                    <div class="empty-state-desc">${escapeHtml(err.message)}</div>
                </div>
            `;
        }
    };
    
    document.getElementById('filterPlant').addEventListener('change', loadPendingApprovals);
    
    // ========================================================
    // APPROVAL MODAL
    // ========================================================
    
    const $modal = document.getElementById('approvalModal');
    const $details = document.getElementById('approvalDetails');
    const $rejectInput = document.getElementById('rejectionInput');
    const $rejectReason = document.getElementById('rejectReason');
    
    window.openApprovalModal = function(record) {
        currentApprovalRecord = record;
        
        $details.innerHTML = `
            <div class="modal-detail-row">
                <span class="modal-detail-label">Record SI</span>
                <span class="modal-detail-value">#${record.si}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Date</span>
                <span class="modal-detail-value">${formatDate(record.training_date)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Plant / Line</span>
                <span class="modal-detail-value">${escapeHtml(record.plant)} / ${escapeHtml(record.line)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Trainee</span>
                <span class="modal-detail-value" style="font-family: var(--font-sans)">${escapeHtml(record.emp_name || '#' + record.user_id)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Trainer ID</span>
                <span class="modal-detail-value">${record.trainer_id}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Model / Grade</span>
                <span class="modal-detail-value" style="font-family: var(--font-sans)">${escapeHtml(record.model)} / ${escapeHtml(record.grade)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Process</span>
                <span class="modal-detail-value" style="font-family: var(--font-sans)">${escapeHtml(record.process_name)}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Trained Cars / Hours</span>
                <span class="modal-detail-value">${record.trained_cars} cars / ${record.trained_hours} hrs</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Training Score</span>
                <span class="modal-detail-value">${Math.round((record.training_score || 0) * 100)}%</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Result</span>
                <span class="modal-detail-value" style="font-family: var(--font-sans); color: ${record.training_result === 'Passed' ? 'var(--alj-viridian)' : 'var(--alj-blaze)'}">${escapeHtml(record.training_result || '—')}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Signed by Supervisor</span>
                <span class="modal-detail-value" style="font-family: var(--font-sans)">${escapeHtml(record.signed_by_supervisor_name || '—')}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Signed at</span>
                <span class="modal-detail-value">${formatDateTime(record.signed_at)}</span>
            </div>
        `;
        
        $rejectInput.classList.add('hidden');
        $rejectReason.value = '';
        $modal.classList.remove('hidden');
    };
    
    document.getElementById('approvalCancelBtn').addEventListener('click', () => {
        $modal.classList.add('hidden');
        currentApprovalRecord = null;
    });
    
    let rejectMode = false;
    
    document.getElementById('approvalRejectBtn').addEventListener('click', async () => {
        if (!rejectMode) {
            // First click - show reason input
            $rejectInput.classList.remove('hidden');
            rejectMode = true;
            return;
        }
        
        // Second click - confirm rejection
        const reason = $rejectReason.value.trim();
        if (!reason) {
            showToast('Reason required', 'Please provide a rejection reason', 'warning');
            return;
        }
        
        await processApproval('reject', reason);
    });
    
    document.getElementById('approvalApproveBtn').addEventListener('click', async () => {
        await processApproval('approve', null);
    });
    
    async function processApproval(action, reason) {
        if (!currentApprovalRecord) return;
        
        const $approveBtn = document.getElementById('approvalApproveBtn');
        const $rejectBtn = document.getElementById('approvalRejectBtn');
        $approveBtn.disabled = true;
        $rejectBtn.disabled = true;
        
        try {
            const result = await AdminAPI.approveRecord(
                currentApprovalRecord.id,
                session.empId,
                session.name,
                action,
                reason
            );
            
            if (result && result.success) {
                showToast(
                    action === 'approve' ? 'Approved' : 'Rejected',
                    action === 'approve' 
                        ? `Record SI #${currentApprovalRecord.si} approved and signed`
                        : `Record SI #${currentApprovalRecord.si} rejected`,
                    action === 'approve' ? 'success' : 'warning'
                );
                
                API.logAudit(
                    action === 'approve' ? 'RECORD_APPROVED' : 'RECORD_REJECTED',
                    'admin',
                    session.empId,
                    { si: currentApprovalRecord.si, record_id: currentApprovalRecord.id, reason }
                );
                
                $modal.classList.add('hidden');
                rejectMode = false;
                currentApprovalRecord = null;
                
                // Reload
                loadPendingApprovals();
                loadKPIs();
            } else {
                showToast('Failed', result?.message || 'Could not process', 'error');
            }
        } catch (err) {
            console.error('Approval error:', err);
            showToast('Error', err.message || 'Failed to process approval', 'error');
        } finally {
            $approveBtn.disabled = false;
            $rejectBtn.disabled = false;
        }
    }
    
    // ========================================================
    // LOGOUT
    // ========================================================
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Sign out of the admin dashboard?')) {
            API.logAudit('ADMIN_LOGOUT', 'admin', session.empId, {});
            localStorage.removeItem('admin_session');
            window.location.href = 'login.html';
        }
    });
    
    // ========================================================
    // INIT
    // ========================================================
    
    loadKPIs();
})();
