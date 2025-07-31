import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Clock, MapPin, User, Mail, Video, CheckCircle, XCircle, AlertCircle, Search, Filter, List, Grid, BarChart3, Bell, Target, TrendingUp, BookOpen, Lightbulb, Zap } from "lucide-react";

const localizer = momentLocalizer(moment);

interface Interview {
  id: string;
  type: 'Phone Screen' | 'Technical' | 'Behavioral' | 'Final Round' | 'HR' | 'Onsite' | 'Other';
  date: string;
  time: string;
  duration?: number;
  interviewer?: string;
  interviewerEmail?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  completed: boolean;
  outcome?: 'Passed' | 'Failed' | 'Pending';
}

interface Application {
  id: string;
  companyName: string;
  position: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Offer Received' | 'Rejected';
  interviews?: Interview[];
}

interface InterviewSchedulerProps {
  user: string;
}

interface CalendarEvent extends Event {
  resource: {
    interview: Interview;
    application: Application;
  };
}

const interviewTypeColors = {
  'Phone Screen': 'bg-blue-100 text-blue-800 border-blue-300',
  'Technical': 'bg-purple-100 text-purple-800 border-purple-300',
  'Behavioral': 'bg-green-100 text-green-800 border-green-300',
  'Final Round': 'bg-orange-100 text-orange-800 border-orange-300',
  'HR': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Onsite': 'bg-pink-100 text-pink-800 border-pink-300',
  'Other': 'bg-gray-100 text-gray-800 border-gray-300'
};

const outcomeColors = {
  'Passed': 'bg-green-100 text-green-800',
  'Failed': 'bg-red-100 text-red-800',
  'Pending': 'bg-yellow-100 text-yellow-800'
};

interface SmartNotification {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  action: string;
  actionType: 'filter-today' | 'open-preparation';
}

