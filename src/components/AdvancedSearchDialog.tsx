import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Settings, Zap, Users, FileText, Building2, Calendar, Link, RotateCcw } from 'lucide-react';
import { SearchOptions, searchPresets } from '@/utils/advancedSearch';

interface AdvancedSearchDialogProps {
  onSearch: (options: SearchOptions) => void;
  currentQuery: string;
  searchStats?: {
    totalCount: number;
    matchCount: number;
    filterRate: number;
    query: string;
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AdvancedSearchDialog({
  onSearch,
  currentQuery,
  searchStats,
  isOpen,
  onOpenChange
}: AdvancedSearchDialogProps) {
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: currentQuery,
    includeBasicFields: true,
    includeNotes: true,
    includeCompanyResearch: true,
    includeInterviews: true,
    includeJobDescription: true,
    includeDates: false,
    includeUrls: false,
    caseSensitive: false,
    exactMatch: false,
    searchInHtml: true
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('comprehensive');

  // Update query when external query changes
  useEffect(() => {
    setSearchOptions(prev => ({ ...prev, query: currentQuery }));
  }, [currentQuery]);

  const handlePresetChange = (presetName: string) => {
    if (presetName in searchPresets) {
      setSelectedPreset(presetName);
      setSearchOptions(prev => ({
        ...searchPresets[presetName as keyof typeof searchPresets],
        query: prev.query // Keep the current query
      }));
    }
  };

  const handleOptionChange = (key: keyof SearchOptions, value: any) => {
    setSearchOptions(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('custom'); // Switch to custom when manually changing options
  };

  const handleSearch = () => {
    onSearch(searchOptions);
  };

  const resetToDefaults = () => {
    setSearchOptions({
      query: '',
      includeBasicFields: true,
      includeNotes: true,
      includeCompanyResearch: true,
      includeInterviews: true,
      includeJobDescription: true,
      includeDates: false,
      includeUrls: false,
      caseSensitive: false,
      exactMatch: false,
      searchInHtml: true
    });
    setSelectedPreset('comprehensive');
  };

  const getActiveOptionsCount = () => {
    return Object.entries(searchOptions)
      .filter(([key, value]) => key.startsWith('include') && value === true)
      .length;
  };

  const getPresetDescription = (presetName: string) => {
    switch (presetName) {
      case 'basic':
        return 'Search only in company, position, recruiter, and basic fields';
      case 'comprehensive':
        return 'Search across all fields including notes, research, and interviews';
      case 'contentOnly':
        return 'Search in notes, research, interviews, and job descriptions only';
      case 'peopleAndContacts':
        return 'Search for people names, recruiters, and interviewers';
      default:
        return 'Custom search configuration';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search Options
          </DialogTitle>
          <DialogDescription>
            Configure comprehensive search across all your application data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Input
              id="search-query"
              placeholder="Enter search terms..."
              value={searchOptions.query}
              onChange={(e) => handleOptionChange('query', e.target.value)}
              className="text-lg"
            />
            {searchStats && searchStats.query && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Found {searchStats.matchCount} of {searchStats.totalCount} applications</span>
                <Badge variant="outline" className="text-xs">
                  {searchStats.filterRate.toFixed(1)}% match rate
                </Badge>
              </div>
            )}
          </div>

          <Tabs value={selectedPreset} onValueChange={handlePresetChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="comprehensive" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                All
              </TabsTrigger>
              <TabsTrigger value="basic" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="contentOnly" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Content
              </TabsTrigger>
              <TabsTrigger value="peopleAndContacts" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                People
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Custom
              </TabsTrigger>
            </TabsList>

            {/* Preset Descriptions */}
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                {getPresetDescription(selectedPreset)}
              </p>
            </div>

            {/* Custom Configuration */}
            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Areas</CardTitle>
                  <CardDescription>
                    Choose which data fields to include in your search
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Basic Fields</Label>
                        <p className="text-xs text-muted-foreground">Company, position, recruiter info</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeBasicFields}
                        onCheckedChange={(checked) => handleOptionChange('includeBasicFields', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-xs text-muted-foreground">Application notes and comments</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeNotes}
                        onCheckedChange={(checked) => handleOptionChange('includeNotes', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Company Research</Label>
                        <p className="text-xs text-muted-foreground">Culture, benefits, industry data</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeCompanyResearch}
                        onCheckedChange={(checked) => handleOptionChange('includeCompanyResearch', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Interviews</Label>
                        <p className="text-xs text-muted-foreground">Interview details and notes</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeInterviews}
                        onCheckedChange={(checked) => handleOptionChange('includeInterviews', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Job Descriptions</Label>
                        <p className="text-xs text-muted-foreground">Full job posting content</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeJobDescription}
                        onCheckedChange={(checked) => handleOptionChange('includeJobDescription', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Dates</Label>
                        <p className="text-xs text-muted-foreground">Application and deadline dates</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeDates}
                        onCheckedChange={(checked) => handleOptionChange('includeDates', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">URLs</Label>
                        <p className="text-xs text-muted-foreground">Job links and company websites</p>
                      </div>
                      <Switch
                        checked={searchOptions.includeUrls}
                        onCheckedChange={(checked) => handleOptionChange('includeUrls', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Case Sensitive</Label>
                        <p className="text-xs text-muted-foreground">Match exact case</p>
                      </div>
                      <Switch
                        checked={searchOptions.caseSensitive}
                        onCheckedChange={(checked) => handleOptionChange('caseSensitive', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Exact Match</Label>
                        <p className="text-xs text-muted-foreground">Match complete words only</p>
                      </div>
                      <Switch
                        checked={searchOptions.exactMatch}
                        onCheckedChange={(checked) => handleOptionChange('exactMatch', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Search in HTML</Label>
                        <p className="text-xs text-muted-foreground">Include rich text formatting</p>
                      </div>
                      <Switch
                        checked={searchOptions.searchInHtml}
                        onCheckedChange={(checked) => handleOptionChange('searchInHtml', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preset Content (show summary for non-custom presets) */}
            {selectedPreset !== 'custom' && (
              <TabsContent value={selectedPreset} className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Search Configuration</h4>
                        <p className="text-sm text-muted-foreground">
                          {getActiveOptionsCount()} search areas enabled
                        </p>
                      </div>
                      <Badge variant="outline">
                        {selectedPreset} preset
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {searchOptions.includeBasicFields && <Badge variant="secondary">Basic Fields</Badge>}
                        {searchOptions.includeNotes && <Badge variant="secondary">Notes</Badge>}
                        {searchOptions.includeCompanyResearch && <Badge variant="secondary">Company Research</Badge>}
                        {searchOptions.includeInterviews && <Badge variant="secondary">Interviews</Badge>}
                        {searchOptions.includeJobDescription && <Badge variant="secondary">Job Descriptions</Badge>}
                        {searchOptions.includeDates && <Badge variant="secondary">Dates</Badge>}
                        {searchOptions.includeUrls && <Badge variant="secondary">URLs</Badge>}
                      </div>
                      
                      {(searchOptions.caseSensitive || searchOptions.exactMatch || searchOptions.searchInHtml) && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {searchOptions.caseSensitive && <Badge variant="outline">Case Sensitive</Badge>}
                          {searchOptions.exactMatch && <Badge variant="outline">Exact Match</Badge>}
                          {searchOptions.searchInHtml && <Badge variant="outline">HTML Search</Badge>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSearch}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}