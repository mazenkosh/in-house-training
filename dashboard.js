/* ============================================================
   PIO ADMIN DASHBOARD — Professional UI v2.0
   Modern, animated, role-based
   ============================================================ */

/* ---- RESET & BASE ---- */
*, *::before, *::after { box-sizing: border-box; }

/* ---- CSS VARIABLES ---- */
:root {
    --dash-sidebar-w: 240px;
    --dash-header-h: 64px;
    --dash-radius: 16px;
    --dash-radius-sm: 10px;
    --dash-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
    --dash-shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06);
    --dash-shadow-hover: 0 8px 24px rgba(81,133,154,0.15), 0 2px 8px rgba(0,0,0,0.06);
    --dash-transition: 0.22s cubic-bezier(0.4,0,0.2,1);
    --dash-bg: #F4F6F8;
    --dash-surface: #FFFFFF;
    --dash-border: rgba(0,0,0,0.07);
    
    /* Role colors */
    --role-gm-bg: linear-gradient(135deg, #1C3258 0%, #0D1F38 100%);
    --role-gm-accent: #C9A84C;
    --role-architect-accent: #ED6B13;
    --role-prodmgr-accent: #5FC4E2;
}

/* ---- APP SHELL ---- */
.app {
    min-height: 100vh;
    background: var(--dash-bg);
    display: flex;
    flex-direction: column;
}

/* ---- HEADER ---- */
.header {
    height: var(--dash-header-h);
    background: var(--alj-dark-teal);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

.header-inner {
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.brand { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.pio-mark-sm {
    font-family: 'Outfit', sans-serif;
    font-weight: 900;
    font-size: 1.5rem;
    background: linear-gradient(135deg, #FFFFFF 0%, #5FC4E2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
}
.brand-text { display: flex; flex-direction: column; }
.brand-title { color: white; font-weight: 700; font-size: 0.9rem; line-height: 1.2; }
.brand-subtitle { color: rgba(255,255,255,0.5); font-size: 0.7rem; letter-spacing: 0.06em; }

.header-right { display: flex; align-items: center; gap: 16px; }
.brand-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.15); }
.brand-logo { height: 20px; width: auto; opacity: 0.8; }

.header-user { display: flex; align-items: center; gap: 10px; }
.header-user-info { text-align: right; }
.header-user-name { color: white; font-weight: 600; font-size: 0.88rem; line-height: 1.2; }
.header-user-id { color: rgba(255,255,255,0.55); font-size: 0.72rem; font-family: var(--font-mono); }

.btn-logout {
    padding: 6px 14px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    color: rgba(255,255,255,0.85);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--dash-transition);
    font-family: inherit;
    white-space: nowrap;
}
.btn-logout:hover { background: rgba(255,255,255,0.18); color: white; }

/* ---- ROLE BADGE ---- */
.role-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
}

/* ---- NAVIGATION TABS ---- */
.dash-nav {
    background: var(--dash-surface);
    border-bottom: 1px solid var(--dash-border);
    position: sticky;
    top: var(--dash-header-h);
    z-index: 90;
    box-shadow: 0 1px 0 var(--dash-border);
}
.dash-nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
}
.dash-nav-inner::-webkit-scrollbar { display: none; }

.dash-nav-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    color: #717173;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 500;
    border-bottom: 3px solid transparent;
    transition: var(--dash-transition);
    white-space: nowrap;
    cursor: pointer;
    position: relative;
}
.dash-nav-link:hover { color: var(--alj-teal); background: rgba(81,133,154,0.04); }
.dash-nav-link.active {
    color: var(--alj-dark-teal);
    border-bottom-color: var(--alj-teal);
    font-weight: 600;
}

.dash-nav-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: var(--alj-blaze);
    color: white;
    font-size: 0.68rem;
    font-weight: 700;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* ---- MAIN CONTENT ---- */
.main {
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    padding: 28px 24px;
}

/* ---- SECTIONS ---- */
.dash-section {
    animation: sectionIn 0.35s cubic-bezier(0.4,0,0.2,1) both;
}
@keyframes sectionIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
.hidden { display: none !important; }

.page-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--alj-dark-teal);
    letter-spacing: -0.02em;
    margin: 0 0 4px 0;
}
.page-subtitle {
    font-size: 0.9rem;
    color: #9B9B9D;
    margin: 0 0 24px 0;
}

