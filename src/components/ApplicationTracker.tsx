import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, Edit, Trash2, ExternalLink, Mail, Building, Calendar, FileText, MapPin } from "lucide-react";

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Offer Received' | 'Rejected';
  applicationDate: string;
  jobDescription: string;
  jobUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  location?: string;
  cvUsed?: string;
  notes?: string;
  salary?: string;
  deadline?: string;
}

interface CV {
  id: string;
  name: string;
  role: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
}

interface ApplicationTrackerProps {
  user: string;
}

const statusColors = {
  'To Submit': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Submitted': 'bg-blue-100 text-blue-800 border-blue-300',
  'Interviewing': 'bg-purple-100 text-purple-800 border-purple-300',
  'Offer Received': 'bg-green-100 text-green-800 border-green-300',
  'Rejected': 'bg-red-100 text-red-800 border-red-300'
};

export default function ApplicationTracker({ user }: ApplicationTrackerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    status: 'To Submit' as Application['status'],
    jobDescription: '',
    jobUrl: '',
    recruiterName: '',
    recruiterEmail: '',
    location: '',
    cvUsed: '',
    notes: '',
    salary: '',
    deadline: ''
  });

  useEffect(() => {
    // Load applications
    const savedApps = localStorage.getItem(`internaide_applications_${user}`);
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }
    
    // Load CVs for the dropdown
    const savedCvs = localStorage.getItem(`internaide_cvs_${user}`);
    if (savedCvs) {
      setCvs(JSON.parse(savedCvs));
    }
  }, [user]);

  const saveApplications = (newApps: Application[]) => {
    setApplications(newApps);
    localStorage.setItem(`internaide_applications_${user}`, JSON.stringify(newApps));
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      position: '',
      status: 'To Submit',
      jobDescription: '',
      jobUrl: '',
      recruiterName: '',
      recruiterEmail: '',
      location: '',
      cvUsed: '',
      notes: '',
      salary: '',
      deadline: ''
    });
  };

  const handleAdd = () => {
    if (!formData.companyName || !formData.position || !formData.jobDescription) {
      alert('Please fill in company name, position, and job description');
      return;
    }

    const newApplication: Application = {
      id: Date.now().toString(),
      ...formData,
      applicationDate: new Date().toISOString()
    };

    saveApplications([...applications, newApplication]);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setFormData({
      companyName: app.companyName,
      position: app.position,
      status: app.status,
      jobDescription: app.jobDescription,
      jobUrl: app.jobUrl || '',
      recruiterName: app.recruiterName || '',
      recruiterEmail: app.recruiterEmail || '',
      location: app.location || '',
      cvUsed: app.cvUsed || '',
      notes: app.notes || '',
      salary: app.salary || '',
      deadline: app.deadline || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingApp || !formData.companyName || !formData.position || !formData.jobDescription) {
      alert('Please fill in company name, position, and job description');
      return;
    }

    const updatedApp: Application = {
      ...editingApp,
      ...formData
    };

    const updatedApps = applications.map(app => 
      app.id === editingApp.id ? updatedApp : app
    );

    saveApplications(updatedApps);
    resetForm();
    setEditingApp(null);
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      const updatedApps = applications.filter(app => app.id !== id);
      saveApplications(updatedApps);
    }
  };

  const getStatusStats = () => {
    const stats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: applications.length,
      toSubmit: stats['To Submit'] || 0,
      submitted: stats['Submitted'] || 0,
      interviewing: stats['Interviewing'] || 0,
      offers: stats['Offer Received'] || 0,
      rejected: stats['Rejected'] || 0
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Application Tracker</h2>
          <p className="text-muted-foreground">
            Track and manage your internship applications
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
          </DialogTrigger>
          <ApplicationDialog
            title="Add New Application"
            formData={formData}
            setFormData={setFormData}
            cvs={cvs}
            onSubmit={handleAdd}
            onCancel={() => {
              resetForm();
              setIsAddDialogOpen(false);
            }}
          />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatsCard title="Total" value={stats.total} color="border-gray-200" />
        <StatsCard title="To Submit" value={stats.toSubmit} color="border-yellow-300" />
        <StatsCard title="Submitted" value={stats.submitted} color="border-blue-300" />
        <StatsCard title="Interviewing" value={stats.interviewing} color="border-purple-300" />
        <StatsCard title="Offers" value={stats.offers} color="border-green-300" />
        <StatsCard title="Rejected" value={stats.rejected} color="border-red-300" />
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            All your internship applications in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No applications yet</h3>
              <p className="text-sm mb-4">
                Start tracking your internship applications to stay organized
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Add Your First Application
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>CV Used</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{app.companyName}</div>
                              {app.recruiterName && (
                                <div className="text-sm text-muted-foreground">
                                  {app.recruiterName}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{app.position}</div>
                            {app.salary && (
                              <div className="text-sm text-muted-foreground">
                                {app.salary}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[app.status]}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {app.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{app.location}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(app.applicationDate)}</TableCell>
                        <TableCell>
                          {app.cvUsed && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{app.cvUsed}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {app.jobUrl && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(app.jobUrl, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(app)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(app.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <div className="font-medium">{app.companyName}</div>
                            <div className="text-sm font-medium text-primary">{app.position}</div>
                            {app.recruiterName && (
                              <div className="text-sm text-muted-foreground">
                                {app.recruiterName}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={statusColors[app.status]}>
                          {app.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {app.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{app.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDate(app.applicationDate)}</span>
                        </div>
                        {app.cvUsed && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span>{app.cvUsed}</span>
                          </div>
                        )}
                        {app.salary && (
                          <div className="text-muted-foreground">
                            {app.salary}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {app.jobUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(app.jobUrl, '_blank')}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Job
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(app)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(app.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ApplicationDialog
          title="Edit Application"
          formData={formData}
          setFormData={setFormData}
          cvs={cvs}
          onSubmit={handleUpdate}
          onCancel={() => {
            resetForm();
            setEditingApp(null);
            setIsEditDialogOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <Card className={`border-2 ${color}`}>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </CardContent>
    </Card>
  );
}

function ApplicationDialog({ 
  title, 
  formData, 
  setFormData, 
  cvs, 
  onSubmit, 
  onCancel 
}: {
  title: string;
  formData: any;
  setFormData: (data: any) => void;
  cvs: CV[];
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Fill in the details for your internship application
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              placeholder="e.g. Google, Microsoft"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              placeholder="e.g. Software Engineering Intern"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Submit">To Submit</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Interviewing">Interviewing</SelectItem>
                <SelectItem value="Offer Received">Offer Received</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description *</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
            placeholder="Paste the job description here..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input
              id="jobUrl"
              value={formData.jobUrl}
              onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Salary/Compensation</Label>
            <Input
              id="salary"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="e.g. $5000/month"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recruiterName">Recruiter Name</Label>
            <Input
              id="recruiterName"
              value={formData.recruiterName}
              onChange={(e) => setFormData({...formData, recruiterName: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recruiterEmail">Recruiter Email</Label>
            <Input
              id="recruiterEmail"
              type="email"
              value={formData.recruiterEmail}
              onChange={(e) => setFormData({...formData, recruiterEmail: e.target.value})}
              placeholder="recruiter@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cvUsed">CV Used</Label>
            <Select value={formData.cvUsed} onValueChange={(value) => setFormData({...formData, cvUsed: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select CV..." />
              </SelectTrigger>
              <SelectContent>
                {cvs.map((cv) => (
                  <SelectItem key={cv.id} value={cv.name}>
                    {cv.name} ({cv.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Application Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional notes about this application..."
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {title.includes('Edit') ? 'Update' : 'Add'} Application
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}