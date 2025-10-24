import { toast } from "@/hooks/use-toast";

// Configuration de base de l'API
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://dienguixbackend-production.up.railway.app/index.php/"
    : "https://dienguixbackend-production.up.railway.app/index.php/";

    // http://127.0.0.1:8000/

// Types pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface RequestOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

// Type pour les réponses sécurisées
interface SafeApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  statusCode?: number;
}

// Fonction utilitaire pour gérer les en-têtes
const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Fonction générique pour les appels API (version originale - garde la compatibilité)
const apiCall = async <T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  options: RequestOptions = {}
): Promise<T | null> => {
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
  } = options;

  try {
    const config: RequestInit = {
      method,
      headers: getHeaders(),
    };

    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || "Erreur API");
    }

    if (result.success) {
      if (showSuccessToast) {
        toast({
          title: "Succès",
          description: successMessage || result.message || "Opération réussie",
        });
      }
      return result.data || null;
    } else {
      throw new Error(result.error || result.message || "Erreur inconnue");
    }
  } catch (error) {
    console.error("Erreur API:", error);

    if (showErrorToast) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          errorMessage || (error as Error).message || "Une erreur est survenue",
      });
    }

    // Redirection si token expiré
    if (
      (error as Error).message.includes("401") ||
      (error as Error).message.includes("Unauthorized")
    ) {
      //deconnecter(); à remettre en production
    }

    return null;
  }
};

// Nouvelle fonction sécurisée pour les appels API
const apiCallSafe = async <T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  options: RequestOptions = {}
): Promise<SafeApiResponse<T>> => {
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
  } = options;

  try {
    const config: RequestInit = {
      method,
      headers: getHeaders(),
    };

    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Essayer de parser la réponse JSON
    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch (parseError) {
      return {
        success: false,
        data: null,
        error: "Erreur de format de réponse du serveur",
        statusCode: response.status
      };
    }

    if (!response.ok) {
      const errorMessage = result.error || result.message || `Erreur HTTP ${response.status}`;
      
      if (showErrorToast) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: options.errorMessage || errorMessage,
        });
      }

      // Redirection si token expiré
      if (response.status === 401) {
        //deconnecter();  à remettre en production
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
        statusCode: response.status
      };
    }

    if (result.success) {
      if (showSuccessToast) {
        toast({
          title: "Succès",
          description: successMessage || result.message || "Opération réussie",
        });
      }
      
      return {
        success: true,
        data: result.data || null,
        statusCode: response.status
      };
    } else {
      const errorMessage = result.error || result.message || "Erreur inconnue";
      
      if (showErrorToast) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: options.errorMessage || errorMessage,
        });
      }

      return {
        success: false,
        data: null,
        error: errorMessage,
        statusCode: response.status
      };
    }
  } catch (error) {
    console.error("Erreur API:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Une erreur de connexion est survenue";

    if (showErrorToast) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: options.errorMessage || errorMessage,
      });
    }

    // Vérification des erreurs de réseau
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        data: null,
        error: "Erreur de connexion au serveur",
      };
    }

    return {
      success: false,
      data: null,
      error: errorMessage,
    };
  }
};

// ========== FONCTIONS ORIGINALES (pour la compatibilité) ==========

// Fonction pour récupérer des données (GET)
export const recuperer = async <T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T | null> => {
  return apiCall<T>(endpoint, "GET", undefined, {
    showSuccessToast: false,
    ...options,
  });
};

// Fonction pour envoyer/créer des données (POST)
export const envoyer = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<T | null> => {
  return apiCall<T>(endpoint, "POST", data, {
    successMessage: "Données créées avec succès",
    ...options,
  });
};

// Fonction pour mettre à jour des données (PUT)
export const mettreAJour = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<T | null> => {
  return apiCall<T>(endpoint, "PUT", data, {
    successMessage: "Données mises à jour avec succès",
    ...options,
  });
};

// Fonction pour supprimer des données (DELETE)
export const supprimer = async <T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<T | null> => {
  return apiCall<T>(endpoint, "DELETE", undefined, {
    successMessage: "Données supprimées avec succès",
    ...options,
  });
};

// ========== NOUVELLES FONCTIONS SÉCURISÉES ==========

// Fonction pour récupérer des données (GET) - Version sécurisée
export const recupererSafe = async <T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "GET", undefined, {
    showSuccessToast: false,
    ...options,
  });
};

// Fonction pour envoyer/créer des données (POST) - Version sécurisée
export const envoyerSafe = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "POST", data, {
    successMessage: "Données créées avec succès",
    ...options,
  });
};

// Fonction pour envoyer/créer des données (POST) avec le token déjà inclus pour les requêtes sécurisées - Version sécurisée
export const envoyerSafeWithToken = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "POST", data, {
    successMessage: "Données créées avec succès",
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {}),
    },
  });
};

// Fonction pour mettre à jour des données (PUT) - Version sécurisée
export const mettreAJourSafe = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "PUT", data, {
    successMessage: "Données mises à jour avec succès",
    ...options,
  });
};

