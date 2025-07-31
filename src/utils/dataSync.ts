// Data synchronization service using GitHub Gists
export interface SyncData {
  profile: string | null;
  applications: string | null;
  cvs: string | null;
  interviews: string | null;
  emailTemplates: string | null;
  lastSyncTime: number;
  user: string;
}

export interface GitHubConfig {
  token: string;
  gistId?: string;
}

class DataSyncService {
  private config: GitHubConfig | null = null;
  private readonly GIST_FILENAME = 'internaide-data.json';
  private readonly STORAGE_KEY = 'internaide_sync_config';

  constructor() {
    this.loadConfig();
  }

  // Initialize sync with GitHub token
  init(token: string, gistId?: string): void {
    this.config = { token, gistId };
    this.saveConfig();
  }

  // Load saved config from localStorage
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  // Save config to localStorage
  private saveConfig(): void {
    if (this.config) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
      } catch (error) {
        console.error('Failed to save sync config:', error);
      }
    }
  }

  // Check if sync is configured
  isConfigured(): boolean {
    return this.config !== null && this.config.token !== '';
  }

  // Get current user data from localStorage
  private getCurrentUserData(user: string): SyncData {
    return {
      profile: localStorage.getItem(`internaide_profile_${user}`),
      applications: localStorage.getItem(`internaide_applications_${user}`),
      cvs: localStorage.getItem(`internaide_cvs_${user}`),
      interviews: localStorage.getItem(`internaide_interviews_${user}`),
      emailTemplates: localStorage.getItem(`internaide_email_templates_${user}`),
      lastSyncTime: Date.now(),
      user
    };
  }

  // Apply synced data to localStorage
  private applyUserData(data: SyncData): void {
    const { user } = data;
    try {
      if (data.profile) localStorage.setItem(`internaide_profile_${user}`, data.profile);
      if (data.applications) localStorage.setItem(`internaide_applications_${user}`, data.applications);
      if (data.cvs) localStorage.setItem(`internaide_cvs_${user}`, data.cvs);
      if (data.interviews) localStorage.setItem(`internaide_interviews_${user}`, data.interviews);
      if (data.emailTemplates) localStorage.setItem(`internaide_email_templates_${user}`, data.emailTemplates);
      
      // Store last sync time
      localStorage.setItem(`internaide_last_sync_${user}`, data.lastSyncTime.toString());
    } catch (error) {
      console.error('Failed to apply user data:', error);
      throw error;
    }
  }

  // Create a new gist with user data
  async createGist(user: string): Promise<string> {
    if (!this.config) throw new Error('Sync not configured');

    const userData = this.getCurrentUserData(user);
    
    const gistData = {
      description: 'InternAIde Data Backup',
      public: false,
      files: {
        [this.GIST_FILENAME]: {
          content: JSON.stringify(userData, null, 2)
        }
      }
    };

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(gistData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      this.config.gistId = result.id;
      this.saveConfig();
      
      return result.id;
    } catch (error) {
      console.error('Failed to create gist:', error);
      throw error;
    }
  }

  // Update existing gist with current data
  async uploadData(user: string): Promise<void> {
    if (!this.config) throw new Error('Sync not configured');

    let gistId = this.config.gistId;
    
    // Create new gist if none exists
    if (!gistId) {
      gistId = await this.createGist(user);
      return;
    }

    const userData = this.getCurrentUserData(user);
    
    const updateData = {
      files: {
        [this.GIST_FILENAME]: {
          content: JSON.stringify(userData, null, 2)
        }
      }
    };

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Gist not found, create a new one
          await this.createGist(user);
          return;
        }
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to upload data:', error);
      throw error;
    }
  }

  // Download data from gist
  async downloadData(user: string): Promise<SyncData> {
    if (!this.config || !this.config.gistId) {
      throw new Error('Sync not configured or no gist ID');
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${this.config.gistId}`, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      const gist = await response.json();
      const fileContent = gist.files[this.GIST_FILENAME]?.content;
      
      if (!fileContent) {
        throw new Error('No data found in gist');
      }

      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to download data:', error);
      throw error;
    }
  }

  // Full sync: download remote data and merge with local
  async syncData(user: string, strategy: 'merge' | 'overwrite_local' | 'overwrite_remote' = 'merge'): Promise<void> {
    if (!this.config) throw new Error('Sync not configured');

    try {
      const localData = this.getCurrentUserData(user);
      let remoteData: SyncData;

      try {
        remoteData = await this.downloadData(user);
      } catch (error) {
        // If remote data doesn't exist, upload local data
        if (error instanceof Error && error.message.includes('404')) {
          await this.uploadData(user);
          return;
        }
        throw error;
      }

      // Apply sync strategy
      switch (strategy) {
        case 'overwrite_local':
          this.applyUserData(remoteData);
          break;
        
        case 'overwrite_remote':
          await this.uploadData(user);
          break;
        
        case 'merge':
        default:
          // Use last sync time to determine which data is newer
          const localSyncTime = parseInt(localStorage.getItem(`internaide_last_sync_${user}`) || '0');
          const remoteSyncTime = remoteData.lastSyncTime || 0;
          
          if (remoteSyncTime > localSyncTime) {
            // Remote is newer, apply remote data
            this.applyUserData(remoteData);
          } else {
            // Local is newer or same, upload local data
            await this.uploadData(user);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  }

  // Get last sync time for user
  getLastSyncTime(user: string): Date | null {
    const timestamp = localStorage.getItem(`internaide_last_sync_${user}`);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  // Clear sync configuration
  clearConfig(): void {
    this.config = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Test connection to GitHub API
  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();