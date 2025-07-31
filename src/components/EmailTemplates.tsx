import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Plus, Copy, Send, FileText, MessageSquare, Calendar, User, Building, Clock, Sparkles, Edit, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Offer Received' | 'Rejected';
  recruiterName?: string;
  recruiterEmail?: string;
  applicationDate: string;
  interviews?: Interview[];
}

interface Interview {
  id: string;
  type: 'Phone Screen' | 'Technical' | 'Behavioral' | 'Final Round' | 'HR' | 'Onsite' | 'Other';
  date: string;
  time: string;
  interviewer?: string;
  interviewerEmail?: string;
}

interface Profile {
  name: string;
  email: string;
  phone?: string;
  title?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: 'follow-up' | 'thank-you' | 'interview-request' | 'offer-acceptance' | 'offer-decline' | 'custom';
  subject: string;
  body: string;
  createdDate: string;
  lastUsed?: string;
}

interface EmailTemplatesProps {
  user: string;
}

const defaultTemplates: Omit<EmailTemplate, 'id' | 'createdDate'>[] = [
  {
    name: "Application Follow-up",
    type: "follow-up",
    subject: "Following up on {position} application at {company}",
    body: `Dear {recruiterName},

I hope this email finds you well. I wanted to follow up on my application for the {position} position at {company}, which I submitted on {applicationDate}.

I remain very interested in this opportunity and would welcome the chance to discuss how my skills and experience align with your team's needs.

If you need any additional information from me, please don't hesitate to reach out.

Thank you for your time and consideration.

Best regards,
{name}
{email}
{phone}`
  },
  {
    name: "Interview Thank You",
    type: "thank-you",
    subject: "Thank you for the {interviewType} interview - {position} at {company}",
    body: `Dear {interviewer},

Thank you for taking the time to speak with me today about the {position} opportunity at {company}. I enjoyed our conversation about {interviewType} and learning more about the team and role.

Our discussion reinforced my enthusiasm for this position and my desire to contribute to {company}. I'm particularly excited about the opportunity to work on the projects we discussed.

I look forward to the next steps in the process. Please let me know if you need any additional information from me.

Thank you again for your time and consideration.

Best regards,
{name}
{email}
{phone}`
  },
  {
    name: "Interview Request Follow-up",
    type: "interview-request",
    subject: "Availability for interview - {position} at {company}",
    body: `Dear {recruiterName},

Thank you for considering my application for the {position} position at {company}. I'm excited about the opportunity to interview for this role.

I'm available for an interview at your convenience. My general availability is:
- Weekdays: 9:00 AM - 6:00 PM
- I can also accommodate outside these hours if needed

Please let me know what times work best for your schedule, and I'll be happy to adjust accordingly.

I look forward to speaking with you soon.

Best regards,
{name}
{email}
{phone}`
  },
  {
    name: "Offer Acceptance",
    type: "offer-acceptance",
    subject: "Acceptance of {position} offer at {company}",
    body: `Dear {recruiterName},

I am delighted to formally accept the offer for the {position} position at {company}. Thank you for this wonderful opportunity.

I'm excited to join the team and contribute to {company}'s continued success. I look forward to starting on the agreed date and working with everyone.

Please let me know if there are any documents or preparations I should complete before my start date.

Thank you again for your confidence in me.

Best regards,
{name}
{email}
{phone}`
  },
  {
    name: "Offer Decline",
    type: "offer-decline",
    subject: "Re: {position} offer at {company}",
    body: `Dear {recruiterName},

Thank you for extending the offer for the {position} position at {company}. I sincerely appreciate the time and effort you and your team invested in the interview process.

After careful consideration, I have decided to decline the offer. This was not an easy decision, as I have great respect for {company} and the team.

I hope we might have the opportunity to work together in the future, and I wish you and the team continued success.

Thank you again for your consideration.

Best regards,
{name}
{email}
{phone}`
  }
];

const templateTypeColors = {
  'follow-up': 'bg-blue-100 text-blue-800',
  'thank-you': 'bg-green-100 text-green-800',
  'interview-request': 'bg-purple-100 text-purple-800',
  'offer-acceptance': 'bg-emerald-100 text-emerald-800',
  'offer-decline': 'bg-red-100 text-red-800',
  'custom': 'bg-gray-100 text-gray-800'
};

