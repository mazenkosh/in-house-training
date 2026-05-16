/* ============================================================
   ADMIN DASHBOARD STYLES
   ============================================================ */

/* Navigation */
.dash-nav {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: var(--shadow-sm);
}

.dash-nav-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
}

.dash-nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-5);
    color: var(--color-ink-muted);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    border-bottom: 3px solid transparent;
    transition: all var(--duration-fast) var(--ease);
    white-space: nowrap;
    cursor: pointer;
}

.dash-nav-link:hover {
    color: var(--alj-teal);
    background: var(--alj-teal-soft);
}

.dash-nav-link.active {
    color: var(--alj-dark-teal);
    border-bottom-color: var(--alj-teal);
    font-weight: 600;
}

.dash-nav-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    background: var(--alj-blaze);
    color: white;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 11px;
    margin-left: 4px;
}

.dash-nav-badge:empty,
.dash-nav-badge[data-count="0"] {
    display: none;
}

/* Sections */
.dash-section {
    animation: fadeInSection 0.3s var(--ease);
}

@keyframes fadeInSection {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

/* KPI Cards */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-8);
}

.kpi-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    transition: all var(--duration-fast) var(--ease);
}

.kpi-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
}

.kpi-content {
    flex: 1;
    min-width: 0;
}

.kpi-label {
    font-size: 0.78rem;
    color: var(--color-ink-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    margin-bottom: 4px;
}

.kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--alj-dark-teal);
    line-height: 1;
    margin-bottom: 6px;
    font-feature-settings: 'tnum';
}

.kpi-trend {
    font-size: 0.78rem;
    color: var(--color-ink-subtle);
}

/* Quick Actions */
.quick-section {
    margin-top: var(--space-10);
}

.quick-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--alj-dark-teal);
    margin-bottom: var(--space-4);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--space-4);
}

.quick-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease);
    text-align: left;
    font-family: inherit;
}

.quick-card:hover {
    border-color: var(--alj-teal);
    background: var(--alj-teal-soft);
    transform: translateX(4px);
}

.quick-card-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
}

.quick-card-text {
    flex: 1;
    min-width: 0;
}

.quick-card-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--alj-dark-teal);
    margin-bottom: 2px;
}

.quick-card-desc {
    font-size: 0.8rem;
    color: var(--color-ink-muted);
}

.quick-card-arrow {
    font-size: 1.3rem;
    color: var(--alj-teal);
    flex-shrink: 0;
}

/* Filters Bar */
.filters-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    flex-wrap: wrap;
}

/* Pending List */
.pending-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.pending-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--alj-blaze);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
    align-items: center;
    transition: all var(--duration-fast) var(--ease);
}

.pending-card:hover {
    box-shadow: var(--shadow-md);
}

.pending-info {
    min-width: 0;
}

.pending-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
    flex-wrap: wrap;
}

.pending-si {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--alj-charcoal);
    background: var(--color-bg-alt);
    padding: 2px 8px;
    border-radius: 4px;
}

.pending-plant {
    font-size: 0.78rem;
    background: var(--alj-teal-soft);
    color: var(--alj-teal-darker);
    padding: 2px 10px;
    border-radius: 20px;
    font-weight: 600;
}

.pending-date {
    font-size: 0.85rem;
    color: var(--color-ink-muted);
    font-family: var(--font-mono);
}

.pending-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--alj-dark-teal);
    margin-bottom: var(--space-2);
}

.pending-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: 0.85rem;
    color: var(--color-ink-muted);
}

.pending-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.pending-meta-label {
    color: var(--color-ink-subtle);
}

.pending-actions {
    display: flex;
    gap: var(--space-2);
}

/* Empty State */
.empty-state {
    background: var(--color-surface);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
    text-align: center;
}

.empty-state-icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
}

.empty-state-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--alj-dark-teal);
    margin-bottom: var(--space-2);
}

.empty-state-desc {
    font-size: 0.9rem;
    color: var(--color-ink-muted);
}

/* Approval Modal Detail Rows */
#approvalDetails .modal-detail-row {
    flex-direction: row;
    justify-content: space-between;
    padding: var(--space-2) 0;
}

#approvalDetails .modal-detail-label {
    color: var(--color-ink-muted);
    flex: 0 0 40%;
}

#approvalDetails .modal-detail-value {
    text-align: right;
    color: var(--alj-dark-teal);
}

/* Responsive */
@media (max-width: 768px) {
    .dash-nav-inner {
        padding: 0 var(--space-4);
    }
    .dash-nav-link {
        padding: var(--space-3) var(--space-4);
        font-size: 0.85rem;
    }
    .kpi-grid {
        grid-template-columns: 1fr;
    }
    .pending-card {
        grid-template-columns: 1fr;
    }
    .pending-actions {
        flex-direction: column;
    }
    .pending-actions .btn {
        width: 100%;
    }
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
}
