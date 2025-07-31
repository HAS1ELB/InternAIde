import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Github, Linkedin, Globe, Mail, Phone, Save, Plus, X } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  customLinks: { name: string; url: string }[];
}

interface ProfileManagerProps {
  user: string;
}

export default function ProfileManager({ user }: ProfileManagerProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: user,
    phone: '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: '',
    customLinks: []
  });

  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load profile from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem(`internaide_profile_${user}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save to localStorage (in real app, this would be an API call)
    localStorage.setItem(`internaide_profile_${user}`, JSON.stringify(profile));
    
    setIsSaving(false);
  };

  const addCustomLink = () => {
    if (newLinkName && newLinkUrl) {
      setProfile(prev => ({
        ...prev,
        customLinks: [...prev.customLinks, { name: newLinkName, url: newLinkUrl }]
      }));
      setNewLinkName('');
      setNewLinkUrl('');
    }
  };

  const removeCustomLink = (index: number) => {
    setProfile(prev => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
          <p className="text-muted-foreground">
            Manage your personal information and external links
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your basic profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed after registration
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Write a brief professional summary about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* External Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              External Profiles
            </CardTitle>
            <CardDescription>
              Add links to your professional profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Profile
              </Label>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={profile.github}
                onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn Profile
              </Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/username"
                value={profile.linkedin}
                onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portfolio" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Portfolio Website
              </Label>
              <Input
                id="portfolio"
                placeholder="https://yourportfolio.com"
                value={profile.portfolio}
                onChange={(e) => setProfile(prev => ({ ...prev, portfolio: e.target.value }))}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Custom Links</Label>
              
              {/* Existing custom links */}
              {profile.customLinks.length > 0 && (
                <div className="space-y-2">
                  {profile.customLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                      <Badge variant="secondary">{link.name}</Badge>
                      <span className="text-sm text-muted-foreground flex-1 truncate">
                        {link.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomLink(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new custom link */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Link name"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={addCustomLink}
                    disabled={!newLinkName || !newLinkUrl}
                    size="sm"
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add other professional links (Behance, Dribbble, etc.)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Preview</CardTitle>
          <CardDescription>
            How your profile information will appear in cover letters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {profile.name || 'Your Name'}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {profile.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {profile.phone}
                    </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-sm mt-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Links preview */}
            {(profile.github || profile.linkedin || profile.portfolio || profile.customLinks.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Professional Links</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.github && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Github className="h-3 w-3" />
                      GitHub
                    </Badge>
                  )}
                  {profile.linkedin && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </Badge>
                  )}
                  {profile.portfolio && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Portfolio
                    </Badge>
                  )}
                  {profile.customLinks.map((link, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {link.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}