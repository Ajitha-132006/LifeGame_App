**🎮 Life RPG App**

Life RPG is a full-stack web application that gamifies real life by turning daily activities into quests. Users can register, log in, complete quests, earn XP, level up, maintain streaks, and track progress — like a real RPG, but for life.
AI integration is not completly done yet.

**🧠 Features**

User authentication (JWT-based)

Quest creation & completion

XP, levels, gold, streaks

Profile & avatar system

Leaderboard

Friends system

Shop items

Photo & quiz-based quest verification

Responsive RPG-style UI

**🛠 Tech Stack**
Frontend

React (CRA + CRACO)

JavaScript

Axios (API calls)

React Router

CSS / UI components

Backend

FastAPI (Python)

JWT Authentication

Pydantic models

Uvicorn ASGI server

Database

MongoDB

Motor (async MongoDB driver)

Tools & Environment

Node.js

npm

Python venv

MongoDB (local)

Git & GitHub

**📁 Project Structure**
life_rpg_app/
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── craco.config.js
│
└── README.md

**⚙️ Prerequisites (Install These First)**
1️⃣ Node.js

Recommended: Node 18 LTS

node -v
npm -v

2️⃣ Python

Recommended: Python 3.11 / 3.12

python --version

3️⃣ MongoDB

Install MongoDB Community Server

Ensure MongoDB service is running

Check:

mongod


or

mongo

**🔐 Environment Variables**

Create a .env file inside backend/:

MONGO_URL=mongodb://localhost:27017
DB_NAME=life_rpg
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

**🚀 How to Run the Application (Step-by-Step)**
🔹 Step 1: Start MongoDB

MongoDB must be running before backend starts.

🔹 Step 2: Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate   # Windows


Install dependencies:

pip install -r requirements.txt


Run backend:

python -m uvicorn server:app --reload


Backend runs at:

http://127.0.0.1:8000


API docs:

http://127.0.0.1:8000/docs

🔹 Step 3: Frontend Setup
cd frontend
npm install --legacy-peer-deps


Run frontend:

npm start


Frontend runs at:

http://localhost:3000

**🔄 How the App Works (Flow)**
React Frontend (3000)
        ↓
FastAPI Backend (8000)
        ↓
MongoDB (27017)


Frontend sends API requests

Backend handles auth, logic, DB

MongoDB stores users, quests, progress

**⚠️ Common Notes**

MongoDB must be running every time the app is used

React hook warnings can be ignored for now

npm audit warnings are common in CRA projects

Backend will throw errors if MongoDB is offline

**📌 Future Improvements**

MongoDB Atlas (cloud DB)

Docker setup

Deployment (Vercel + Render)

Push notifications

Mobile app version

AI-generated quests (optional)

**👤 Author**

Chalasani Ajitha
Project built for learning, practice, and CV showcasing.
