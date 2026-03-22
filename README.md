<div align="center">

# 🏥 MediGrated

**An integrated healthcare management platform with AI-powered report analysis, real-time family medicine tracking, and role-based dashboards.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com)

</div>

---

## ✨ Features

### 🔬 AI-Powered Report Scanner
- Upload medical reports (images / PDFs) for instant **OCR text extraction**
- AI analysis powered by **Groq's Llama model** for natural-language summaries
- Server-side OCR via **Tesseract.js** + a dedicated **FastAPI Python OCR microservice**
- Stores parsed reports in the cloud via **Cloudinary**

### 👨‍👩‍👧‍👦 Family Medicine Monitoring
- Create or join **family groups** via invite codes to collaboratively track medications
- Add medicines with dose schedules, tablet counts, and instructions
- **Medicine ownership** — only the user who added a medicine can update, skip, remove, or mark doses
- **Smart missed-dose detection** — automatically alerts when a scheduled dose is missed, with intelligent guards to prevent false alerts for newly added medicines
- **First-dose prompt** — when adding a medicine, optionally mark the first dose as already taken; the system backdates the activity log to the nearest scheduled time
- Real-time **activity log** with chronological history of all actions
- **Refill tracking** with low-supply warnings

### 🤖 AI Chatbot
- Professional, glassmorphic chatbot UI with gradient message bubbles
- Animated typing indicators and smooth transitions
- Available across Patient, Doctor, and Admin views

### 🎨 Premium UI & Theming
- **Light / Dark mode** toggle with full application support
- **Glassmorphism** design language with `backdrop-blur`, translucent panels, and depth layers
- Smooth **300ms transitions** on all interactive elements
- Custom **scrollbars** and micro-animations
- Fully responsive semantic Tailwind CSS color system

### 👥 Role-Based Access
- **Patient** — dashboard, report scanner, chatbot, family monitoring, profile
- **Doctor** — dedicated dashboard and chatbot
- **Admin** — system management, reports overview, chatbot

---

## 🏗️ Architecture

```
MediGrated-Website/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── patient-view/    # Dashboard, Report Scanner, Family Monitoring, Chatbot
│   │   │   ├── doctor-view/     # Doctor Dashboard & Chatbot
│   │   │   ├── admin-view/      # Admin Dashboard & Chatbot
│   │   │   └── auth/            # Login & Registration
│   │   ├── components/ui/       # Reusable UI components (Button, Input, Label, etc.)
│   │   └── store/               # Redux Toolkit slices
│   └── index.css                # Global styles, transitions, custom scrollbars
│
├── server/                  # Express.js backend
│   ├── controllers/
│   │   ├── auth/                # JWT authentication (register, login, logout)
│   │   ├── patient/             # Patient dashboard data
│   │   └── family/              # Family groups, medicines, activity logs
│   ├── models/                  # Mongoose schemas (User, Group, Medicine, Report, ActivityLog)
│   ├── routes/                  # Express route definitions
│   └── ocr_service/             # FastAPI Python microservice for OCR
│       └── app.py               # Tesseract + image processing
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local instance or [Atlas](https://www.mongodb.com/atlas) connection string)
- **Python 3.9+** (for the OCR microservice)

### 1. Clone the Repository

```bash
git clone https://github.com/AbhayJShetty/MI-ChatBot.git
cd MI-ChatBot
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
MONGO_URI=mongodb://localhost:27017/medigrated
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key          # Optional — enables AI report analysis
CLOUDINARY_CLOUD_NAME=your_cloud_name   # Optional — for report image storage
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the server:

```bash
npm run dev     # Starts Express on port 5000
```

### 3. OCR Microservice (Optional)

```bash
cd server/ocr_service
pip install -r requirements.txt
uvicorn app:app --reload    # Starts FastAPI on port 8000
```

### 4. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev     # Starts Vite on port 5173
```

### 5. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3, Redux Toolkit, Radix UI, Lucide Icons |
| **Backend** | Express 5, Mongoose 8, JWT, bcrypt, Multer, Cloudinary |
| **AI / ML** | Groq SDK (Llama), Tesseract.js, FastAPI OCR microservice |
| **Database** | MongoDB |
| **Other** | Twilio (notifications), Nodemon, PostCSS, Autoprefixer |

---

## 📸 Key Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Live stats pulled from MongoDB — recent reports, active family groups |
| **Report Scanner** | Glassmorphic upload UI → OCR → AI summary → stored report |
| **Family Monitoring** | Group-based medicine tracking with ownership, schedules, and alerts |
| **Chatbot** | Floating AI assistant with gradient bubbles and typing animation |
| **Profile** | User profile management |
| **Theme Toggle** | System-aware light/dark mode with smooth transitions |

---

## 🔒 Security

- **JWT-based authentication** with HTTP-only cookies
- **Role-based route protection** (Patient / Doctor / Admin)
- **Medicine ownership enforcement** — backend returns `403 Forbidden` if a non-creator attempts to modify a medicine
- **Password hashing** with bcrypt

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|---------|
| **"Network Error" on Analyze** | Ensure the backend is running (`npm run dev` in `server/`) |
| **MongoDB connection failed** | Check `MONGO_URI` in `server/.env` or start a local instance |
| **OCR not working** | Start the FastAPI service: `uvicorn app:app --reload` in `server/ocr_service/` |
| **Dark mode text invisible** | Clear browser cache — the latest CSS uses semantic `text-foreground` tokens |

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

**Built with ❤️ by the MediGrated Team**

</div>