/* ---- KPI GRID ---- */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.kpi-card {
    background: var(--dash-surface);
    border-radius: var(--dash-radius);
    padding: 22px 20px;
    box-shadow: var(--dash-shadow);
    border: 1px solid var(--dash-border);
    display: flex;
    align-items: flex-start;
    gap: 14px;
    transition: var(--dash-transition);
    animation: cardIn 0.4s cubic-bezier(0.4,0,0.2,1) both;
    position: relative;
    overflow: hidden;
}
.kpi-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--kpi-color, var(--alj-teal));
    border-radius: var(--dash-radius) var(--dash-radius) 0 0;
}
.kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--dash-shadow-hover);
}
.kpi-card:nth-child(1) { animation-delay: 0.05s; --kpi-color: #51859A; }
.kpi-card:nth-child(2) { animation-delay: 0.10s; --kpi-color: #ED6B13; }
.kpi-card:nth-child(3) { animation-delay: 0.15s; --kpi-color: #069999; }
.kpi-card:nth-child(4) { animation-delay: 0.20s; --kpi-color: #5FC4E2; }

@keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}

.kpi-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
}
.kpi-content { flex: 1; min-width: 0; }
.kpi-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #9B9B9D;
    margin-bottom: 6px;
}
.kpi-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--alj-dark-teal);
    line-height: 1;
    margin-bottom: 6px;
    font-feature-settings: 'tnum';
    letter-spacing: -0.02em;
}
.kpi-trend { font-size: 0.78rem; color: #9B9B9D; }

/* ---- CARDS ---- */
.card {
    background: var(--dash-surface);
    border-radius: var(--dash-radius);
    box-shadow: var(--dash-shadow);
    border: 1px solid var(--dash-border);
    overflow: hidden;
    animation: cardIn 0.4s cubic-bezier(0.4,0,0.2,1) both;
}
.card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--dash-border);
    background: #FAFBFC;
}
.card-title {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--alj-dark-teal);
    display: flex;
    align-items: center;
    gap: 8px;
}
.card-body { padding: 20px; }
.card-title-number {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--alj-teal);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.72rem; font-weight: 700;
}

/* ---- QUICK ACTIONS ---- */
.quick-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 14px;
    margin-top: 8px;
}
.quick-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: var(--dash-radius-sm);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: var(--dash-transition);
    text-align: left;
    font-family: inherit;
}
.quick-card:hover {
    border-color: var(--alj-teal);
    background: rgba(81,133,154,0.04);
    transform: translateX(3px);
    box-shadow: var(--dash-shadow);
}
.quick-card-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; flex-shrink: 0;
}
.quick-card-title { font-size: 0.9rem; font-weight: 600; color: var(--alj-dark-teal); }
.quick-card-desc { font-size: 0.78rem; color: #9B9B9D; margin-top: 2px; }
.quick-card-arrow { font-size: 1.1rem; color: var(--alj-teal); margin-left: auto; flex-shrink: 0; }

/* ---- SECTION TITLES ---- */
.section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #9B9B9D;
    margin: 28px 0 12px;
}

/* ---- FILTERS BAR ---- */
.filters-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}
.filters-bar .form-select {
    background: var(--dash-surface);
    border-radius: 10px;
    border: 1px solid var(--dash-border);
    font-size: 0.88rem;
    padding: 8px 12px;
    height: 38px;
    color: var(--alj-dark-teal);
    font-family: inherit;
    cursor: pointer;
    transition: var(--dash-transition);
    outline: none;
}
.filters-bar .form-select:focus { border-color: var(--alj-teal); box-shadow: 0 0 0 3px rgba(81,133,154,0.12); }