// Fonction pour mettre à jour des données (PUT) avec le token déjà inclus pour les requêtes sécurisées - Version sécurisée
export const mettreAJourSafeWithToken = async <T = any>(
  endpoint: string,
  data: any,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "PUT", data, {
    successMessage: "Données mises à jour avec succès",
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {}),
    },
  });
};



// Fonction pour supprimer des données (DELETE) - Version sécurisée
export const supprimerSafe = async <T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<SafeApiResponse<T>> => {
  return apiCallSafe<T>(endpoint, "DELETE", undefined, {
    successMessage: "Données supprimées avec succès",
    ...options,
  });
};

// ========== AUTRES FONCTIONS ==========

// Fonction de déconnexion améliorée
export const deconnecter = () => {
  // Supprimer toutes les données d'authentification
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
  localStorage.removeItem("refresh_token");

  // Nettoyer le sessionStorage aussi
  sessionStorage.clear();

  // Toast de déconnexion
  toast({
    title: "Déconnexion",
    description: "Vous avez été déconnecté avec succès",
  });

  // Redirection vers la page de connexion
  window.location.href = "/auth";
};

// Fonction pour vérifier si l'utilisateur est connecté
export const estConnecte = (): boolean => {
  return !!localStorage.getItem("auth_token");
};

// Fonction pour récupérer les données utilisateur
export const obtenirUtilisateur = () => {
  const userData = localStorage.getItem("user_data");
  return userData ? JSON.parse(userData) : null;
};

// Fonction pour sauvegarder les données d'authentification
export const sauvegarderAuth = (
  token: string,
  userData: any,
  refreshToken?: string
) => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("user_data", JSON.stringify(userData));
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
};

// Fonctions spécialisées pour votre application (versions originales)
export const utilisateurs = {
  liste: () => recuperer("/users"),
  creer: (data: any) => envoyer("/users", data),
  modifier: (id: string, data: any) => mettreAJour(`/users/${id}`, data),
  supprimer: (id: string) => supprimer(`/users/${id}`),
  obtenirProfil: () => recuperer("/users/profile"),
};

// Fonctions spécialisées - versions sécurisées
export const utilisateursSafe = {
  liste: () => recupererSafe("/users"),
  creer: (data: any) => envoyerSafe("/users", data),
  modifier: (id: string, data: any) => mettreAJourSafe(`/users/${id}`, data),
  supprimer: (id: string) => supprimerSafe(`/users/${id}`),
  obtenirProfil: () => recupererSafe("/users/profile"),
};

// Gestion des transactions
export const transactions = {
  liste: () => recuperer("/transactions"),
  creer: (data: any) => envoyer("/transactions", data),
  modifier: (id: string, data: any) => mettreAJour(`/transactions/${id}`, data),
  supprimer: (id: string) => supprimer(`/transactions/${id}`),
  historique: (userId: string) => recuperer(`/transactions/user/${userId}`),
};

// Gestion des taux de change
export const tauxChange = {
  liste: () => recuperer("/exchange-rates"),
  creer: (data: any) => envoyer("/exchange-rates", data),
  modifier: (id: string, data: any) =>
    mettreAJour(`/exchange-rates/${id}`, data),
  supprimer: (id: string) => supprimer(`/exchange-rates/${id}`),
  historique: (id: string) => recuperer(`/exchange-rates/${id}/history`),
};

// Gestion des rapports
export const rapports = {
  tableau: () => recuperer("/reports/dashboard"),
  utilisateursActifs: () => recuperer("/reports/active-users"),
  principauxExpediteurs: () => recuperer("/reports/top-senders"),
  statistiques: () => recuperer("/reports/statistics"),
};

// Fonction pour afficher des toasts personnalisés
export const afficherToast = {
  succes: (message: string, titre?: string) => {
    toast({
      variant: "default", 
      title: titre || "Succès",
      description: message,
      className: "bg-green-500 text-white", 
    });
  },
  erreur: (message: string, titre?: string) => {
    toast({
      variant: "destructive",
      title: titre || "Erreur",
      description: message,
    });
  },
  info: (message: string, titre?: string) => {
    toast({
      title: titre || "Information",
      description: message,
    });
  },
  avertissement: (message: string, titre?: string) => {
    toast({
      title: titre || "Avertissement",
      description: message,
      className: "bg-yellow-500 text-white",
    });
  },
};

// Export par défaut avec toutes les fonctions
export default {
  // Fonctions originales
  recuperer,
  envoyer,
  mettreAJour,
  supprimer,
  
  // Nouvelles fonctions sécurisées
  recupererSafe,
  envoyerSafe,
  mettreAJourSafe,
  supprimerSafe,
  
  // Autres fonctions
  deconnecter,
  estConnecte,
  obtenirUtilisateur,
  sauvegarderAuth,
  utilisateurs,
  utilisateursSafe,
  transactions,
  tauxChange,
  rapports,
  afficherToast,
};