import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle, XCircle, Circle, Briefcase, Users, Trophy, MapPin, Building } from "lucide-react";

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
  rating?: number;
}

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
  interviews?: Interview[];
  companyResearch?: CompanyResearch;
}

interface TimelineEvent {
  id: string;
  type: 'application' | 'interview' | 'status_change' | 'deadline';
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'upcoming' | 'overdue' | 'cancelled';
  application: Application;
  metadata?: any;
}

interface ApplicationTimelineProps {
  user: string;
}

const statusColors = {
  'To Submit': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Submitted': 'bg-blue-100 text-blue-800 border-blue-300',
  'Interviewing': 'bg-purple-100 text-purple-800 border-purple-300',
  'Offer Received': 'bg-green-100 text-green-800 border-green-300',
  'Rejected': 'bg-red-100 text-red-800 border-red-300'
};

const eventColors = {
  completed: 'bg-green-50 border-green-200',
  upcoming: 'bg-blue-50 border-blue-200',
  overdue: 'bg-red-50 border-red-200',
  cancelled: 'bg-gray-50 border-gray-200'
};

const eventIcons = {
  application: Briefcase,
  interview: Users,
  status_change: CheckCircle,
  deadline: Clock
};

export default function ApplicationTimeline({ user }: ApplicationTimelineProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    // Load applications
    const savedApps = localStorage.getItem(`internaide_applications_${user}`);
    if (savedApps) {
      const apps = JSON.parse(savedApps);
      setApplications(apps);
      generateTimelineEvents(apps);
    }
  }, [user]);

  const generateTimelineEvents = (apps: Application[]) => {
    const events: TimelineEvent[] = [];

    apps.forEach(app => {
      // Add application submission event
      events.push({
        id: `app-${app.id}`,
        type: 'application',
        date: app.applicationDate,
        title: 'Application Submitted',
        description: `Applied for ${app.position} at ${app.companyName}`,
        status: 'completed',
        application: app
      });

      // Add deadline event if exists
      if (app.deadline) {
        const deadlineDate = new Date(app.deadline);
        const today = new Date();
        const isOverdue = deadlineDate < today && app.status === 'To Submit';
        
        events.push({
          id: `deadline-${app.id}`,
          type: 'deadline',
          date: app.deadline,
          title: 'Application Deadline',
          description: `Deadline for ${app.position} at ${app.companyName}`,
          status: app.status === 'To Submit' 
            ? (isOverdue ? 'overdue' : 'upcoming')
            : 'completed',
          application: app
        });
      }

      // Add interview events
      if (app.interviews && app.interviews.length > 0) {
        app.interviews.forEach((interview, index) => {
          const interviewDate = new Date(`${interview.date}T${interview.time}`);
          const today = new Date();
          
          let status: 'completed' | 'upcoming' | 'overdue' | 'cancelled' = 'upcoming';
          if (interview.completed) {
            status = interview.outcome === 'Failed' ? 'cancelled' : 'completed';
          } else if (interviewDate < today) {
            status = 'overdue';
          }

          events.push({
            id: `interview-${app.id}-${index}`,
            type: 'interview',
            date: interview.date,
            title: `${interview.type} Interview`,
            description: `${interview.type} interview for ${app.position} at ${app.companyName}`,
            status,
            application: app,
            metadata: {
              interview,
              time: interview.time,
              interviewer: interview.interviewer,
              location: interview.location
            }
          });
        });
      }

      // Add status change events based on current status
      if (app.status === 'Offer Received') {
        events.push({
          id: `offer-${app.id}`,
          type: 'status_change',
          date: app.applicationDate, // We don't have exact offer date, use application date as fallback
          title: 'Offer Received',
          description: `Received offer for ${app.position} at ${app.companyName}`,
          status: 'completed',
          application: app
        });
      } else if (app.status === 'Rejected') {
        events.push({
          id: `rejected-${app.id}`,
          type: 'status_change',
          date: app.applicationDate,
          title: 'Application Rejected',
          description: `Application rejected for ${app.position} at ${app.companyName}`,
          status: 'cancelled',
          application: app
        });
      }
    });

    // Sort events by date (newest first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimelineEvents(events);
  };

  const filteredEvents = timelineEvents.filter(event => {
    // Filter by selected application
    if (selectedApp !== 'all' && event.application.id !== selectedApp) {
      return false;
    }

    // Filter by view mode
    if (viewMode === 'upcoming' && event.status !== 'upcoming') {
      return false;
    }
    if (viewMode === 'completed' && event.status !== 'completed') {
      return false;
    }

    return true;
  });

  const getEventIcon = (event: TimelineEvent) => {
    const IconComponent = eventIcons[event.type];
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <Circle className="h-5 w-5 text-blue-500" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatEventDate = (dateString: string, time?: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));

    let dateText = date.toLocaleDateString();
    if (diffDays === 0) {
      dateText = 'Today';
    } else if (diffDays === 1) {
      dateText = 'Tomorrow';
    } else if (diffDays === -1) {
      dateText = 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      dateText = `In ${diffDays} days`;
    } else if (diffDays < -1 && diffDays >= -7) {
      dateText = `${Math.abs(diffDays)} days ago`;
    }

    if (time) {
      dateText += ` at ${time}`;
    }

    return dateText;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return timelineEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && event.status === 'upcoming';
    }).slice(0, 3);
  };

  const getCompletedEvents = () => {
    return timelineEvents.filter(event => event.status === 'completed').slice(0, 5);
  };

  const upcomingEvents = getUpcomingEvents();
  const completedEvents = getCompletedEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Application Timeline</h2>
          <p className="text-muted-foreground">
            Track your application progress and upcoming events
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Interviews and deadlines
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Applications and interviews
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.status !== 'Rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by application..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            {applications.map(app => (
              <SelectItem key={app.id} value={app.id}>
                {app.position} at {app.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming Only</SelectItem>
            <SelectItem value="completed">Completed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            {filteredEvents.length} events {selectedApp !== 'all' && 'for selected application'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found for the selected filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline connector */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-6 bg-border" />
                  )}
                  
                  <div className={`relative flex items-start gap-4 p-4 rounded-lg border ${eventColors[event.status]}`}>
                    {/* Timeline dot */}
                    <div className="flex-shrink-0">
                      {getStatusIcon(event.status)}
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event)}
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge variant="outline" className={statusColors[event.application.status]}>
                            {event.application.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatEventDate(event.date, event.metadata?.time)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      
                      {/* Additional metadata */}
                      {event.metadata && (
                        <div className="mt-2 space-y-1">
                          {event.metadata.interviewer && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>Interviewer: {event.metadata.interviewer}</span>
                            </div>
                          )}
                          {event.metadata.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{event.metadata.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Company info */}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>{event.application.companyName}</span>
                        {event.application.location && (
                          <>
                            <span>•</span>
                            <span>{event.application.location}</span>
                          </>
                        )}
                      </div>
                    </div>
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