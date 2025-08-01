import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, FileText, Users, Sparkles, LogIn, UserPlus, Settings, User, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ProfileManager from "./components/ProfileManager";
import CVManager from "./components/CVManager";
import ApplicationTracker from "./components/ApplicationTracker";

function createCoverLetter({ profile, jobDescription, companyName, positionTitle, language, tone }: any) {
  const today = new Date().toLocaleDateString();
  
  if (language === 'french') {
    return `${today}

Madame, Monsieur,

Je vous écris pour postuler au poste de ${positionTitle} chez ${companyName}.

En tant que ${profile?.title || 'professionnel motivé'}, je suis convaincu(e) de pouvoir contribuer efficacement à votre équipe.

${jobDescription ? 'Après avoir étudié votre offre d\'emploi, je pense que mon profil correspond parfaitement à vos attentes.' : ''}

${profile?.skills ? `Mes compétences incluent ${profile.skills}.` : ''}

Je reste à votre disposition pour discuter de ma candidature.

Cordialement,\n${profile?.name || 'Votre Nom'}`;
  }
  
  return `${today}

Dear Hiring Manager,

I am writing to express my interest in the ${positionTitle} position at ${companyName}.

As a ${profile?.title || 'dedicated professional'}, I am excited about the opportunity to contribute to your team.

${jobDescription ? 'After reviewing the job description, I believe my background aligns well with your requirements.' : ''}

${profile?.skills ? `My skills include ${profile.skills}.` : ''}

I would welcome the opportunity to discuss my qualifications further.

Sincerely,\n${profile?.name || 'Your Name'}`;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLogin = (email: string, password: string) => {
    // Simulate authentication - in real app this would call an API
    if (email && password) {
      setIsAuthenticated(true);
      setCurrentUser(email);
      localStorage.setItem('internaide_user', email);
    }
  };

  const handleRegister = (email: string, password: string, name: string) => {
    // Simulate registration - in real app this would call an API
    if (email && password && name) {
      setIsAuthenticated(true);
      setCurrentUser(email);
      localStorage.setItem('internaide_user', email);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('internaide_user');
  };

  // Check if user is already logged in
  React.useEffect(() => {
    const savedUser = localStorage.getItem('internaide_user');
    if (savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
    }
  }, []);

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <MainApp user={currentUser} />
      </main>
    </div>
  );
}

function AuthPage({ onLogin, onRegister }: { 
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string) => void;
}) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              InternAIde
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your smart internship application tracker
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => onLogin(loginEmail, loginPassword)}
                  className="w-full"
                  disabled={!loginEmail || !loginPassword}
                >
                  Sign In
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => onRegister(registerEmail, registerPassword, registerName)}
                  className="w-full"
                  disabled={!registerName || !registerEmail || !registerPassword}
                >
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Header({ user, onLogout }: { user: string | null; onLogout: () => void }) {
  return (
    <header className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            InternAIde
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user?.split('@')[0]}
            </span>
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout} className="text-xs md:text-sm">
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function MainApp({ user }: { user: string | null }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="dashboard" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden">Home</span>
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </TabsTrigger>
        <TabsTrigger value="cvs" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <FileText className="h-4 w-4" />
          <span>CVs</span>
        </TabsTrigger>
        <TabsTrigger value="applications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <Briefcase className="h-4 w-4" />
          <span className="hidden sm:inline">Applications</span>
          <span className="sm:hidden">Apps</span>
        </TabsTrigger>
        <TabsTrigger value="cover-letter" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Cover Letter</span>
          <span className="sm:hidden">Letter</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <Dashboard setActiveTab={setActiveTab} />
      </TabsContent>
      
      <TabsContent value="profile">
        <ProfileManager user={user || ''} />
      </TabsContent>
      
      <TabsContent value="cvs">
        <CVManager user={user || ''} />
      </TabsContent>
      
      <TabsContent value="applications">
        <ApplicationTracker user={user || ''} />
      </TabsContent>
      
      <TabsContent value="cover-letter">
        <CoverLetterGenerator user={user || ''} />
      </TabsContent>
    </Tabs>
  );
}

function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [dashboardData, setDashboardData] = useState({
    applications: 0,
    cvs: 0,
    interviews: 0,
    recentApplications: [] as any[]
  });

  React.useEffect(() => {
    const currentUser = localStorage.getItem('internaide_user');
    if (currentUser) {
      // Get applications data
      const applicationsData = localStorage.getItem(`internaide_applications_${currentUser}`);
      const applications = applicationsData ? JSON.parse(applicationsData) : [];
      
      // Get CVs data
      const cvsData = localStorage.getItem(`internaide_cvs_${currentUser}`);
      const cvs = cvsData ? JSON.parse(cvsData) : [];
      
      // Calculate interviews (applications with status 'Interviewing' or 'Offer Received')
      const interviews = applications.filter((app: any) => 
        app.status === 'Interviewing' || app.status === 'Offer Received'
      ).length;
      
      // Get recent applications (last 5)
      const recentApplications = applications
        .sort((a: any, b: any) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime())
        .slice(0, 5);
      
      setDashboardData({
        applications: applications.length,
        cvs: cvs.length,
        interviews,
        recentApplications
      });
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your internship applications and generate cover letters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab("applications")}
          >
            <Briefcase className="h-4 w-4" />
            Add Application
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setActiveTab("cover-letter")}
          >
            <Sparkles className="h-4 w-4" />
            Generate Cover Letter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard
          title="Total Applications"
          value={dashboardData.applications.toString()}
          description={dashboardData.applications > 0 ? "Keep applying!" : "Start your journey"}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="CVs Uploaded"
          value={dashboardData.cvs.toString()}
          description="For different roles"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Interviews"
          value={dashboardData.interviews.toString()}
          description="Active opportunities"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Your latest internship applications and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications yet. Start by adding your first internship application!
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentApplications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{app.position}</div>
                      <div className="text-sm text-muted-foreground">{app.companyName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'Offer Received' ? 'bg-green-100 text-green-800' :
                      app.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                      app.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, description, icon }: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}



