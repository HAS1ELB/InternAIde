import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Briefcase, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ApplicationTable } from './ApplicationTable';
import { ApplicationForm } from './ApplicationForm';
import { CoverLetterGenerator } from './CoverLetterGenerator';

export interface Application {
  id: number;
  user_id: number;
  cv_id?: number;
  company_name: string;
  role_title: string;
  job_url?: string;
  job_description?: string;
  cover_letter?: string;
  cover_letter_language?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_linkedin?: string;
  status: 'To Submit' | 'Submitted' | 'Interviewing' | 'Rejected' | 'Offer Received';
  created_at: string;
  updated_at: string;
  submission_date?: string;
}

export interface CV {
  id: number;
  filename: string;
  role_category: string;
}

export function Dashboard() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showCoverLetterGenerator, setShowCoverLetterGenerator] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchApplications();
    fetchCVs();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCVs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cvs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCvs(data);
      }
    } catch (error) {
      console.error('Failed to fetch CVs:', error);
    }
  };

  const handleCreateApplication = async (applicationData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        await fetchApplications();
        setShowApplicationForm(false);
      }
    } catch (error) {
      console.error('Failed to create application:', error);
    }
  };

  const handleUpdateApplication = async (id: number, applicationData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        await fetchApplications();
        setEditingApplication(null);
        setShowApplicationForm(false);
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const handleDeleteApplication = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchApplications();
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'To Submit':
        return <Clock className="h-4 w-4" />;
      case 'Submitted':
        return <FileText className="h-4 w-4" />;
      case 'Interviewing':
        return <AlertCircle className="h-4 w-4" />;
      case 'Offer Received':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'To Submit':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Interviewing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Offer Received':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const stats = {
    total: applications.length,
    submitted: applications.filter(app => app.status === 'Submitted').length,
    interviewing: applications.filter(app => app.status === 'Interviewing').length,
    offers: applications.filter(app => app.status === 'Offer Received').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your internship applications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCoverLetterGenerator(true)} variant="outline">
            <Briefcase className="h-4 w-4 mr-2" />
            Generate Cover Letter
          </Button>
          <Button onClick={() => setShowApplicationForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviewing</p>
                <p className="text-2xl font-bold text-purple-600">{stats.interviewing}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offers</p>
                <p className="text-2xl font-bold text-green-600">{stats.offers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Manage all your internship applications in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationTable
            applications={applications}
            cvs={cvs}
            onEdit={(app) => {
              setEditingApplication(app);
              setShowApplicationForm(true);
            }}
            onDelete={handleDeleteApplication}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
          />
        </CardContent>
      </Card>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm
          cvs={cvs}
          application={editingApplication}
          onSubmit={editingApplication ? 
            (data) => handleUpdateApplication(editingApplication.id, data) :
            handleCreateApplication
          }
          onCancel={() => {
            setShowApplicationForm(false);
            setEditingApplication(null);
          }}
        />
      )}

      {/* Cover Letter Generator Modal */}
      {showCoverLetterGenerator && (
        <CoverLetterGenerator
          cvs={cvs}
          onClose={() => setShowCoverLetterGenerator(false)}
        />
      )}
    </div>
  );
}