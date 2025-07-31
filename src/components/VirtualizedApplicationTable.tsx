import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, FileText, Clock, ExternalLink, Edit, Trash2 } from "lucide-react";
import NotesViewer from './NotesViewer';

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

interface VirtualizedApplicationTableProps {
  applications: Application[];
  selectedApplications: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectApplication: (id: string, checked: boolean) => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  isAllSelected: boolean;
  height?: number;
}

const statusColors = {
  'To Submit': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Submitted': 'bg-blue-100 text-blue-800 border-blue-300',
  'Interviewing': 'bg-purple-100 text-purple-800 border-purple-300',
  'Offer Received': 'bg-green-100 text-green-800 border-green-300',
  'Rejected': 'bg-red-100 text-red-800 border-red-300',
  'Archived': 'bg-gray-100 text-gray-800 border-gray-300'
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

const formatDeadlineText = (deadline: string): string => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else {
    return `${diffDays} days left`;
  }
};

const getDeadlineStatus = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { color: 'bg-red-100 text-red-800 border-red-300', isOverdue: true };
  } else if (diffDays <= 3) {
    return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', isUpcoming: true };
  } else {
    return { color: 'bg-green-100 text-green-800 border-green-300', isUpcoming: false };
  }
};

interface RowProps {
  index: number;
  style: any;
  data: {
    applications: Application[];
    selectedApplications: Set<string>;
    onSelectApplication: (id: string, checked: boolean) => void;
    onEdit: (app: Application) => void;
    onDelete: (id: string) => void;
  };
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { applications, selectedApplications, onSelectApplication, onEdit, onDelete } = data;
  const app = applications[index];

  return (
    <div style={style} className="flex w-full">
      <TableRow className="flex w-full items-center border-b">
        {/* Checkbox */}
        <TableCell className="w-12 flex-shrink-0 flex items-center">
          <Checkbox
            checked={selectedApplications.has(app.id)}
            onCheckedChange={(checked) => onSelectApplication(app.id, checked as boolean)}
            aria-label={`Select ${app.position} at ${app.companyName}`}
          />
        </TableCell>
        
        {/* Company */}
        <TableCell className="w-48 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{app.companyName}</div>
              {app.recruiterName && (
                <div className="text-sm text-muted-foreground truncate">
                  {app.recruiterName}
                </div>
              )}
            </div>
          </div>
        </TableCell>
        
        {/* Position */}
        <TableCell className="w-48 flex-shrink-0">
          <div className="min-w-0">
            <div className="font-medium truncate">{app.position}</div>
            {app.salary && (
              <div className="text-sm text-muted-foreground truncate">
                {app.salary}
              </div>
            )}
          </div>
        </TableCell>
        
        {/* Status */}
        <TableCell className="w-32 flex-shrink-0">
          <Badge variant="outline" className={statusColors[app.status]}>
            {app.status}
          </Badge>
        </TableCell>
        
        {/* Location */}
        <TableCell className="w-40 flex-shrink-0">
          {app.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{app.location}</span>
            </div>
          )}
        </TableCell>
        
        {/* Applied Date */}
        <TableCell className="w-32 flex-shrink-0">
          <span className="text-sm">{formatDate(app.applicationDate)}</span>
        </TableCell>
        
        {/* CV Used / Deadline */}
        <TableCell className="w-48 flex-shrink-0">
          <div className="space-y-1">
            {app.cvUsed && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{app.cvUsed}</span>
              </div>
            )}
            {app.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <Badge variant="outline" className={`text-xs ${getDeadlineStatus(app.deadline)?.color || ''}`}>
                  {formatDeadlineText(app.deadline)}
                </Badge>
              </div>
            )}
          </div>
        </TableCell>
        
        {/* Actions */}
        <TableCell className="w-40 flex-shrink-0">
          <div className="flex items-center gap-1">
            {app.notes && (
              <NotesViewer 
                notes={app.notes}
                companyName={app.companyName}
                position={app.position}
              />
            )}
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
              onClick={() => onEdit(app)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(app.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </div>
  );
});

Row.displayName = 'VirtualizedRow';

export default function VirtualizedApplicationTable({
  applications,
  selectedApplications,
  onSelectAll,
  onSelectApplication,
  onEdit,
  onDelete,
  isAllSelected,
  height = 600
}: VirtualizedApplicationTableProps) {
  const itemData = {
    applications,
    selectedApplications,
    onSelectApplication,
    onEdit,
    onDelete
  };

  // Only use virtual scrolling for large lists (> 50 items)
  const useVirtualScrolling = applications.length > 50;

  if (!useVirtualScrolling) {
    // Render normal table for small lists
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader>
            <TableRow className="flex w-full">
              <TableHead className="w-12 flex-shrink-0">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all applications"
                />
              </TableHead>
              <TableHead className="w-48 flex-shrink-0">Company</TableHead>
              <TableHead className="w-48 flex-shrink-0">Position</TableHead>
              <TableHead className="w-32 flex-shrink-0">Status</TableHead>
              <TableHead className="w-40 flex-shrink-0">Location</TableHead>
              <TableHead className="w-32 flex-shrink-0">Applied Date</TableHead>
              <TableHead className="w-48 flex-shrink-0">CV Used / Deadline</TableHead>
              <TableHead className="w-40 flex-shrink-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app, index) => (
              <Row
                key={app.id}
                index={index}
                style={{}}
                data={itemData}
              />
            ))}
          </TableBody>
        </table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="flex w-full p-3">
          <div className="w-12 flex-shrink-0 flex items-center">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Select all applications"
            />
          </div>
          <div className="w-48 flex-shrink-0 font-medium">Company</div>
          <div className="w-48 flex-shrink-0 font-medium">Position</div>
          <div className="w-32 flex-shrink-0 font-medium">Status</div>
          <div className="w-40 flex-shrink-0 font-medium">Location</div>
          <div className="w-32 flex-shrink-0 font-medium">Applied Date</div>
          <div className="w-48 flex-shrink-0 font-medium">CV Used / Deadline</div>
          <div className="w-40 flex-shrink-0 font-medium">Actions</div>
        </div>
      </div>
      
      {/* Virtualized Body */}
      <List
        height={height}
        width="100%"
        itemCount={applications.length}
        itemSize={80} // Height of each row
        itemData={itemData}
        overscanCount={5} // Render 5 extra items outside viewport for smooth scrolling
      >
        {Row}
      </List>
      
      {/* Footer with count */}
      <div className="border-t bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        Showing {applications.length} application{applications.length !== 1 ? 's' : ''} (Virtual scrolling enabled for large lists)
      </div>
    </div>
  );
}