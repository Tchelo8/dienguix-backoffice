import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  BarChart3,
  ArrowUpRight,
  Activity,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { recupererSafe } from "@/lib/transmission"


// Types pour les données de l'API
interface GlobalStats {
  total_transactions: number;
  business_volume: number;
  active_users: number;
  error_rate: number;
}

interface Transaction {
  sender: string;
  receiver: string;
  amount: string;
  status: string;
  transaction_ref: string;
  date: string;
}

interface DailyPerformance {
  successful_transactions: number;
  total_transactions: number;
  new_users: number;
  error_rate: number;
  period_start: string;
  period_end: string;
}

export default function Dashboard() {
  // États pour les données
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour charger les statistiques globales
  const loadGlobalStats = async () => {
    const response = await recupererSafe<GlobalStats>("api/dashboard/stats", {
      showErrorToast: true
    });
    
    if (response.success && response.data) {
      setGlobalStats(response.data);
    }
  };

  // Fonction pour charger les dernières transactions
  const loadLastTransactions = async () => {
    const response = await recupererSafe<Transaction[]>("api/dashboard/last-transactions", {
      showErrorToast: true
    });
    
    if (response.success && response.data) {
      setRecentTransactions(response.data);
    }
  };

  // Fonction pour charger les performances journalières
  const loadDailyPerformance = async () => {
    const response = await recupererSafe<DailyPerformance>("api/dashboard/daily-performance", {
      showErrorToast: true
    });
    
    if (response.success && response.data) {
      setDailyPerformance(response.data);
    }
  };

  // Fonction pour charger toutes les données
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGlobalStats(),
        loadLastTransactions(),
        loadDailyPerformance()
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setRefreshing(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadAllData();
  }, []);

  // Configuration des cartes de statistiques
  const getStatsConfig = () => {
    if (!globalStats) return [];
    
    return [
      {
        title: "Total Transactions",
        value: globalStats.total_transactions.toLocaleString(),
        icon: CreditCard,
        color: "text-success"
      },
      {
        title: "Volume d'affaires Gabon",
        value: ` ${globalStats.business_volume.toLocaleString()} XAF`,
        icon: DollarSign,
        color: "text-secondary"
      },
      {
        title: "Utilisateurs Actifs",
        value: globalStats.active_users.toLocaleString(),
        icon: Users,
        color: "text-primary"
      },
      {
        title: "Taux d'Erreur des transactions",
        value: `${globalStats.error_rate}%`,
        icon: BarChart3,
        color: globalStats.error_rate > 10 ? "text-destructive" : "text-warning"
      }
    ];
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("success") || statusLower.includes("terminé") || statusLower.includes("completed")) {
      return "bg-success text-success-foreground";
    }
    if (statusLower.includes("en cours") || statusLower.includes("pending")) {
      return "bg-warning text-warning-foreground";
    }
    if (statusLower.includes("échoué") || statusLower.includes("failed") || statusLower.includes("echoue")) {
      return "bg-destructive text-destructive-foreground";
    }
    return "bg-muted text-muted-foreground";
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("success")) return "Terminé";
    if (statusLower.includes("en cours")) return "En cours";
    if (statusLower.includes("échoué") || statusLower.includes("failed")) return "Échoué";
    return status;
  };

  // Fonction pour formater les montants
  const formatAmount = (transaction: Transaction) => {
    // Utiliser le montant formaté avec la devise si disponible
    return transaction.formatted_amount || `₣ ${parseFloat(transaction.amount).toLocaleString()}`;
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffMins < 1440) {
      const diffHours = Math.floor(diffMins / 60);
      return `Il y a ${diffHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de la plateforme DIENGUIX
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Activity className="h-4 w-4 mr-2" />
          )}
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {globalStats ? getStatsConfig().map((stat, index) => (
          <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
            </CardContent>
          </Card>
        )) : (
          // Skeleton pour les cartes de stats
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-primary">Transactions Récentes</CardTitle>
                <CardDescription>
                  Les dernières transactions sur votre plateforme
                </CardDescription>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {transaction.sender} → {transaction.receiver}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.transaction_ref} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-primary">{formatAmount(transaction)}</span>
                      <Badge className={getStatusColor(transaction.status)}>
                        {getStatusText(transaction.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucune transaction récente disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">Actions Rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/transactions">
              <Button className="w-full justify-start bg-gradient-primary hover:bg-primary/90">
                <CreditCard className="h-4 w-4 mr-2" />
                Nouvelle Transaction
              </Button>
            </Link>
            <Link to="/users">
              <Button variant="outline" className="w-full justify-start border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Gérer Utilisateurs
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir Rapports
              </Button>
            </Link>
            <Link to="/exchange-rates">
              <Button variant="outline" className="w-full justify-start border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                <DollarSign className="h-4 w-4 mr-2" />
                Taux de Change
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">Performance Journalière</CardTitle>
            <CardDescription>
              Statistiques des dernières 24 heures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailyPerformance ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions traitées</span>
                  <span className="font-medium text-primary">{dailyPerformance.successful_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total transactions</span>
                  <span className="font-medium text-primary">{dailyPerformance.total_transactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nouveaux utilisateurs</span>
                  <span className="font-medium text-primary">{dailyPerformance.new_users.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taux d'erreur</span>
                  <span className={`font-medium ${dailyPerformance.error_rate > 5 ? 'text-destructive' : 'text-success'}`}>
                    {dailyPerformance.error_rate}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">Alertes Système</CardTitle>
            <CardDescription>
              Notifications importantes à traiter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm text-warning-foreground">
                  3 transactions en attente de validation
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-success-foreground">
                  Système opérationnel - 99.9% uptime
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span className="text-sm text-secondary-foreground">
                  Mise à jour des taux disponible
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}