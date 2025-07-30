import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, Trash2, Plus, Download } from 'lucide-react';

export interface CV {
  id: number;
  filename: string;
  role_category: string;
}

const ROLE_CATEGORIES = [
  'Data Scientist',
  'ML Engineer',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Product Manager',
  'UX/UI Designer',
  'Business Analyst',
  'Generative AI',
  'Research Intern',
  'Marketing Intern',
  'Sales Intern',
  'Other'
];

export function CVManager() {
  const { token } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    role_category: '',
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchCVs();
  }, []);

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
      setError('Failed to load CVs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF and DOCX files are allowed');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setUploadData(prev => ({ ...prev, file }));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.role_category) {
      setError('Please select a file and role category');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('role_category', uploadData.role_category);

      const response = await fetch(`${API_BASE_URL}/api/cvs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      await fetchCVs();
      setShowUploadDialog(false);
      setUploadData({ file: null, role_category: '' });
      setSuccess('CV uploaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this CV?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/cvs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchCVs();
        setSuccess('CV deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError('Failed to delete CV');
    }
  };

  const getRoleCategoryColor = (category: string) => {
    const colors = {
      'Data Scientist': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'ML Engineer': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Software Engineer': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Frontend Developer': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'Backend Developer': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Full Stack Developer': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'DevOps Engineer': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Product Manager': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      'UX/UI Designer': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      'Business Analyst': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      'Generative AI': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your CVs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">CV Management</h1>
          <p className="text-muted-foreground">Upload and organize your CVs by target roles</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload CV
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* CVs Grid */}
      {cvs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto max-w-sm">
                <div className="bg-muted rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No CVs uploaded yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first CV to start organizing them by target roles. Supported formats: PDF, DOCX
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First CV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <Card key={cv.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{cv.filename}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`${getRoleCategoryColor(cv.role_category)} text-xs`}
                      >
                        {cv.role_category}
                      </Badge>
                    </CardDescription>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      // In a real app, you'd download the actual file
                      console.log('Download CV:', cv.id);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(cv.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New CV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cv-file">CV File (PDF or DOCX) *</Label>
              <Input
                id="cv-file"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
              />
              {uploadData.file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadData.file.name} ({(uploadData.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-category">Target Role Category *</Label>
              <Select 
                value={uploadData.role_category} 
                onValueChange={(value) => setUploadData(prev => ({ ...prev, role_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role category" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadData({ file: null, role_category: '' });
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !uploadData.file || !uploadData.role_category}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CV
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}