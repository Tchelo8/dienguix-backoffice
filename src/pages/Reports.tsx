import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  CreditCard,
  Shield,
  TrendingUp,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const reportTypes = [
  { id: "transactions", name: "Transactions", icon: CreditCard },
  { id: "users", name: "Utilisateurs", icon: Users },
  { id: "audit", name: "Journaux d'Audit", icon: Shield },
  { id: "rates", name: "Taux de Change", icon: BarChart3 },
  { id: "profits", name: "Bénéfices", icon: TrendingUp }
]

const mockReportsHistory = [
  {
    id: 1,
    type: "transactions",
    period: "01/01/2024 - 15/01/2024",
    generatedAt: "2024-01-15 10:30",
    status: "completed",
    records: 1250
  },
  {
    id: 2,
    type: "users",
    period: "Décembre 2023",
    generatedAt: "2024-01-01 09:15",
    status: "completed",
    records: 345
  },
  {
    id: 3,
    type: "audit",
    period: "14/01/2024",
    generatedAt: "2024-01-14 18:45",
    status: "completed",
    records: 89
  }
]

export default function Reports() {
  const [selectedType, setSelectedType] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
  const { toast } = useToast()

  const handleGenerateReport = () => {
    if (!selectedType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de rapport.",
        variant: "destructive"
      })
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: "Erreur", 
        description: "Veuillez sélectionner une période.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Rapport généré",
      description: "Le rapport a été généré avec succès.",
    })
  }

  const handlePrintReport = (reportId: number) => {
    toast({
      title: "Impression",
      description: `Impression du rapport #${reportId} en cours...`,
    })
  }

  const handleDownloadReport = (reportId: number) => {
    toast({
      title: "Téléchargement",
      description: `Téléchargement du rapport #${reportId} en cours...`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Rapports</h1>
        <p className="text-muted-foreground">Générez et gérez les rapports d'activité</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Générer un Rapport</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Rapport</CardTitle>
              <CardDescription>
                Configurez et générez un rapport personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div className="space-y-3">
                <Label>Type de Rapport</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {reportTypes.map((type) => (
                    <div
                      key={type.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        selectedType === type.id ? "border-primary bg-primary/5" : "border-border"
                      )}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <type.icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{type.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de Début</Label>
                  <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          setIsStartCalendarOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Date de Fin</Label>
                  <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          setIsEndCalendarOpen(false)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button onClick={handleGenerateReport} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Générer le Rapport
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Rapports</CardTitle>
              <CardDescription>
                Consultez et téléchargez les rapports précédemment générés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Généré le</TableHead>
                    <TableHead>Enregistrements</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReportsHistory.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const type = reportTypes.find(t => t.id === report.type)
                            const Icon = type?.icon || FileText
                            return <Icon className="h-4 w-4" />
                          })()}
                          <span className="font-medium">
                            {reportTypes.find(t => t.id === report.type)?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.generatedAt}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{report.records} entrées</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {report.status === "completed" ? "Terminé" : "En cours"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReport(report.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReport(report.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}