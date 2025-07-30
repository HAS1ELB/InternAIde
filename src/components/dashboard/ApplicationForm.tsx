import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Application, CV } from './Dashboard';

interface ApplicationFormProps {
  cvs: CV[];
  application?: Application | null;
  onSubmit: (data: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  'To Submit',
  'Submitted',
  'Interviewing',
  'Rejected',
  'Offer Received'
] as const;

export function ApplicationForm({ cvs, application, onSubmit, onCancel }: ApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    job_url: '',
    job_description: '',
    cover_letter: '',
    cover_letter_language: 'english',
    recruiter_name: '',
    recruiter_email: '',
    recruiter_linkedin: '',
    status: 'To Submit' as Application['status'],
    cv_id: undefined as number | undefined,
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company_name: application.company_name || '',
        role_title: application.role_title || '',
        job_url: application.job_url || '',
        job_description: application.job_description || '',
        cover_letter: application.cover_letter || '',
        cover_letter_language: application.cover_letter_language || 'english',
        recruiter_name: application.recruiter_name || '',
        recruiter_email: application.recruiter_email || '',
        recruiter_linkedin: application.recruiter_linkedin || '',
        status: application.status,
        cv_id: application.cv_id,
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        cv_id: formData.cv_id || undefined,
        job_url: formData.job_url || undefined,
        job_description: formData.job_description || undefined,
        cover_letter: formData.cover_letter || undefined,
        cover_letter_language: formData.cover_letter_language || undefined,
        recruiter_name: formData.recruiter_name || undefined,
        recruiter_email: formData.recruiter_email || undefined,
        recruiter_linkedin: formData.recruiter_linkedin || undefined,
        submission_date: formData.status === 'Submitted' ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      console.error('Failed to save application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {application ? 'Edit Application' : 'Add New Application'}
          </DialogTitle>
          <DialogDescription>
            {application ? 
              'Update your internship application details' : 
              'Add a new internship application to track'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateFormData('company_name', e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role_title">Role Title *</Label>
                <Input
                  id="role_title"
                  value={formData.role_title}
                  onChange={(e) => updateFormData('role_title', e.target.value)}
                  placeholder="e.g., Data Science Intern"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_url">Job URL</Label>
              <Input
                id="job_url"
                type="url"
                value={formData.job_url}
                onChange={(e) => updateFormData('job_url', e.target.value)}
                placeholder="https://company.com/careers/job-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job Description</Label>
              <Textarea
                id="job_description"
                value={formData.job_description}
                onChange={(e) => updateFormData('job_description', e.target.value)}
                placeholder="Paste the job description here..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cv_id">CV Used</Label>
                <Select 
                  value={formData.cv_id?.toString() || ''} 
                  onValueChange={(value) => updateFormData('cv_id', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a CV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No CV selected</SelectItem>
                    {cvs.map((cv) => (
                      <SelectItem key={cv.id} value={cv.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{cv.filename}</span>
                          <Badge variant="outline" className="text-xs">
                            {cv.role_category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => updateFormData('status', value as Application['status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Recruiter Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recruiter Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recruiter_name">Recruiter Name</Label>
                <Input
                  id="recruiter_name"
                  value={formData.recruiter_name}
                  onChange={(e) => updateFormData('recruiter_name', e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recruiter_email">Recruiter Email</Label>
                <Input
                  id="recruiter_email"
                  type="email"
                  value={formData.recruiter_email}
                  onChange={(e) => updateFormData('recruiter_email', e.target.value)}
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter_linkedin">Recruiter LinkedIn</Label>
              <Input
                id="recruiter_linkedin"
                type="url"
                value={formData.recruiter_linkedin}
                onChange={(e) => updateFormData('recruiter_linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/recruiter-profile"
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cover Letter</h3>
            
            <div className="space-y-2">
              <Label htmlFor="cover_letter_language">Language</Label>
              <Select 
                value={formData.cover_letter_language} 
                onValueChange={(value) => updateFormData('cover_letter_language', value)}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_letter">Cover Letter Content</Label>
              <Textarea
                id="cover_letter"
                value={formData.cover_letter}
                onChange={(e) => updateFormData('cover_letter', e.target.value)}
                placeholder="Your cover letter content will appear here..."
                rows={8}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (application ? 'Update Application' : 'Add Application')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}