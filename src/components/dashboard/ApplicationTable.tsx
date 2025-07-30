import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Edit, Trash2, ExternalLink, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Application, CV } from './Dashboard';

interface ApplicationTableProps {
  applications: Application[];
  cvs: CV[];
  onEdit: (application: Application) => void;
  onDelete: (id: number) => void;
  getStatusIcon: (status: Application['status']) => React.ReactNode;
  getStatusColor: (status: Application['status']) => string;
}

export function ApplicationTable({ 
  applications, 
  cvs, 
  onEdit, 
  onDelete, 
  getStatusIcon, 
  getStatusColor 
}: ApplicationTableProps) {
  
  const getCVName = (cv_id?: number) => {
    const cv = cvs.find(c => c.id === cv_id);
    return cv ? cv.filename : 'No CV selected';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-sm">
          <div className="bg-muted rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Trash2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your internship applications by adding your first one.
          </p>
          <Button size="sm">Add Your First Application</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>CV Used</TableHead>
            <TableHead>Recruiter</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{application.company_name}</span>
                  {application.job_url && (
                    <a 
                      href={application.job_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Job
                    </a>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="max-w-[200px]">
                  <p className="font-medium truncate">{application.role_title}</p>
                  {application.job_description && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {application.job_description.substring(0, 50)}...
                    </p>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={`${getStatusColor(application.status)} flex items-center gap-1 w-fit`}
                >
                  {getStatusIcon(application.status)}
                  {application.status}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {application.cv_id ? (
                    <span className="text-muted-foreground">{getCVName(application.cv_id)}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No CV</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {application.recruiter_name && (
                    <p className="font-medium">{application.recruiter_name}</p>
                  )}
                  {application.recruiter_email && (
                    <p className="text-muted-foreground text-xs">{application.recruiter_email}</p>
                  )}
                  {application.recruiter_linkedin && (
                    <a 
                      href={application.recruiter_linkedin}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  {!application.recruiter_name && !application.recruiter_email && !application.recruiter_linkedin && (
                    <span className="text-muted-foreground italic text-xs">No contact</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                {application.submission_date ? 
                  formatDate(application.submission_date) : 
                  formatDate(application.created_at)
                }
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(application)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {application.cover_letter && (
                      <DropdownMenuItem 
                        onClick={() => {
                          const blob = new Blob([application.cover_letter!], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${application.company_name}_cover_letter.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Cover Letter
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onDelete(application.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}