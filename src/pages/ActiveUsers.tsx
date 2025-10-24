import { useState, useEffect } from "react"
import { recupererSafe } from "@/lib/transmission"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Search, 
  Eye, 
  ArrowUpRight, 
  ArrowDownLeft,
  Crown,
  Star,
  MapPin,
  Calendar,
  Activity,
  DollarSign,
  RefreshCw
} from "lucide-react"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

interface CountryStats {
  country: {
    id: number
    name: string
    iso_code: string
    currency_code: string
  }
  users_count: number
  transactions_stats: {
    total_amount_sent: string
    total_amount_received: string
    sent_count: number
    received_count: number
    total_transactions: number
  }
  currency_info: {
    sent_currency: string
    received_currency: string
  }
}

interface ActiveUser {
  id: number
  name: string
  first_name: string
  last_name: string
  email: string
  country: string
  currency: string
  total_amount_sent: string
  total_amount_received: string
  transaction_count: number
  sent_count: number
  received_count: number
  average_amount: string
  last_login_at: string
  created_at: string
  favorite_partner: {
    id: number
    name: string
    country: string
    transaction_count: number
    total_amount: string
    relationship_type: "sent_to" | "received_from"
  } | null
  status: "active" | "inactive"
}

interface ApiResponse {
  success: boolean
  data: ActiveUser[]
  total: number
  count: number
  pagination: {
    limit: number
    offset: number
    has_more: boolean
  }
  message: string
}

