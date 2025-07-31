# InternAIde

**Your smart internship application tracker with AI-powered cover letter generation**

InternAIde is a comprehensive web application designed to help students and professionals manage their internship applications, organize their CVs, and generate personalized cover letters using intelligent templates.

## 🌟 Features

### 📊 Dashboard
- Real-time statistics of your applications
- Visual overview of application statuses
- Recent applications timeline
- Quick access to add applications and generate cover letters

### 👤 Profile Management
- Complete personal information management
- External links integration (GitHub, LinkedIn, Portfolio)
- Custom link management
- Profile preview functionality

### 📄 CV Management
- Upload and organize CVs by role category
- Support for PDF and Word documents
- 11 predefined role categories (Data Scientist, ML Engineer, Software Engineer, etc.)
- File size validation (up to 10MB)
- Role-based CV categorization with color-coded badges

### 📋 Application Tracker
- Comprehensive application management
- Track applications with 5 status levels:
  - To Submit
  - Submitted
  - Interviewing
  - Offer Received
  - Rejected
- Detailed information tracking:
  - Company name and recruiter contacts
  - Position details and salary information
  - Job URLs and application deadlines
  - Associated CV tracking
  - Personal notes

### ✨ AI-Powered Cover Letter Generator
- Generate personalized cover letters in **English** and **French**
- Three tone options: Professional, Enthusiastic, Confident
- Template-based generation using:
  - Your profile information
  - CV details
  - Job description analysis
  - Company-specific customization
- Integration with existing applications or manual entry
- Copy to clipboard and download functionality

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Bun package manager (recommended) or npm/yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd internaide
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
bun run build
# or
npm run build
```

The built files will be in the `dist/` directory.

## 🛠️ Technology Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **UI Components:** ShadCN UI
- **Icons:** Lucide React
- **Data Storage:** Local Storage (browser-based)
- **Package Manager:** Bun

## 📱 Features Overview

### User Authentication
- Simple email/password registration and login
- Persistent sessions using localStorage
- User-specific data isolation

### Data Management
- All data stored locally in browser's localStorage
- No external database required
- User-specific data keys for multi-user support

### File Handling
- CV upload with validation
- Base64 encoding for browser storage
- File type validation (PDF, DOC, DOCX)
- File size limits (10MB max)

### Responsive Design
- Mobile-first design approach
- Tablet and desktop optimized layouts
- Touch-friendly interactions
- Collapsible navigation for smaller screens

## 📋 Usage Guide

### Getting Started
1. **Register/Login:** Create an account or log in with existing credentials
2. **Complete Profile:** Fill in your personal information, education, skills, and links
3. **Upload CVs:** Add your CVs categorized by role types
4. **Add Applications:** Start tracking your internship applications
5. **Generate Cover Letters:** Use the AI generator for personalized cover letters

### Managing Applications
- **Add Application:** Click "Add Application" from dashboard or applications tab
- **Edit/Update:** Use the edit button on any application to update information
- **Status Tracking:** Update application status as you progress through the process
- **Associate CVs:** Link specific CVs to applications for better organization

### Cover Letter Generation
- **From Applications:** Select an existing application for auto-filled details
- **Manual Entry:** Enter company and job details manually
- **Language Selection:** Choose English or French
- **Tone Customization:** Select Professional, Enthusiastic, or Confident tone
- **Export Options:** Copy to clipboard or download as text file

## 🎨 UI/UX Features

- **Modern Design:** Clean, professional interface with gradient backgrounds
- **Intuitive Navigation:** Tab-based navigation for easy access to all features
- **Visual Feedback:** Loading states, success notifications, and error handling
- **Data Visualization:** Statistics cards and progress indicators
- **Responsive Tables:** Sortable and scrollable tables for application management

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── ui/           # ShadCN UI components
│   ├── ApplicationTracker.tsx
│   ├── CVManager.tsx
│   └── ProfileManager.tsx
├── lib/
│   └── utils.ts      # Utility functions
├── App.tsx           # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

### Key Components
- **App.tsx:** Main application with authentication and routing
- **ApplicationTracker.tsx:** Complete application management system
- **CVManager.tsx:** CV upload and organization system
- **ProfileManager.tsx:** User profile management

### Data Models
- **User Profile:** Personal info, education, skills, links
- **Applications:** Company details, status tracking, recruiter info
- **CVs:** File management with role categorization

## 🌐 Browser Compatibility

- **Chrome:** Fully supported
- **Firefox:** Fully supported
- **Safari:** Fully supported
- **Edge:** Fully supported

## 📊 Data Storage

All data is stored locally in the browser's localStorage:
- `internaide_user`: Current logged-in user
- `internaide_profile_{user}`: User profile data
- `internaide_applications_{user}`: Application data
- `internaide_cvs_{user}`: CV file data

## 🔒 Privacy & Security

- **Local Storage Only:** No data sent to external servers
- **User Isolation:** Each user's data is separately stored
- **File Security:** CVs stored as base64 encoded strings
- **No Tracking:** No analytics or external tracking

## 🚧 Future Enhancements

- [ ] Export data to external formats (Excel, PDF reports)
- [ ] Calendar integration for interview scheduling
- [ ] Email template generation
- [ ] Advanced search and filtering
- [ ] Data backup and sync options
- [ ] Mobile app version

## 🤝 Contributing

This is a personal project built using only free tools. Feel free to fork and customize for your own needs.

## 📄 License

This project is available for personal and educational use.

## 🙋 Support

For questions or issues, please refer to the source code comments and documentation within the application.

---

**Built with ❤️ using only free tools and technologies**