// ============================================================
// ADMIN DASHBOARD — Professional Version with Server-side Analytics
// ============================================================
(function() {
    'use strict';

    // SESSION
    let session = null;
    function loadSession() {
        const raw = localStorage.getItem('admin_session');
        if (!raw) { window.location.href = 'login.html'; return null; }
        try {
            const s = JSON.parse(raw);
            if (!s.isAdmin) { localStorage.removeItem('admin_session'); window.location.href = 'login.html'; return null; }
            return s;
        } catch(e) { localStorage.removeItem('admin_session'); window.location.href = 'login.html'; return null; }
    }
    session = loadSession();
    if (!session) return;

    // ROLE
    const ROLES = {
        isGM: session.job_title === 'Production General Manager',
        isProdMgr: session.job_title === 'Production Manager',
        isArchitect: session.job_title === 'PIO System Architect',
        isPlantMgr: session.job_title === 'Plant Manager' || session.job_title === 'Plant Supervisor'
    };
    const isAllPlants = ROLES.isGM || ROLES.isProdMgr || ROLES.isArchitect;
    const plantFilter = isAllPlants ? null : session.location;
    const firstName = (session.name || 'Manager').split(' ')[0];

    // THEME
    function applyTheme() {
        if (ROLES.isGM) {
            document.querySelector('.header').style.cssText += 'background:linear-gradient(135deg,#1C3258 0%,#0D1F38 100%);border-bottom-color:#C9A84C;';
            addBadge('⭐ EXECUTIVE VIEW', 'rgba(201,168,76,0.2)', '#C9A84C', 'rgba(201,168,76,0.5)');
        } else if (ROLES.isArchitect) {
            addBadge('🔧 SYSTEM ARCHITECT', 'rgba(237,107,19,0.2)', '#ED6B13', 'rgba(237,107,19,0.5)');
        } else if (ROLES.isProdMgr) {
            addBadge('📊 OPERATIONS VIEW', 'rgba(95,196,226,0.2)', '#5FC4E2', 'rgba(95,196,226,0.5)');
        }
    }
    function addBadge(text, bg, color, border) {
        const $hu = document.querySelector('.header-user');
        if (!$hu) return;
        const b = document.createElement('span');
        b.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${bg};border:1px solid ${border};border-radius:20px;font-size:0.68rem;font-weight:700;color:${color};letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;`;
        b.textContent = text;
        $hu.insertBefore(b, $hu.firstChild);
    }

    // UTILS
    function esc(s) {
        if (!s && s !== 0) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function showToast(title, msg, type='success') {
        const $c = document.getElementById('toastContainer');
        const $t = document.createElement('div');
        $t.className = `toast ${type==='error'?'is-error':type==='warning'?'is-warning':''}`;
        $t.innerHTML = `<div class="toast-icon">${type==='error'?'⚠':type==='warning'?'⚡':'✓'}</div><div class="toast-content"><div class="toast-title">${esc(title)}</div><div class="toast-message">${esc(msg)}</div></div>`;
        $c.appendChild($t);
        setTimeout(() => { $t.classList.add('is-leaving'); setTimeout(()=>$t.remove(),300); }, 4000);
    }
    function fmtDate(d) { try { return d ? new Date(d).toISOString().split('T')[0] : '—'; } catch(e) { return d||'—'; } }
    function fmtDT(d) {
        try {
            const dt = new Date(d);
            return dt.toISOString().split('T')[0]+' '+dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
        } catch(e) { return d||'—'; }
    }
    function numFmt(n) { return Number(n||0).toLocaleString(); }

    // API
    const H = { 'apikey': CONFIG.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}` };

    async function rpc(fn, params={}) {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
            method: 'POST',
            headers: {...H, 'Content-Type': 'application/json'},
            body: JSON.stringify(params)
        });
        if (!r.ok) throw new Error(await r.text());
        return r.json();
    }

    async function qry(table, params='') {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${params}`, {headers: H});
        if (!r.ok) throw new Error(await r.text());
        return r.json();
    }

    async function qryCount(table, params='') {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${params}&select=count`, {
            headers: {...H, 'Prefer': 'count=exact'}
        });
        const rng = r.headers.get('content-range');
        if (rng) { const m = rng.match(/\/(\d+)/); if (m) return parseInt(m[1]); }
        return 0;
    }

    // NAVIGATION
    window.navigateToSection = function(id) {
        document.querySelectorAll('.dash-section').forEach(s=>s.classList.add('hidden'));
        document.getElementById(`section-${id}`)?.classList.remove('hidden');
        document.querySelectorAll('.dash-nav-link').forEach(l=>l.classList.remove('active'));
        document.querySelector(`.dash-nav-link[data-section="${id}"]`)?.classList.add('active');
        if (id==='approvals') loadPendingApprovals();
        else if (id==='overview') loadOverview();
        else if (id==='analytics') loadAnalytics();
        else if (id==='records') loadAllRecords();
        window.scrollTo({top:0,behavior:'smooth'});
    };
    document.querySelectorAll('.dash-nav-link').forEach(l => {
        l.addEventListener('click', e => { e.preventDefault(); navigateToSection(l.getAttribute('data-section')); });
    });

    // ====================================================
    // OVERVIEW
    // ====================================================
    async function loadOverview() {
        try {
            const pParam = plantFilter ? {p_plant: plantFilter} : {};
            const stats = await rpc('get_dashboard_stats', pParam);
            const s = Array.isArray(stats) ? stats[0] : stats;

            const total = Number(s?.total_records||0);
            const passed = Number(s?.total_passed||0);
            const pending = Number(s?.pending_approvals||0);
            const approved = Number(s?.approved_count||0);
            const passRate = total > 0 ? Math.round(passed/total*100) : 0;

            setKPI('kpiTotal', numFmt(total), isAllPlants ? 'All Plants' : session.location);
            setKPI('kpiPending', numFmt(pending), 'Awaiting your review');
            setKPI('kpiApproved', numFmt(approved), 'Digitally signed');
            setKPI('kpiPassRate', `${passRate}%`, `${numFmt(passed)} passed of ${numFmt(total)}`);

            const $b = document.getElementById('pendingCount');
            if ($b) { $b.textContent = pending; $b.setAttribute('data-count', pending); }

            if (isAllPlants) await loadPlantChart();
        } catch(err) {
            console.error('Overview error:', err);
            showToast('Error', 'Failed to load statistics: '+err.message, 'error');
        }
    }

    function setKPI(id, val, trend) {
        const el = document.getElementById(id); if (el) el.textContent = val;
        const te = document.getElementById(id+'Trend'); if (te) te.textContent = trend||'';
    }

    async function loadPlantChart() {
        const $c = document.getElementById('plantComparison');
        if (!$c) return;
        try {
            const data = await rpc('get_plant_stats', {});
            if (!data || !data.length) return;
            const max = Math.max(...data.map(r => Number(r.total)), 1);
            const colors = {
                'Plant-1': '#51859A', 'Plant-2': '#28424D',
                'Plant-3': '#069999', 'Plant-4': '#5FC4E2', 'Plant-6': '#ED6B13'
            };

            $c.innerHTML = `
                <div class="section-label" style="margin-top:32px;">Plant Performance — All Time</div>
                <div class="card" style="margin-bottom:24px;">
                    <div class="card-body">
                        <div class="plant-bar-wrap">
                            ${data.map(r => {
                                const t = Number(r.total), p = Number(r.passed);
                                const pct = t > 0 ? Math.round(p/t*100) : 0;
                                const h = Math.max(20, Math.round(t/max*150));
                                const c = colors[r.plant] || '#51859A';
                                const rateColor = pct >= 70 ? '#069999' : pct >= 50 ? '#ED6B13' : '#B92A2A';
                                return `
                                    <div class="plant-bar-col">
                                        <div class="plant-bar-count" style="color:${c};">${numFmt(t)}</div>
                                        <div class="plant-bar-rate" style="color:${rateColor};">${pct}% pass</div>
                                        <div class="plant-bar" style="background:${c};height:${h}px;" title="${r.plant}: ${numFmt(t)} records, ${pct}% pass rate"></div>
                                        <div class="plant-bar-label">${esc(r.plant)}</div>
                                    </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>`;

            // Animate bars after render
            setTimeout(() => {
                $c.querySelectorAll('.plant-bar').forEach(bar => {
                    bar.style.opacity = '1';
                });
            }, 100);

        } catch(err) { console.error('Plant chart error:', err); }
    }

    // ====================================================
    // ANALYTICS
    // ====================================================
    async function loadAnalytics() {
        const $s = document.getElementById('section-analytics');
        $s.innerHTML = `<h1 class="page-title">Analytics & Insights</h1><p class="page-subtitle">4 years of training data — 2022 to 2026</p><div id="ac"><div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div><div class="empty-state-title">Loading analytics…</div></div></div>`;

        try {
            const pParam = plantFilter ? {p_plant: plantFilter} : {};

            const [yearly, plantStats, topModels, monthly] = await Promise.all([
                rpc('get_yearly_stats', pParam),
                rpc('get_plant_stats', {}),
                rpc('get_top_models', plantFilter ? {p_plant: plantFilter, p_limit: 8} : {p_limit: 8}),
                rpc('get_monthly_trend', pParam)
            ]);

            // Summary from plant stats
            const totalAll = plantStats.reduce((s,r)=>s+Number(r.total),0);
            const totalPassed = plantStats.reduce((s,r)=>s+Number(r.passed),0);
            const overallPass = totalAll > 0 ? Math.round(totalPassed/totalAll*100) : 0;

            const maxYear = Math.max(...yearly.map(r=>Number(r.count)),1);
            const maxMonth = Math.max(...monthly.map(r=>Number(r.count)),1);
            const maxModel = topModels.length > 0 ? Number(topModels[0].count) : 1;
            const colors = {'Plant-1':'#51859A','Plant-2':'#28424D','Plant-3':'#069999','Plant-4':'#5FC4E2','Plant-6':'#ED6B13'};

            document.getElementById('ac').innerHTML = `

                <!-- Yearly Trend -->
                <div class="card" style="margin-bottom:20px;">
                    <div class="card-header"><div class="card-title">📈 Training Volume by Year</div></div>
                    <div class="card-body">
                        <div style="display:flex;gap:20px;align-items:flex-end;height:220px;padding-bottom:12px;">
                            ${yearly.map(r => `
                                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;">
                                    <div style="font-weight:800;color:var(--alj-teal);font-size:1.25rem;">${numFmt(r.count)}</div>
                                    <div style="width:100%;background:var(--alj-teal);border-radius:8px 8px 0 0;height:${Math.max(24,Math.round(Number(r.count)/maxYear*160))}px;transition:height 1s cubic-bezier(0.4,0,0.2,1);opacity:0.85;"></div>
                                    <div style="font-weight:700;color:var(--alj-dark-teal);font-size:1rem;">${esc(r.year)}</div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">

                    <!-- Pass Rate by Plant -->
                    <div class="card">
                        <div class="card-header"><div class="card-title">✅ Pass Rate by Plant</div></div>
                        <div class="card-body">
                            ${plantStats.map(r => {
                                const rate = Number(r.total)>0 ? Math.round(Number(r.passed)/Number(r.total)*100) : 0;
                                const clr = rate>=70?'#069999':rate>=50?'#ED6B13':'#B92A2A';
                                return `
                                    <div style="margin-bottom:18px;">
                                        <div style="display:flex;justify-content:space-between;margin-bottom:7px;">
                                            <span style="font-weight:700;color:var(--alj-dark-teal);">${esc(r.plant)}</span>
                                            <span style="font-weight:800;color:${clr};">${rate}%</span>
                                        </div>
                                        <div class="progress-wrap">
                                            <div class="progress-bar" style="width:${rate}%;background:${clr};"></div>
                                        </div>
                                        <div style="font-size:0.75rem;color:#9B9B9D;margin-top:4px;">${numFmt(r.passed)} passed / ${numFmt(r.total)} total</div>
                                    </div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Top Models -->
                    <div class="card">
                        <div class="card-header"><div class="card-title">🚗 Top Models Trained</div></div>
                        <div class="card-body">
                            ${topModels.map((r,i) => `
                                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                                    <div style="width:26px;height:26px;border-radius:50%;background:var(--alj-teal);color:white;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;">${i+1}</div>
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-weight:700;color:var(--alj-dark-teal);font-size:0.9rem;margin-bottom:5px;">${esc(r.model)}</div>
                                        <div class="progress-wrap">
                                            <div class="progress-bar" style="width:${Math.round(Number(r.count)/maxModel*100)}%;background:var(--alj-teal);"></div>
                                        </div>
                                    </div>
                                    <div style="font-weight:800;color:#717173;font-size:0.9rem;min-width:45px;text-align:right;">${numFmt(r.count)}</div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Monthly Trend -->
                <div class="card" style="margin-bottom:20px;">
                    <div class="card-header"><div class="card-title">📅 Monthly Training Trend — Last 24 Months</div></div>
                    <div class="card-body" style="overflow-x:auto;">
                        <div style="display:flex;gap:5px;align-items:flex-end;height:180px;padding-bottom:32px;min-width:600px;">
                            ${monthly.map(r => `
                                <div style="flex:1;min-width:28px;display:flex;flex-direction:column;align-items:center;gap:3px;" title="${esc(r.month)}: ${numFmt(r.count)}">
                                    <div style="font-size:0.62rem;font-weight:600;color:var(--alj-teal);">${numFmt(r.count)}</div>
                                    <div style="width:100%;background:var(--alj-teal);border-radius:4px 4px 0 0;height:${Math.max(3,Math.round(Number(r.count)/maxMonth*130))}px;opacity:${0.45+0.55*(Number(r.count)/maxMonth)};transition:height 1s ease;"></div>
                                    <div style="font-size:0.58rem;color:#9B9B9D;transform:rotate(-40deg);transform-origin:top center;margin-top:6px;white-space:nowrap;">${r.month.substring(5)}'${r.month.substring(2,4)}</div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="card">
                    <div class="card-header"><div class="card-title">📊 All-Time Summary</div></div>
                    <div class="card-body">
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;">
                            ${[
                                [numFmt(totalAll), 'Total Trainings', '#EEF4F6', '#51859A'],
                                [overallPass+'%', 'Pass Rate', '#E6F4F4', '#069999'],
                                [numFmt(plantStats.length), 'Active Plants', '#EEF4F6', '#51859A'],
                                [numFmt(topModels.length), 'Car Models', '#FDF1E6', '#ED6B13'],
                                [numFmt(yearly.length), 'Years of Data', '#EEF4F6', '#51859A'],
                            ].map(([val,label,bg,clr]) => `
                                <div style="text-align:center;padding:18px 12px;background:${bg};border-radius:12px;">
                                    <div style="font-size:2rem;font-weight:800;color:${clr};line-height:1;">${val}</div>
                                    <div style="font-size:0.72rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px;">${label}</div>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>
            `;

        } catch(err) {
            console.error('Analytics error:', err);
            document.getElementById('ac').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">Failed to load analytics</div><div class="empty-state-desc">${esc(err.message)}</div></div>`;
        }
    }

    // ====================================================
    // ALL RECORDS
    // ====================================================
    window.recordsPage = 0;
    const PAGE_SIZE = 50;

    window.loadAllRecords = async function(reset=true) {
        if (reset) window.recordsPage = 0;
        const $s = document.getElementById('section-records');
        const pf = plantFilter ? `plant=eq.${encodeURIComponent(plantFilter)}&` : '';

        if (reset) {
            $s.innerHTML = `
                <h1 class="page-title">All Training Records</h1>
                <p class="page-subtitle">Complete history — live + historical data.</p>
                <div class="filters-bar">
                    <select id="frPlant" class="form-select" style="width:150px;">
                        <option value="">All Plants</option>
                        <option>Plant-1</option><option>Plant-2</option>
                        <option>Plant-3</option><option>Plant-4</option><option>Plant-6</option>
                    </select>
                    <select id="frTable" class="form-select" style="width:200px;">
                        <option value="historical_records">Historical (2022-2026)</option>
                        <option value="training_records">Live Records (2026)</option>
                    </select>
                    <button class="btn btn-secondary" onclick="loadAllRecords(true)">🔍 Apply</button>
                </div>
                <div id="rtw"></div>`;
        }

        const tbl = document.getElementById('frTable')?.value || 'historical_records';
        const ep = document.getElementById('frPlant')?.value;
        const pq = ep ? `plant=eq.${encodeURIComponent(ep)}&` : pf;

        document.getElementById('rtw').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div></div>`;

        try {
            const offset = window.recordsPage * PAGE_SIZE;
            const rows = await qry(tbl, `${pq}select=si,training_date,plant,line,emp_name,model,grade,process_name,trained_hours,training_result${tbl==='training_records'?',approval_status':''}&order=training_date.desc&limit=${PAGE_SIZE}&offset=${offset}`);

            if (!rows.length) {
                document.getElementById('rtw').innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No records found</div></div>`;
                return;
            }

            document.getElementById('rtw').innerHTML = `
                <div class="card" style="overflow:hidden;">
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                            <thead>
                                <tr style="background:var(--alj-teal-soft);border-bottom:2px solid var(--alj-teal-25);">
                                    ${['SI','Date','Plant / Line','Trainee','Model / Process','Hours','Result'].map(h=>`<th style="padding:12px 16px;text-align:left;font-size:0.76rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((r,i) => {
                                    const rc = r.training_result==='Passed'?'#069999':r.training_result?'#ED6B13':'#9B9B9D';
                                    return `<tr style="border-bottom:1px solid var(--color-border);background:${i%2===0?'var(--color-surface)':'var(--color-bg)'};">
                                        <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.82rem;">#${esc(r.si)}</td>
                                        <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.85rem;">${fmtDate(r.training_date)}</td>
                                        <td style="padding:10px 16px;"><span style="font-weight:700;color:var(--alj-teal);">${esc(r.plant)}</span><br><span style="font-size:0.78rem;color:var(--color-ink-muted);">${esc(r.line)}</span></td>
                                        <td style="padding:10px 16px;font-size:0.88rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.emp_name||'—')}</td>
                                        <td style="padding:10px 16px;"><div style="font-weight:600;font-size:0.88rem;">${esc(r.model)}</div><div style="font-size:0.78rem;color:var(--color-ink-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.process_name||'—')}</div></td>
                                        <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.88rem;">${r.trained_hours||'—'}</td>
                                        <td style="padding:10px 16px;font-weight:700;color:${rc};font-size:0.85rem;">${esc(r.training_result||'—')}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="padding:var(--space-4) var(--space-6);border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:0.88rem;color:var(--color-ink-muted);">Showing ${offset+1}–${offset+rows.length}</span>
                        <div style="display:flex;gap:var(--space-2);">
                            ${window.recordsPage>0?`<button class="btn btn-secondary" onclick="window.recordsPage--;loadAllRecords(false)">← Prev</button>`:''}
                            ${rows.length===PAGE_SIZE?`<button class="btn btn-primary" onclick="window.recordsPage++;loadAllRecords(false)">Next →</button>`:''}
                        </div>
                    </div>
                </div>`;
        } catch(err) {
            document.getElementById('rtw').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">${esc(err.message)}</div></div>`;
        }
    };

    // ====================================================
    // PENDING APPROVALS
    // ====================================================
    let currentRecord = null;

    window.loadPendingApprovals = async function() {
        const $list = document.getElementById('pendingList');
        $list.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div><div class="empty-state-title">Loading…</div></div>`;
        try {
            const pf2 = document.getElementById('filterPlant')?.value || plantFilter || '';
            const params = pf2
                ? `approval_status=eq.pending_manager_approval&plant=eq.${encodeURIComponent(pf2)}&order=submitted_at.desc`
                : 'approval_status=eq.pending_manager_approval&order=submitted_at.desc';
            const records = await qry('training_records', params);
            if (!records.length) {
                $list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✓</div><div class="empty-state-title">All caught up!</div><div class="empty-state-desc">No pending approvals.</div></div>`;
                return;
            }
            $list.innerHTML = records.map(r => `
                <div class="pending-card">
                    <div class="pending-info">
                        <div class="pending-header">
                            <span class="pending-si">SI #${esc(r.si)}</span>
                            <span class="pending-plant">${esc(r.plant)} · ${esc(r.line)}</span>
                            <span class="pending-date">${fmtDate(r.training_date)}</span>
                        </div>
                        <div class="pending-title">${esc(r.emp_name||'Trainee #'+r.user_id)} — ${esc(r.model)} / ${esc(r.process_name)}</div>
                        <div class="pending-meta">
                            <div class="pending-meta-item"><span class="pending-meta-label">Grade:</span> ${esc(r.grade)}</div>
                            <div class="pending-meta-item"><span class="pending-meta-label">Score:</span> ${Math.round((r.training_score||0)*100)}%</div>
                            <div class="pending-meta-item"><span class="pending-meta-label">Result:</span> ${esc(r.training_result||'—')}</div>
                            <div class="pending-meta-item"><span class="pending-meta-label">Signed:</span> ${esc(r.signed_by_supervisor_name||'—')}</div>
                        </div>
                    </div>
                    <div class="pending-actions">
                        <button class="btn btn-primary" onclick='openApprovalModal(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Review →</button>
                    </div>
                </div>`).join('');
        } catch(err) {
            $list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">${esc(err.message)}</div></div>`;
        }
    };

    const $modal = document.getElementById('approvalModal');
    const $details = document.getElementById('approvalDetails');
    const $rejInput = document.getElementById('rejectionInput');
    const $rejReason = document.getElementById('rejectReason');
    let rejectMode = false;

    window.openApprovalModal = function(r) {
        currentRecord = r; rejectMode = false;
        $rejInput?.classList.add('hidden');
        if ($rejReason) $rejReason.value = '';
        const row = (l,v,mono=false) => `<div class="modal-detail-row"><span class="modal-detail-label">${l}</span><span class="modal-detail-value" style="${mono?'':'font-family:var(--font-sans)'}">${esc(v||'—')}</span></div>`;
        $details.innerHTML = row('Record SI','#'+r.si,true)+row('Date',fmtDate(r.training_date),true)+row('Plant / Line',r.plant+' / '+r.line)+row('Trainee',r.emp_name||'#'+r.user_id)+row('Model / Grade',r.model+' / '+r.grade)+row('Process',r.process_name)+row('Cars / Hours',r.trained_cars+' cars / '+r.trained_hours+' hrs',true)+row('Score',Math.round((r.training_score||0)*100)+'%',true)+row('Result',r.training_result)+row('Signed by',r.signed_by_supervisor_name)+row('Signed at',fmtDT(r.signed_at),true);
        $modal.classList.remove('hidden');
    };

    document.getElementById('approvalCancelBtn')?.addEventListener('click', () => { $modal.classList.add('hidden'); currentRecord=null; rejectMode=false; });

    document.getElementById('approvalRejectBtn')?.addEventListener('click', async () => {
        if (!rejectMode) { $rejInput?.classList.remove('hidden'); rejectMode=true; return; }
        const reason = $rejReason?.value.trim();
        if (!reason) { showToast('Required','Please enter a rejection reason','warning'); return; }
        await processApproval('reject', reason);
    });

    document.getElementById('approvalApproveBtn')?.addEventListener('click', () => processApproval('approve', null));

    async function processApproval(action, reason) {
        if (!currentRecord) return;
        document.getElementById('approvalApproveBtn').disabled = true;
        document.getElementById('approvalRejectBtn').disabled = true;
        try {
            const body = action==='approve'
                ? {approval_status:'approved', approved_by_manager_id:session.empId, approved_by_manager_name:session.name, approved_at:new Date().toISOString()}
                : {approval_status:'rejected', approved_by_manager_id:session.empId, approved_by_manager_name:session.name, approved_at:new Date().toISOString(), rejection_reason:reason};
            const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/training_records?id=eq.${currentRecord.id}`, {
                method:'PATCH', headers:{...H,'Content-Type':'application/json','Prefer':'return=minimal'}, body:JSON.stringify(body)
            });
            if (r.ok) {
                showToast(action==='approve'?'Approved ✓':'Rejected', `SI #${currentRecord.si} ${action==='approve'?'approved and signed':'rejected'}`, action==='approve'?'success':'warning');
                $modal.classList.add('hidden'); currentRecord=null; rejectMode=false;
                loadPendingApprovals(); loadOverview();
            } else showToast('Failed', await r.text(), 'error');
        } catch(err) { showToast('Error', err.message, 'error'); }
        finally { document.getElementById('approvalApproveBtn').disabled=false; document.getElementById('approvalRejectBtn').disabled=false; }
    }

    // LOGOUT
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Sign out?')) { localStorage.removeItem('admin_session'); window.location.href='login.html'; }
    });

    // INIT
    document.getElementById('userName').textContent = session.name||'—';
    document.getElementById('userRole').textContent = `${session.job_title||'Manager'} · ${session.location||''}`;
    document.getElementById('welcomeName').textContent = firstName;
    applyTheme();
    loadOverview();
})();
