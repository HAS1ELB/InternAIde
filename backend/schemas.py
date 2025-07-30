from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# CV schemas
class CVBase(BaseModel):
    filename: str
    role_category: str

class CVResponse(CVBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Application schemas
class ApplicationBase(BaseModel):
    company_name: str
    role_title: str
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    cover_letter: Optional[str] = None
    cover_letter_language: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_linkedin: Optional[str] = None
    status: str = "To Submit"
    cv_id: Optional[int] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    submission_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenResponse(Token):
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Cover letter generation schemas
class CoverLetterRequest(BaseModel):
    job_description: str
    company_name: str
    language: str = "english"  # "english" or "french"
    cv_id: Optional[int] = None

class CoverLetterResponse(BaseModel):
    cover_letter: str