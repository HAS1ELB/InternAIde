import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Plus, Edit, Trash2, ExternalLink, Mail, Building, Calendar, FileText, MapPin, Download, FileOutput, Search, Filter, X, AlertTriangle, Clock, CheckSquare, Square, BarChart3, TrendingUp, Target, Users, Settings, Eye, EyeOff, Star, Archive, Copy, RefreshCw, Zap } from "lucide-react";
import RichTextEditor from './RichTextEditor';
import NotesViewer from './NotesViewer';
import VirtualizedApplicationTable from './VirtualizedApplicationTable';
import AdvancedSearchDialog from './AdvancedSearchDialog';
import { advancedSearch, SearchOptions, getSearchStats, searchPresets } from '@/utils/advancedSearch';
import { useDebounce, a11y } from '@/utils/performance';
import { useNotifications } from '@/contexts/NotificationContext';

interface Interview {
  id: string;
  type: 'Phone Screen' | 'Technical' | 'Behavioral' | 'Final Round' | 'HR' | 'Onsite' | 'Other';
  date: string;
  time: string;
  duration?: number; // in minutes
  interviewer?: string;
  interviewerEmail?: string;
  location?: string; // can be address or "Video Call"
  meetingLink?: string;
  notes?: string;
  completed: boolean;
  outcome?: 'Passed' | 'Failed' | 'Pending';
}

interface CompanyResearch {
  glassdoorUrl?: string;
  companyWebsite?: string;
  linkedinUrl?: string;
  salaryRange?: string;
  companySize?: string;
  industry?: string;
  culture?: string;
  benefits?: string;
  notes?: string;
  rating?: number; // 1-5 stars
}

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Offer Received' | 'Rejected' | 'Archived';
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
  interviews?: Interview[];
  companyResearch?: CompanyResearch;
  priority?: 'Low' | 'Medium' | 'High';
  tags?: string[];
  followUpDate?: string;
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
  'Rejected': 'bg-red-100 text-red-800 border-red-300',
  'Archived': 'bg-gray-100 text-gray-800 border-gray-300'
};

const priorityColors = {
  'Low': 'bg-gray-100 text-gray-800',
  'Medium': 'bg-orange-100 text-orange-800', 
  'High': 'bg-red-100 text-red-800'
};

