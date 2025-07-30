#!/usr/bin/env python3
"""
Development runner for InternAIde backend
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    
    # Set environment variables for development
    os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")
    os.environ.setdefault("DATABASE_URL", "sqlite:///./internaide.db")
    
    # Create uploads directory if it doesn't exist
    uploads_dir = backend_dir / "uploads" / "cvs"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    print("🚀 Starting InternAIde Backend API...")
    print("📡 API will be available at: http://localhost:8000")
    print("📖 API docs will be available at: http://localhost:8000/docs")
    print("🗃️ Database: SQLite (./internaide.db)")
    print("\n🔧 For AI cover letter generation, set GROQ_API_KEY environment variable")
    print("   Get your free API key at: https://console.groq.com/keys")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir)]
    )