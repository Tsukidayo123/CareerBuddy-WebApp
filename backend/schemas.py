from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from models import ApplicationStatus


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: Optional[str] = None


class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    priority: str = "MEDIUM"
    deadline: Optional[datetime] = None
    salary_range: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    salary_range: Optional[str] = None


class JobOut(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicationBase(BaseModel):
    status: ApplicationStatus = ApplicationStatus.SAVED
    applied_at: Optional[datetime] = None


class ApplicationCreate(ApplicationBase):
    job_id: int


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    applied_at: Optional[datetime] = None


class ApplicationOut(ApplicationBase):
    id: int
    user_id: int
    job_id: int
    updated_at: datetime

    model_config = {"from_attributes": True}