export default function ActiveUsers() {
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [countryStats, setCountryStats] = useState<CountryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("totalSent")
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null)
  const [currentPageSenders, setCurrentPageSenders] = useState(1)
  const [currentPageReceivers, setCurrentPageReceivers] = useState(1)
  const [currentPageAll, setCurrentPageAll] = useState(1)
  const itemsPerPage = 10

  const formatCurrency = (amount: string, currency: string = "XAF") => {
    // Convertir la chaîne en nombre en supprimant les virgules
    const numAmount = parseFloat(amount.replace(/,/g, ''))
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(numAmount)
  }

  // Fonction pour charger les statistiques des pays
  const loadCountryStats = async () => {
    try {
      const response = await recupererSafe<CountryStats[]>("api/countries/stats", {
        showSuccessToast: false,
        showErrorToast: false
      })
      
      if (response.success && response.data) {
        setCountryStats(response.data)
      } else {
        console.error("Erreur lors du chargement des statistiques:", response.error)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques des pays:", error)
    }
  }

  // Fonction pour charger les utilisateurs actifs
  const loadActiveUsers = async () => {
    try {
      setLoading(true)
      console.log("Chargement des utilisateurs actifs...")
      const response = await recupererSafe<ApiResponse>("api/users/active", {
        showSuccessToast: false,
        showErrorToast: false
      })
      
      console.log("Réponse API complète:", response)
      
      if (response.success && response.data) {
        console.log("Utilisateurs reçus:", response.data)
        // Les données sont directement dans response.data, pas response.data.data
        setUsers(response.data)
      } else {
        console.error("Erreur lors du chargement des utilisateurs actifs:", response.error)
        setUsers([]) // S'assurer qu'on a au moins un tableau vide
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs actifs:", error)
      setUsers([]) // S'assurer qu'on a au moins un tableau vide
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage du composant
  useEffect(() => {
    loadCountryStats()
    loadActiveUsers()
  }, [])

  // Fonction pour obtenir les stats d'un pays spécifique
  const getCountryStatsById = (countryName: string) => {
    return countryStats.find(stat => stat.country.name === countryName)
  }

  const getFilteredAndSortedUsers = () => {
    if (!users || users.length === 0) return []
    
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedRegion !== "all") {
      if (selectedRegion === "gabon") {
        filtered = filtered.filter(user => user.country === "Gabon")
      } else if (selectedRegion === "russia") {
        filtered = filtered.filter(user => user.country === "Russie")
      }
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "totalSent":
          return parseFloat(b.total_amount_sent.replace(/,/g, '')) - parseFloat(a.total_amount_sent.replace(/,/g, ''))
        case "totalReceived":
          return parseFloat(b.total_amount_received.replace(/,/g, '')) - parseFloat(a.total_amount_received.replace(/,/g, ''))
        case "transactionCount":
          return b.transaction_count - a.transaction_count
        case "averageAmount":
          return parseFloat(b.average_amount.replace(/,/g, '')) - parseFloat(a.average_amount.replace(/,/g, ''))
        default:
          return parseFloat(b.total_amount_sent.replace(/,/g, '')) - parseFloat(a.total_amount_sent.replace(/,/g, ''))
      }
    })
  }

  const getTopSenders = () => {
    if (!users || users.length === 0) return []
    
    return [...users].sort((a, b) => 
      parseFloat(b.total_amount_sent.replace(/,/g, '')) - parseFloat(a.total_amount_sent.replace(/,/g, ''))
    ).slice(0, 5)
  }

  const getTopReceivers = () => {
    if (!users || users.length === 0) return []
    
    return [...users].sort((a, b) => 
      parseFloat(b.total_amount_received.replace(/,/g, '')) - parseFloat(a.total_amount_received.replace(/,/g, ''))
    )
  }

  const paginatedTopSenders = () => {
    const senders = getTopSenders()
    const startIndex = (currentPageSenders - 1) * itemsPerPage
    return senders.slice(startIndex, startIndex + itemsPerPage)
  }

  const paginatedTopReceivers = () => {
    const receivers = getTopReceivers()
    const startIndex = (currentPageReceivers - 1) * itemsPerPage
    return receivers.slice(startIndex, startIndex + itemsPerPage)
  }

  const paginatedAllUsers = () => {
    const filtered = getFilteredAndSortedUsers()
    const startIndex = (currentPageAll - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }

  const totalPagesSenders = Math.ceil(getTopSenders().length / itemsPerPage)
  const totalPagesReceivers = Math.ceil(getTopReceivers().length / itemsPerPage)
  const totalPagesAll = Math.ceil(getFilteredAndSortedUsers().length / itemsPerPage)

  const handleRefresh = () => {
    console.log("Actualisation des données utilisateurs actifs...")
    loadCountryStats()
    loadActiveUsers()
  }

  const getTotalStats = () => {
    const gabonStats = getCountryStatsById("Gabon")
    const russiaStats = getCountryStatsById("Russie")
    
    return {
      gabon: gabonStats || {
        country: { name: "Gabon" },
        users_count: 0,
        transactions_stats: {
          total_amount_sent: "0.00",
          total_amount_received: "0.00",
          sent_count: 0,
          received_count: 0,
          total_transactions: 0
        },
        currency_info: {
          sent_currency: "XAF",
          received_currency: "XAF"
        }
      },
      russia: russiaStats || {
        country: { name: "Russie" },
        users_count: 0,
        transactions_stats: {
          total_amount_sent: "0.00",
          total_amount_received: "0.00",
          sent_count: 0,
          received_count: 0,
          total_transactions: 0
        },
        currency_info: {
          sent_currency: "RUB",
          received_currency: "RUB"
        }
      }
    }
  }

  const stats = getTotalStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Utilisateurs Actifs</h1>
            <p className="text-muted-foreground">Analyse des utilisateurs les plus actifs sur la plateforme</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Chargement des données...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Utilisateurs Actifs</h1>
          <p className="text-muted-foreground">Analyse des utilisateurs les plus actifs sur la plateforme</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gabon
            </CardTitle>
            <CardDescription>Statistiques des utilisateurs gabonais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.gabon.users_count}</div>
                <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.gabon.transactions_stats.total_transactions}</div>
                <div className="text-sm text-muted-foreground">Transactions totales</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant envoyé</span>
                <span className="font-medium">{stats.gabon.transactions_stats.total_amount_sent} {stats.gabon.currency_info.sent_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant reçu</span>
                <span className="font-medium">{stats.gabon.transactions_stats.total_amount_received} {stats.gabon.currency_info.received_currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Russie
            </CardTitle>
            <CardDescription>Statistiques des utilisateurs russes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.russia.users_count}</div>
                <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.russia.transactions_stats.total_transactions}</div>
                <div className="text-sm text-muted-foreground">Transactions totales</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant envoyé</span>
                <span className="font-medium">{stats.russia.transactions_stats.total_amount_sent} {stats.russia.currency_info.sent_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant reçu</span>
                <span className="font-medium">{stats.russia.transactions_stats.total_amount_received} {stats.russia.currency_info.received_currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="senders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="senders">Top Envoyeurs</TabsTrigger>
          <TabsTrigger value="receivers">Top Destinataires</TabsTrigger>
          <TabsTrigger value="all">Tous les Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="senders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Top 5 des Envoyeurs
              </CardTitle>
              <CardDescription>
                Utilisateurs ayant envoyé le plus d'argent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedTopSenders().map((user, index) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center">
                        <span className="text-sm font-bold text-secondary-foreground">
                          {index + 1}
                        </span>
                      </div>
                      {index === 0 && <Crown className="h-5 w-5 text-warning" />}
                      {index === 1 && <Star className="h-5 w-5 text-muted-foreground" />}
                      {index === 2 && <Star className="h-5 w-5 text-warning/60" />}
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {user.first_name[0]}{user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.country}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {formatCurrency(user.total_amount_sent, user.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.transaction_count} transactions
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Détails de l'utilisateur</DialogTitle>
                          <DialogDescription>
                            Informations complètes sur {user.name}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                <p className="text-muted-foreground">{selectedUser.email}</p>
                                <Badge variant="outline">{selectedUser.country}</Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Total Envoyé</label>
                                <div className="text-lg font-bold text-success">
                                  {formatCurrency(selectedUser.total_amount_sent, selectedUser.currency)}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Total Reçu</label>
                                <div className="text-lg font-bold text-primary">
                                  {formatCurrency(selectedUser.total_amount_received, selectedUser.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Nombre de Transactions</label>
                                <div className="text-lg font-bold">{selectedUser.transaction_count}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Moyen</label>
                                <div className="text-lg font-bold">
                                  {formatCurrency(selectedUser.average_amount, selectedUser.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                                <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                                <div>{new Date(selectedUser.last_login_at).toLocaleString()}</div>
                              </div>
                            </div>

                            {selectedUser.favorite_partner && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Partenaire Principal</label>
                                <div className="p-3 bg-accent rounded-lg">
                                  {selectedUser.favorite_partner.name} ({selectedUser.favorite_partner.country})
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {selectedUser.favorite_partner.transaction_count} transaction(s) - {formatCurrency(selectedUser.favorite_partner.total_amount, selectedUser.currency)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Top 5 des Destinataires
              </CardTitle>
              <CardDescription>
                Utilisateurs ayant reçu le plus d'argent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paginatedTopReceivers().slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center">
                        <span className="text-sm font-bold text-secondary-foreground">
                          {index + 1}
                        </span>
                      </div>
                      {index === 0 && <Crown className="h-5 w-5 text-warning" />}
                      {index === 1 && <Star className="h-5 w-5 text-muted-foreground" />}
                      {index === 2 && <Star className="h-5 w-5 text-warning/60" />}
                    </div>
                    
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {user.first_name[0]}{user.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.country}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {formatCurrency(user.total_amount_received, user.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.transaction_count} transactions
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Détails de l'utilisateur</DialogTitle>
                          <DialogDescription>
                            Informations complètes sur {user.name}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                <p className="text-muted-foreground">{selectedUser.email}</p>
                                <Badge variant="outline">{selectedUser.country}</Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Total Envoyé</label>
                                <div className="text-lg font-bold text-success">
                                  {formatCurrency(selectedUser.total_amount_sent, selectedUser.currency)}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Total Reçu</label>
                                <div className="text-lg font-bold text-primary">
                                  {formatCurrency(selectedUser.total_amount_received, selectedUser.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Nombre de Transactions</label>
                                <div className="text-lg font-bold">{selectedUser.transaction_count}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Montant Moyen</label>
                                <div className="text-lg font-bold">
                                  {formatCurrency(selectedUser.average_amount, selectedUser.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                                <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                                <div>{new Date(selectedUser.last_login_at).toLocaleString()}</div>
                              </div>
                            </div>

                            {selectedUser.favorite_partner && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Partenaire Principal</label>
                                <div className="p-3 bg-accent rounded-lg">
                                  {selectedUser.favorite_partner.name} ({selectedUser.favorite_partner.country})
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {selectedUser.favorite_partner.transaction_count} transaction(s) - {formatCurrency(selectedUser.favorite_partner.total_amount, selectedUser.currency)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres et Tri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rechercher</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nom, email, pays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Région</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      <SelectItem value="gabon">Gabon</SelectItem>
                      <SelectItem value="russia">Russie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trier par</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalSent">Montant envoyé</SelectItem>
                      <SelectItem value="totalReceived">Montant reçu</SelectItem>
                      <SelectItem value="transactionCount">Nb transactions</SelectItem>
                      <SelectItem value="averageAmount">Montant moyen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Tous les Utilisateurs Actifs</CardTitle>
              <CardDescription>
                {getFilteredAndSortedUsers().length} utilisateur(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Envoyé</TableHead>
                      <TableHead>Reçu</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAllUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                                {user.first_name[0]}{user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {user.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(user.total_amount_sent, user.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(user.total_amount_received, user.currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.transaction_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.last_login_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Détails de l'utilisateur</DialogTitle>
                                <DialogDescription>
                                  Informations complètes sur {user.name}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                        {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                      <p className="text-muted-foreground">{selectedUser.email}</p>
                                      <Badge variant="outline">{selectedUser.country}</Badge>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Montant Total Envoyé</label>
                                      <div className="text-lg font-bold text-success">
                                        {formatCurrency(selectedUser.total_amount_sent, selectedUser.currency)}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Montant Total Reçu</label>
                                      <div className="text-lg font-bold text-primary">
                                        {formatCurrency(selectedUser.total_amount_received, selectedUser.currency)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Nombre de Transactions</label>
                                      <div className="text-lg font-bold">{selectedUser.transaction_count}</div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Montant Moyen</label>
                                      <div className="text-lg font-bold">
                                        {formatCurrency(selectedUser.average_amount, selectedUser.currency)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                                      <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                                      <div>{new Date(selectedUser.last_login_at).toLocaleString()}</div>
                                    </div>
                                  </div>

                                  {selectedUser.favorite_partner && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Partenaire Principal</label>
                                      <div className="p-3 bg-accent rounded-lg">
                                        {selectedUser.favorite_partner.name} ({selectedUser.favorite_partner.country})
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {selectedUser.favorite_partner.transaction_count} transaction(s) - {formatCurrency(selectedUser.favorite_partner.total_amount, selectedUser.currency)}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination pour tous les utilisateurs */}
          {totalPagesAll > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPageAll(Math.max(1, currentPageAll - 1))
                      }}
                      className={currentPageAll === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPagesAll }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPageAll(page)
                        }}
                        isActive={currentPageAll === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPageAll(Math.min(totalPagesAll, currentPageAll + 1))
                      }}
                      className={currentPageAll === totalPagesAll ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}