/* ---- PENDING CARDS ---- */
.pending-list { display: flex; flex-direction: column; gap: 12px; }
.pending-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-left: 4px solid var(--alj-blaze);
    border-radius: var(--dash-radius-sm);
    padding: 16px 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    transition: var(--dash-transition);
    animation: cardIn 0.3s ease both;
}
.pending-card:hover { box-shadow: var(--dash-shadow-md); transform: translateY(-1px); }
.pending-si {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    background: #F0F4F6;
    color: var(--alj-charcoal);
    padding: 2px 8px;
    border-radius: 5px;
}
.pending-plant {
    font-size: 0.75rem;
    background: rgba(81,133,154,0.1);
    color: var(--alj-teal-darker, #2a6a7a);
    padding: 2px 10px;
    border-radius: 20px;
    font-weight: 600;
}
.pending-date { font-size: 0.82rem; color: #9B9B9D; font-family: var(--font-mono); }
.pending-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.pending-title { font-size: 1rem; font-weight: 600; color: var(--alj-dark-teal); margin-bottom: 8px; }
.pending-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.82rem; color: #9B9B9D; }
.pending-meta-label { color: #C0C0C2; }
.pending-actions { display: flex; gap: 8px; }

/* ---- RECORDS TABLE ---- */
.records-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.records-table th {
    padding: 11px 16px;
    text-align: left;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--alj-dark-teal);
    font-weight: 700;
    background: #F7F9FA;
    border-bottom: 2px solid var(--dash-border);
    white-space: nowrap;
}
.records-table td {
    padding: 11px 16px;
    border-bottom: 1px solid #F0F2F4;
    vertical-align: middle;
    transition: background 0.15s;
}
.records-table tr:hover td { background: #F7FBFC; }
.records-table tr:last-child td { border-bottom: none; }

/* ---- PLANT CHART BARS ---- */
.plant-bar-wrap {
    display: grid;
    grid-template-columns: repeat(5,1fr);
    gap: 16px;
    align-items: flex-end;
    height: 200px;
    padding-bottom: 8px;
}
.plant-bar-col {
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
}
.plant-bar {
    width: 100%;
    border-radius: 8px 8px 0 0;
    transition: height 1s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease;
    min-height: 4px;
    cursor: pointer;
    position: relative;
}
.plant-bar:hover { opacity: 0.85; }
.plant-bar-label { font-size: 0.75rem; font-weight: 700; color: var(--alj-dark-teal); }
.plant-bar-count { font-size: 1rem; font-weight: 800; }
.plant-bar-rate { font-size: 0.72rem; font-weight: 600; }

/* ---- MODAL ---- */
.modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
    background: var(--dash-surface);
    border-radius: var(--dash-radius);
    box-shadow: 0 24px 80px rgba(0,0,0,0.2);
    width: 100%; max-width: 600px;
    max-height: 90vh; overflow-y: auto;
    animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes modalIn {
    from { opacity: 0; transform: scale(0.92) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-body { padding: 24px; }
.modal-actions {
    display: flex; justify-content: flex-end;
    gap: 10px; margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--dash-border);
}
.modal-detail-row {
    display: flex; justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #F4F6F8;
    font-size: 0.9rem;
}
.modal-detail-row:last-child { border-bottom: none; }
.modal-detail-label { color: #9B9B9D; font-weight: 500; }
.modal-detail-value { color: var(--alj-dark-teal); font-weight: 600; text-align: right; }

/* ---- EMPTY STATE ---- */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    border: 1.5px dashed #DDE1E6;
    border-radius: var(--dash-radius);
    background: #FAFBFC;
}
.empty-state-icon { font-size: 2.5rem; margin-bottom: 12px; }
.empty-state-title { font-size: 1rem; font-weight: 600; color: var(--alj-dark-teal); margin-bottom: 6px; }
.empty-state-desc { font-size: 0.85rem; color: #9B9B9D; }

/* ---- BUTTONS ---- */
.btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; padding: 9px 18px;
    font-family: inherit; font-size: 0.88rem; font-weight: 600;
    border: none; border-radius: 10px;
    cursor: pointer; transition: var(--dash-transition);
    text-decoration: none; white-space: nowrap;
}
.btn-primary {
    background: var(--alj-teal);
    color: white;
    box-shadow: 0 2px 8px rgba(81,133,154,0.3);
}
.btn-primary:hover { background: var(--alj-dark-teal); box-shadow: 0 4px 16px rgba(81,133,154,0.4); transform: translateY(-1px); }
.btn-secondary {
    background: #F0F4F6;
    color: var(--alj-dark-teal);
    border: 1px solid var(--dash-border);
}
.btn-secondary:hover { background: #E4EEF2; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

/* ---- TOAST ---- */
.toast-container {
    position: fixed; bottom: 24px; right: 24px;
    display: flex; flex-direction: column; gap: 10px;
    z-index: 999; pointer-events: none;
}
.toast {
    background: var(--alj-dark-teal);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    display: flex; align-items: flex-start; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    min-width: 280px; max-width: 360px;
    pointer-events: auto;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    border-left: 4px solid var(--alj-teal);
}
.toast.is-error { border-left-color: #B92A2A; }
.toast.is-warning { border-left-color: #ED6B13; }
.toast.is-leaving { animation: toastOut 0.25s ease forwards; }
@keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
@keyframes toastOut { to { opacity:0; transform:translateX(40px); } }
.toast-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
.toast-title { font-weight: 700; font-size: 0.88rem; }
.toast-message { font-size: 0.8rem; opacity: 0.8; margin-top: 2px; }

/* ---- SPINNER ---- */
.spinner {
    display: inline-block; width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
.spinner-lg { width: 36px; height: 36px; border-width: 3px; border-top-color: var(--alj-teal); border-color: rgba(81,133,154,0.2); }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- PROGRESS BAR ---- */
.progress-wrap { height: 8px; background: #F0F2F4; border-radius: 4px; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 4px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }

/* ---- TEXTAREA ---- */
.form-textarea {
    width: 100%; min-height: 80px; padding: 10px 14px;
    border: 1.5px solid var(--dash-border); border-radius: 10px;
    font-family: inherit; font-size: 0.9rem; resize: vertical; outline: none;
    transition: border-color 0.2s;
}
.form-textarea:focus { border-color: var(--alj-teal); }

/* ---- RESPONSIVE ---- */
@media (max-width: 1100px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .quick-grid { grid-template-columns: 1fr; }
    .plant-bar-wrap { grid-template-columns: repeat(3,1fr); height: 160px; }
}
@media (max-width: 768px) {
    .main { padding: 16px; }
    .kpi-grid { grid-template-columns: 1fr; gap: 12px; }
    .pending-card { grid-template-columns: 1fr; }
    .dash-nav-link { padding: 12px 14px; font-size: 0.82rem; }
    .header-inner { padding: 0 16px; }
    .brand-text { display: none; }
    .header-user-info { display: none; }
    .brand-divider { display: none; }
    .brand-logo { display: none; }
    .page-title { font-size: 1.3rem; }
    .plant-bar-wrap { grid-template-columns: repeat(2,1fr); }
}
