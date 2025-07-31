// Advanced search utilities for comprehensive application data search

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

export interface SearchOptions {
  query: string;
  includeBasicFields?: boolean;
  includeNotes?: boolean;
  includeCompanyResearch?: boolean;
  includeInterviews?: boolean;
  includeJobDescription?: boolean;
  includeDates?: boolean;
  includeUrls?: boolean;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  searchInHtml?: boolean; // For rich text notes
}

// Helper function to strip HTML tags from rich text content
function stripHtml(html: string): string {
  if (!html) return '';
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

// Helper function to safely convert to string and normalize
function normalizeString(value: any, caseSensitive: boolean = false): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return caseSensitive ? str : str.toLowerCase();
}

// Helper function to check if a string matches the query
function matchesQuery(
  text: string, 
  query: string, 
  exactMatch: boolean = false, 
  caseSensitive: boolean = false
): boolean {
  if (!text || !query) return false;
  
  const normalizedText = normalizeString(text, caseSensitive);
  const normalizedQuery = normalizeString(query, caseSensitive);
  
  if (exactMatch) {
    return normalizedText === normalizedQuery;
  } else {
    return normalizedText.includes(normalizedQuery);
  }
}

// Search through basic application fields
function searchBasicFields(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeBasicFields) return false;
  
  const basicFields = [
    app.companyName,
    app.position,
    app.status,
    app.location,
    app.recruiterName,
    app.recruiterEmail,
    app.salary,
    app.cvUsed
  ];
  
  return basicFields.some(field => 
    field && matchesQuery(field, query, options.exactMatch, options.caseSensitive)
  );
}

// Search through application notes (with HTML support)
function searchNotes(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeNotes || !app.notes) return false;
  
  let notesText = app.notes;
  if (options.searchInHtml) {
    // Search in both HTML and plain text versions
    const plainText = stripHtml(app.notes);
    return (
      matchesQuery(app.notes, query, options.exactMatch, options.caseSensitive) ||
      matchesQuery(plainText, query, options.exactMatch, options.caseSensitive)
    );
  } else {
    // Only search in plain text version
    notesText = stripHtml(app.notes);
  }
  
  return matchesQuery(notesText, query, options.exactMatch, options.caseSensitive);
}

// Search through company research data
function searchCompanyResearch(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeCompanyResearch || !app.companyResearch) return false;
  
  const research = app.companyResearch;
  const researchFields = [
    research.salaryRange,
    research.companySize,
    research.industry,
    research.culture,
    research.benefits,
    research.notes
  ];
  
  // Include URLs if enabled
  if (options.includeUrls) {
    researchFields.push(
      research.glassdoorUrl,
      research.companyWebsite,
      research.linkedinUrl
    );
  }
  
  return researchFields.some(field => 
    field && matchesQuery(field, query, options.exactMatch, options.caseSensitive)
  );
}

// Search through interview data
function searchInterviews(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeInterviews || !app.interviews || app.interviews.length === 0) return false;
  
  return app.interviews.some(interview => {
    const interviewFields = [
      interview.type,
      interview.interviewer,
      interview.interviewerEmail,
      interview.location,
      interview.outcome,
      interview.notes
    ];
    
    // Include URLs if enabled
    if (options.includeUrls) {
      interviewFields.push(interview.meetingLink);
    }
    
    // Include dates if enabled
    if (options.includeDates) {
      interviewFields.push(interview.date, interview.time);
    }
    
    return interviewFields.some(field => 
      field && matchesQuery(field, query, options.exactMatch, options.caseSensitive)
    );
  });
}

// Search through job description
function searchJobDescription(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeJobDescription) return false;
  return matchesQuery(app.jobDescription, query, options.exactMatch, options.caseSensitive);
}

// Search through dates
function searchDates(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeDates) return false;
  
  const dateFields = [
    app.applicationDate,
    app.deadline
  ];
  
  return dateFields.some(field => 
    field && matchesQuery(field, query, options.exactMatch, options.caseSensitive)
  );
}

// Search through URLs
function searchUrls(app: Application, query: string, options: SearchOptions): boolean {
  if (!options.includeUrls) return false;
  
  if (!app.jobUrl) return false;
  return matchesQuery(app.jobUrl, query, options.exactMatch, options.caseSensitive);
}

// Main advanced search function
export function advancedSearch(
  applications: Application[], 
  searchOptions: SearchOptions
): Application[] {
  const { query } = searchOptions;
  
  if (!query || !query.trim()) {
    return applications;
  }
  
  const trimmedQuery = query.trim();
  
  return applications.filter(app => {
    // Check each search category
    const matchResults = [
      searchBasicFields(app, trimmedQuery, searchOptions),
      searchNotes(app, trimmedQuery, searchOptions),
      searchCompanyResearch(app, trimmedQuery, searchOptions),
      searchInterviews(app, trimmedQuery, searchOptions),
      searchJobDescription(app, trimmedQuery, searchOptions),
      searchDates(app, trimmedQuery, searchOptions),
      searchUrls(app, trimmedQuery, searchOptions)
    ];
    
    // Return true if any category matches
    return matchResults.some(result => result);
  });
}

// Predefined search option presets
export const searchPresets = {
  basic: {
    includeBasicFields: true,
    includeNotes: false,
    includeCompanyResearch: false,
    includeInterviews: false,
    includeJobDescription: false,
    includeDates: false,
    includeUrls: false,
    caseSensitive: false,
    exactMatch: false,
    searchInHtml: false
  },
  
  comprehensive: {
    includeBasicFields: true,
    includeNotes: true,
    includeCompanyResearch: true,
    includeInterviews: true,
    includeJobDescription: true,
    includeDates: true,
    includeUrls: true,
    caseSensitive: false,
    exactMatch: false,
    searchInHtml: true
  },
  
  contentOnly: {
    includeBasicFields: false,
    includeNotes: true,
    includeCompanyResearch: true,
    includeInterviews: true,
    includeJobDescription: true,
    includeDates: false,
    includeUrls: false,
    caseSensitive: false,
    exactMatch: false,
    searchInHtml: true
  },
  
  peopleAndContacts: {
    includeBasicFields: true, // Includes recruiter info
    includeNotes: false,
    includeCompanyResearch: false,
    includeInterviews: true, // Includes interviewer info
    includeJobDescription: false,
    includeDates: false,
    includeUrls: false,
    caseSensitive: false,
    exactMatch: false,
    searchInHtml: false
  }
};

// Utility function to highlight search matches in text
export function highlightMatches(
  text: string, 
  query: string, 
  caseSensitive: boolean = false
): string {
  if (!text || !query) return text;
  
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
  
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

// Get search result statistics
export function getSearchStats(
  originalApplications: Application[],
  filteredApplications: Application[],
  query: string
): {
  totalCount: number;
  matchCount: number;
  filterRate: number;
  query: string;
} {
  return {
    totalCount: originalApplications.length,
    matchCount: filteredApplications.length,
    filterRate: originalApplications.length > 0 
      ? (filteredApplications.length / originalApplications.length) * 100 
      : 0,
    query
  };
}