#!/usr/bin/env python3
"""
InternAIde Development Startup Script
This script starts both the frontend and backend servers
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path

def check_command(command):
    """Check if a command exists in the system PATH"""
    try:
        subprocess.run([command, "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def main():
    print("🎯 Starting InternAIde Development Environment...")
    print()
    
    # Check prerequisites
    print("🔍 Checking prerequisites...")
    
    if not check_command("bun"):
        print("❌ bun is not installed. Please install bun first.")
        print("   Visit: https://bun.sh/")
        sys.exit(1)
    
    if not check_command("python3") and not check_command("python"):
        print("❌ Python is not installed. Please install Python 3.10+ first.")
        sys.exit(1)
    
    print("✅ Prerequisites check passed!")
    print()
    
    # Get the project directory
    project_dir = Path(__file__).parent
    backend_dir = project_dir / "backend"
    
    # Create uploads directory
    uploads_dir = backend_dir / "uploads" / "cvs"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if .env file exists in backend
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("⚠️  Backend .env file not found. Creating from template...")
        env_example = backend_dir / ".env.example"
        if env_example.exists():
            env_file.write_text(env_example.read_text())
            print("✅ Created .env file. Please edit it with your API keys.")
        print()
    
    processes = []
    
    def cleanup(signum=None, frame=None):
        print("\n🛑 Shutting down servers...")
        for proc in processes:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except (subprocess.TimeoutExpired, ProcessLookupError):
                try:
                    proc.kill()
                except ProcessLookupError:
                    pass
        print("👋 Goodbye!")
        sys.exit(0)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    try:
        # Start backend
        print("🐍 Starting FastAPI backend...")
        print("🚀 Backend will be available at: http://localhost:8000")
        print("📖 API docs will be available at: http://localhost:8000/docs")
        
        backend_proc = subprocess.Popen(
            [sys.executable, "run.py"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(backend_proc)
        
        # Wait a moment for backend to start
        time.sleep(3)
        
        # Start frontend
        print("⚛️ Starting React frontend...")
        print("🚀 Frontend will be available at: http://localhost:5173")
        
        frontend_proc = subprocess.Popen(
            ["bun", "dev"],
            cwd=project_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        processes.append(frontend_proc)
        
        print()
        print("🎉 InternAIde is now starting up!")
        print()
        print("📱 Frontend: http://localhost:5173")
        print("🔗 Backend:  http://localhost:8000")
        print("📚 API Docs: http://localhost:8000/docs")
        print()
        print("💡 To enable AI cover letter generation:")
        print("   1. Get a free API key from https://console.groq.com/keys")
        print("   2. Add it to backend/.env: GROQ_API_KEY=your-key-here")
        print()
        print("Press Ctrl+C to stop both servers")
        print()
        
        # Wait for processes
        while True:
            time.sleep(1)
            # Check if any process has died
            for proc in processes:
                if proc.poll() is not None:
                    print(f"⚠️  A server process has stopped unexpectedly")
                    cleanup()
    
    except KeyboardInterrupt:
        cleanup()
    except Exception as e:
        print(f"❌ Error: {e}")
        cleanup()

if __name__ == "__main__":
    main()