export default function EmailTemplates({ user }: EmailTemplatesProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as EmailTemplate['type'],
    subject: '',
    body: ''
  });
  
  const { showError, showSuccess, showWarning } = useNotifications();

  useEffect(() => {
    // Load existing templates
    const savedTemplates = localStorage.getItem(`internaide_email_templates_${user}`);
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      // Initialize with default templates
      const initialTemplates = defaultTemplates.map(template => ({
        ...template,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdDate: new Date().toISOString()
      }));
      setTemplates(initialTemplates);
      localStorage.setItem(`internaide_email_templates_${user}`, JSON.stringify(initialTemplates));
    }

    // Load applications
    const savedApps = localStorage.getItem(`internaide_applications_${user}`);
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }

    // Load profile
    const savedProfile = localStorage.getItem(`internaide_profile_${user}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, [user]);

  const saveTemplates = (newTemplates: EmailTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(`internaide_email_templates_${user}`, JSON.stringify(newTemplates));
  };

  const generateEmail = (template: EmailTemplate, application: Application, interview?: Interview) => {
    const placeholders: Record<string, string> = {
      '{name}': profile?.name || 'Your Name',
      '{email}': profile?.email || 'your.email@example.com',
      '{phone}': profile?.phone || 'Your Phone Number',
      '{title}': profile?.title || 'Your Title',
      '{company}': application.companyName,
      '{position}': application.position,
      '{recruiterName}': application.recruiterName || 'Hiring Manager',
      '{recruiterEmail}': application.recruiterEmail || '',
      '{applicationDate}': new Date(application.applicationDate).toLocaleDateString(),
      '{interviewType}': interview?.type || '',
      '{interviewer}': interview?.interviewer || 'the interviewer',
      '{interviewDate}': interview ? new Date(interview.date).toLocaleDateString() : '',
      '{interviewTime}': interview?.time || ''
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { subject, body };
  };

  const handlePreview = (template: EmailTemplate) => {
    if (!selectedApplication) {
      alert('Please select an application first');
      return;
    }

    const { subject, body } = generateEmail(template, selectedApplication, selectedInterview || undefined);
    setSelectedTemplate(template);
    setGeneratedSubject(subject);
    setGeneratedBody(body);
    setIsPreviewOpen(true);

    // Update last used
    const updatedTemplates = templates.map(t => 
      t.id === template.id 
        ? { ...t, lastUsed: new Date().toISOString() }
        : t
    );
    saveTemplates(updatedTemplates);
  };

  const handleCreateTemplate = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      showWarning('Missing Information', 'Please fill in all fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      subject: formData.subject,
      body: formData.body,
      createdDate: new Date().toISOString()
    };

    saveTemplates([...templates, newTemplate]);
    setFormData({ name: '', type: 'custom', subject: '', body: '' });
    setIsCreateOpen(false);
  };

  const handleEditTemplate = () => {
    if (!selectedTemplate || !formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const updatedTemplates = templates.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, name: formData.name, type: formData.type, subject: formData.subject, body: formData.body }
        : t
    );

    saveTemplates(updatedTemplates);
    setFormData({ name: '', type: 'custom', subject: '', body: '' });
    setSelectedTemplate(null);
    setIsEditOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== id);
      saveTemplates(updatedTemplates);
    }
  };

  const handleEditClick = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      body: template.body
    });
    setIsEditOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess('Copied!', 'Email content copied to clipboard');
    }).catch(() => {
      showError('Copy Failed', 'Failed to copy to clipboard');
    });
  };

  const openEmailClient = () => {
    const mailto = `mailto:${selectedApplication?.recruiterEmail || ''}?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(generatedBody)}`;
    window.open(mailto);
  };

  const getTemplateStats = () => {
    const typeCount = templates.reduce((acc, template) => {
      acc[template.type] = (acc[template.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentlyUsed = templates.filter(t => t.lastUsed).length;
    const total = templates.length;

    return { typeCount, recentlyUsed, total };
  };

  const getAvailableInterviews = () => {
    if (!selectedApplication?.interviews) return [];
    return selectedApplication.interviews.filter(interview => 
      new Date(`${interview.date} ${interview.time}`) <= new Date()
    );
  };

  const stats = getTemplateStats();
  const availableInterviews = getAvailableInterviews();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Generate professional follow-up emails and thank you notes
          </p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentlyUsed} used recently
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for templates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Type</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.entries(stats.typeCount).length > 0 
                ? Object.entries(stats.typeCount).sort(([,a], [,b]) => b - a)[0][0]
                : '-'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Template type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application/Interview Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Email</CardTitle>
          <CardDescription>
            Select an application and optionally an interview to generate personalized emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="application">Select Application</Label>
              <Select 
                value={selectedApplication?.id || ''} 
                onValueChange={(value) => {
                  const app = applications.find(a => a.id === value) as (Application & { interviews?: Interview[] }) | undefined;
                  setSelectedApplication(app || null);
                  setSelectedInterview(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} - {app.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedApplication && availableInterviews.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="interview">Select Interview (Optional)</Label>
                <Select 
                  value={selectedInterview?.id || ''} 
                  onValueChange={(value) => {
                    const interview = availableInterviews.find(i => i.id === value);
                    setSelectedInterview(interview || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an interview" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInterviews.map((interview) => (
                      <SelectItem key={interview.id} value={interview.id}>
                        {interview.type} - {new Date(interview.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedApplication && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Selected: <strong>{selectedApplication.companyName}</strong> - {selectedApplication.position}
                {selectedInterview && (
                  <span> | Interview: <strong>{selectedInterview.type}</strong> on {new Date(selectedInterview.date).toLocaleDateString()}</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(template)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={templateTypeColors[template.type]}>
                  {template.type.replace('-', ' ')}
                </Badge>
                {template.lastUsed && (
                  <span className="text-xs text-muted-foreground">
                    Last used {new Date(template.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium mb-1">Subject:</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {template.subject}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Preview:</div>
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded h-20 overflow-hidden">
                  {template.body.substring(0, 120)}...
                </div>
              </div>
              <Button 
                onClick={() => handlePreview(template)}
                disabled={!selectedApplication}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Email
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Preview: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Generated email for {selectedApplication?.companyName} - {selectedApplication?.position}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="preview-to">To:</Label>
              <Input
                id="preview-to"
                value={selectedApplication?.recruiterEmail || 'recruiter@company.com'}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preview-subject">Subject:</Label>
              <Input
                id="preview-subject"
                value={generatedSubject}
                onChange={(e) => setGeneratedSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preview-body">Body:</Label>
              <Textarea
                id="preview-body"
                value={generatedBody}
                onChange={(e) => setGeneratedBody(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => copyToClipboard(generatedSubject)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Subject
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(generatedBody)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Body
            </Button>
            <Button onClick={openEmailClient}>
              <Send className="h-4 w-4 mr-2" />
              Open Email Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a custom email template with placeholders
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Template Name</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Custom Follow-up"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type">Type</Label>
                <Select value={formData.type} onValueChange={(value: EmailTemplate['type']) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="thank-you">Thank You</SelectItem>
                    <SelectItem value="interview-request">Interview Request</SelectItem>
                    <SelectItem value="offer-acceptance">Offer Acceptance</SelectItem>
                    <SelectItem value="offer-decline">Offer Decline</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-subject">Subject Line</Label>
              <Input
                id="create-subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="e.g. Following up on {position} application"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-body">Email Body</Label>
              <Textarea
                id="create-body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                placeholder="Dear {recruiterName},&#10;&#10;I wanted to follow up..."
                rows={10}
              />
            </div>

            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                <strong>Available placeholders:</strong><br/>
                {'{name}'}, {'{email}'}, {'{phone}'}, {'{title}'}, {'{company}'}, {'{position}'}, {'{recruiterName}'}, {'{applicationDate}'}, {'{interviewType}'}, {'{interviewer}'}, {'{interviewDate}'}, {'{interviewTime}'}
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify your email template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.type} onValueChange={(value: EmailTemplate['type']) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="thank-you">Thank You</SelectItem>
                    <SelectItem value="interview-request">Interview Request</SelectItem>
                    <SelectItem value="offer-acceptance">Offer Acceptance</SelectItem>
                    <SelectItem value="offer-decline">Offer Decline</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject Line</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-body">Email Body</Label>
              <Textarea
                id="edit-body"
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                rows={10}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate}>
              Update Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}