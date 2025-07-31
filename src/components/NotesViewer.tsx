import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText } from "lucide-react";

interface NotesViewerProps {
  notes: string;
  companyName: string;
  position: string;
}

export default function NotesViewer({ notes, companyName, position }: NotesViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert HTML to plain text for length checking
  const plainTextNotes = notes?.replace(/<[^>]*>/g, '').trim() || '';
  
  if (!plainTextNotes) {
    return null;
  }

  const hasNotes = plainTextNotes.length > 0;
  const isLongNotes = plainTextNotes.length > 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <MessageSquare className="h-3 w-3 mr-1" />
          <Badge variant="secondary" className="text-xs">
            {isLongNotes ? `${plainTextNotes.slice(0, 20)}...` : plainTextNotes.slice(0, 30)}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes: {companyName} - {position}
          </DialogTitle>
          <DialogDescription>
            Application notes and additional details
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: notes }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}