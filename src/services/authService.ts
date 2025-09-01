interface ExternalAuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  permissions: string[];
}

class AuthService {
  private authData: ExternalAuthData | null = null;
  private authCallbacks: ((isAuthenticated: boolean) => void)[] = [];

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    // Listen for authentication messages from parent window
    window.addEventListener('message', (event) => {
      // Validate origin for security (replace with your actual domain)
      const allowedOrigins = [
        'https://your-main-site.com',
        'http://localhost:3000', // For development
        'http://localhost:5173', // For development
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Unauthorized origin:', event.origin);
        return;
      }

      if (event.data.type === 'AUTH_DATA') {
        this.handleAuthData(event.data.payload);
      } else if (event.data.type === 'AUTH_LOGOUT') {
        this.handleLogout();
      }
    });

    // Check for existing auth data in sessionStorage
    this.loadStoredAuth();

    // Request auth data from parent window if in iframe
    if (window.parent !== window) {
      this.requestAuthFromParent();
    }
  }

  private handleAuthData(authData: ExternalAuthData) {
    this.authData = authData;
    sessionStorage.setItem('external_auth', JSON.stringify(authData));
    this.notifyAuthCallbacks(true);
  }

  private handleLogout() {
    this.authData = null;
    sessionStorage.removeItem('external_auth');
    this.notifyAuthCallbacks(false);
    
    // Redirect to login page
    this.redirectToLogin();
  }

  private loadStoredAuth() {
    try {
      const stored = sessionStorage.getItem('external_auth');
      if (stored) {
        const authData = JSON.parse(stored);
        
        // Validate token expiration if present
        if (this.isTokenValid(authData)) {
          this.authData = authData;
        } else {
          sessionStorage.removeItem('external_auth');
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      sessionStorage.removeItem('external_auth');
    }
  }

  private isTokenValid(authData: ExternalAuthData): boolean {
    // Basic token validation - implement according to your token format
    if (!authData.token || !authData.user) return false;
    
    // Add token expiration check if your tokens have expiration
    // const tokenPayload = JSON.parse(atob(authData.token.split('.')[1]));
    // return tokenPayload.exp > Date.now() / 1000;
    
    return true;
  }

  private requestAuthFromParent() {
    // Request authentication data from parent window
    window.parent.postMessage({ type: 'REQUEST_AUTH' }, '*');
  }

  private notifyAuthCallbacks(isAuthenticated: boolean) {
    this.authCallbacks.forEach(callback => callback(isAuthenticated));
  }

  private redirectToLogin() {
    // Redirect to your main site's login page
    const loginUrl = 'https://your-main-site.com/login';
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${loginUrl}?return=${returnUrl}`;
  }

  // Public methods
  isAuthenticated(): boolean {
    return this.authData !== null;
  }

  getUser() {
    return this.authData?.user || null;
  }

  getToken(): string | null {
    return this.authData?.token || null;
  }

  hasPermission(permission: string): boolean {
    return this.authData?.permissions.includes(permission) || false;
  }

  onAuthChange(callback: (isAuthenticated: boolean) => void) {
    this.authCallbacks.push(callback);
    
    // Call immediately with current state
    callback(this.isAuthenticated());
    
    // Return unsubscribe function
    return () => {
      this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
    };
  }

  logout() {
    this.handleLogout();
  }

  // Method to be called by external site
  static authenticateFromExternal(authData: ExternalAuthData) {
    window.postMessage({ type: 'AUTH_DATA', payload: authData }, '*');
  }
}

export const authService = new AuthService();