function generateCoverLetterContent({ profile, jobDescription, companyName, positionTitle, language, tone }: {
  profile: any;
  jobDescription: string;
  companyName: string;
  positionTitle: string;
  language: string;
  tone: string;
}) {
  const today = new Date().toLocaleDateString(language === 'french' ? 'fr-FR' : 'en-US');
  
  if (language === 'french') {
    return generateFrenchCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today });
  } else {
    return generateEnglishCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today });
  }
}

function generateEnglishCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today }: any) {
  const greeting = tone === 'enthusiastic' ? 'Dear Hiring Team,' : 'Dear Hiring Manager,';
  const intro = tone === 'enthusiastic' 
    ? `I am thrilled to express my strong interest in the ${positionTitle} position at ${companyName}.`
    : tone === 'confident'
    ? `I am writing to apply for the ${positionTitle} position at ${companyName}, confident that my background makes me an ideal candidate.`
    : `I am writing to express my interest in the ${positionTitle} position at ${companyName}.`;
    
  const skills = extractSkillsFromJobDescription(jobDescription);
  const closing = tone === 'enthusiastic'
    ? 'I would be absolutely delighted to discuss how my passion and skills can contribute to your team\'s success.'
    : 'I would welcome the opportunity to discuss how my experience aligns with your needs.';

  return `${today}

${greeting}

${intro} As a ${profile.title || 'dedicated professional'} with ${profile.experience || 'relevant experience'}, I am excited about the opportunity to contribute to your team.

${generateBodyParagraph(profile, skills, companyName, tone)}

${profile.skills ? `My technical skills include ${profile.skills}, which I believe align well with the requirements outlined in your job posting.` : ''}

${profile.education ? `I hold a ${profile.education} and have continuously sought to expand my knowledge through various projects and learning opportunities.` : ''}

${closing}

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
${profile.name || 'Your Name'}
${profile.email || ''}
${profile.phone || ''}`;
}

function generateFrenchCoverLetter({ profile, jobDescription, companyName, positionTitle, tone, today }: any) {
  const greeting = 'Madame, Monsieur,';
  const intro = tone === 'enthusiastic'
    ? `C'est avec un grand enthousiasme que je vous présente ma candidature pour le poste de ${positionTitle} au sein de ${companyName}.`
    : tone === 'confident'
    ? `Je me permets de vous adresser ma candidature pour le poste de ${positionTitle} chez ${companyName}, convaincu(e) que mon profil correspond parfaitement à vos attentes.`
    : `Je vous écris pour postuler au poste de ${positionTitle} chez ${companyName}.`;

  const skills = extractSkillsFromJobDescription(jobDescription);
  const closing = tone === 'enthusiastic'
    ? 'Je serais ravi(e) de pouvoir discuter de ma candidature et de ma motivation lors d\'un entretien.'
    : 'Je reste à votre disposition pour tout complément d\'information et espère avoir l\'opportunité de vous rencontrer.';

  return `${today}

${greeting}

${intro} En tant que ${profile.title || 'professionnel(le) motivé(e)'} avec ${profile.experience || 'une expérience pertinente'}, je suis convaincu(e) de pouvoir apporter une réelle valeur ajoutée à votre équipe.

${generateBodyParagraphFrench(profile, skills, companyName, tone)}

${profile.skills ? `Mes compétences techniques incluent ${profile.skills}, qui correspondent bien aux exigences mentionnées dans votre offre d'emploi.` : ''}

${profile.education ? `Titulaire d'un ${profile.education}, j'ai continuellement cherché à enrichir mes connaissances à travers divers projets et opportunités d'apprentissage.` : ''}

${closing}

Je vous remercie de l'attention que vous porterez à ma candidature.

Cordialement,
${profile.name || 'Votre Nom'}
${profile.email || ''}
${profile.phone || ''}`;
}

function extractSkillsFromJobDescription(jobDescription: string): string[] {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Git', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis', 'Project Management',
    'Communication', 'Leadership', 'Problem Solving', 'Team Collaboration'
  ];
  
  return commonSkills.filter(skill => 
    jobDescription.toLowerCase().includes(skill.toLowerCase())
  ).slice(0, 5);
}

function generateBodyParagraph(profile: any, skills: string[], companyName: string, tone: string): string {
  const enthusiasm = tone === 'enthusiastic' ? ' I am particularly excited about ' : ' I am interested in ';
  const confidence = tone === 'confident' ? ' My proven track record demonstrates ' : ' My experience includes ';
  
  let paragraph = `During my career, I have developed strong expertise in ${skills.join(', ')} which directly relates to this position.`;
  
  if (profile.projects) {
    paragraph += ` I have successfully worked on projects involving ${profile.projects}, demonstrating my ability to deliver results.`;
  }
  
  paragraph += `${enthusiasm}${companyName}'s mission and the opportunity to contribute to innovative projects.`;
  
  return paragraph;
}

