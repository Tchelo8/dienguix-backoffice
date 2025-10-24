import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Shield,
  Search,
  Calendar,
  Download,
  Filter,
  Eye,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  RefreshCw,
  Loader2
} from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { recupererSafe } from "@/lib/transmission"
import * as XLSX from 'xlsx'


interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  role: {
    id: number
    name: string
  }
  country: {
    id: number
    name: string
  }
}

interface AuditLog {
  id: number
  date: string
  user: UserData
  action: string
  categorie: string
  ip_address: string
  user_agent: string
  localisation: string | null
  details: string | null
}

interface ApiResponse {
  success: boolean
  data: AuditLog[]
  count: number
}

export default function UserHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "Authentification", label: "Authentification" },
    { value: "Transactions", label: "Transactions" },
    { value: "Gestion Utilisateurs", label: "Gestion Utilisateurs" },
    { value: "Système", label: "Système" },
    { value: "Sécurité", label: "Sécurité" }
  ]

  const users = [
    { value: "all", label: "Tous les utilisateurs" },
    ...(logs && logs.length > 0
      ? Array.from(new Set(logs.map(log => `${log.user.first_name} ${log.user.last_name}`))).map(name => ({
        value: name,
        label: name
      }))
      : [])
  ]

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const response = await recupererSafe<AuditLog[]>("api/log-activity", {
        showSuccessToast: false,
        showErrorToast: true,
        errorMessage: "Erreur lors du chargement des logs d'audit"
      })

      if (response.success && response.data) {
        setLogs(response.data)
        setFilteredLogs(response.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleFilter = () => {
    if (!logs || logs.length === 0) {
      setFilteredLogs([])
      return
    }

    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${log.user.first_name} ${log.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(log => log.categorie === selectedCategory)
    }

    if (selectedUser !== "all") {
      filtered = filtered.filter(log => `${log.user.first_name} ${log.user.last_name}` === selectedUser)
    }

    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.date) >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter(log => new Date(log.date) <= dateTo)
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs?.slice(startIndex, startIndex + itemsPerPage) || []

  const handleRefresh = () => {
    loadLogs()
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedUser("all")
    setDateFrom(undefined)
    setDateTo(undefined)
    setFilteredLogs(logs || [])
  }

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes("authentification")) return <Shield className="h-4 w-4" />
    if (category.toLowerCase().includes("transaction")) return <Activity className="h-4 w-4" />
    if (category.toLowerCase().includes("utilisateur")) return <User className="h-4 w-4" />
    if (category.toLowerCase().includes("système") || category.toLowerCase().includes("systeme")) return <Monitor className="h-4 w-4" />
    if (category.toLowerCase().includes("sécurité") || category.toLowerCase().includes("securite")) return <Shield className="h-4 w-4" />
    return <Info className="h-4 w-4" />
  }

  // Fonction pour exporter les logs en Excel
  const exportLogs = () => {
  if (!filteredLogs || filteredLogs.length === 0 || !Array.isArray(filteredLogs)) {
    console.error("Aucune donnée à exporter")
    return
  }

  const data = filteredLogs.map(log => ({
    "Numéro": log.id,
    "Date/Heure": format(new Date(log.date), "dd/MM/yyyy HH:mm:ss"),
    "Utilisateur": `${log.user.first_name} ${log.user.last_name}`,
    "Email": log.user.email,
    "Rôle": log.user.role.name,
    "Action": log.action,
    "Catégorie": log.categorie,
    "Adresse IP": log.ip_address,
    "Pays": log.user.country.name,
    "Localisation": log.localisation || "-",
    "Détails": log.details || "-",
    "User Agent": log.user_agent
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Audit")
  ws['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 20 }, { wch: 25 },
    { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 40 }
  ]

  XLSX.writeFile(wb, `piste-audit-${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`)
}


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des logs d'audit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Piste d'Audit</h1>
          <p className="text-muted-foreground">Suivi et traçabilité de toutes les actions utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={exportLogs} variant="outline" disabled={!filteredLogs || filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          <CardDescription>
            Filtrez les logs d'audit par critères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Utilisateur</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.value} value={user.value}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP", { locale: fr }) : "Sélectionner la date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP", { locale: fr }) : "Sélectionner la date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFilter}>
              <Filter className="h-4 w-4 mr-2" />
              Appliquer les filtres
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Effacer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Journal d'Audit</CardTitle>
          <CardDescription>
            {filteredLogs?.length || 0} entrée(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.date), "dd/MM/yyyy HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{log.user.first_name} {log.user.last_name}</div>
                        <Badge variant="outline" className="text-xs">
                          {log.user.role.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.action}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.categorie)}
                        <span>{log.categorie}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails du Log d'Audit</DialogTitle>
                            <DialogDescription>
                              Informations complètes sur cette action
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">

                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(selectedLog.categorie)}
                                    {selectedLog.categorie}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Utilisateur</label>
                                  <div>{selectedLog.user.first_name} {selectedLog.user.last_name}</div>
                                  <div className="text-sm text-muted-foreground">{selectedLog.user.email}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                                  <div>{selectedLog.user.role.name}</div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Action</label>
                                <div className="font-medium">{selectedLog.action}</div>
                              </div>

                              {selectedLog.details && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Détails</label>
                                  <div className="p-3 bg-muted rounded-lg text-sm">
                                    {selectedLog.details}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Date/Heure</label>
                                  <div className="font-mono text-sm">{selectedLog.date}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Adresse IP</label>
                                  <div className="font-mono text-sm">{selectedLog.ip_address}</div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Appareil</label>
                                <div className="flex items-center gap-2 text-sm">
                                  <Smartphone className="h-4 w-4" />
                                  {selectedLog.user_agent}
                                </div>
                              </div>

                              {selectedLog.localisation && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    {selectedLog.localisation}
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Pays</label>
                                <div>{selectedLog.user.country.name}</div>
                              </div>
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

          {(!filteredLogs || filteredLogs.length === 0) && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun log d'audit trouvé avec les critères sélectionnés</p>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && filteredLogs && filteredLogs.length > 0 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(Math.max(1, currentPage - 1))
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page)
                    }}
                    isActive={currentPage === page}
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
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}