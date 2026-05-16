// ============================================================
// ADMIN DASHBOARD — Full Professional Version
// Role-based views: GM / Production Manager / Plant Manager / System Architect
// ============================================================

(function() {
    'use strict';

    // ========================================================
    // SESSION
    // ========================================================
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

    // ========================================================
    // ROLE DETECTION
    // ========================================================
    const ROLES = {
        isGM: session.job_title === 'Production General Manager',
        isProdMgr: session.job_title === 'Production Manager',
        isArchitect: session.job_title === 'PIO System Architect',
        isPlantMgr: session.job_title === 'Plant Manager' || session.job_title === 'Plant Supervisor'
    };

    const isAllPlants = ROLES.isGM || ROLES.isProdMgr || ROLES.isArchitect;
    const plantFilter = isAllPlants ? null : session.location;
    const firstName = (session.name || 'Manager').split(' ')[0];

    // ========================================================
    // APPLY ROLE-BASED THEMING
    // ========================================================
    function applyTheme() {
        const header = document.querySelector('.header');
        const badge = document.getElementById('roleBadge');

        if (ROLES.isGM) {
            // Executive theme — Prussian Blue + Gold accent
            header.style.background = 'linear-gradient(135deg, #1C3258 0%, #0D1F38 100%)';
            header.style.borderBottomColor = '#C9A84C';
            if (badge) {
                badge.textContent = '⭐ EXECUTIVE VIEW';
                badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 14px;background:rgba(201,168,76,0.2);border:1px solid rgba(201,168,76,0.5);border-radius:20px;font-size:0.7rem;font-weight:700;color:#C9A84C;letter-spacing:0.12em;text-transform:uppercase;';
            }
        } else if (ROLES.isArchitect) {
            if (badge) {
                badge.textContent = '🔧 SYSTEM ARCHITECT';
                badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 14px;background:rgba(237,107,19,0.2);border:1px solid rgba(237,107,19,0.5);border-radius:20px;font-size:0.7rem;font-weight:700;color:#ED6B13;letter-spacing:0.12em;text-transform:uppercase;';
            }
        }
    }

    // ========================================================
    // UTILITIES
    // ========================================================
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function showToast(title, msg, type='success') {
        const $c = document.getElementById('toastContainer');
        const $t = document.createElement('div');
        $t.className = `toast ${type==='error'?'is-error':type==='warning'?'is-warning':''}`;
        $t.innerHTML = `<div class="toast-icon">${type==='error'?'⚠':type==='warning'?'⚡':'✓'}</div><div class="toast-content"><div class="toast-title">${esc(title)}</div><div class="toast-message">${esc(msg)}</div></div>`;
        $c.appendChild($t);
        setTimeout(() => { $t.classList.add('is-leaving'); setTimeout(() => $t.remove(), 300); }, 4000);
    }

    function fmtDate(d) {
        if (!d) return '—';
        try { return new Date(d).toISOString().split('T')[0]; } catch(e) { return d; }
    }

    function fmtDateTime(d) {
        if (!d) return '—';
        try {
            const dt = new Date(d);
            return dt.toISOString().split('T')[0] + ' ' + dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
        } catch(e) { return d; }
    }

    // ========================================================
    // API CALLS
    // ========================================================
    const HEADERS = {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
    };

    async function query(table, params='') {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${params}`, {headers: HEADERS});
        if (!r.ok) throw new Error(await r.text());
        return r.json();
    }

    async function queryCount(table, params='') {
        const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?${params}&select=count`, {
            headers: {...HEADERS, 'Prefer': 'count=exact'}
        });
        const range = r.headers.get('content-range');
        if (range) { const m = range.match(/\/(\d+)/); if (m) return parseInt(m[1]); }
        return 0;
    }

    // ========================================================
    // NAVIGATION
    // ========================================================
    window.navigateToSection = function(sectionId) {
        document.querySelectorAll('.dash-section').forEach(s => s.classList.add('hidden'));
        const t = document.getElementById(`section-${sectionId}`);
        if (t) t.classList.remove('hidden');
        document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
        const nl = document.querySelector(`.dash-nav-link[data-section="${sectionId}"]`);
        if (nl) nl.classList.add('active');
        if (sectionId === 'approvals') loadPendingApprovals();
        else if (sectionId === 'overview') loadOverview();
        else if (sectionId === 'analytics') loadAnalytics();
        else if (sectionId === 'records') loadAllRecords();
        window.scrollTo({top:0,behavior:'smooth'});
    };

    document.querySelectorAll('.dash-nav-link').forEach(l => {
        l.addEventListener('click', e => { e.preventDefault(); navigateToSection(l.getAttribute('data-section')); });
    });

    // ========================================================
    // OVERVIEW — KPIs
    // ========================================================
    async function loadOverview() {
        try {
            const pf = plantFilter ? `&plant=eq.${encodeURIComponent(plantFilter)}` : '';

            // Combine historical + live records
            const [histCount, liveCount, pendingCount, approvedCount, passedLive, passedHist] = await Promise.all([
                queryCount('historical_records', pf ? pf.slice(1) : ''),
                queryCount('training_records', pf ? pf.slice(1) : ''),
                queryCount('training_records', `approval_status=eq.pending_manager_approval${pf}`),
                queryCount('training_records', `approval_status=eq.approved${pf}`),
                queryCount('training_records', `training_result=eq.Passed${pf}`),
                queryCount('historical_records', `training_result=eq.Passed${pf ? pf.slice(1) : ''}`)
            ]);

            const totalAll = histCount + liveCount;
            const totalPassed = passedLive + passedHist;
            const passRate = totalAll > 0 ? Math.round(totalPassed / totalAll * 100) : 0;

            setKPI('kpiTotal', totalAll.toLocaleString(), isAllPlants ? 'All Plants' : session.location);
            setKPI('kpiPending', pendingCount.toLocaleString(), 'Awaiting your review');
            setKPI('kpiApproved', approvedCount.toLocaleString(), `${liveCount} new records`);
            setKPI('kpiPassRate', `${passRate}%`, `${totalPassed.toLocaleString()} passed out of ${totalAll.toLocaleString()}`);

            // Update nav badge
            const $badge = document.getElementById('pendingCount');
            if ($badge) { $badge.textContent = pendingCount; $badge.setAttribute('data-count', pendingCount); }

            // Load plant comparison for GM/ProdMgr/Architect
            if (isAllPlants) await loadPlantComparison();

        } catch(err) {
            console.error('KPI error:', err);
            showToast('Error', 'Failed to load statistics', 'error');
        }
    }

    function setKPI(id, value, trend) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
        const te = document.getElementById(id + 'Trend');
        if (te) te.textContent = trend || '';
    }

    // ========================================================
    // PLANT COMPARISON (GM / ProdMgr / Architect)
    // ========================================================
    async function loadPlantComparison() {
        const $container = document.getElementById('plantComparison');
        if (!$container) return;

        try {
            const plants = ['Plant-1','Plant-2','Plant-3','Plant-4','Plant-6'];
            const counts = await Promise.all(plants.map(p =>
                queryCount('historical_records', `plant=eq.${encodeURIComponent(p)}`)
                .then(h => queryCount('training_records', `plant=eq.${encodeURIComponent(p)}`).then(l => h + l))
            ));

            const max = Math.max(...counts);
            const colors = ['#51859A','#28424D','#069999','#5FC4E2','#ED6B13'];

            $container.innerHTML = `
                <div class="card" style="margin-top: var(--space-8);">
                    <div class="card-header">
                        <div class="card-title">🏭 Plant Performance Overview — All Time</div>
                    </div>
                    <div class="card-body">
                        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--space-4);align-items:end;min-height:180px;padding-bottom:var(--space-4);">
                            ${plants.map((p,i) => `
                                <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
                                    <div style="font-size:1rem;font-weight:700;color:${colors[i]};">${counts[i].toLocaleString()}</div>
                                    <div style="width:100%;background:${colors[i]};border-radius:6px 6px 0 0;height:${max>0?Math.max(20,Math.round(counts[i]/max*140)):20}px;transition:height 0.8s ease;"></div>
                                    <div style="font-size:0.8rem;font-weight:600;color:var(--alj-dark-teal);">${p}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch(err) { console.error('Plant comparison error:', err); }
    }

    // ========================================================
    // ANALYTICS
    // ========================================================
    async function loadAnalytics() {
        const $container = document.getElementById('section-analytics');
        $container.innerHTML = `
            <h1 class="page-title">Analytics & Insights</h1>
            <p class="page-subtitle">4 years of training data — 2022 to 2026</p>
            <div id="analyticsContent"><div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div><div class="empty-state-title">Loading analytics…</div></div></div>
        `;

        try {
            const pf = plantFilter ? `plant=eq.${encodeURIComponent(plantFilter)}&` : '';

            // Fetch all historical records (sample for charts)
            const [histRecords, liveRecords] = await Promise.all([
                query('historical_records', `${pf}select=training_date,plant,training_result,model,trainer_id&order=training_date.asc&limit=15728`),
                query('training_records', `${pf}select=training_date,plant,training_result,model,trainer_id&order=training_date.asc`)
            ]);

            const allRecords = [...histRecords, ...liveRecords];

            // 1. By Year
            const byYear = {};
            allRecords.forEach(r => {
                if (!r.training_date) return;
                const y = r.training_date.substring(0,4);
                byYear[y] = (byYear[y] || 0) + 1;
            });

            // 2. By Plant
            const byPlant = {};
            allRecords.forEach(r => {
                if (!r.plant) return;
                byPlant[r.plant] = (byPlant[r.plant] || 0) + 1;
            });

            // 3. Pass Rate by Plant
            const passRates = {};
            allRecords.forEach(r => {
                if (!r.plant) return;
                if (!passRates[r.plant]) passRates[r.plant] = {pass:0, total:0};
                passRates[r.plant].total++;
                if (r.training_result === 'Passed') passRates[r.plant].pass++;
            });

            // 4. Top Models
            const byModel = {};
            allRecords.forEach(r => {
                if (!r.model) return;
                byModel[r.model] = (byModel[r.model] || 0) + 1;
            });
            const topModels = Object.entries(byModel).sort((a,b)=>b[1]-a[1]).slice(0,8);

            // 5. Monthly trend (last 24 months)
            const byMonth = {};
            allRecords.forEach(r => {
                if (!r.training_date) return;
                const m = r.training_date.substring(0,7);
                byMonth[m] = (byMonth[m] || 0) + 1;
            });
            const months = Object.keys(byMonth).sort().slice(-24);
            const monthCounts = months.map(m => byMonth[m]);
            const maxMonth = Math.max(...monthCounts);

            const colors = {'Plant-1':'#51859A','Plant-2':'#28424D','Plant-3':'#069999','Plant-4':'#5FC4E2','Plant-6':'#ED6B13'};
            const years = Object.keys(byYear).sort();
            const maxYear = Math.max(...Object.values(byYear));

            document.getElementById('analyticsContent').innerHTML = `

                <!-- Yearly Trend -->
                <div class="card" style="margin-bottom:var(--space-6);">
                    <div class="card-header"><div class="card-title">📈 Training Volume by Year</div></div>
                    <div class="card-body">
                        <div style="display:flex;gap:var(--space-6);align-items:flex-end;height:200px;padding-bottom:var(--space-4);">
                            ${years.map(y => `
                                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
                                    <div style="font-weight:700;color:var(--alj-teal);font-size:1.1rem;">${byYear[y].toLocaleString()}</div>
                                    <div style="width:100%;background:var(--alj-teal);border-radius:6px 6px 0 0;height:${Math.max(20,Math.round(byYear[y]/maxYear*140))}px;"></div>
                                    <div style="font-weight:600;color:var(--alj-dark-teal);">${y}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6);">

                    <!-- Pass Rate by Plant -->
                    <div class="card">
                        <div class="card-header"><div class="card-title">✅ Pass Rate by Plant</div></div>
                        <div class="card-body">
                            ${Object.entries(passRates).sort((a,b)=>b[1].pass/b[1].total - a[1].pass/a[1].total).map(([plant, data]) => {
                                const rate = data.total > 0 ? Math.round(data.pass/data.total*100) : 0;
                                const color = rate >= 70 ? '#069999' : rate >= 50 ? '#ED6B13' : '#B92A2A';
                                return `
                                    <div style="margin-bottom:var(--space-4);">
                                        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                                            <span style="font-weight:600;color:var(--alj-dark-teal);">${plant}</span>
                                            <span style="font-weight:700;color:${color};">${rate}%</span>
                                        </div>
                                        <div style="height:8px;background:var(--color-bg-alt);border-radius:4px;overflow:hidden;">
                                            <div style="height:100%;width:${rate}%;background:${color};border-radius:4px;transition:width 1s ease;"></div>
                                        </div>
                                        <div style="font-size:0.75rem;color:var(--color-ink-subtle);margin-top:4px;">${data.pass.toLocaleString()} / ${data.total.toLocaleString()} records</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Top Models -->
                    <div class="card">
                        <div class="card-header"><div class="card-title">🚗 Top Models Trained</div></div>
                        <div class="card-body">
                            ${topModels.map(([model, count], i) => `
                                <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3);">
                                    <div style="width:24px;height:24px;border-radius:50%;background:var(--alj-teal);color:white;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;">${i+1}</div>
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-weight:600;color:var(--alj-dark-teal);font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(model)}</div>
                                        <div style="height:6px;background:var(--color-bg-alt);border-radius:3px;margin-top:4px;">
                                            <div style="height:100%;width:${Math.round(count/topModels[0][1]*100)}%;background:var(--alj-teal);border-radius:3px;"></div>
                                        </div>
                                    </div>
                                    <div style="font-weight:700;color:var(--alj-charcoal);font-size:0.9rem;flex-shrink:0;">${count.toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Monthly Trend (last 24 months) -->
                <div class="card" style="margin-bottom:var(--space-6);">
                    <div class="card-header"><div class="card-title">📅 Monthly Training Trend (Last 24 Months)</div></div>
                    <div class="card-body">
                        <div style="display:flex;gap:4px;align-items:flex-end;height:160px;overflow-x:auto;padding-bottom:var(--space-4);">
                            ${months.map((m, i) => `
                                <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:36px;" title="${m}: ${monthCounts[i]}">
                                    <div style="width:28px;background:var(--alj-teal);border-radius:3px 3px 0 0;height:${Math.max(4,Math.round(monthCounts[i]/maxMonth*120))}px;opacity:${0.5+0.5*(monthCounts[i]/maxMonth)};"></div>
                                    <div style="font-size:0.6rem;color:var(--color-ink-subtle);transform:rotate(-45deg);transform-origin:top left;margin-top:8px;white-space:nowrap;">${m.substring(5)}'${m.substring(2,4)}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="text-align:center;font-size:0.8rem;color:var(--color-ink-muted);margin-top:var(--space-4);">Hover over bars to see exact counts</div>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div class="card">
                    <div class="card-header"><div class="card-title">📊 All-Time Summary</div></div>
                    <div class="card-body">
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--space-4);">
                            <div style="text-align:center;padding:var(--space-4);background:var(--alj-teal-soft);border-radius:var(--radius-lg);">
                                <div style="font-size:2rem;font-weight:800;color:var(--alj-teal);">${allRecords.length.toLocaleString()}</div>
                                <div style="font-size:0.8rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Total Trainings</div>
                            </div>
                            <div style="text-align:center;padding:var(--space-4);background:#E6F4F4;border-radius:var(--radius-lg);">
                                <div style="font-size:2rem;font-weight:800;color:#069999;">${Math.round(allRecords.filter(r=>r.training_result==='Passed').length/allRecords.length*100)}%</div>
                                <div style="font-size:0.8rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Overall Pass Rate</div>
                            </div>
                            <div style="text-align:center;padding:var(--space-4);background:var(--alj-teal-soft);border-radius:var(--radius-lg);">
                                <div style="font-size:2rem;font-weight:800;color:var(--alj-teal);">${Object.keys(byPlant).length}</div>
                                <div style="font-size:0.8rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Active Plants</div>
                            </div>
                            <div style="text-align:center;padding:var(--space-4);background:#FDF1E6;border-radius:var(--radius-lg);">
                                <div style="font-size:2rem;font-weight:800;color:var(--alj-blaze);">${Object.keys(byModel).length}</div>
                                <div style="font-size:0.8rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Car Models</div>
                            </div>
                            <div style="text-align:center;padding:var(--space-4);background:var(--alj-teal-soft);border-radius:var(--radius-lg);">
                                <div style="font-size:2rem;font-weight:800;color:var(--alj-teal);">${years.length}</div>
                                <div style="font-size:0.8rem;color:var(--alj-dark-teal);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Years of Data</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch(err) {
            console.error('Analytics error:', err);
            document.getElementById('analyticsContent').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">Failed to load analytics</div><div class="empty-state-desc">${esc(err.message)}</div></div>`;
        }
    }

    // ========================================================
    // ALL RECORDS
    // ========================================================
    let recordsPage = 0;
    const PAGE_SIZE = 50;

    async function loadAllRecords(reset = true) {
        if (reset) recordsPage = 0;
        const $container = document.getElementById('section-records');
        const pf = plantFilter ? `plant=eq.${encodeURIComponent(plantFilter)}&` : '';

        if (reset) {
            $container.innerHTML = `
                <h1 class="page-title">All Training Records</h1>
                <p class="page-subtitle">Complete history — live + historical data.</p>
                <div class="filters-bar" style="margin-bottom:var(--space-5);">
                    <select id="filterRecordsPlant" class="form-select" style="width:160px;">
                        <option value="">All Plants</option>
                        <option>Plant-1</option><option>Plant-2</option>
                        <option>Plant-3</option><option>Plant-4</option><option>Plant-6</option>
                    </select>
                    <select id="filterRecordsTable" class="form-select" style="width:160px;">
                        <option value="historical_records">Historical (2022-2026)</option>
                        <option value="training_records">Live Records</option>
                    </select>
                    <button class="btn btn-secondary" onclick="loadAllRecords(true)">🔍 Filter</button>
                </div>
                <div id="recordsTableWrap"></div>
            `;
        }

        const table = document.getElementById('filterRecordsTable')?.value || 'historical_records';
        const extraPlant = document.getElementById('filterRecordsPlant')?.value;
        const plantQ = extraPlant ? `plant=eq.${encodeURIComponent(extraPlant)}&` : pf;

        document.getElementById('recordsTableWrap').innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div></div>`;

        try {
            const offset = recordsPage * PAGE_SIZE;
            const rows = await query(table, `${plantQ}select=si,training_date,plant,line,emp_name,model,grade,process_name,trained_hours,training_result,approval_status&order=training_date.desc&limit=${PAGE_SIZE}&offset=${offset}`);

            if (rows.length === 0) {
                document.getElementById('recordsTableWrap').innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">No records found</div></div>`;
                return;
            }

            document.getElementById('recordsTableWrap').innerHTML = `
                <div class="card" style="overflow:hidden;">
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
                            <thead>
                                <tr style="background:var(--alj-teal-soft);border-bottom:2px solid var(--alj-teal-25);">
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">SI</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Date</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Plant/Line</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Trainee</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Model / Process</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Hours</th>
                                    <th style="padding:12px 16px;text-align:left;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--alj-dark-teal);font-weight:700;">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map((r,i) => {
                                    const resultColor = r.training_result === 'Passed' ? '#069999' : r.training_result ? '#ED6B13' : '#9B9B9D';
                                    const statusColor = r.approval_status === 'approved' ? '#069999' : r.approval_status === 'pending_manager_approval' ? '#ED6B13' : null;
                                    return `
                                        <tr style="border-bottom:1px solid var(--color-border);${i%2===0?'background:var(--color-surface);':'background:var(--color-bg);'}">
                                            <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.82rem;color:var(--alj-charcoal);">#${esc(r.si)}</td>
                                            <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.82rem;">${fmtDate(r.training_date)}</td>
                                            <td style="padding:10px 16px;"><span style="font-weight:600;color:var(--alj-teal);">${esc(r.plant)}</span><br><span style="font-size:0.78rem;color:var(--color-ink-muted);">${esc(r.line)}</span></td>
                                            <td style="padding:10px 16px;font-size:0.85rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.emp_name||'—')}</td>
                                            <td style="padding:10px 16px;"><div style="font-weight:600;font-size:0.85rem;">${esc(r.model)}</div><div style="font-size:0.78rem;color:var(--color-ink-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.process_name||'—')}</div></td>
                                            <td style="padding:10px 16px;font-family:var(--font-mono);font-size:0.85rem;">${r.trained_hours||'—'}</td>
                                            <td style="padding:10px 16px;"><span style="font-weight:600;color:${resultColor};font-size:0.82rem;">${esc(r.training_result||'—')}</span>${statusColor?`<br><span style="font-size:0.72rem;color:${statusColor};">${r.approval_status==='approved'?'✓ Approved':'⏳ Pending'}</span>`:''}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="padding:var(--space-4) var(--space-6);border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:0.85rem;color:var(--color-ink-muted);">Showing ${offset+1}–${offset+rows.length} • Page ${recordsPage+1}</span>
                        <div style="display:flex;gap:var(--space-2);">
                            ${recordsPage > 0 ? `<button class="btn btn-secondary" onclick="recordsPage--;loadAllRecords(false)">← Prev</button>` : ''}
                            ${rows.length === PAGE_SIZE ? `<button class="btn btn-primary" onclick="recordsPage++;loadAllRecords(false)">Next →</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            window.recordsPage = recordsPage;

        } catch(err) {
            console.error('Records error:', err);
            document.getElementById('recordsTableWrap').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">${esc(err.message)}</div></div>`;
        }
    }

    // ========================================================
    // PENDING APPROVALS
    // ========================================================
    let currentRecord = null;

    window.loadPendingApprovals = async function() {
        const $list = document.getElementById('pendingList');
        $list.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span class="spinner spinner-lg"></span></div><div class="empty-state-title">Loading…</div></div>`;

        try {
            const pf2 = document.getElementById('filterPlant')?.value || plantFilter || '';
            const params = pf2 ? `approval_status=eq.pending_manager_approval&plant=eq.${encodeURIComponent(pf2)}&order=submitted_at.desc` : 'approval_status=eq.pending_manager_approval&order=submitted_at.desc';
            const records = await query('training_records', params);

            if (records.length === 0) {
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
                            <div class="pending-meta-item"><span class="pending-meta-label">Signed by:</span> ${esc(r.signed_by_supervisor_name||'—')}</div>
                        </div>
                    </div>
                    <div class="pending-actions">
                        <button class="btn btn-primary" onclick='openApprovalModal(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Review →</button>
                    </div>
                </div>
            `).join('');

        } catch(err) {
            $list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">${esc(err.message)}</div></div>`;
        }
    };

    // ========================================================
    // APPROVAL MODAL
    // ========================================================
    const $modal = document.getElementById('approvalModal');
    const $details = document.getElementById('approvalDetails');
    const $rejectInput = document.getElementById('rejectionInput');
    const $rejectReason = document.getElementById('rejectReason');
    let rejectMode = false;

    window.openApprovalModal = function(record) {
        currentRecord = record;
        rejectMode = false;
        if ($rejectInput) $rejectInput.classList.add('hidden');
        if ($rejectReason) $rejectReason.value = '';

        const row = (label, value, mono=false) => `
            <div class="modal-detail-row">
                <span class="modal-detail-label">${label}</span>
                <span class="modal-detail-value" ${mono?'':'style="font-family:var(--font-sans)'}>${esc(value||'—')}</span>
            </div>`;

        $details.innerHTML = `
            ${row('Record SI', '#' + record.si, true)}
            ${row('Date', fmtDate(record.training_date), true)}
            ${row('Plant / Line', `${record.plant} / ${record.line}`)}
            ${row('Trainee', record.emp_name || '#'+record.user_id)}
            ${row('Model / Grade', `${record.model} / ${record.grade}`)}
            ${row('Process', record.process_name)}
            ${row('Trained Cars/Hours', `${record.trained_cars} cars / ${record.trained_hours} hrs`, true)}
            ${row('Score', Math.round((record.training_score||0)*100)+'%', true)}
            ${row('Result', record.training_result)}
            ${row('Signed by', record.signed_by_supervisor_name)}
            ${row('Signed at', fmtDateTime(record.signed_at), true)}
        `;
        $modal.classList.remove('hidden');
    };

    document.getElementById('approvalCancelBtn')?.addEventListener('click', () => {
        $modal.classList.add('hidden'); currentRecord = null; rejectMode = false;
    });

    document.getElementById('approvalRejectBtn')?.addEventListener('click', async () => {
        if (!rejectMode) { $rejectInput?.classList.remove('hidden'); rejectMode = true; return; }
        const reason = $rejectReason?.value.trim();
        if (!reason) { showToast('Required', 'Please enter a rejection reason', 'warning'); return; }
        await processApproval('reject', reason);
    });

    document.getElementById('approvalApproveBtn')?.addEventListener('click', () => processApproval('approve', null));

    async function processApproval(action, reason) {
        if (!currentRecord) return;
        document.getElementById('approvalApproveBtn').disabled = true;
        document.getElementById('approvalRejectBtn').disabled = true;

        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/training_records?id=eq.${currentRecord.id}`, {
                method: 'PATCH',
                headers: {...HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
                body: JSON.stringify(
                    action === 'approve'
                    ? { approval_status: 'approved', approved_by_manager_id: session.empId, approved_by_manager_name: session.name, approved_at: new Date().toISOString() }
                    : { approval_status: 'rejected', approved_by_manager_id: session.empId, approved_by_manager_name: session.name, approved_at: new Date().toISOString(), rejection_reason: reason }
                )
            });

            if (res.ok) {
                showToast(action==='approve'?'Approved ✓':'Rejected', `SI #${currentRecord.si} ${action==='approve'?'approved':'rejected'}`, action==='approve'?'success':'warning');
                $modal.classList.add('hidden'); currentRecord = null; rejectMode = false;
                loadPendingApprovals(); loadOverview();
            } else {
                showToast('Failed', await res.text(), 'error');
            }
        } catch(err) {
            showToast('Error', err.message, 'error');
        } finally {
            document.getElementById('approvalApproveBtn').disabled = false;
            document.getElementById('approvalRejectBtn').disabled = false;
        }
    }

    // ========================================================
    // EXPORT (placeholder for now)
    // ========================================================

    // ========================================================
    // LOGOUT
    // ========================================================
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Sign out?')) { localStorage.removeItem('admin_session'); window.location.href = 'login.html'; }
    });

    // ========================================================
    // POPULATE HEADER + INIT
    // ========================================================
    document.getElementById('userName').textContent = session.name || '—';
    document.getElementById('userRole').textContent = `${session.job_title||'Manager'} · ${session.location||''}`;
    document.getElementById('welcomeName').textContent = firstName;

    // Add role badge to header
    const headerUser = document.querySelector('.header-user');
    if (headerUser && (ROLES.isGM || ROLES.isArchitect)) {
        const badge = document.createElement('span');
        badge.id = 'roleBadge';
        headerUser.insertBefore(badge, headerUser.firstChild);
    }

    applyTheme();
    loadOverview();

})();
