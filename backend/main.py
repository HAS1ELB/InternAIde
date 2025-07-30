from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn
import os
from typing import List, Optional

from database import get_db, engine, Base
from models import User, Application, CV
from schemas import UserCreate, UserResponse, ApplicationCreate, ApplicationResponse, TokenResponse
from auth import create_access_token, verify_token, hash_password, verify_password
from services.cv_service import save_cv_file, get_cv_by_id
from services.cover_letter_service import generate_cover_letter

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="InternAIde API",
    description="API for managing internship applications with AI-powered cover letter generation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.scout.site"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Health check
@app.get("/")
async def root():
    return {"message": "InternAIde API is running"}

# Auth routes
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        phone=user_data.phone,
        github_url=user_data.github_url,
        linkedin_url=user_data.linkedin_url,
        portfolio_url=user_data.portfolio_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer", user=UserResponse.from_orm(user))

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, token_type="bearer", user=UserResponse.from_orm(user))

# User profile routes
@app.get("/api/user/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@app.put("/api/user/profile", response_model=UserResponse)
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    portfolio_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if name is not None:
        current_user.name = name
    if phone is not None:
        current_user.phone = phone
    if github_url is not None:
        current_user.github_url = github_url
    if linkedin_url is not None:
        current_user.linkedin_url = linkedin_url
    if portfolio_url is not None:
        current_user.portfolio_url = portfolio_url
    
    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)

# CV routes
@app.post("/api/cvs/upload")
async def upload_cv(
    file: UploadFile = File(...),
    role_category: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    
    # Save file and create CV record
    file_path = await save_cv_file(file, current_user.id)
    
    cv = CV(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        role_category=role_category
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    
    return {"id": cv.id, "filename": cv.filename, "role_category": cv.role_category}

@app.get("/api/cvs")
async def get_user_cvs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cvs = db.query(CV).filter(CV.user_id == current_user.id).all()
    return [{"id": cv.id, "filename": cv.filename, "role_category": cv.role_category} for cv in cvs]

# Application routes
@app.post("/api/applications", response_model=ApplicationResponse)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = Application(
        user_id=current_user.id,
        **application_data.dict()
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return ApplicationResponse.from_orm(application)

@app.get("/api/applications", response_model=List[ApplicationResponse])
async def get_user_applications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    applications = db.query(Application).filter(Application.user_id == current_user.id).all()
    return [ApplicationResponse.from_orm(app) for app in applications]

@app.put("/api/applications/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    for field, value in application_data.dict().items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    return ApplicationResponse.from_orm(application)

@app.delete("/api/applications/{application_id}")
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    return {"message": "Application deleted successfully"}

# Cover letter generation
@app.post("/api/cover-letter/generate")
async def generate_cover_letter_endpoint(
    job_description: str = Form(...),
    company_name: str = Form(...),
    language: str = Form("english"),
    cv_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cv_content = None
    if cv_id:
        cv = get_cv_by_id(cv_id, current_user.id, db)
        if cv:
            cv_content = cv.file_path  # This would need to be extracted content
    
    cover_letter = await generate_cover_letter(
        job_description=job_description,
        company_name=company_name,
        language=language,
        user_profile=current_user,
        cv_content=cv_content
    )
    
    return {"cover_letter": cover_letter}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)