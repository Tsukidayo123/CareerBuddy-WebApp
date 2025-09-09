from typing import Optional

from sqlalchemy.orm import Session

import models, schemas
from security import get_password_hash


# Users
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Jobs
def create_job(db: Session, job_in: schemas.JobCreate) -> models.Job:
    job = models.Job(**job_in.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_jobs(db: Session, skip: int = 0, limit: int = 50, category: str = None, priority: str = None, search: str = None) -> list[models.Job]:
    query = db.query(models.Job)
    
    # Apply filters
    if category:
        query = query.filter(models.Job.category == category)
    if priority:
        query = query.filter(models.Job.priority == priority)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Job.title.ilike(search_term)) |
            (models.Job.company.ilike(search_term)) |
            (models.Job.location.ilike(search_term)) |
            (models.Job.notes.ilike(search_term))
        )
    
    return query.order_by(models.Job.created_at.desc()).offset(skip).limit(limit).all()


def get_job(db: Session, job_id: int) -> Optional[models.Job]:
    return db.query(models.Job).filter(models.Job.id == job_id).first()


def update_job(db: Session, job: models.Job, job_in: schemas.JobUpdate) -> models.Job:
    for field, value in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job: models.Job) -> None:
    db.delete(job)
    db.commit()


# Applications
def create_application(db: Session, user_id: int, app_in: schemas.ApplicationCreate) -> models.Application:
    app = models.Application(user_id=user_id, job_id=app_in.job_id, status=app_in.status, applied_at=app_in.applied_at)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def get_user_applications(db: Session, user_id: int) -> list[models.Application]:
    return db.query(models.Application).filter(models.Application.user_id == user_id).all()


def update_application(db: Session, app: models.Application, app_in: schemas.ApplicationUpdate) -> models.Application:
    for field, value in app_in.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def get_application(db: Session, app_id: int) -> Optional[models.Application]:
    return db.query(models.Application).filter(models.Application.id == app_id).first()


def delete_application(db: Session, app: models.Application) -> None:
    db.delete(app)
    db.commit()


