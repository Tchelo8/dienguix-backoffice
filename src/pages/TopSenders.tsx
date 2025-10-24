import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Users, 
  ArrowUpDown,
  Crown,
  Medal,
  Award,
  Eye,
  BarChart3
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const mockGabonSenders = [
  {
    id: 1,
    name: "Jean-Baptiste Mouanda",
    phone: "+241 07 XX XX XX",
    location: "Libreville",
    totalSent: 15680000,
    totalReceived: 2340000,
    transactionCount: 127,
    averageAmount: 123465,
    lastTransaction: "2024-01-15",
    rank: 1,
    trend: "up",
    monthlyGrowth: 15.2
  },
  {
    id: 2,
    name: "Marie-Claire Nzoghe",
    phone: "+241 06 XX XX XX", 
    location: "Port-Gentil",
    totalSent: 12450000,
    totalReceived: 4560000,
    transactionCount: 98,
    averageAmount: 126938,
    lastTransaction: "2024-01-14",
    rank: 2,
    trend: "up",
    monthlyGrowth: 8.7
  },
  {
    id: 3,
    name: "Paul Ndong Essone",
    phone: "+241 05 XX XX XX",
    location: "Franceville",
    totalSent: 9870000,
    totalReceived: 1230000,
    transactionCount: 84,
    averageAmount: 117500,
    lastTransaction: "2024-01-13",
    rank: 3,
    trend: "down",
    monthlyGrowth: -2.1
  },
  {
    id: 4,
    name: "Sylvie Mba Obame",
    phone: "+241 07 XX XX XX",
    location: "Oyem",
    totalSent: 8560000,
    totalReceived: 3450000,
    transactionCount: 76,
    averageAmount: 112631,
    lastTransaction: "2024-01-12",
    rank: 4,
    trend: "up",
    monthlyGrowth: 12.3
  },
  {
    id: 5,
    name: "Robert Ngouabi",
    phone: "+241 06 XX XX XX",
    location: "Lambaréné",
    totalSent: 7890000,
    totalReceived: 890000,
    transactionCount: 65,
    averageAmount: 121384,
    lastTransaction: "2024-01-11",
    rank: 5,
    trend: "stable",
    monthlyGrowth: 0.5
  }
]

const mockRussiaSenders = [
  {
    id: 1,
    name: "Vladimir Petrov",
    phone: "+7 XXX XXX XX XX",
    location: "Moscou",
    totalSent: 8450000,
    totalReceived: 18900000,
    transactionCount: 156,
    averageAmount: 175641,
    lastTransaction: "2024-01-15",
    rank: 1,
    trend: "up",
    monthlyGrowth: 22.1
  },
  {
    id: 2,
    name: "Anastasia Volkov",
    phone: "+7 XXX XXX XX XX",
    location: "Saint-Pétersbourg", 
    totalSent: 6780000,
    totalReceived: 14560000,
    transactionCount: 123,
    averageAmount: 173495,
    lastTransaction: "2024-01-14",
    rank: 2,
    trend: "up",
    monthlyGrowth: 18.7
  },
  {
    id: 3,
    name: "Dmitri Sokolov",
    phone: "+7 XXX XXX XX XX",
    location: "Novosibirsk",
    totalSent: 5670000,
    totalReceived: 11230000,
    transactionCount: 89,
    averageAmount: 189663,
    lastTransaction: "2024-01-13",
    rank: 3,
    trend: "down",
    monthlyGrowth: -5.2
  },
  {
    id: 4,
    name: "Ekaterina Fedorov",
    phone: "+7 XXX XXX XX XX",
    location: "Kazan",
    totalSent: 4890000,
    totalReceived: 9870000,
    transactionCount: 67,
    averageAmount: 219701,
    lastTransaction: "2024-01-12",
    rank: 4,
    trend: "up",
    monthlyGrowth: 9.8
  },
  {
    id: 5,
    name: "Igor Kuznetsov",
    phone: "+7 XXX XXX XX XX",
    location: "Ekaterinbourg",
    totalSent: 4200000,
    totalReceived: 7650000,
    transactionCount: 54,
    averageAmount: 219444,
    lastTransaction: "2024-01-11",
    rank: 5,
    trend: "stable",
    monthlyGrowth: 1.2
  }
]

const chartData = [
  { country: "Gabon", envois: 54450, receptions: 12470 },
  { country: "Russie", envois: 29990, receptions: 62210 }
]

const pieData = [
  { name: "Gabon → Russie", value: 54450, color: "hsl(var(--primary))" },
  { name: "Russie → Gabon", value: 29990, color: "hsl(var(--chart-2))" }
]

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-4 w-4 text-yellow-500" />
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />
    default:
      return <span className="text-sm font-medium">#{rank}</span>
  }
}

const getTrendIcon = (trend: string, growth: number) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-chart-2" />
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />
  return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
}

