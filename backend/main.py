from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import settings
from database import engine, Base, get_db
import schemas, models, crud
from deps import get_current_user
from auth import router as auth_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
def health():
    return {"status": "ok"}


# Jobs endpoints
@app.post("/jobs", response_model=schemas.JobOut)
def create_job(job_in: schemas.JobCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.create_job(db, job_in)


@app.get("/jobs", response_model=list[schemas.JobOut])
def list_jobs(
    skip: int = 0, 
    limit: int = 50, 
    category: str = None,
    priority: str = None,
    search: str = None,
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    return crud.get_jobs(db, skip=skip, limit=limit, category=category, priority=priority, search=search)


@app.put("/jobs/{job_id}", response_model=schemas.JobOut)
def update_job(job_id: int, job_in: schemas.JobUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return crud.update_job(db, job, job_in)


@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    job = crud.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    crud.delete_job(db, job)
    return {"ok": True}


# Applications endpoints
@app.post("/applications", response_model=schemas.ApplicationOut)
def create_application(app_in: schemas.ApplicationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.create_application(db, user.id, app_in)


@app.get("/applications", response_model=list[schemas.ApplicationOut])
def list_applications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.get_user_applications(db, user.id)


@app.put("/applications/{app_id}", response_model=schemas.ApplicationOut)
def update_application(app_id: int, app_in: schemas.ApplicationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = crud.get_application(db, app_id)
    if not app or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return crud.update_application(db, app, app_in)


@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = crud.get_application(db, app_id)
    if not app or app.user_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    crud.delete_application(db, app)
    return {"ok": True}


# Job URL redirect endpoint (for production use)
@app.get("/redirect/{job_id}")
def redirect_to_job(job_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    job = crud.get_job(db, job_id)
    if not job or not job.url:
        raise HTTPException(status_code=404, detail="Job or URL not found")
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=job.url, status_code=302)