function generateBodyParagraphFrench(profile: any, skills: string[], companyName: string, tone: string): string {
  const enthusiasm = tone === 'enthusiastic' ? ' Je suis particulièrement enthousiaste à l\'idée de ' : ' Je suis intéressé(e) par ';
  
  let paragraph = `Au cours de ma carrière, j'ai développé une solide expertise en ${skills.join(', ')}, compétences directement liées à ce poste.`;
  
  if (profile.projects) {
    paragraph += ` J'ai travaillé avec succès sur des projets impliquant ${profile.projects}, démontrant ma capacité à livrer des résultats.`;
  }
  
  paragraph += `${enthusiasm}contribuer à la mission de ${companyName} et aux projets innovants de l'entreprise.`;
  
  return paragraph;
}

function CoverLetterGenerator({ user }: { user: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [cvs, setCvs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    applicationId: '',
    language: 'english',
    tone: 'professional',
    customJobDescription: '',
    customCompany: '',
    customPosition: ''
  });

  React.useEffect(() => {
    // Load data
    const applicationsData = localStorage.getItem(`internaide_applications_${user}`);
    if (applicationsData) {
      setApplications(JSON.parse(applicationsData));
    }
    
    const cvsData = localStorage.getItem(`internaide_cvs_${user}`);
    if (cvsData) {
      setCvs(JSON.parse(cvsData));
    }
    
    const profileData = localStorage.getItem(`internaide_profile_${user}`);
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }
  }, [user]);

  const generateCoverLetter = () => {
    if (!profile) {
      alert('Please complete your profile first to generate cover letters.');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    setTimeout(() => {
      let selectedApp: any = null;
      let jobDescription = formData.customJobDescription;
      let companyName = formData.customCompany;
      let positionTitle = formData.customPosition;
      
      if (formData.applicationId) {
        selectedApp = applications.find(app => app.id === formData.applicationId);
        if (selectedApp) {
          jobDescription = selectedApp.jobDescription;
          companyName = selectedApp.companyName;
          positionTitle = selectedApp.position;
        }
      }
      
      if (!jobDescription || !companyName || !positionTitle) {
        alert('Please provide job description, company name, and position.');
        setIsGenerating(false);
        return;
      }
      
      const coverLetter = createCoverLetter({
        profile,
        jobDescription,
        companyName,
        positionTitle,
        language: formData.language,
        tone: formData.tone
      });
      
      setGeneratedCoverLetter(coverLetter);
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCoverLetter);
    alert('Cover letter copied to clipboard!');
  };

  const downloadCoverLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCoverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cover Letter Generator</h2>
          <p className="text-muted-foreground">
            Generate personalized cover letters using your profile and application data
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Cover Letter Generator
            </CardTitle>
            <CardDescription>
              Select an application or enter job details manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Source</Label>
              <Tabs value={formData.applicationId ? 'existing' : 'manual'} onValueChange={(value) => {
                if (value === 'manual') {
                  setFormData({...formData, applicationId: ''});
                }
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing Application</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="space-y-3">
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No applications found. Add some applications first.
                    </p>
                  ) : (
                    <Select value={formData.applicationId} onValueChange={(value) => setFormData({...formData, applicationId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an application..." />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.position} at {app.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-3">
                  <Input
                    placeholder="Company name"
                    value={formData.customCompany}
                    onChange={(e) => setFormData({...formData, customCompany: e.target.value})}
                  />
                  <Input
                    placeholder="Position title"
                    value={formData.customPosition}
                    onChange={(e) => setFormData({...formData, customPosition: e.target.value})}
                  />
                  <Textarea
                    placeholder="Job description..."
                    value={formData.customJobDescription}
                    onChange={(e) => setFormData({...formData, customJobDescription: e.target.value})}
                    rows={4}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({...formData, tone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="confident">Confident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={generateCoverLetter} 
              disabled={isGenerating || !profile}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
            
            {!profile && (
              <p className="text-sm text-muted-foreground text-center">
                Complete your profile to enable cover letter generation
              </p>
            )}
          </CardContent>
        </Card>

        {/* Generated Cover Letter */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Cover Letter</CardTitle>
            {generatedCoverLetter && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCoverLetter}>
                  Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!generatedCoverLetter ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated cover letter will appear here</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto">
                {generatedCoverLetter}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