export default function ApplicationTracker({ user }: ApplicationTrackerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [advancedSearchOptions, setAdvancedSearchOptions] = useState<SearchOptions | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status' | 'deadline'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);
  
  // Bulk actions state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<Application['status']>('Submitted');
  
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
    deadline: '',
    interviews: [] as Interview[],
    companyResearch: {
      glassdoorUrl: '',
      companyWebsite: '',
      linkedinUrl: '',
      salaryRange: '',
      companySize: '',
      industry: '',
      culture: '',
      benefits: '',
      notes: '',
      rating: 0
    }
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

  // Advanced filtering and sorting
  const processedApplications = useMemo(() => {
    let filtered = applications;

    // Filter by archived status
    if (!showArchived) {
      filtered = filtered.filter(app => app.status !== 'Archived');
    }

    // Apply advanced search if available, otherwise use basic search
    if (advancedSearchOptions && advancedSearchOptions.query.trim()) {
      filtered = advancedSearch(filtered, advancedSearchOptions);
    } else if (searchQuery.trim()) {
      // Fallback to basic search with enhanced capabilities
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.companyName.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        app.recruiterName?.toLowerCase().includes(query) ||
        app.recruiterEmail?.toLowerCase().includes(query) ||
        app.location?.toLowerCase().includes(query) ||
        app.notes?.toLowerCase().includes(query) ||
        app.salary?.toLowerCase().includes(query) ||
        app.jobDescription?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply company filter
    if (companyFilter.trim()) {
      const companyQuery = companyFilter.toLowerCase();
      filtered = filtered.filter(app => 
        app.companyName.toLowerCase().includes(companyQuery)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.applicationDate);
          bValue = new Date(b.applicationDate);
          break;
        case 'company':
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
          break;
        case 'status':
          const statusOrder = { 'To Submit': 0, 'Submitted': 1, 'Interviewing': 2, 'Offer Received': 3, 'Rejected': 4 };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'deadline':
          aValue = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
          bValue = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, searchQuery, statusFilter, companyFilter, advancedSearchOptions, sortBy, sortOrder, showArchived]);

  // Update filtered applications when processed applications change
  useEffect(() => {
    setFilteredApplications(processedApplications);
  }, [processedApplications]);

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
      deadline: '',
      interviews: [] as Interview[],
      companyResearch: {
        glassdoorUrl: '',
        companyWebsite: '',
        linkedinUrl: '',
        salaryRange: '',
        companySize: '',
        industry: '',
        culture: '',
        benefits: '',
        notes: '',
        rating: 0
      }
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
      deadline: app.deadline || '',
      interviews: app.interviews || [],
      companyResearch: {
        glassdoorUrl: app.companyResearch?.glassdoorUrl || '',
        companyWebsite: app.companyResearch?.companyWebsite || '',
        linkedinUrl: app.companyResearch?.linkedinUrl || '',
        salaryRange: app.companyResearch?.salaryRange || '',
        companySize: app.companyResearch?.companySize || '',
        industry: app.companyResearch?.industry || '',
        culture: app.companyResearch?.culture || '',
        benefits: app.companyResearch?.benefits || '',
        notes: app.companyResearch?.notes || '',
        rating: app.companyResearch?.rating || 0
      }
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
    const activeApps = applications.filter(app => app.status !== 'Archived');
    const stats = activeApps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = activeApps.length;
    const toSubmit = stats['To Submit'] || 0;
    const submitted = stats['Submitted'] || 0;
    const interviewing = stats['Interviewing'] || 0;
    const offers = stats['Offer Received'] || 0;
    const rejected = stats['Rejected'] || 0;
    
    return {
      total,
      toSubmit,
      submitted,
      interviewing,
      offers,
      rejected,
      successRate: total > 0 ? ((offers / total) * 100) : 0,
      responseRate: total > 0 ? (((interviewing + offers + rejected) / total) * 100) : 0,
      activeApplications: toSubmit + submitted + interviewing
    };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCompanyFilter('');
  };

  const getUniqueCompanies = () => {
    const companies = applications.map(app => app.companyName);
    return [...new Set(companies)].sort();
  };

  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return { status: 'overdue', days: Math.abs(daysDiff), color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (daysDiff <= 3) {
      return { status: 'due-soon', days: daysDiff, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    } else if (daysDiff <= 7) {
      return { status: 'upcoming', days: daysDiff, color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    
    return { status: 'normal', days: daysDiff, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const getOverdueApplications = () => {
    return applications.filter(app => {
      if (!app.deadline) return false;
      const deadlineStatus = getDeadlineStatus(app.deadline);
      return deadlineStatus?.status === 'overdue';
    });
  };

  const getUpcomingDeadlines = () => {
    return applications.filter(app => {
      if (!app.deadline) return false;
      const deadlineStatus = getDeadlineStatus(app.deadline);
      return deadlineStatus?.status === 'due-soon' || deadlineStatus?.status === 'upcoming';
    });
  };

  const formatDeadlineText = (deadline: string) => {
    const deadlineStatus = getDeadlineStatus(deadline);
    if (!deadlineStatus) return '';
    
    if (deadlineStatus.status === 'overdue') {
      return `Overdue by ${deadlineStatus.days} day${deadlineStatus.days !== 1 ? 's' : ''}`;
    } else if (deadlineStatus.status === 'due-soon') {
      return deadlineStatus.days === 0 ? 'Due today' : `Due in ${deadlineStatus.days} day${deadlineStatus.days !== 1 ? 's' : ''}`;
    } else if (deadlineStatus.status === 'upcoming') {
      return `Due in ${deadlineStatus.days} day${deadlineStatus.days !== 1 ? 's' : ''}`;
    }
    
    return `Due in ${deadlineStatus.days} day${deadlineStatus.days !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Bulk actions functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredApplications.map(app => app.id));
      setSelectedApplications(allIds);
    } else {
      setSelectedApplications(new Set());
    }
  };

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    const newSelection = new Set(selectedApplications);
    if (checked) {
      newSelection.add(applicationId);
    } else {
      newSelection.delete(applicationId);
    }
    setSelectedApplications(newSelection);
  };

  const handleBulkStatusUpdate = () => {
    if (selectedApplications.size === 0) {
      alert('Please select applications to update');
      return;
    }

    const updatedApps = applications.map(app => {
      if (selectedApplications.has(app.id)) {
        return { ...app, status: bulkActionStatus };
      }
      return app;
    });

    saveApplications(updatedApps);
    setSelectedApplications(new Set());
    alert(`Updated ${selectedApplications.size} application(s) to ${bulkActionStatus}`);
  };

  const handleBulkDelete = () => {
    if (selectedApplications.size === 0) {
      alert('Please select applications to delete');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedApplications.size} application(s)? This action cannot be undone.`)) {
      const updatedApps = applications.filter(app => !selectedApplications.has(app.id));
      saveApplications(updatedApps);
      setSelectedApplications(new Set());
      alert(`Deleted ${selectedApplications.size} application(s)`);
    }
  };

  const handleBulkExport = () => {
    if (selectedApplications.size === 0) {
      alert('Please select applications to export');
      return;
    }

    const selectedApps = applications.filter(app => selectedApplications.has(app.id));
    const headers = [
      'Company Name',
      'Position',
      'Status',
      'Location',
      'Application Date',
      'Recruiter Name',
      'Recruiter Email',
      'CV Used',
      'Salary',
      'Job URL',
      'Deadline'
    ];

    const csvData = selectedApps.map(app => [
      app.companyName,
      app.position,
      app.status,
      app.location || '',
      formatDate(app.applicationDate),
      app.recruiterName || '',
      app.recruiterEmail || '',
      app.cvUsed || '',
      app.salary || '',
      app.jobUrl || '',
      app.deadline || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `selected-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    alert(`Exported ${selectedApplications.size} application(s) to CSV`);
  };

  const clearSelection = () => {
    setSelectedApplications(new Set());
  };

  const isAllSelected = filteredApplications.length > 0 && selectedApplications.size === filteredApplications.length;
  const isPartialSelected = selectedApplications.size > 0 && selectedApplications.size < filteredApplications.length;

  const exportToCSV = () => {
    if (applications.length === 0) {
      alert('No applications to export');
      return;
    }

    const headers = [
      'Company Name',
      'Position',
      'Status',
      'Location',
      'Application Date',
      'Recruiter Name',
      'Recruiter Email',
      'CV Used',
      'Salary',
      'Job URL',
      'Deadline',
      'Notes'
    ];

    const csvData = applications.map(app => [
      app.companyName,
      app.position,
      app.status,
      app.location || '',
      formatDate(app.applicationDate),
      app.recruiterName || '',
      app.recruiterEmail || '',
      app.cvUsed || '',
      app.salary || '',
      app.jobUrl || '',
      app.deadline || '',
      app.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `internaide-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (applications.length === 0) {
      alert('No applications to export');
      return;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      applicationCount: applications.length,
      applications: applications
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `internaide-applications-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportAllData = () => {
    // Get all user data for comprehensive backup
    const currentUser = localStorage.getItem('internaide_user');
    if (!currentUser) return;

    const profileData = localStorage.getItem(`internaide_profile_${currentUser}`);
    const cvsData = localStorage.getItem(`internaide_cvs_${currentUser}`);
    const applicationsData = localStorage.getItem(`internaide_applications_${currentUser}`);

    const fullBackup = {
      exportDate: new Date().toISOString(),
      user: currentUser,
      profile: profileData ? JSON.parse(profileData) : null,
      cvs: cvsData ? JSON.parse(cvsData) : [],
      applications: applicationsData ? JSON.parse(applicationsData) : []
    };

    const jsonContent = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `internaide-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const stats = getStatusStats();
  const searchStats = advancedSearchOptions ? getSearchStats(applications, filteredApplications, searchQuery) : undefined;
  const hasActiveFilters = searchQuery.trim() || statusFilter !== 'all' || companyFilter.trim() || advancedSearchOptions;

  // Add missing functions
  const handleAdvancedSearch = (options: SearchOptions) => {
    setAdvancedSearchOptions(options);
    setSearchQuery(options.query);
    setIsAdvancedSearchOpen(false);
  };

  const handleQuickSearch = (preset: keyof typeof searchPresets) => {
    const options = { ...searchPresets[preset], query: searchQuery };
    setAdvancedSearchOptions(options);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCompanyFilter('');
    setAdvancedSearchOptions(null);
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6">
      {/* Smart Notifications & Alerts */}
      <div className="space-y-3">
        {getOverdueApplications().length > 0 && (
          <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-red-100 animate-pulse">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block">🚨 {getOverdueApplications().length} application{getOverdueApplications().length !== 1 ? 's' : ''} overdue!</strong>
                  <span className="text-sm">{getOverdueApplications().map(app => app.companyName).join(', ')}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStatusFilter('To Submit')}
                  className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
                >
                  View All
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {getUpcomingDeadlines().length > 0 && getOverdueApplications().length === 0 && (
          <Alert className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block">⏰ {getUpcomingDeadlines().length} deadline{getUpcomingDeadlines().length !== 1 ? 's' : ''} coming up soon!</strong>
                  <span className="text-sm">Don't forget to submit your applications.</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSortBy('deadline')}
                  className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Sort by Deadline
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {stats.successRate > 0 && stats.total >= 5 && (
          <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>🎉 Great progress!</strong> You have a {stats.successRate.toFixed(1)}% offer rate with {stats.responseRate.toFixed(1)}% response rate.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Enhanced Header with Modern Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 border border-slate-200 dark:border-slate-700">
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/25" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                    Application Tracker
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Manage your internship journey with intelligence
                  </p>
                </div>
              </div>
              
              {/* Quick Stats Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {stats.total} Total Applications
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {stats.activeApplications} Active
                </Badge>
                {stats.successRate > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {stats.successRate.toFixed(1)}% Success Rate
                  </Badge>
                )}
                {searchStats && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {searchStats.matchCount}/{searchStats.totalCount} matches
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-fit">
                <TabsList className="grid grid-cols-3 h-10">
                  <TabsTrigger value="table" className="flex items-center gap-1 text-xs">
                    <BarChart3 className="h-3 w-3" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="flex items-center gap-1 text-xs">
                    <Square className="h-3 w-3" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 h-10">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileOutput className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAllData}>
                    <Download className="h-4 w-4 mr-2" />
                    Full Backup
                  </DropdownMenuItem>
                  {selectedApplications.size > 0 && (
                    <>
                      <Separator />
                      <DropdownMenuItem onClick={handleBulkExport}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Export Selected ({selectedApplications.size})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Add Application Button */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                  <Input
                    placeholder="Search across all fields - company, position, notes, research..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 text-base"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Quick Search Presets */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Search
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleQuickSearch('basic')}>
                      <Building className="h-4 w-4 mr-2" />
                      Basic Fields Only
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickSearch('contentOnly')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Notes & Content
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickSearch('peopleAndContacts')}>
                      <Users className="h-4 w-4 mr-2" />
                      People & Contacts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickSearch('comprehensive')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Everything
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <AdvancedSearchDialog
                  onSearch={handleAdvancedSearch}
                  currentQuery={searchQuery}
                  searchStats={searchStats}
                  isOpen={isAdvancedSearchOpen}
                  onOpenChange={setIsAdvancedSearchOpen}
                />
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="To Submit">📝 To Submit</SelectItem>
                  <SelectItem value="Submitted">📤 Submitted</SelectItem>
                  <SelectItem value="Interviewing">💼 Interviewing</SelectItem>
                  <SelectItem value="Offer Received">🎉 Offer Received</SelectItem>
                  <SelectItem value="Rejected">❌ Rejected</SelectItem>
                  <SelectItem value="Archived">📁 Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Companies</SelectItem>
                  {getUniqueCompanies().map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [sort, order] = value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">📅 Newest First</SelectItem>
                  <SelectItem value="date-asc">📅 Oldest First</SelectItem>
                  <SelectItem value="company-asc">🏢 Company A-Z</SelectItem>
                  <SelectItem value="company-desc">🏢 Company Z-A</SelectItem>
                  <SelectItem value="status-asc">📊 Status Order</SelectItem>
                  <SelectItem value="deadline-asc">⏰ Deadline Soon</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="whitespace-nowrap"
                >
                  {showArchived ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showArchived ? 'Hide' : 'Show'} Archived
                </Button>
                
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearAllFilters} className="whitespace-nowrap">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search Results Info */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-slate-900 dark:text-slate-100">{filteredApplications.length}</span> of <span className="font-medium">{applications.length}</span> applications
                  {advancedSearchOptions && (
                    <Badge variant="secondary" className="ml-2">Advanced Search Active</Badge>
                  )}
                </div>
                {searchStats && searchStats.filterRate < 100 && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Match rate:</div>
                    <div className="flex items-center gap-1">
                      <Progress value={searchStats.filterRate} className="w-16 h-2" />
                      <span className="text-xs font-medium">{searchStats.filterRate.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards with Progress Indicators */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <EnhancedStatsCard 
          title="Total" 
          value={stats.total} 
          icon={<BarChart3 className="h-4 w-4" />}
          color="slate" 
          description="All applications"
        />
        <EnhancedStatsCard 
          title="To Submit" 
          value={stats.toSubmit} 
          icon={<FileText className="h-4 w-4" />}
          color="yellow" 
          description="Ready to apply"
          percentage={stats.total > 0 ? (stats.toSubmit / stats.total) * 100 : 0}
        />
        <EnhancedStatsCard 
          title="Submitted" 
          value={stats.submitted} 
          icon={<Mail className="h-4 w-4" />}
          color="blue" 
          description="Awaiting response"
          percentage={stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0}
        />
        <EnhancedStatsCard 
          title="Interviewing" 
          value={stats.interviewing} 
          icon={<Users className="h-4 w-4" />}
          color="purple" 
          description="In progress"
          percentage={stats.total > 0 ? (stats.interviewing / stats.total) * 100 : 0}
        />
        <EnhancedStatsCard 
          title="Offers" 
          value={stats.offers} 
          icon={<Star className="h-4 w-4" />}
          color="green" 
          description={`${stats.successRate.toFixed(1)}% success rate`}
          percentage={stats.total > 0 ? (stats.offers / stats.total) * 100 : 0}
        />
        <EnhancedStatsCard 
          title="Rejected" 
          value={stats.rejected} 
          icon={<X className="h-4 w-4" />}
          color="red" 
          description="Keep learning"
          percentage={stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedApplications.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={bulkActionStatus} onValueChange={(value: any) => setBulkActionStatus(value)}>
                    <SelectTrigger className="w-40">
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
                  
                  <Button onClick={handleBulkStatusUpdate} size="sm">
                    Update Status
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Selected
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelection}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            All your internship applications in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            applications.length === 0 ? (
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
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No applications found</h3>
                <p className="text-sm mb-4">
                  No applications match your current search and filter criteria
                </p>
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <VirtualizedApplicationTable
                  applications={filteredApplications}
                  selectedApplications={selectedApplications}
                  onSelectAll={handleSelectAll}
                  onSelectApplication={handleSelectApplication}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isAllSelected={isAllSelected}
                  height={600}
                />
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredApplications.map((app) => (
                  <Card key={app.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedApplications.has(app.id)}
                            onCheckedChange={(checked) => handleSelectApplication(app.id, checked as boolean)}
                            aria-label={`Select ${app.position} at ${app.companyName}`}
                          />
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
                        {app.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className={`text-xs ${getDeadlineStatus(app.deadline)?.color || ''}`}>
                              {formatDeadlineText(app.deadline)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {app.notes && (
                        <div className="pt-2 border-t">
                          <NotesViewer 
                            notes={app.notes}
                            companyName={app.companyName}
                            position={app.position}
                          />
                        </div>
                      )}
                      
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

function EnhancedStatsCard({ 
  title, 
  value, 
  icon, 
  color, 
  description, 
  percentage 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string; 
  description: string;
  percentage?: number;
}) {
  const colorClasses = {
    slate: 'from-slate-50 to-slate-100 border-slate-200 text-slate-700',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700'
  };

  const iconColorClasses = {
    slate: 'text-slate-500',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    red: 'text-red-500'
  };

  return (
    <Card className={`border bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-md transition-all duration-200 hover:scale-105`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg bg-white/50 ${iconColorClasses[color as keyof typeof iconColorClasses]}`}>
            {icon}
          </div>
          {percentage !== undefined && (
            <div className="text-xs font-medium">
              {percentage.toFixed(0)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        {percentage !== undefined && percentage > 0 && (
          <div className="mt-2">
            <Progress value={percentage} className="h-1" />
          </div>
        )}
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
          <RichTextEditor
            value={formData.notes}
            onChange={(value) => setFormData({...formData, notes: value})}
            placeholder="Additional notes about this application..."
            className="min-h-[120px]"
          />
        </div>

        {/* Company Research Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company Research
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  value={formData.companyResearch.companyWebsite}
                  onChange={(e) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      companyWebsite: e.target.value
                    }
                  })}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="glassdoorUrl">Glassdoor URL</Label>
                <Input
                  id="glassdoorUrl"
                  value={formData.companyResearch.glassdoorUrl}
                  onChange={(e) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      glassdoorUrl: e.target.value
                    }
                  })}
                  placeholder="https://glassdoor.com/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Company Page</Label>
                <Input
                  id="linkedinUrl"
                  value={formData.companyResearch.linkedinUrl}
                  onChange={(e) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      linkedinUrl: e.target.value
                    }
                  })}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  value={formData.companyResearch.salaryRange}
                  onChange={(e) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      salaryRange: e.target.value
                    }
                  })}
                  placeholder="e.g. $4000-6000/month"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select 
                  value={formData.companyResearch.companySize} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      companySize: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1001-5000">1001-5000 employees</SelectItem>
                    <SelectItem value="5000+">5000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.companyResearch.industry}
                  onChange={(e) => setFormData({
                    ...formData, 
                    companyResearch: {
                      ...formData.companyResearch, 
                      industry: e.target.value
                    }
                  })}
                  placeholder="e.g. Technology, Finance, Healthcare"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="culture">Company Culture</Label>
              <Textarea
                id="culture"
                value={formData.companyResearch.culture}
                onChange={(e) => setFormData({
                  ...formData, 
                  companyResearch: {
                    ...formData.companyResearch, 
                    culture: e.target.value
                  }
                })}
                placeholder="Company culture notes, values, work environment..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <Textarea
                id="benefits"
                value={formData.companyResearch.benefits}
                onChange={(e) => setFormData({
                  ...formData, 
                  companyResearch: {
                    ...formData.companyResearch, 
                    benefits: e.target.value
                  }
                })}
                placeholder="Health insurance, vacation days, perks, etc..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="researchNotes">Research Notes</Label>
              <Textarea
                id="researchNotes"
                value={formData.companyResearch.notes}
                onChange={(e) => setFormData({
                  ...formData, 
                  companyResearch: {
                    ...formData.companyResearch, 
                    notes: e.target.value
                  }
                })}
                placeholder="Additional research notes about the company..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Company Rating (1-5 stars)</Label>
              <Select 
                value={formData.companyResearch.rating.toString()} 
                onValueChange={(value) => setFormData({
                  ...formData, 
                  companyResearch: {
                    ...formData.companyResearch, 
                    rating: parseInt(value)
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rate the company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No rating</SelectItem>
                  <SelectItem value="1">⭐ (1 star)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2 stars)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3 stars)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4 stars)</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5 stars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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