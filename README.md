CareerBuddy - Student Job Tracker
=================================

Tech stack: FastAPI (Python), SQLite, SQLAlchemy, Vanilla HTML/CSS/JS.

Run locally
-----------
1) Python 3.11+
2) Create venv and install deps:

```
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

3) Open `frontend/index.html` with Live Server or any static server. Default API base is `http://127.0.0.1:8000`.

Features
--------
- Register/Login with hashed passwords and JWT
- Create and manage jobs
- Track applications with statuses (Saved → Applied → Interview → Offer → Rejected)
- CORS enabled, validation with Pydantic

Environment
-----------
Optional `.env` in `backend`:

```
SECRET_KEY=change-me
SQLALCHEMY_DATABASE_URL=sqlite:///./careerbuddy.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://127.0.0.1:5500","http://localhost:5500"]
```

Security notes
--------------
- Passwords hashed with bcrypt via Passlib
- JWTs signed with HS256, short-lived tokens
- Minimal attack surface: no file uploads, strict JSON bodies

Azure deployment
----------------
- Containerize with Docker or use Azure App Service for Containers.
- Use `WEBSITE_RUN_FROM_PACKAGE=1` and set `SECRET_KEY` in Azure App Settings.
- For a quick container build:

```
docker build -t careerbuddy-api -f Dockerfile .
docker run -p 8000:8000 careerbuddy-api
```


