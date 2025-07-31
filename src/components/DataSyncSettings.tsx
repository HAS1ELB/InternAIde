import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cloud, CloudOff, Upload, Download, Settings, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { dataSyncService } from '@/utils/dataSync';

interface DataSyncSettingsProps {
  user: string;
  trigger?: React.ReactNode;
}

export default function DataSyncSettings({ user, trigger }: DataSyncSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStrategy, setSyncStrategy] = useState<'merge' | 'overwrite_local' | 'overwrite_remote'>('merge');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    setIsConfigured(dataSyncService.isConfigured());
    setLastSyncTime(dataSyncService.getLastSyncTime(user));
  }, [user]);

  const handleConnect = async () => {
    if (!token.trim()) {
      setStatus({ type: 'error', message: 'Please enter a GitHub token' });
      return;
    }

    setIsConnecting(true);
    setStatus(null);

    try {
      dataSyncService.init(token);
      
      // Test connection
      const isValid = await dataSyncService.testConnection();
      if (!isValid) {
        throw new Error('Invalid GitHub token or no internet connection');
      }

      setIsConfigured(true);
      setStatus({ type: 'success', message: 'Successfully connected to GitHub!' });
      setToken(''); // Clear token from UI for security
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to connect to GitHub' 
      });
      dataSyncService.clearConfig();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUpload = async () => {
    setIsSyncing(true);
    setStatus(null);

    try {
      await dataSyncService.uploadData(user);
      setLastSyncTime(new Date());
      setStatus({ type: 'success', message: 'Data successfully uploaded to GitHub!' });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to upload data' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    setIsSyncing(true);
    setStatus(null);

    try {
      const data = await dataSyncService.downloadData(user);
      
      // Show preview of what will be downloaded
      const dataPreview = {
        profile: data.profile ? 'Yes' : 'No',
        applications: data.applications ? JSON.parse(data.applications).length : 0,
        cvs: data.cvs ? JSON.parse(data.cvs).length : 0,
        interviews: data.interviews ? JSON.parse(data.interviews).length : 0,
        lastSync: new Date(data.lastSyncTime).toLocaleString()
      };

      const confirmDownload = window.confirm(
        `Found remote data from ${dataPreview.lastSync}:\n` +
        `- Profile: ${dataPreview.profile}\n` +
        `- Applications: ${dataPreview.applications}\n` +
        `- CVs: ${dataPreview.cvs}\n` +
        `- Interviews: ${dataPreview.interviews}\n\n` +
        'This will overwrite your local data. Continue?'
      );

      if (confirmDownload) {
        await dataSyncService.syncData(user, 'overwrite_local');
        setLastSyncTime(new Date());
        setStatus({ type: 'success', message: 'Data successfully downloaded from GitHub!' });
        
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to download data' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus(null);

    try {
      await dataSyncService.syncData(user, syncStrategy);
      setLastSyncTime(new Date());
      setStatus({ type: 'success', message: 'Data successfully synchronized!' });
      
      if (syncStrategy === 'overwrite_local') {
        // Refresh the page to show updated data
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to sync data' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    const confirm = window.confirm('Are you sure you want to disconnect from GitHub? This will remove your sync configuration.');
    if (confirm) {
      dataSyncService.clearConfig();
      setIsConfigured(false);
      setLastSyncTime(null);
      setStatus({ type: 'info', message: 'Disconnected from GitHub' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Data Sync
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Data Synchronization
          </DialogTitle>
          <DialogDescription>
            Sync your InternAIde data across devices using GitHub Gists
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConfigured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Connected to GitHub</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not connected</span>
                </>
              )}
            </div>
            {lastSyncTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last sync: {lastSyncTime.toLocaleString()}
              </div>
            )}
          </div>

          {/* Connection Setup */}
          {!isConfigured && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect to GitHub</CardTitle>
                <CardDescription>
                  Enter your GitHub personal access token to enable data synchronization.
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Create a token here →
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-token">GitHub Token</Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token needs 'gist' scope to create and manage private gists
                  </p>
                </div>
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting || !token.trim()}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Connect to GitHub
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sync Controls */}
          {isConfigured && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Sync Controls
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage your data synchronization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sync Strategy</Label>
                  <Select value={syncStrategy} onValueChange={(value: any) => setSyncStrategy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">Smart Merge (recommended)</SelectItem>
                      <SelectItem value="overwrite_local">Download & Overwrite Local</SelectItem>
                      <SelectItem value="overwrite_remote">Upload & Overwrite Remote</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {syncStrategy === 'merge' && 'Automatically choose newer data based on last sync time'}
                    {syncStrategy === 'overwrite_local' && 'Replace all local data with remote data'}
                    {syncStrategy === 'overwrite_remote' && 'Replace all remote data with local data'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={handleUpload} 
                    disabled={isSyncing}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button 
                    onClick={handleDownload} 
                    disabled={isSyncing}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Sync
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Messages */}
          {status && (
            <Alert className={status.type === 'error' ? 'border-destructive' : status.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
              {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {status.type === 'info' && <Cloud className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {/* Help */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-2">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your data is stored in a private GitHub Gist</li>
                <li>• Only you can access your data with your GitHub token</li>
                <li>• Data includes profile, applications, CVs, and interviews</li>
                <li>• Use the same token on other devices to sync</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}