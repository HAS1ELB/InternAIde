import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Download, Trash2, Plus, Calendar, Tag, Eye, Edit2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface CV {
  id: string;
  name: string;
  role: string;
  uploadDate: string;
  fileSize: string;
  fileType: string;
  fileData?: string;
}

interface CVManagerProps {
  user: string;
}

const roleCategories = [
  'Data Scientist',
  'ML Engineer', 
  'Software Engineer',
  'Generative AI',
  'Product Manager',
  'UX/UI Designer',
  'Business Analyst',
  'Research Intern',
  'Marketing Intern',
  'Finance Intern',
  'Other'
];

export default function CVManager({ user }: CVManagerProps) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadRole, setUploadRole] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewCV, setPreviewCV] = useState<CV | null>(null);
  const [editingCV, setEditingCV] = useState<CV | null>(null);
  const [editName, setEditName] = useState('');
  
  const { showError, showSuccess, showWarning } = useNotifications();

  useEffect(() => {
    const savedCvs = localStorage.getItem(`internaide_cvs_${user}`);
    if (savedCvs) {
      setCvs(JSON.parse(savedCvs));
    }
  }, [user]);

  const saveCvs = (newCvs: CV[]) => {
    setCvs(newCvs);
    localStorage.setItem(`internaide_cvs_${user}`, JSON.stringify(newCvs));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        showError('Invalid File Type', 'Please select a PDF or Word document');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadName || !uploadRole) {
      showWarning('Missing Information', 'Please fill in all fields and select a file');
      return;
    }

    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result as string;
      
      const newCV: CV = {
        id: Date.now().toString(),
        name: uploadName,
        role: uploadRole,
        uploadDate: new Date().toISOString(),
        fileSize: formatFileSize(selectedFile.size),
        fileType: selectedFile.type,
        fileData: fileData
      };

      const updatedCvs = [...cvs, newCV];
      saveCvs(updatedCvs);
      
      showSuccess('CV Uploaded Successfully', `${newCV.name} has been added to your CV collection`);

      setUploadName('');
      setUploadRole('');
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      setIsUploading(false);

      const fileInput = document.getElementById('cv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this CV?')) {
      const updatedCvs = cvs.filter(cv => cv.id !== id);
      saveCvs(updatedCvs);
    }
  };

  const handleDownload = (cv: CV) => {
    if (cv.fileData) {
      const link = document.createElement('a');
      link.href = cv.fileData;
      link.download = `${cv.name}.${cv.fileType.includes('pdf') ? 'pdf' : 'docx'}`;
      link.click();
    }
  };

  const handlePreview = (cv: CV) => {
    setPreviewCV(cv);
  };

  const handleEdit = (cv: CV) => {
    setEditingCV(cv);
    setEditName(cv.name);
  };

  const handleSaveEdit = () => {
    if (!editingCV || !editName.trim()) return;
    
    const updatedCvs = cvs.map(cv => 
      cv.id === editingCV.id 
        ? { ...cv, name: editName.trim() }
        : cv
    );
    saveCvs(updatedCvs);
    setEditingCV(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingCV(null);
    setEditName('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      'Data Scientist': 'bg-blue-100 text-blue-800',
      'ML Engineer': 'bg-purple-100 text-purple-800',
      'Software Engineer': 'bg-green-100 text-green-800',
      'Generative AI': 'bg-pink-100 text-pink-800',
      'Product Manager': 'bg-orange-100 text-orange-800',
      'UX/UI Designer': 'bg-cyan-100 text-cyan-800',
      'Business Analyst': 'bg-yellow-100 text-yellow-800',
      'Research Intern': 'bg-indigo-100 text-indigo-800',
      'Marketing Intern': 'bg-red-100 text-red-800',
      'Finance Intern': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors['Other'];
  };

  const groupedCvs = cvs.reduce((acc, cv) => {
    if (!acc[cv.role]) {
      acc[cv.role] = [];
    }
    acc[cv.role].push(cv);
    return acc;
  }, {} as { [key: string]: CV[] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CV Management</h2>
          <p className="text-muted-foreground">
            Upload and organize your CVs by target role
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload CV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New CV</DialogTitle>
              <DialogDescription>
                Add a new CV to your collection and categorize it by target role
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv-name">CV Name</Label>
                <Input
                  id="cv-name"
                  placeholder="e.g., Data Science CV"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cv-role">Target Role</Label>
                <Select value={uploadRole} onValueChange={setUploadRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role category" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleCategories.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cv-file">CV File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="cv-file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Label
                    htmlFor="cv-file"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : 'Click to upload CV'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF or Word documents only (max 10MB)
                    </span>
                  </Label>
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    File size: {formatFileSize(selectedFile.size)}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadName || !uploadRole || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload CV'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CVs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvs.length}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(groupedCvs).length} different roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Recent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cvs.length > 0 ? formatDate(cvs[cvs.length - 1].uploadDate) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last upload date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Role</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(groupedCvs).length > 0 
                ? Object.entries(groupedCvs).sort(([,a], [,b]) => b.length - a.length)[0][0]
                : '-'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most used category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CV List */}
      {Object.keys(groupedCvs).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedCvs).map(([role, roleCvs]) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={getRoleColor(role)}>
                    {role}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({roleCvs.length} CV{roleCvs.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roleCvs.map((cv) => (
                    <Card key={cv.id} className="border border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{cv.name}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div>Uploaded: {formatDate(cv.uploadDate)}</div>
                          <div>Size: {cv.fileSize}</div>
                          <div>Type: {cv.fileType.includes('pdf') ? 'PDF' : 'Word'}</div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(cv)}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(cv)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cv)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cv.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No CVs uploaded yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first CV to get started with tracking your applications
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First CV
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {previewCV && (
        <Dialog open={!!previewCV} onOpenChange={() => setPreviewCV(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview: {previewCV.name}
              </DialogTitle>
              <DialogDescription>
                {previewCV.fileType.includes('pdf') ? 'PDF Document' : 'Word Document'} • {previewCV.fileSize}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {previewCV.fileType.includes('pdf') ? (
                <iframe
                  src={previewCV.fileData}
                  className="w-full h-[60vh] border rounded-lg"
                  title={`Preview of ${previewCV.name}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] border rounded-lg bg-muted/20">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Preview Not Available</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Word documents cannot be previewed in the browser.<br/>
                    Please download the file to view it.
                  </p>
                  <Button onClick={() => handleDownload(previewCV)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewCV(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownload(previewCV)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingCV && (
        <Dialog open={!!editingCV} onOpenChange={() => setEditingCV(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Rename CV
              </DialogTitle>
              <DialogDescription>
                Change the name of your CV
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">CV Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter new CV name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div>Role: <Badge className={getRoleColor(editingCV.role)}>{editingCV.role}</Badge></div>
                <div>Type: {editingCV.fileType.includes('pdf') ? 'PDF' : 'Word'}</div>
                <div>Size: {editingCV.fileSize}</div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editName.trim() || editName.trim() === editingCV.name}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}