export default function InterviewScheduler({ user }: InterviewSchedulerProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'timeline'>('calendar');
  const [showPreparation, setShowPreparation] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Phone Screen' as Interview['type'],
    date: '',
    time: '',
    duration: 60,
    interviewer: '',
    interviewerEmail: '',
    location: '',
    meetingLink: '',
    notes: '',
    completed: false,
    outcome: undefined as Interview['outcome']
  });

  useEffect(() => {
    const savedApps = localStorage.getItem(`internaide_applications_${user}`);
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }
  }, [user]);

  const saveApplications = (apps: Application[]) => {
    setApplications(apps);
    localStorage.setItem(`internaide_applications_${user}`, JSON.stringify(apps));
  };

  const resetForm = () => {
    setFormData({
      type: 'Phone Screen',
      date: '',
      time: '',
      duration: 60,
      interviewer: '',
      interviewerEmail: '',
      location: '',
      meetingLink: '',
      notes: '',
      completed: false,
      outcome: undefined
    });
  };

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    applications.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          const startDateTime = moment(`${interview.date} ${interview.time}`);
          const endDateTime = interview.duration 
            ? moment(startDateTime).add(interview.duration, 'minutes')
            : moment(startDateTime).add(60, 'minutes');

          events.push({
            title: `${app.companyName} - ${interview.type}`,
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            resource: {
              interview,
              application: app
            }
          });
        });
      }
    });
    
    return events;
  }, [applications]);

  const handleAddInterview = () => {
    if (!selectedApplication || !formData.date || !formData.time) {
      alert('Please select an application and fill in date and time');
      return;
    }

    const newInterview: Interview = {
      id: Date.now().toString(),
      type: formData.type,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      interviewer: formData.interviewer || undefined,
      interviewerEmail: formData.interviewerEmail || undefined,
      location: formData.location || undefined,
      meetingLink: formData.meetingLink || undefined,
      notes: formData.notes || undefined,
      completed: formData.completed,
      outcome: formData.outcome || undefined
    };

    const updatedApps = applications.map(app => 
      app.id === selectedApplication.id 
        ? { ...app, interviews: [...(app.interviews || []), newInterview] }
        : app
    );

    saveApplications(updatedApps);
    resetForm();
    setSelectedApplication(null);
    setIsAddDialogOpen(false);
  };

  const handleEditInterview = () => {
    if (!selectedApplication || !selectedInterview || !formData.date || !formData.time) {
      alert('Please fill in date and time');
      return;
    }

    const updatedInterview: Interview = {
      ...selectedInterview,
      type: formData.type,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      interviewer: formData.interviewer || undefined,
      interviewerEmail: formData.interviewerEmail || undefined,
      location: formData.location || undefined,
      meetingLink: formData.meetingLink || undefined,
      notes: formData.notes || undefined,
      completed: formData.completed,
      outcome: formData.outcome || undefined
    };

    const updatedApps = applications.map(app => 
      app.id === selectedApplication.id 
        ? { 
            ...app, 
            interviews: app.interviews?.map(interview => 
              interview.id === selectedInterview.id ? updatedInterview : interview
            ) || []
          }
        : app
    );

    saveApplications(updatedApps);
    resetForm();
    setSelectedApplication(null);
    setSelectedInterview(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteInterview = (applicationId: string, interviewId: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      const updatedApps = applications.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              interviews: app.interviews?.filter(interview => interview.id !== interviewId) || []
            }
          : app
      );
      saveApplications(updatedApps);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedApplication(event.resource.application);
    setSelectedInterview(event.resource.interview);
    setFormData({
      type: event.resource.interview.type,
      date: event.resource.interview.date,
      time: event.resource.interview.time,
      duration: event.resource.interview.duration || 60,
      interviewer: event.resource.interview.interviewer || '',
      interviewerEmail: event.resource.interview.interviewerEmail || '',
      location: event.resource.interview.location || '',
      meetingLink: event.resource.interview.meetingLink || '',
      notes: event.resource.interview.notes || '',
      completed: event.resource.interview.completed,
      outcome: event.resource.interview.outcome
    });
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setSelectedInterview(null);
    setSelectedApplication(null);
    setIsAddDialogOpen(true);
  };

  const handleEdit = () => {
    setIsViewDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const getUpcomingInterviews = () => {
    const upcoming: { interview: Interview; application: Application }[] = [];
    const now = moment();
    
    applications.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          const interviewTime = moment(`${interview.date} ${interview.time}`);
          if (interviewTime.isAfter(now)) {
            upcoming.push({ interview, application: app });
          }
        });
      }
    });
    
    return upcoming.sort((a, b) => 
      moment(`${a.interview.date} ${a.interview.time}`).valueOf() - 
      moment(`${b.interview.date} ${b.interview.time}`).valueOf()
    );
  };

  const getTodaysInterviews = () => {
    const today = moment().format('YYYY-MM-DD');
    const todaysInterviews: { interview: Interview; application: Application }[] = [];
    
    applications.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          if (interview.date === today) {
            todaysInterviews.push({ interview, application: app });
          }
        });
      }
    });
    
    return todaysInterviews.sort((a, b) => 
      a.interview.time.localeCompare(b.interview.time)
    );
  };

  const getFilteredInterviews = () => {
    let filtered: { interview: Interview; application: Application }[] = [];
    
    applications.forEach(app => {
      if (app.interviews) {
        app.interviews.forEach(interview => {
          // Apply search filter
          if (searchTerm && !app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !app.position.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !interview.type.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !(interview.interviewer || '').toLowerCase().includes(searchTerm.toLowerCase())) {
            return;
          }
          
          // Apply type filter
          if (selectedTypeFilter !== 'all' && interview.type !== selectedTypeFilter) {
            return;
          }
          
          // Apply status filter
          if (selectedStatusFilter !== 'all') {
            if (selectedStatusFilter === 'upcoming' && (interview.completed || moment(`${interview.date} ${interview.time}`).isBefore(moment()))) {
              return;
            }
            if (selectedStatusFilter === 'completed' && !interview.completed) {
              return;
            }
            if (selectedStatusFilter === 'today' && interview.date !== moment().format('YYYY-MM-DD')) {
              return;
            }
          }
          
          filtered.push({ interview, application: app });
        });
      }
    });
    
    return filtered.sort((a, b) => 
      moment(`${a.interview.date} ${a.interview.time}`).valueOf() - 
      moment(`${b.interview.date} ${b.interview.time}`).valueOf()
    );
  };

  const getSmartNotifications = (): SmartNotification[] => {
    const notifications: SmartNotification[] = [];
    const now = moment();
    const todaysInterviews = getTodaysInterviews();
    const upcomingInterviews = getUpcomingInterviews();
    
    // Today's interviews
    if (todaysInterviews.length > 0) {
      notifications.push({
        type: 'info' as const,
        title: `${todaysInterviews.length} interview${todaysInterviews.length > 1 ? 's' : ''} today`,
        message: `You have interviews scheduled for today. Make sure you're prepared!`,
        action: 'View Today\'s Schedule',
        actionType: 'filter-today' as const
      });
    }
    
    // Upcoming interviews in next 24 hours
    const next24Hours = upcomingInterviews.filter(item => 
      moment(`${item.interview.date} ${item.interview.time}`).isBefore(moment().add(24, 'hours'))
    );
    
    if (next24Hours.length > 0) {
      notifications.push({
        type: 'warning' as const,
        title: `${next24Hours.length} interview${next24Hours.length > 1 ? 's' : ''} in next 24 hours`,
        message: 'Review your interview preparation and confirm meeting details.',
        action: 'Prepare Now',
        actionType: 'open-preparation' as const
      });
    }
    
    // Interviews without preparation notes
    const unpreparedInterviews = upcomingInterviews.filter(item => 
      !item.interview.notes || item.interview.notes.trim().length === 0
    );
    
    if (unpreparedInterviews.length > 0) {
      notifications.push({
        type: 'info' as const,
        title: `${unpreparedInterviews.length} interview${unpreparedInterviews.length > 1 ? 's' : ''} need preparation`,
        message: 'Add notes and preparation details for better interview outcomes.',
        action: 'Add Prep Notes',
        actionType: 'open-preparation' as const
      });
    }
    
    return notifications.slice(0, 3); // Show max 3 notifications
  };

  const getInterviewStats = () => {
    let total = 0;
    let completed = 0;
    let upcoming = 0;
    let thisWeek = 0;
    let passed = 0;
    let failed = 0;
    let pending = 0;
    
    const weekStart = moment().startOf('week');
    const weekEnd = moment().endOf('week');
    
    applications.forEach(app => {
      if (app.interviews) {
        total += app.interviews.length;
        app.interviews.forEach(interview => {
          if (interview.completed) {
            completed++;
            if (interview.outcome === 'Passed') passed++;
            else if (interview.outcome === 'Failed') failed++;
            else pending++;
          } else {
            const interviewTime = moment(`${interview.date} ${interview.time}`);
            if (interviewTime.isAfter(moment())) {
              upcoming++;
              if (interviewTime.isBetween(weekStart, weekEnd)) {
                thisWeek++;
              }
            }
          }
        });
      }
    });
    
    const successRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { 
      total, 
      completed, 
      upcoming, 
      thisWeek, 
      passed, 
      failed, 
      pending, 
      successRate, 
      completionRate 
    };
  };

  const upcomingInterviews = getUpcomingInterviews();
  const todaysInterviews = getTodaysInterviews();
  const filteredInterviews = getFilteredInterviews();
  const smartNotifications = getSmartNotifications();
  const stats = getInterviewStats();
  const interviewingApplications = applications.filter(app => app.status === 'Interviewing');

  const handleNotificationAction = (actionType: string) => {
    switch (actionType) {
      case 'filter-today':
        setSelectedStatusFilter('today');
        setViewMode('list');
        break;
      case 'open-preparation':
        setShowPreparation(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Interview Scheduler
              </h1>
              <p className="text-lg text-white/90">
                Manage and track your interview schedule with smart insights
              </p>
              <div className="flex items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {stats.total} Total Interviews
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {stats.successRate}% Success Rate
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {stats.upcoming} Upcoming
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setShowPreparation(true)}
                variant="secondary" 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Prep Guide
              </Button>
              <Button 
                onClick={handleAddNew} 
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Smart Notifications */}
      {smartNotifications.length > 0 && (
        <div className="space-y-3">
          {smartNotifications.map((notification, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border-l-4 bg-gradient-to-r shadow-sm ${
                notification.type === 'warning' 
                  ? 'border-l-amber-500 from-amber-50 to-amber-50/50 text-amber-900'
                  : notification.type === 'error'
                  ? 'border-l-red-500 from-red-50 to-red-50/50 text-red-900'
                  : 'border-l-blue-500 from-blue-50 to-blue-50/50 text-blue-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'warning' 
                      ? 'bg-amber-100'
                      : notification.type === 'error'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                  }`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm opacity-80">{notification.message}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNotificationAction(notification.actionType)}
                  className="border-current/20 hover:bg-current/10"
                >
                  {notification.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search interviews, companies, or interviewers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              
              <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Final Round">Final Round</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Onsite">Onsite</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Interviews</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-blue-700">
                <span>Completion Rate</span>
                <span>{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-1 bg-blue-200" />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {stats.completed} completed, {stats.upcoming} upcoming
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">This Week</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.thisWeek}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-purple-700">
                <span>Today</span>
                <span>{todaysInterviews.length}</span>
              </div>
              <Progress 
                value={stats.thisWeek > 0 ? (todaysInterviews.length / stats.thisWeek) * 100 : 0} 
                className="h-1 bg-purple-200" 
              />
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {todaysInterviews.length} today, {stats.thisWeek - todaysInterviews.length} remaining
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Success Rate</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.successRate}%</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-green-700">
                <span>Passed: {stats.passed}</span>
                <span>Failed: {stats.failed}</span>
              </div>
              <Progress value={stats.successRate} className="h-1 bg-green-200" />
            </div>
            <p className="text-xs text-green-600 mt-2">
              Out of {stats.completed} completed interviews
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Active Pipeline</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{interviewingApplications.length}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-orange-700">
                <span>Progress</span>
                <span>{Math.round((interviewingApplications.length / (applications.length || 1)) * 100)}%</span>
              </div>
              <Progress 
                value={(interviewingApplications.length / (applications.length || 1)) * 100} 
                className="h-1 bg-orange-200" 
              />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Currently interviewing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with View Modes */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsContent value="calendar">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Interview Calendar
              </CardTitle>
              <CardDescription>
                Click on an interview to view details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={handleSelectEvent}
                  popup
                  views={['month', 'week', 'day']}
                  defaultView="week"
                  className="border border-border rounded-lg"
                  eventPropGetter={(event) => ({
                    style: {
                      backgroundColor: 'var(--primary)',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: '4px'
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5 text-purple-600" />
                Interview List
                {searchTerm || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all' ? (
                  <Badge variant="secondary" className="ml-2">
                    {filteredInterviews.length} filtered
                  </Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Detailed list view of all interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No interviews found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or schedule a new interview</p>
                  </div>
                ) : (
                  filteredInterviews.map(({ interview, application }) => {
                    const interviewTime = moment(`${interview.date} ${interview.time}`);
                    const isToday = interview.date === moment().format('YYYY-MM-DD');
                    const isPast = interviewTime.isBefore(moment());
                    const isUpcoming = interviewTime.isAfter(moment());
                    
                    return (
                      <div key={interview.id} className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        isToday ? 'border-orange-200 bg-orange-50/50' : 
                        isPast ? 'border-gray-200 bg-gray-50/50' : 
                        'border-blue-200 bg-blue-50/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-lg">{application.companyName}</span>
                              <Badge className={interviewTypeColors[interview.type]}>
                                {interview.type}
                              </Badge>
                              {isToday && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  Today
                                </Badge>
                              )}
                              {interview.completed && interview.outcome && (
                                <Badge className={outcomeColors[interview.outcome]}>
                                  {interview.outcome}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {application.position}
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                {moment(interview.date).format('MMM DD, YYYY')}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {interview.time}
                              </div>
                              {interview.duration && (
                                <div className="text-muted-foreground">
                                  {interview.duration} min
                                </div>
                              )}
                              {interview.interviewer && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {interview.interviewer}
                                </div>
                              )}
                              {interview.location && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {interview.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {interview.meetingLink && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(interview.meetingLink, '_blank')}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Video className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectEvent({
                                id: interview.id,
                                title: '',
                                start: new Date(),
                                end: new Date(),
                                resource: { interview, application }
                              } as CalendarEvent)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Interview Timeline
              </CardTitle>
              <CardDescription>
                Chronological view of your interview journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No interviews found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or schedule a new interview</p>
                  </div>
                ) : (
                  filteredInterviews.map(({ interview, application }, index) => {
                    const interviewTime = moment(`${interview.date} ${interview.time}`);
                    const isLast = index === filteredInterviews.length - 1;
                    
                    return (
                      <div key={interview.id} className="relative">
                        {!isLast && (
                          <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="flex items-start gap-4">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${
                            interview.completed 
                              ? interview.outcome === 'Passed' 
                                ? 'border-green-500 text-green-500' 
                                : interview.outcome === 'Failed'
                                ? 'border-red-500 text-red-500'
                                : 'border-yellow-500 text-yellow-500'
                              : interviewTime.isBefore(moment())
                              ? 'border-gray-500 text-gray-500'
                              : 'border-blue-500 text-blue-500'
                          }`}>
                            {interview.completed ? (
                              interview.outcome === 'Passed' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : interview.outcome === 'Failed' ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )
                            ) : (
                              <CalendarIcon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{application.companyName}</h4>
                                  <Badge className={interviewTypeColors[interview.type]} variant="secondary">
                                    {interview.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{application.position}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{interviewTime.format('MMM DD, YYYY')}</span>
                                  <span>{interview.time}</span>
                                  {interview.interviewer && <span>with {interview.interviewer}</span>}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSelectEvent({
                                  id: interview.id,
                                  title: '',
                                  start: new Date(),
                                  end: new Date(),
                                  resource: { interview, application }
                                } as CalendarEvent)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Upcoming Interviews
            </CardTitle>
            <CardDescription>
              Next {Math.min(upcomingInterviews.length, 5)} interviews - stay prepared!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.slice(0, 5).map(({ interview, application }) => {
                const interviewTime = moment(`${interview.date} ${interview.time}`);
                const timeUntil = interviewTime.fromNow();
                const isToday = interview.date === moment().format('YYYY-MM-DD');
                const isWithin24Hours = interviewTime.isBefore(moment().add(24, 'hours'));
                
                return (
                  <div key={interview.id} className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md ${
                    isToday ? 'border-orange-200 bg-orange-50/50' : 
                    isWithin24Hours ? 'border-yellow-200 bg-yellow-50/50' : 
                    'border-blue-200 bg-blue-50/50'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-lg">{application.companyName}</span>
                        <Badge className={interviewTypeColors[interview.type]}>
                          {interview.type}
                        </Badge>
                        {isToday && (
                          <Badge className="bg-orange-100 text-orange-800 animate-pulse">
                            <Clock className="h-3 w-3 mr-1" />
                            Today
                          </Badge>
                        )}
                        {isWithin24Hours && !isToday && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Soon
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.position}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {moment(interview.date).format('MMM DD, YYYY')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {interview.time} ({timeUntil})
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {interview.location}
                          </div>
                        )}
                        {interview.interviewer && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {interview.interviewer}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {interview.meetingLink && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(interview.meetingLink, '_blank')}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSelectEvent({
                          id: interview.id,
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          resource: { interview, application }
                        } as CalendarEvent)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Interview Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
              Add a new interview to your schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="application">Application</Label>
              <Select 
                value={selectedApplication?.id || ''} 
                onValueChange={(value) => {
                  const app = applications.find(a => a.id === value);
                  setSelectedApplication(app || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {interviewingApplications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.companyName} - {app.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type</Label>
                <Select value={formData.type} onValueChange={(value: Interview['type']) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Final Round">Final Round</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer">Interviewer Name</Label>
                <Input
                  id="interviewer"
                  value={formData.interviewer}
                  onChange={(e) => setFormData({...formData, interviewer: e.target.value})}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interviewerEmail">Interviewer Email</Label>
                <Input
                  id="interviewerEmail"
                  type="email"
                  value={formData.interviewerEmail}
                  onChange={(e) => setFormData({...formData, interviewerEmail: e.target.value})}
                  placeholder="e.g. john@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Video Call, Office Address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                  placeholder="e.g. Zoom, Google Meet link"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about this interview..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInterview}>
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Interview Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedApplication?.companyName} - {selectedInterview?.type}
            </DialogTitle>
            <DialogDescription>
              {selectedApplication?.position}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInterview && selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{moment(selectedInterview.date).format('MMM DD, YYYY')}</span>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span>{selectedInterview.time}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="mt-1">
                    {selectedInterview.duration || 60} minutes
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="mt-1">
                    <Badge className={interviewTypeColors[selectedInterview.type]}>
                      {selectedInterview.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedInterview.completed ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Completed</span>
                        {selectedInterview.outcome && (
                          <Badge className={outcomeColors[selectedInterview.outcome]}>
                            {selectedInterview.outcome}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span>Scheduled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {selectedInterview.interviewer && (
                <div>
                  <Label className="text-sm font-medium">Interviewer</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInterview.interviewer}</span>
                    {selectedInterview.interviewerEmail && (
                      <>
                        <Mail className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{selectedInterview.interviewerEmail}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedInterview.location && (
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInterview.location}</span>
                  </div>
                </div>
              )}

              {selectedInterview.meetingLink && (
                <div>
                  <Label className="text-sm font-medium">Meeting Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={selectedInterview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                </div>
              )}

              {selectedInterview.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    {selectedInterview.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => selectedInterview && selectedApplication && 
                handleDeleteInterview(selectedApplication.id, selectedInterview.id)
              }
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Interview Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Interview</DialogTitle>
            <DialogDescription>
              Update interview details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Interview Type</Label>
                <Select value={formData.type} onValueChange={(value: Interview['type']) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Final Round">Final Round</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-interviewer">Interviewer Name</Label>
                <Input
                  id="edit-interviewer"
                  value={formData.interviewer}
                  onChange={(e) => setFormData({...formData, interviewer: e.target.value})}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-interviewerEmail">Interviewer Email</Label>
                <Input
                  id="edit-interviewerEmail"
                  type="email"
                  value={formData.interviewerEmail}
                  onChange={(e) => setFormData({...formData, interviewerEmail: e.target.value})}
                  placeholder="e.g. john@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Video Call, Office Address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meetingLink">Meeting Link</Label>
                <Input
                  id="edit-meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                  placeholder="e.g. Zoom, Google Meet link"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about this interview..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-completed"
                  checked={formData.completed}
                  onChange={(e) => setFormData({...formData, completed: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-completed">Mark as completed</Label>
              </div>
              
              {formData.completed && (
                <div className="space-y-2">
                  <Label htmlFor="edit-outcome">Outcome</Label>
                  <Select value={formData.outcome || ''} onValueChange={(value) => setFormData({...formData, outcome: value as Interview['outcome']})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passed">Passed</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInterview}>
              Update Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview Preparation Dialog */}
      <Dialog open={showPreparation} onOpenChange={setShowPreparation}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Interview Preparation Guide
            </DialogTitle>
            <DialogDescription>
              Get ready for your upcoming interviews with our comprehensive preparation guide
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2" />
                    <span>Research the company and recent news</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2" />
                    <span>Prepare specific examples using STAR method</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2" />
                    <span>Practice common interview questions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2" />
                    <span>Prepare thoughtful questions to ask</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Day-of Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2" />
                    <span>Test video/audio setup 30 min before</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2" />
                    <span>Have resume and notes ready</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2" />
                    <span>Arrive 10-15 minutes early</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full mt-2" />
                    <span>Bring pen, paper, and questions</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Common Questions by Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Common Questions by Interview Type</h3>
              
              <Tabs defaultValue="behavioral" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="phone">Phone Screen</TabsTrigger>
                  <TabsTrigger value="final">Final Round</TabsTrigger>
                </TabsList>
                
                <TabsContent value="behavioral" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Tell me about a time when you faced a challenge at work"</p>
                      <p className="text-xs text-muted-foreground mt-1">Use STAR method: Situation, Task, Action, Result</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Describe a time when you had to work with a difficult team member"</p>
                      <p className="text-xs text-muted-foreground mt-1">Focus on conflict resolution and collaboration skills</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Give an example of when you had to learn something new quickly"</p>
                      <p className="text-xs text-muted-foreground mt-1">Highlight adaptability and learning approach</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="technical" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Walk me through your approach to solving [specific problem]"</p>
                      <p className="text-xs text-muted-foreground mt-1">Think out loud and explain your reasoning</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"How would you optimize this code/process?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Consider time/space complexity and trade-offs</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Explain a complex technical concept to a non-technical person"</p>
                      <p className="text-xs text-muted-foreground mt-1">Test communication and understanding depth</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Why are you interested in this position?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Show enthusiasm and research about the role</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"What do you know about our company?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Demonstrate research and genuine interest</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"What are your salary expectations?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Research market rates and give a range</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="final" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Where do you see yourself in 5 years?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Align with company growth opportunities</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Why should we hire you over other candidates?"</p>
                      <p className="text-xs text-muted-foreground mt-1">Highlight unique value proposition</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">"Do you have any questions for us?"</p>
                      <p className="text-xs text-muted-foreground mt-1">ALWAYS have thoughtful questions prepared</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Your Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Upcoming Interviews</h3>
                <div className="grid gap-3">
                  {upcomingInterviews.slice(0, 3).map(({ interview, application }) => (
                    <div key={interview.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{application.companyName}</span>
                            <Badge className={interviewTypeColors[interview.type]} variant="secondary">
                              {interview.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{application.position}</p>
                          <p className="text-xs text-muted-foreground">
                            {moment(`${interview.date} ${interview.time}`).format('MMM DD, YYYY [at] h:mm A')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowPreparation(false);
                              handleSelectEvent({
                                id: interview.id,
                                title: '',
                                start: new Date(),
                                end: new Date(),
                                resource: { interview, application }
                              } as CalendarEvent);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Add Notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPreparation(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}