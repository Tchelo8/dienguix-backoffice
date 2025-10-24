
interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string;
  user_profile?: {
    id: number;
    address: string;
    photo?: string;
    city: string;
    birth_date: string;
    verified: boolean;
    gender: string;
    status: boolean;
    document_number: string;
    document_file: string;
    created_at: string;
    updated_at: string;
    document?: {
      id: number;
      name: string;
      type: string;
    };
  };
  country?: {
    id: number;
    name: string;
  };
  role?: {
    id: number;
    name: string;
  };
}

interface CachedData {
  data: UserProfile;
  timestamp: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
}

interface ProfileUpdates {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  gender?: string;
  birth_date?: string;
}

class UserProfileService {
  private readonly apiBaseUrl: string = '/api/user';
  private readonly cacheKey: string = 'user_profile';
  private readonly cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private readonly inactivityTimeout: number = 30 * 60 * 1000; // 30 minutes d'inactivité
  private readonly warningTimeout: number = 25 * 60 * 1000; // Avertissement à 25 minutes
  
  private inactivityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isWarningShown: boolean = false;
  private warningModal: HTMLElement | null = null;

  constructor() {
    this.initializeInactivityDetection();
    this.createWarningModal();
  }

  /**
   * Initialise la détection d'inactivité
   */
  private initializeInactivityDetection(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.resetInactivityTimer.bind(this), true);
    });

    // Démarre le timer initial
    this.resetInactivityTimer();

    // Écoute les changements de visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.resetInactivityTimer();
      }
    });
  }

  /**
   * Remet à zéro le timer d'inactivité
   */
  private resetInactivityTimer(): void {
    this.lastActivity = Date.now();
    this.isWarningShown = false;
    this.hideWarningModal();

    // Nettoie les timers existants
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Démarre le timer d'avertissement (25 minutes)
    this.warningTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.warningTimeout);

    // Démarre le timer de déconnexion (30 minutes)
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityLogout();
    }, this.inactivityTimeout);
  }

  /**
   * Crée la modale d'avertissement d'inactivité
   */
  private createWarningModal(): void {
    const modalHTML = `
      <div id="inactivity-warning-modal" class="inactivity-modal" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        justify-content: center;
        align-items: center;
      ">
        <div class="modal-content" style="
          background: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        ">
          <h3 style="color: #ff6b35; margin-bottom: 20px;">⚠️ Session bientôt expirée</h3>
          <p style="margin-bottom: 20px;">
            Votre session expirera dans <strong id="countdown-timer">5:00</strong> minutes d'inactivité.
          </p>
          <p style="margin-bottom: 30px; color: #666;">
            Cliquez sur "Rester connecté" pour prolonger votre session.
          </p>
          <div>
            <button id="stay-connected-btn" style="
              background: #4CAF50;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 10px;
              border-radius: 5px;
              cursor: pointer;
            ">Rester connecté</button>
            <button id="logout-now-btn" style="
              background: #f44336;
              color: white;
              border: none;
              padding: 10px 20px;
              margin: 0 10px;
              border-radius: 5px;
              cursor: pointer;
            ">Se déconnecter</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.warningModal = document.getElementById('inactivity-warning-modal');

    // Événements pour les boutons de la modale
    document.getElementById('stay-connected-btn')?.addEventListener('click', () => {
      this.resetInactivityTimer();
    });

    document.getElementById('logout-now-btn')?.addEventListener('click', () => {
      this.logout();
    });
  }

  /**
   * Affiche l'avertissement d'inactivité avec countdown
   */
  private showInactivityWarning(): void {
    if (this.isWarningShown) return;
    
    this.isWarningShown = true;
    
    if (this.warningModal) {
      this.warningModal.style.display = 'flex';
    }

    // Démarre le countdown de 5 minutes
    this.startCountdown();
  }

  /**
   * Démarre le countdown dans la modale
   */
  private startCountdown(): void {
    const countdownElement = document.getElementById('countdown-timer');
    let timeLeft = 5 * 60; // 5 minutes en secondes

    const countdownInterval = setInterval(() => {
      if (!this.isWarningShown) {
        clearInterval(countdownInterval);
        return;
      }

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (countdownElement) {
        countdownElement.textContent = timeString;
      }

      timeLeft--;

      if (timeLeft < 0) {
        clearInterval(countdownInterval);
        this.handleInactivityLogout();
      }
    }, 1000);
  }

  /**
   * Cache la modale d'avertissement
   */
  private hideWarningModal(): void {
    if (this.warningModal) {
      this.warningModal.style.display = 'none';
    }
  }

  /**
   * Gère la déconnexion automatique par inactivité
   */
  private handleInactivityLogout(): void {
    console.log('Déconnexion automatique due à l\'inactivité');
    
    // Affiche une notification de déconnexion
    this.showLogoutNotification('Vous avez été déconnecté automatiquement après 30 minutes d\'inactivité.');
    
    // Déconnecte l'utilisateur
    this.logout();
  }

  /**
   * Affiche une notification de déconnexion
   */
  private showLogoutNotification(message: string): void {
    // Crée une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprime la notification après 5 secondes
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Récupère le token JWT depuis le localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  /**
   * Récupère le profil utilisateur (cache puis API si nécessaire)
   */
  public async getUserProfile(forceRefresh: boolean = false): Promise<UserProfile> {
    try {
      // Vérification de l'authentification
      if (!this.isAuthenticated()) {
        throw new Error('Utilisateur non authentifié');
      }

      // Réinitialise le timer d'activité lors des appels API
      this.resetInactivityTimer();

      // 1. Vérifier le cache d'abord (sauf si forceRefresh)
      if (!forceRefresh) {
        const cachedProfile = this.getCachedProfile();
        if (cachedProfile) {
          console.log('Profil récupéré depuis le cache');
          return cachedProfile;
        }
      }

      // 2. Appeler l'API pour récupérer les données fraîches
      console.log('Récupération du profil depuis l\'API...');
      const response = await fetch(`${this.apiBaseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data: ApiResponse<UserProfile> = await response.json();
      
      if (data.success && data.user) {
        // 3. Sauvegarder en cache avec timestamp
        this.cacheProfile(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

    } catch (error) {
      console.error('Erreur getUserProfile:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil depuis le cache (si valide)
   */
  private getCachedProfile(): UserProfile | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { data, timestamp }: CachedData = JSON.parse(cached);
      
      // Vérifier si le cache a expiré
      if (Date.now() - timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lecture cache:', error);
      localStorage.removeItem(this.cacheKey);
      return null;
    }
  }

  /**
   * Sauvegarde le profil en cache
   */
  private cacheProfile(profileData: UserProfile): void {
    try {
      const cacheData: CachedData = {
        data: profileData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erreur sauvegarde cache:', error);
    }
  }

  /**
   * Met à jour une partie du profil en cache et sur le serveur
   */
  public async updateProfile(updates: ProfileUpdates): Promise<UserProfile> {
    try {
      // Réinitialise le timer d'activité
      this.resetInactivityTimer();

      const response = await fetch(`${this.apiBaseUrl}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expirée');
        }
        throw new Error(`Erreur mise à jour: ${response.status}`);
      }

      const data: ApiResponse<UserProfile> = await response.json();
      
      if (data.success && data.user) {
        // Mettre à jour le cache
        this.cacheProfile(data.user);
        return data.user;
      } else {
        throw new Error(data.message || 'Erreur mise à jour');
      }

    } catch (error) {
      console.error('Erreur updateProfile:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit le profil depuis l'API
   */
  public async refreshProfile(): Promise<UserProfile> {
    return this.getUserProfile(true);
  }

  /**
   * Vide le cache (utile lors de la déconnexion)
   */
  public clearCache(): void {
    localStorage.removeItem(this.cacheKey);
  }

  /**
   * Déconnecte l'utilisateur
   */
  public logout(): void {
    // Nettoie les timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Cache la modale si elle est affichée
    this.hideWarningModal();

    // Nettoie le localStorage
    localStorage.removeItem('jwt_token');
    this.clearCache();

    // Redirige vers la page de connexion
    window.location.href = '/login';
  }

  /**
   * Prolonge manuellement la session
   */
  public extendSession(): void {
    this.resetInactivityTimer();
    console.log('Session prolongée');
  }

  /**
   * Récupère le temps restant avant déconnexion (en secondes)
   */
  public getTimeUntilLogout(): number {
    const elapsed = Date.now() - this.lastActivity;
    const remaining = Math.max(0, this.inactivityTimeout - elapsed);
    return Math.floor(remaining / 1000);
  }

  /**
   * Vérifie si l'avertissement est actuellement affiché
   */
  public isWarningDisplayed(): boolean {
    return this.isWarningShown;
  }
}

// Export de l'instance singleton
export const userProfileService = new UserProfileService();

// Pour compatibilité avec l'ancien code
declare global {
  interface Window {
    userProfileService: UserProfileService;
  }
}

window.userProfileService = userProfileService;