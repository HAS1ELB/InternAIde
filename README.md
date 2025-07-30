# 🎯 InternAIde - AI-Powered Internship Tracker

A comprehensive full-stack web application to help students and professionals manage their internship applications with AI-powered cover letter generation in both English and French.

![InternAIde Screenshot](https://img.shields.io/badge/Status-MVP%20Ready-green) ![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI-blue) ![AI](https://img.shields.io/badge/AI-Groq%20%2F%20Llama-purple)

## ✨ Features

### 🔐 User Management

- **Secure Authentication**: JWT-based registration and login system
- **Profile Management**: Personal information, contact details, and portfolio links
- **Multi-language Support**: Interface and cover letters in English and French

### 📄 CV Management

- **Smart Upload System**: Support for PDF and DOCX files
- **Role Categorization**: Organize CVs by target roles (Data Scientist, ML Engineer, etc.)
- **Secure Storage**: Files stored securely with proper validation

### 📊 Application Tracking

- **Dynamic Dashboard**: Visual overview of all applications with status tracking
- **Comprehensive Details**: Company info, job descriptions, recruiter contacts
- **Status Management**: Track progress from "To Submit" to "Offer Received"
- **Quick Actions**: Edit, delete, and download cover letters

### 🤖 AI-Powered Cover Letters

- **Intelligent Generation**: Uses Groq API with Llama models for personalized content
- **Bilingual Support**: Generate professional cover letters in English or French
- **CV Context Integration**: Incorporates your CV content for better personalization
- **Instant Download**: Export as text files for easy use

### 📱 Modern UI/UX

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme detection
- **Intuitive Interface**: Clean, professional design with smooth animations
- **Accessibility**: Built with accessibility best practices

## 🛠️ Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS V4** for styling
- **ShadCN UI** component library
- **Lucide Icons** for consistent iconography

### Backend

- **FastAPI** (Python) for high-performance API
- **SQLAlchemy** for database ORM
- **JWT Authentication** with bcrypt password hashing
- **Pydantic** for data validation
- **Groq API** for AI cover letter generation

### Database

- **SQLite** for development
- **PostgreSQL** ready for production (Supabase recommended)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and bun
- **Python** 3.10+
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd internaide
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Edit .env file with your settings (especially GROQ_API_KEY)
nano .env

# Start the API server
python run.py
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### 4. Get Your Groq API Key (For AI Features)

1. Visit [Groq Console](https://console.groq.com/keys)
2. Create a free account
3. Generate an API key
4. Add it to your `.env` file: `GROQ_API_KEY=your-key-here`

## 📖 Usage Guide

### Getting Started

1. **Register** a new account or **login** to existing one
2. **Set up your profile** with contact information and portfolio links
3. **Upload your CVs** organized by target role categories
4. **Start tracking applications** with the comprehensive dashboard

### Managing Applications

1. Click **"Add Application"** on the dashboard
2. Fill in company details, job description, and recruiter information
3. Select the appropriate CV for the application
4. Use the **AI Cover Letter Generator** for personalized cover letters
5. Track status updates as you progress through the application process

### AI Cover Letter Generation

1. Open the **Cover Letter Generator** from the dashboard
2. Enter the job description and company name
3. Select your preferred language (English/French)
4. Choose a CV for context (optional)
5. Click **Generate** and get a personalized cover letter
6. Copy or download the result for your application

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./internaide.db
GROQ_API_KEY=your-groq-api-key
```

#### Frontend

Create `.env.local` in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Database Setup

#### Development (SQLite)

The app uses SQLite by default. The database file will be created automatically when you first run the backend.

#### Production (PostgreSQL)

1. Set up a PostgreSQL database (Supabase recommended)
2. Update `DATABASE_URL` in your `.env` file
3. The tables will be created automatically on first run

## 📚 API Documentation

The FastAPI backend provides interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/applications` - Get user applications
- `POST /api/cvs/upload` - Upload CV file
- `POST /api/cover-letter/generate` - Generate AI cover letter

## 🏗️ Project Structure

```
internaide/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── auth/                # Authentication pages
│   │   ├── dashboard/           # Main application dashboard
│   │   ├── cvs/                 # CV management
│   │   └── profile/             # User profile
│   ├── contexts/                # React contexts
│   └── lib/                     # Utilities
├── backend/                      # FastAPI backend
│   ├── main.py                  # API entry point
│   ├── models.py                # Database models
│   ├── schemas.py               # Pydantic schemas
│   ├── auth.py                  # Authentication logic
│   └── services/                # Business logic
│       ├── cv_service.py        # CV file handling
│       └── cover_letter_service.py # AI generation
└── README.md                    # This file
```

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **File Validation** for CV uploads
- **SQL Injection Protection** via SQLAlchemy ORM
- **CORS Configuration** for secure frontend-backend communication

## 🌟 Future Enhancements

The current implementation provides a solid MVP. Potential future features include:

- **Email Integration** for sending cover letters directly
- **Application Deadlines** with reminder notifications
- **Statistics Dashboard** with success rate analytics
- **Multi-user Support** for university career offices
- **Mobile App** with React Native
- **Advanced AI Features** with custom prompts and templates

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the [API documentation](http://localhost:8000/docs) when running locally
2. Ensure all environment variables are properly configured
3. Verify that both frontend and backend servers are running
4. For AI features, make sure you have a valid Groq API key

## 🎉 Acknowledgments

- **Groq** for providing fast AI inference
- **ShadCN** for the beautiful UI components
- **FastAPI** for the excellent Python web framework
- **React & Vite** for the modern frontend development experience

---

Built with ❤️ for students and professionals seeking their dream internships!
