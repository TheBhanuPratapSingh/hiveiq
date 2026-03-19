# 🐝 HiveIQ — AI-Powered Beehive Health Monitor

> Take a photo of your beehive. Get instant health analysis. Protect your colony.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hiveiq--backend.onrender.com-F5A623?style=for-the-badge)](https://hiveiq-backend.onrender.com/app)
[![GitHub](https://img.shields.io/badge/GitHub-TheBhanuPratapSingh%2Fhiveiq-181717?style=for-the-badge&logo=github)](https://github.com/TheBhanuPratapSingh/hiveiq)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📱 Try It Live

Open on any phone browser — no installation needed:

```
https://hiveiq-backend.onrender.com/app
```

> **Note:** First load may take 30–60 seconds as the free server wakes up.

---

## 🌟 What is HiveIQ?

HiveIQ is a mobile-first web application that helps beekeepers monitor the health of their beehives using AI and computer vision. Simply point your phone camera at a hive frame and get an instant diagnosis.

### What it detects

| Metric | What it means |
|---|---|
| 🐝 Bee Activity | How many bees are present in the frame |
| 🌑 Dark Cells | Possible sign of American Foulbrood or dead brood |
| 🔶 Brood Pattern | Is the egg-laying pattern uniform or patchy |
| 🍯 Comb Fill | How much honey and capped comb is present |
| 👑 Overall Health Score | Combined score out of 100 |
| 🚨 Risk Level | LOW / MEDIUM / HIGH / CRITICAL |

### Disease detection

- ✅ Healthy colony
- ⚠️ General unhealthy indicators
- 🍞 Chalkbrood (fungal disease)
- 🚨 American Foulbrood (bacterial — notifiable disease)
- 🔴 Varroa mite infestation

---

## 📸 Screenshots

### Scanner Screen
Take a photo directly from your phone camera or choose from gallery.

### Results Screen
Instant diagnosis with health score, risk level, detailed metrics and actionable recommendations.

### History Screen
Track your hive health over time. See trends and get alerts when health is declining.

---

## 🚀 Features

- 📷 **Mobile camera** — works directly in phone browser, no app download needed
- 🔬 **Hybrid AI analysis** — combines computer vision rules for accurate results
- 📊 **Health scoring** — overall score out of 100 with 4 individual metrics
- 💡 **Smart recommendations** — tells the beekeeper exactly what to do
- 📋 **Scan history** — every scan saved to database with timestamp
- 🚨 **Alert system** — warns if 3 or more unhealthy scans in 5 days
- 📱 **Add to home screen** — installs like a real app via Chrome
- 🌍 **Works anywhere** — deployed online, no WiFi restrictions
- 💰 **Zero cost** — completely free to run and deploy

---

## 🏗️ How It Works

```
Phone Camera
     ↓
Photo uploaded to FastAPI backend
     ↓
Image preprocessed (resize to 224×224)
     ↓
Computer vision rules run (NumPy + OpenCV)
     ├── Bee activity detection (color analysis)
     ├── Dark cell detection (brightness threshold)
     ├── Brood pattern analysis (edge detection)
     └── Comb fill measurement (honey color detection)
     ↓
Hybrid score calculated
     ↓
Result saved to SQLite database
     ↓
Diagnosis shown on phone instantly
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile App | HTML + CSS + JavaScript | Phone UI and camera |
| Backend API | Python + FastAPI | Receives images, runs analysis |
| Image Processing | NumPy + OpenCV + Pillow | Computer vision rules |
| Database | SQLite + SQLAlchemy | Stores scan history |
| Server | Uvicorn | Runs the Python server |
| Hosting | Render.com (free tier) | Live deployment |
| Version Control | Git + GitHub | Code management |

---

## 📁 Project Structure

```
hiveiq/
├── backend/
│   ├── main.py              ← FastAPI app — all routes, classifier, database
│   ├── requirements.txt     ← Python dependencies
│   └── runtime.txt          ← Python version for Render
│
├── mobile/
│   └── index.html           ← Complete mobile web app (HTML + CSS + JS)
│
├── ml/
│   └── models/              ← Trained .tflite model files go here
│
├── infra/
│   └── .github/
│       └── workflows/       ← CI/CD pipelines
│
└── README.md
```

---

## ⚙️ Run Locally

### Prerequisites

- Python 3.11+
- Git

### Step 1 — Clone the repo

```bash
git clone https://github.com/TheBhanuPratapSingh/hiveiq.git
cd hiveiq
```

### Step 2 — Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3 — Start the server

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 4 — Open the app

Find your local IP address:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Then open on your phone browser:
```
http://YOUR_IP_ADDRESS:8000/app
```

---

## 🌐 Deploy to Render (Free)

1. Fork this repo to your GitHub account
2. Go to [render.com](https://render.com) and sign up with GitHub
3. Click **New** → **Web Service**
4. Select your forked `hiveiq` repo
5. Fill in these settings:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port 10000` |

6. Click **Create Web Service**
7. Wait 3 minutes — your app is live!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/app` | Serve mobile web app |
| POST | `/scan` | Analyze hive photo |
| GET | `/history/{hive_name}` | Get scan history |
| GET | `/alerts/{hive_name}` | Get active alerts |
| GET | `/hives` | List all hive names |
| GET | `/docs` | Auto-generated API docs |

### Example scan request

```bash
curl -X POST "https://hiveiq-backend.onrender.com/scan?hive_name=Hive-1" \
  -F "file=@hive_photo.jpg"
```

### Example response

```json
{
  "final_class": "healthy",
  "overall_score": 0.823,
  "risk_level": "LOW",
  "bee_activity": 0.91,
  "dark_cells": 0.85,
  "brood_score": 0.75,
  "comb_fill": 0.78,
  "hive_name": "Hive-1",
  "recommendations": [
    "Hive looks healthy — continue regular inspections every 7 days"
  ]
}
```

---

## 🧠 AI Model (Coming Soon)

Currently HiveIQ uses computer vision rules for analysis. The next version will include a trained **MobileNetV2** deep learning model for more accurate disease detection.

### Planned disease classes
- Healthy
- Chalkbrood
- American Foulbrood
- Varroa mite infestation
- General unhealthy

### Training pipeline
- Dataset: Kaggle beehive disease images + iNaturalist
- Base model: MobileNetV2 (pretrained on ImageNet)
- Training: Google Colab free GPU
- Export: TensorFlow Lite for mobile deployment

---

## 🚨 Alert System

HiveIQ automatically monitors scan history and raises alerts:

| Trigger | Alert Level |
|---|---|
| 3+ unhealthy scans in 5 days | CRITICAL |
| American Foulbrood detected | CRITICAL |
| Health score declining over 3 scans | WARNING |
| Varroa detected | WARNING |
| No scan in 7+ days | INFO |

---

## 🗺️ Roadmap

- [x] Mobile web app with camera
- [x] Computer vision health analysis
- [x] Scan history and database
- [x] Alert system
- [x] Free cloud deployment
- [ ] Real MobileNetV2 AI model
- [ ] User accounts (multiple beekeepers)
- [ ] Multiple hive management
- [ ] Weekly health report email
- [ ] Android native app (TFLite)
- [ ] Raspberry Pi IoT camera module
- [ ] Custom domain

---

## 🤝 Contributing

Contributions are welcome! If you are a beekeeper with hive images, or a developer who wants to improve the AI model:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Push and create a Pull Request

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

## 👨‍💻 Built By

**Bhanu Pratap Singh**
- GitHub: [@TheBhanuPratapSingh](https://github.com/TheBhanuPratapSingh)
- Project: [HiveIQ](https://hiveiq-backend.onrender.com/app)

---

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com) — amazing Python web framework
- [Render](https://render.com) — free cloud hosting
- [TensorFlow](https://tensorflow.org) — AI model training
- [OpenCV](https://opencv.org) — computer vision library
- All the beekeepers who inspired this project 🐝

---

*Built with ❤️ for beekeepers everywhere*
