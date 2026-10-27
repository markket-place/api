/**
 * Simple startup status tracker
 * This helps with deployment platforms like Laravel Cloud that perform
 * health checks during startup
 */

class StartupStatus {
  private _isReady: boolean = false;
  private _startTime: number;

  constructor() {
    this._startTime = Date.now();
  }

  markAsReady(): void {
    this._isReady = true;
    console.log('[STARTUP_STATUS] Application marked as ready');
  }

  isReady(): boolean {
    return this._isReady;
  }

  getUptime(): number {
    return (Date.now() - this._startTime) / 1000;
  }

  getStatus(): { ready: boolean; uptime: number; } {
    return {
      ready: this._isReady,
      uptime: this.getUptime()
    };
  }
}

// Export singleton instance
export const startupStatus = new StartupStatus();

// Also attach to global for easy access
(global as any).startupStatus = startupStatus;