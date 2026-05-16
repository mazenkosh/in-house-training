# In-House Training System
**Abdul Latif Jameel Motors — Production Training Management**

A web-based replacement for the shared Excel file, designed to handle 50+ simultaneous users across 5 production plants with zero data loss.

---

## 🚀 Live System
**Form URL:** [https://mazenkosh.github.io/in-house-training/](https://mazenkosh.github.io/in-house-training/)

---

## 🏗️ Tech Stack
- **Frontend:** Vanilla HTML/CSS/JavaScript (no frameworks, zero installation)
- **Backend/Database:** Supabase (PostgreSQL)
- **Hosting:** GitHub Pages

---

## 📁 Project Structure
```
in-house-training/
├── index.html              ← Login page (Employee ID)
├── form.html               ← Training entry form
├── css/
│   └── main.css            ← Stylesheet (ALJ brand colors)
├── js/
│   ├── config.js           ← Supabase credentials & constants
│   ├── api.js              ← Database API layer
│   ├── login.js            ← Login logic
│   └── form.js             ← Form logic & cascading dropdowns
├── alj-logo.png            ← ALJ Motors logo (color, transparent)
├── alj-logo-white.png      ← ALJ Motors logo (white, for dark BG)
├── alj-symbol.png          ← Pentagon symbol only
└── favicon.png             ← Browser tab icon
```

---

## 🎯 Features
- ✅ Employee ID verification against Manpower database
- ✅ Cascading dropdowns: Plant → Line → Model → Grade → Process
- ✅ Auto-computed fields: Required Hours, Previous Hours, Training Score, Result
- ✅ 50+ concurrent users supported
- ✅ Every submission backed up automatically
- ✅ Audit log for all actions
- ✅ Mobile-responsive (works on phones)

---

## 🔧 Setup Instructions

### 1. Supabase is already configured
The database is live at `https://gbdiwvdhyrgsneirfsma.supabase.co`

### 2. Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Source: **Deploy from branch**
3. Branch: **main** / **root**
4. Click **Save**

### 3. Access the system
After GitHub Pages is enabled, the form is live at:
`https://mazenkosh.github.io/in-house-training/`

---

## 👤 Admin
- **Super Admin:** mazenro1990@gmail.com
- **Dashboard:** Coming in Phase 2

---

## 📊 Database
- **Platform:** Supabase (PostgreSQL)
- **Region:** South Asia (Mumbai) — ap-south-1
- **Tables:** 12 tables including training_records, manpower, models, grades, processes

---

*In-House Training System v1.0 · Abdul Latif Jameel Motors · 2026*