export default function TopSenders() {
  const [selectedCountry, setSelectedCountry] = useState("gabon")
  const [selectedUser, setSelectedUser] = useState<typeof mockGabonSenders[0] | null>(null)

  const currentData = selectedCountry === "gabon" ? mockGabonSenders : mockRussiaSenders

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Top Envoyeurs</h1>
        <p className="text-muted-foreground">
          Analysez les utilisateurs les plus actifs par pays
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envoyeurs Gabon</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envoyeurs Russie</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">
              +8% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.4M XAF</div>
            <p className="text-xs text-muted-foreground">
              Tous pays confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Croissance Mensuelle</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">+15.2%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne pondérée
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparaison par Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              envois: { label: "Envois", color: "hsl(var(--primary))" },
              receptions: { label: "Réceptions", color: "hsl(var(--chart-2))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="country" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="envois" fill="hsl(var(--primary))" />
                  <Bar dataKey="receptions" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Flux</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              gabon: { label: "Gabon → Russie", color: "hsl(var(--primary))" },
              russie: { label: "Russie → Gabon", color: "hsl(var(--chart-2))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Country Tabs */}
      <Tabs defaultValue="gabon" onValueChange={setSelectedCountry}>
        <TabsList>
          <TabsTrigger value="gabon">🇬🇦 Top Gabon</TabsTrigger>
          <TabsTrigger value="russia">🇷🇺 Top Russie</TabsTrigger>
        </TabsList>

        <TabsContent value="gabon" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Envoyeurs - Gabon</CardTitle>
              <CardDescription>
                Les utilisateurs les plus actifs basés au Gabon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rang</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Total Envoyé</TableHead>
                    <TableHead>Total Reçu</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Tendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGabonSenders.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(sender.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {sender.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{sender.name}</div>
                            <div className="text-sm text-muted-foreground">{sender.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{sender.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-chart-1">
                          {sender.totalSent.toLocaleString()} XAF
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-chart-2">
                          {sender.totalReceived.toLocaleString()} XAF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sender.transactionCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(sender.trend, sender.monthlyGrowth)}
                          <span className={sender.trend === "up" ? "text-chart-2" : sender.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                            {sender.monthlyGrowth > 0 ? "+" : ""}{sender.monthlyGrowth}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(sender)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de l'utilisateur</DialogTitle>
                              <DialogDescription>
                                Informations complètes sur {sender.name}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                      {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                    <p className="text-muted-foreground">{selectedUser.phone}</p>
                                    <Badge variant="outline">{selectedUser.location}</Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Total Envoyé</label>
                                    <div className="text-lg font-bold text-chart-1">
                                      {selectedUser.totalSent.toLocaleString()} XAF
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Total Reçu</label>
                                    <div className="text-lg font-bold text-chart-2">
                                      {selectedUser.totalReceived.toLocaleString()} XAF
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nombre de Transactions</label>
                                    <div className="text-lg font-bold">{selectedUser.transactionCount}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Moyen</label>
                                    <div className="text-lg font-bold">
                                      {selectedUser.averageAmount.toLocaleString()} XAF
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Rang</label>
                                    <div className="flex items-center gap-2">
                                      {getRankIcon(selectedUser.rank)}
                                      <span className="font-medium">#{selectedUser.rank}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Tendance</label>
                                    <div className="flex items-center gap-2">
                                      {getTrendIcon(selectedUser.trend, selectedUser.monthlyGrowth)}
                                      <span className={selectedUser.trend === "up" ? "text-chart-2" : selectedUser.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                                        {selectedUser.monthlyGrowth > 0 ? "+" : ""}{selectedUser.monthlyGrowth}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Dernière Transaction</label>
                                  <div>{new Date(selectedUser.lastTransaction).toLocaleDateString()}</div>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="russia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Envoyeurs - Russie</CardTitle>
              <CardDescription>
                Les utilisateurs les plus actifs basés en Russie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rang</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Total Envoyé</TableHead>
                    <TableHead>Total Reçu</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Tendance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRussiaSenders.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(sender.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {sender.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{sender.name}</div>
                            <div className="text-sm text-muted-foreground">{sender.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{sender.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-chart-1">
                          {sender.totalSent.toLocaleString()} XAF
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-chart-2">
                          {sender.totalReceived.toLocaleString()} XAF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sender.transactionCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(sender.trend, sender.monthlyGrowth)}
                          <span className={sender.trend === "up" ? "text-chart-2" : sender.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                            {sender.monthlyGrowth > 0 ? "+" : ""}{sender.monthlyGrowth}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(sender)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de l'utilisateur</DialogTitle>
                              <DialogDescription>
                                Informations complètes sur {sender.name}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                                      {selectedUser.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                    <p className="text-muted-foreground">{selectedUser.phone}</p>
                                    <Badge variant="outline">{selectedUser.location}</Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Total Envoyé</label>
                                    <div className="text-lg font-bold text-chart-1">
                                      {selectedUser.totalSent.toLocaleString()} XAF
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Total Reçu</label>
                                    <div className="text-lg font-bold text-chart-2">
                                      {selectedUser.totalReceived.toLocaleString()} XAF
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Nombre de Transactions</label>
                                    <div className="text-lg font-bold">{selectedUser.transactionCount}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Montant Moyen</label>
                                    <div className="text-lg font-bold">
                                      {selectedUser.averageAmount.toLocaleString()} XAF
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Rang</label>
                                    <div className="flex items-center gap-2">
                                      {getRankIcon(selectedUser.rank)}
                                      <span className="font-medium">#{selectedUser.rank}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Tendance</label>
                                    <div className="flex items-center gap-2">
                                      {getTrendIcon(selectedUser.trend, selectedUser.monthlyGrowth)}
                                      <span className={selectedUser.trend === "up" ? "text-chart-2" : selectedUser.trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                                        {selectedUser.monthlyGrowth > 0 ? "+" : ""}{selectedUser.monthlyGrowth}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground">Dernière Transaction</label>
                                  <div>{new Date(selectedUser.lastTransaction).toLocaleDateString()}</div>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}