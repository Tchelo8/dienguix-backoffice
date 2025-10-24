import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Edit2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowRight,
  Activity,
  Eye,
  RefreshCw,
  Loader2,
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { recupererSafe, mettreAJourSafe } from "@/lib/transmission"

// Types pour les données de l'API
interface ExchangeRateData {
  exchange_rate_id: number
  from_currency: string
  to_currency: string
  rate: number
  margin: number
  transactions_count: number
  profit: number
  volume: number
  created_at: string
  updated_at: string
}

interface DashboardData {
  taux_usd_actif: number
  volume_total_jour: number
  benefice_xaf: number
  benefice_russie: number
  benefices_par_pays: Record<string, number>
  exchange_rates: ExchangeRateData[]
}

// Schema pour modifier le taux uniquement
const updateRateSchema = z.object({
  rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Taux invalide")
})

type UpdateRateForm = z.infer<typeof updateRateSchema>

const currencies = ["XAF", "RUB"]

// Fonction pour convertir entre deux devises
const convertViaRate = (amount: number, rate: number): number => {
  return amount * rate
}

export default function ExchangeRates() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<ExchangeRateData | null>(null)
  const [selectedRate, setSelectedRate] = useState<ExchangeRateData | null>(null)
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false)
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  // États pour le calculateur
  const [fromCurrency, setFromCurrency] = useState("XAF")
  const [toCurrency, setToCurrency] = useState("RUB")
  const [amount, setAmount] = useState("")
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

  const form = useForm<UpdateRateForm>({
    resolver: zodResolver(updateRateSchema),
    defaultValues: {
      rate: ""
    }
  })

  // Charger les données depuis l'API
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const result = await recupererSafe<DashboardData>('api/exchange-rate/dashboard-stats', {
        showSuccessToast: false,
        showErrorToast: true
      })
      
      if (result.success && result.data) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Ouvrir le modal d'édition
  const openEditModal = (rate: ExchangeRateData) => {
    setEditingRate(rate)
    form.setValue("rate", rate.rate.toString())
    setIsEditModalOpen(true)
  }

  // Mettre à jour le taux
  const handleUpdateRate = async (data: UpdateRateForm) => {
    if (!editingRate) return
    
    setIsUpdating(true)
    try {
      const result = await mettreAJourSafe(
        `api/exchange-rate/update-rate/${editingRate.exchange_rate_id}`,
        { rate: parseFloat(data.rate) },
        {
          showSuccessToast: true,
          showErrorToast: true,
          successMessage: `Taux ${editingRate.from_currency} → ${editingRate.to_currency} mis à jour avec succès`
        }
      )
      
      if (result.success) {
        // Recharger les données
        await fetchDashboardData()
        // Fermer le modal
        setIsEditModalOpen(false)
        setEditingRate(null)
        form.reset()
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const openTransactionsModal = (rate: ExchangeRateData) => {
    setSelectedRate(rate)
    setIsTransactionsModalOpen(true)
  }

  const handleConvert = () => {
    const inputAmount = parseFloat(amount)
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      })
      return
    }

    // Trouver le taux de change approprié
    const exchangeRate = dashboardData?.exchange_rates.find(
      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
    )

    if (!exchangeRate) {
      toast({
        title: "Erreur",
        description: "Taux de change non disponible pour cette conversion",
        variant: "destructive"
      })
      return
    }
    
    const result = convertViaRate(inputAmount, exchangeRate.rate)
    setConvertedAmount(result)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Taux de Change</h1>
          <p className="text-muted-foreground">Gestion des taux et surveillance des conversions</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={fetchDashboardData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>

          <Button 
            variant="outline"
            onClick={() => setIsCalculatorModalOpen(true)}
          >
            <Activity className="mr-2 h-4 w-4" />
            Calculateur
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux USD Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.taux_usd_actif}</div>
            <p className="text-xs text-muted-foreground">taux de change actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.volume_total_jour.toLocaleString('fr-FR', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
            <p className="text-xs text-muted-foreground">volume du jour</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfices XAF</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {dashboardData.benefice_xaf.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} XAF
            </div>
            <p className="text-xs text-muted-foreground">bénéfice Gabon</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfices Russie</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">
              {dashboardData.benefice_russie.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} RUB
            </div>
            <p className="text-xs text-muted-foreground">bénéfice Russie</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Exchange Rates Grid - DYNAMIQUE */}
      <div className="grid gap-4 md:grid-cols-2">
        {dashboardData.exchange_rates.map((rate) => (
          <Card key={rate.exchange_rate_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="font-bold">{rate.from_currency}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="font-bold text-blue-600">{rate.to_currency}</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openTransactionsModal(rate)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openEditModal(rate)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Mis à jour: {new Date(rate.updated_at).toLocaleString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm">Taux</span>
                <span className="text-xl font-bold">{rate.rate.toFixed(8)}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Marge</p>
                  <p className="text-sm font-semibold">{rate.margin.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {rate.volume.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })} 
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className="text-sm font-semibold text-green-600">
                    {rate.profit.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <Badge variant="secondary">
                    {rate.transactions_count}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aucun taux disponible */}
      {dashboardData.exchange_rates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Aucun taux de change actif</p>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez votre premier taux de change pour commencer
            </p>
          </CardContent>
        </Card>
      )}

   


      {/* Edit Rate Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-600">
              Modifier le taux {editingRate?.from_currency} → {editingRate?.to_currency}
            </DialogTitle>
            <DialogDescription>
              Mettez à jour le taux de change
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateRate)} className="space-y-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau Taux</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.00000001" 
                        placeholder="0.1418"
                        disabled={isUpdating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingRate(null)
                    form.reset()
                  }}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transactions Modal */}
      <Dialog open={isTransactionsModalOpen} onOpenChange={setIsTransactionsModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="text-blue-600">
              Transactions - {selectedRate?.from_currency} → {selectedRate?.to_currency}
            </DialogTitle>
            <DialogDescription>
              Liste des transactions utilisant ce taux de change
            </DialogDescription>
          </DialogHeader>
          
          {selectedRate && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">1 USD en {selectedRate?.to_currency}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedRate.rate.toFixed(4)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedRate.transactions_count}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-2">
                      {selectedRate.volume.toLocaleString('fr-FR')} {selectedRate.to_currency}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informations Détaillées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Marge:</span>
                      <span className="text-sm font-semibold">{selectedRate.margin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profit Total avec ce taux de change dans la monnaie locale :</span>
                      <span className="text-sm font-semibold text-green-600">
                        {selectedRate.profit.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {selectedRate.to_currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Créé le:</span>
                      <span className="text-sm">{new Date(selectedRate.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dernière mise à jour:</span>
                      <span className="text-sm">{new Date(selectedRate.updated_at).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calculator Modal */}
      <Dialog open={isCalculatorModalOpen} onOpenChange={setIsCalculatorModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Calculateur de Conversion</DialogTitle>
            <DialogDescription>
              Convertissez entre les devises disponibles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Devise Source</label>
                <select 
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Devise Cible</label>
                <select 
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Montant</label>
              <Input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
              />
            </div>

            <Button 
              onClick={handleConvert}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Calculer
            </Button>

            {convertedAmount !== null && (
              <div className="p-6 bg-muted rounded-lg border-2">
                <p className="text-sm mb-2">Résultat de la conversion</p>
                <p className="text-3xl font-bold text-primary">
                  {convertedAmount.toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {toCurrency}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>
                    Taux appliqué: {dashboardData.exchange_rates.find(
                      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
                    )?.rate.toFixed(8)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}