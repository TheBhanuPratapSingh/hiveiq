from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import numpy as np
import httpx

app = FastAPI(title="HiveIQ API")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database setup ─────────────────────────────────────────
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "hiveiq.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp     TEXT NOT NULL,
            hive_name     TEXT NOT NULL,
            final_class   TEXT,
            overall_score REAL,
            risk_level    TEXT,
            bee_activity  REAL,
            dark_cells    REAL,
            brood_score   REAL,
            comb_fill     REAL,
            recommendations TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_scan(result: dict):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO scans (
            timestamp, hive_name, final_class, overall_score,
            risk_level, bee_activity, dark_cells,
            brood_score, comb_fill, recommendations
        ) VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        datetime.now().isoformat(),
        result.get("hive_name", "Hive-1"),
        result.get("final_class", "unknown"),
        result.get("overall_score", 0),
        result.get("risk_level", "UNKNOWN"),
        result.get("bee_activity", 0),
        result.get("dark_cells", 0),
        result.get("brood_score", 0),
        result.get("comb_fill", 0),
        json.dumps(result.get("recommendations", [])),
    ))
    conn.commit()
    conn.close()

def get_scans(hive_name: str, days: int = 30):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    since = (datetime.now() - timedelta(days=days)).isoformat()
    rows = conn.execute(
        "SELECT * FROM scans WHERE hive_name=? AND timestamp>=? ORDER BY timestamp DESC",
        (hive_name, since)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_hives():
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("SELECT DISTINCT hive_name FROM scans").fetchall()
    conn.close()
    return [r[0] for r in rows]

def get_alerts(hive_name: str):
    scans = get_scans(hive_name, days=5)
    if not scans:
        return []
    alerts = []
    unhealthy = sum(1 for s in scans if s["final_class"] != "healthy")
    if unhealthy >= 3:
        alerts.append({
            "level": "CRITICAL",
            "message": f"{unhealthy}/5 recent scans show disease — inspect immediately"
        })
    if len(scans) >= 3:
        scores = [s["overall_score"] for s in scans[:3]]
        if scores[0] < scores[1] < scores[2]:
            alerts.append({
                "level": "WARNING",
                "message": "Health score declining over last 3 scans"
            })
    return alerts

# ── Classifier ─────────────────────────────────────────────

def analyze_image(img_array: np.ndarray) -> dict:
    img = img_array.astype(np.float32) / 255.0
    r, g, b = img[:,:,0], img[:,:,1], img[:,:,2]

    bee_mask = (r > 0.35) & (r < 0.85) & (g > 0.25) & (g < 0.75) & (b < 0.45)
    bee_activity = float(bee_mask.mean())

    brightness = (r + g + b) / 3.0
    dark_ratio = float((brightness < 0.2).mean())

    gray = brightness
    diff_h = float(np.abs(np.diff(gray, axis=0)).mean())
    diff_v = float(np.abs(np.diff(gray, axis=1)).mean())
    edge_density = (diff_h + diff_v) / 2
    brood_score = 1.0 if 0.03 < edge_density < 0.15 else 0.5

    honey_mask = (r > 0.5) & (r < 0.9) & (g > 0.35) & (g < 0.75) & (b < 0.35)
    comb_fill = float(honey_mask.mean())

    scores = {
        "bee_activity": min(bee_activity * 4, 1.0),
        "dark_cells":   max(1.0 - dark_ratio * 8, 0.0),
        "brood_score":  brood_score,
        "comb_fill":    min(comb_fill * 5, 1.0),
    }

    overall = round(sum(scores.values()) / len(scores), 3)

    if overall >= 0.75:
        final_class, risk = "healthy", "LOW"
    elif overall >= 0.55:
        final_class, risk = "unhealthy", "MEDIUM"
    elif overall >= 0.35:
        final_class, risk = "unhealthy", "HIGH"
    else:
        final_class, risk = "unhealthy", "CRITICAL"

    recs = []
    if scores["bee_activity"] < 0.4:
        recs.append("Low bee activity — check for queen or starvation")
    if scores["dark_cells"] < 0.5:
        recs.append("Dark cells detected — test for American Foulbrood")
    if scores["comb_fill"] < 0.3:
        recs.append("Low honey stores — consider supplemental feeding")
    if not recs:
        recs.append("Hive looks healthy — continue regular inspections")

    return {
        "final_class":   final_class,
        "overall_score": overall,
        "risk_level":    risk,
        "bee_activity":  round(scores["bee_activity"], 3),
        "dark_cells":    round(scores["dark_cells"], 3),
        "brood_score":   round(scores["brood_score"], 3),
        "comb_fill":     round(scores["comb_fill"], 3),
        "recommendations": recs,
    }

# ── Routes ─────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "HiveIQ API is running 🐝"}

@app.post("/scan")
async def scan_hive(
    hive_name: str = "Hive-1",
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()
        
        # Handle image opening safely
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
        
        image = image.resize((224, 224))
        img_array = np.array(image)

        result = analyze_image(img_array)
        result["hive_name"] = hive_name
        
        # Save to database safely
        try:
            save_scan(result)
        except Exception as e:
            print(f"DB save error: {e}")
            # Continue even if save fails
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Scan error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{hive_name}")
def get_history(hive_name: str):
    return {"hive_name": hive_name, "scans": get_scans(hive_name)}

@app.get("/alerts/{hive_name}")
def check_alerts(hive_name: str):
    return {"hive_name": hive_name, "alerts": get_alerts(hive_name)}

@app.get("/hives")
def list_hives():
    return {"hives": get_all_hives()}

@app.get("/app")
def serve_app():
    html_path = os.path.join(os.path.dirname(__file__), "..", "mobile", "index.html")
    return FileResponse(
        html_path,
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )

@app.post("/chat")
async def chat(request: dict):
    message = request.get("message", "")
    history = request.get("history", [])

    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")

    # Build conversation history for Gemini
    gemini_messages = []
    for h in history[-10:]:
        # Handle both formats safely
        role = h.get("role", "user")
        content = h.get("content", h.get("text", ""))
        if not content:
            continue
        gemini_role = "user" if role == "user" else "model"
        gemini_messages.append({
            "role": gemini_role,
            "parts": [{"text": content}]
        })

    # Add current message
    gemini_messages.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    # System prompt
    system_prompt = """You are BeeBot, a friendly expert beekeeping
assistant specializing in Apis mellifera (Western honey bee).
You help beekeepers with:
- Hive health and disease identification
- Treatment for Varroa, AFB, Chalkbrood
- Seasonal hive management
- Queen rearing and swarm prevention
- Honey harvesting and extraction
- Equipment and best practices
- Bee biology and behavior

Keep answers practical, clear and friendly.
Use simple language for beginners.
When disease is suspected always recommend
consulting a local bee inspector.
Always remember the user keeps Apis mellifera bees."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "system_instruction": {
                        "parts": [{"text": system_prompt}]
                    },
                    "contents": gemini_messages,
                    "generationConfig": {
                        "maxOutputTokens": 1024,
                        "temperature": 0.7,
                    }
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini error: {response.text}"
            )

        data = response.json()
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
        return {"reply": reply}

    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Request timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
