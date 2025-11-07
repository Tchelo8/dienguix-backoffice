import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Filter,
  Download,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  Calendar,
  Activity,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Combobox } from "@/components/ui/combobox"

import { recupererSafe, envoyerSafe } from "@/lib/transmission";

export default function Transactions() {
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedOperator, setSelectedOperator] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundData, setRefundData] = useState({
    userId: "",
    paymentMethod: "",
    amount: "",
    transactionReason: "",
    exchangeRateId: "",
    sendMethod: "",
    notes: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableOperators, setAvailableOperators] = useState([]);
  const [error, setError] = useState(null);

  // Nouveaux states pour l'API opérateurs
  const [operatorsData, setOperatorsData] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(false);
  const [selectedCountryData, setSelectedCountryData] = useState(null);

  // States pour le modal de remboursement
  const [users, setUsers] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [sendOperators, setSendOperators] = useState([]);
  const [loadingRefundData, setLoadingRefundData] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // L'admin connecté

  const itemsPerPage = 10;

  // Statistiques statiques données
  const countryStats = {
    gabon: {
      total: "₣ 25.8M",
      transactions: 1456,
      operators: {
        "Airtel Money": { volume: "₣ 15.2M", count: 892 },
        "Moov Money": { volume: "₣ 10.6M", count: 564 },
      },
    },
    russia: {
      total: "₽ 8.9M",
      transactions: 743,
      operators: {
        Sberbank: { volume: "₽ 5.4M", count: 456 },
        "Qiwi Wallet": { volume: "₽ 3.5M", count: 287 },
      },
    },
  };

  

  // Charger les données des opérateurs depuis l'API
  const loadOperatorsData = async () => {
    setLoadingOperators(true);
    try {
      const response = await recupererSafe("api/operators/from/country/dgapp", {
        showSuccessToast: false,
        showErrorToast: false,
      });

      if (response.success && response.data) {
        setOperatorsData(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des opérateurs:", error);
    } finally {
      setLoadingOperators(false);
    }
  };

  // Charger les transactions depuis l'API
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await recupererSafe("api/transactions/list/all/dgapp", {
        showSuccessToast: false,
        showErrorToast: false,
      });

      if (response.success && response.data) {
        setTransactions(response.data);

        const operators = [
          ...new Set(
            response.data.map((t) => t.operator_sender?.name).filter(Boolean)
          ),
        ];
        setAvailableOperators(operators);
      } else {
        setError(response.error || "Erreur lors du chargement des données");
        setTransactions([]);
        setAvailableOperators([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
      setError("Impossible de charger les transactions");
      setTransactions([]);
      setAvailableOperators([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisateurs pour le modal de remboursement
  const loadUsers = async () => {
    try {
      const response = await recupererSafe("api/users/list/all/dgapp", {
        showSuccessToast: false,
        showErrorToast: false,
      });

      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  // Charger les taux de change pour le modal de remboursement
  const loadExchangeRates = async () => {
    try {
      const response = await recupererSafe("api/exchange-rate/active", {
        showSuccessToast: false,
        showErrorToast: false,
      });

      if (response.success && response.data) {
        setExchangeRates(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des taux de change:", error);
    }
  };

  // Charger les opérateurs pour le modal de remboursement
  const loadSendOperators = async () => {
    try {
      const response = await recupererSafe("api/operators/user-country", {
        showSuccessToast: false,
        showErrorToast: false,
      });

      if (response.success && response.data) {
        setSendOperators(response.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des opérateurs d'envoi:", error);
    }
  };

  // Charger les données du modal de remboursement
  const loadRefundModalData = async () => {
    setLoadingRefundData(true);
    await Promise.all([
      loadUsers(),
      loadExchangeRates(),
      loadSendOperators()
    ]);
    setLoadingRefundData(false);
  };

  useEffect(() => {
    loadTransactions();
    loadOperatorsData();
  }, []);

  // Charger les données du modal quand il s'ouvre
  useEffect(() => {
    if (isRefundModalOpen) {
      loadRefundModalData();
    }
  }, [isRefundModalOpen]);

  // Gestion du changement de pays
  useEffect(() => {
    if (selectedCountry !== "all") {
      const countryData = operatorsData.find(
        (country) =>
          country.name.toLowerCase() === selectedCountry.toLowerCase()
      );
      setSelectedCountryData(countryData);
    } else {
      setSelectedCountryData(null);
    }
  }, [selectedCountry, operatorsData]);

  // Mettre à jour le moyen de paiement quand un utilisateur est sélectionné
  useEffect(() => {
    if (refundData.userId) {
      const selectedUser = users.find(user => user.id.toString() === refundData.userId);
      if (selectedUser && selectedUser.profile?.operator?.name) {
        setRefundData(prev => ({
          ...prev,
          paymentMethod: selectedUser.profile.operator.name
        }));
      }
    }
  }, [refundData.userId, users]);

  // Fonction pour obtenir la devise selon le pays
  const getCurrencyByCountry = (countryName) => {
    if (!countryName) return "XAF";
    return countryName.toLowerCase() === "gabon" ? "XAF" : "RUB";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Terminé":
        return "bg-green-100 text-green-800 border-green-200";
      case "En cours":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Échoué":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCountryFlag = (countryName) => {
    switch (countryName) {
      case "Gabon":
        return "🇬🇦";
      case "Russie":
        return "🇷🇺";
      default:
        return "🌍";
    }
  };

  const formatTransactionId = (id) => {
    return `TXN${String(id).padStart(3, "0")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount, country = "Gabon") => {
    if (!amount) return "0";
    const currency = country === "Gabon" ? "XAF" : "RUB";
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  // Formater l'affichage des taux de change
  const formatExchangeRate = (rate) => {
    const toCurrency = rate.to_currency.toUpperCase();
    // Si to_currency est XAF → Gabon vers Russie
    // Si to_currency est RUB → Russie vers Gabon
    const direction = toCurrency === "XAF" ? "Gabon → Russie" : "Russie → Gabon";
    return `${rate.from_currency} → ${rate.to_currency} (${direction})`;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesOperator =
      selectedOperator === "all" ||
      transaction.operator_sender?.name === selectedOperator;
    const matchesSearch =
      searchTerm === "" ||
      formatTransactionId(transaction.id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${transaction.sender?.first_name || ""} ${
        transaction.sender?.last_name || ""
      }`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${transaction.receiver?.first_name || ""} ${
        transaction.receiver?.last_name || ""
      }`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesOperator && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleRefresh = () => {
    loadTransactions();
    loadOperatorsData();
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleSaveTransaction = () => {
    console.log("Sauvegarde de la transaction:", selectedTransaction);
    setIsEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleRefund = async () => {
    // Validation des données
    if (!refundData.userId || !refundData.amount || !refundData.transactionReason || 
        !refundData.exchangeRateId || !refundData.sendMethod) {
      console.error("Tous les champs obligatoires doivent être remplis");
      return;
    }

    try {
      // Récupérer l'utilisateur sélectionné
      const selectedUser = users.find(user => user.id.toString() === refundData.userId);
      if (!selectedUser) {
        console.error("Utilisateur introuvable");
        return;
      }

      // Récupérer l'opérateur d'envoi sélectionné
      const selectedOperator = sendOperators.find(op => op.id.toString() === refundData.sendMethod);
      if (!selectedOperator) {
        console.error("Opérateur d'envoi introuvable");
        return;
      }

      // Préparer les données simplifiées pour le backend
      // Le backend va gérer : sender_id, from_country_id, to_country_id, amount_send_code, amount_received_code, transaction_ref
      const payload = {
        receiver_id: parseInt(refundData.userId),
        exchange_rate_id: parseInt(refundData.exchangeRateId),
        amount_sent: parseFloat(refundData.amount),
        operator_sender_id: parseInt(refundData.sendMethod),
        operator_receiver_id: selectedUser.profile?.operator?.id,
        payment_method: selectedOperator.type || "MOBILE MONEY",
        note: `Remboursement - Raison: ${refundData.transactionReason}${refundData.notes ? `\nNotes: ${refundData.notes}` : ""}`
      };

      console.log("Envoi du remboursement:", payload);
      
      // Envoyer la transaction
      const response = await envoyerSafe("api/transactions/create/dgapp", payload, {
        showSuccessToast: true,
        showErrorToast: true,
      });

      if (response.success) {
        // Réinitialiser le formulaire
        setRefundData({
          userId: "",
          paymentMethod: "",
          amount: "",
          transactionReason: "",
          exchangeRateId: "",
          sendMethod: "",
          notes: "",
        });
        setIsRefundModalOpen(false);
        
        // Recharger les transactions
        loadTransactions();
      }
    } catch (error) {
      console.error("Erreur lors du remboursement:", error);
    }
  };

  const getCurrentStats = () => {
    if (operatorsData.length === 0) {
      return {
        gabonTotal: "0",
        russieTotal: "0",
        totalEnvois: 0,
      };
    }

    let gabonTotal = 0;
    let russieTotal = 0;
    let totalEnvois = 0;

    operatorsData.forEach((country) => {
      country.operators.forEach((operator) => {
        const stats = operator.statistics;
        const montantEnvois = parseFloat(stats.montant_total_envois || 0);
        const nbEnvois = parseInt(stats.nombre_envois || 0);

        if (country.name.toLowerCase() === "gabon") {
          gabonTotal += montantEnvois;
        } else if (country.name.toLowerCase() === "russie") {
          russieTotal += montantEnvois;
        }

        totalEnvois += nbEnvois;
      });
    });

    return {
      gabonTotal: gabonTotal.toLocaleString(),
      russieTotal: russieTotal.toLocaleString(),
      totalEnvois,
    };
  };

  const currentStats = getCurrentStats();

  // Préparer les options pour le Combobox des utilisateurs
  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: `${user.full_name} (${user.phone})`
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">
            Gestion des Transactions
          </h2>
          <p className="text-muted-foreground">
            Historique complet et gestion des transactions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsRefundModalOpen(true)}
            className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Remboursement
          </Button>
          <Button
            onClick={handleRefresh}
            className="bg-gradient-primary hover:bg-primary/90"
            disabled={loading || loadingOperators}
          >
            <Activity className="h-4 w-4 mr-2" />
            {loading || loadingOperators ? "Chargement..." : "Actualiser"}
          </Button>
        </div>
      </div>

      {/* Stats globales  */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Total Gabon
            </CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentStats.gabonTotal} XAF
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Total Russie
            </CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentStats.russieTotal} RUB
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nb Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentStats.totalEnvois}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pays Actifs
            </CardTitle>
            <MapPin className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {operatorsData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {operatorsData
                .map((country) => getCountryFlag(country.name))
                .join(" ")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID transaction, expéditeur, destinataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Label htmlFor="country">Pays</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {operatorsData.map((country) => (
                    <SelectItem
                      key={country.id}
                      value={country.name.toLowerCase()}
                    >
                      {getCountryFlag(country.name)} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <Label htmlFor="operator">Opérateur</Label>
              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les opérateurs</SelectItem>
                  {availableOperators.map((operator) => (
                    <SelectItem key={operator} value={operator}>
                      {operator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <Label htmlFor="period">Période</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par opérateur */}
      {selectedCountryData && (
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">
              Comptabilité - {getCountryFlag(selectedCountryData.name)}{" "}
              {selectedCountryData.name}
            </CardTitle>
            <CardDescription>Détails comptables par opérateur</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOperators ? (
              <div className="flex justify-center items-center py-8">
                <Activity className="h-6 w-6 animate-spin mr-2" />
                Chargement des opérateurs...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedCountryData.operators.map((operator) => {
                  const currency = getCurrencyByCountry(
                    selectedCountryData.name
                  );
                  const stats = operator.statistics;

                  return (
                    <div
                      key={operator.id}
                      className="p-6 bg-accent/20 rounded-lg border border-primary/10 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-primary text-lg">
                          {operator.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {selectedPeriod === "general"
                            ? "Général"
                            : selectedPeriod === "today"
                            ? "Aujourd'hui"
                            : "Ce mois"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background/50 p-3 rounded border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Montant Total des envois
                          </p>
                          <p className="font-bold text-primary text-lg">
                            {currency}{" "}
                            {parseFloat(
                              stats.montant_total_envois
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-background/50 p-3 rounded border">
                          <p className="text-xs text-muted-foreground mb-1">
                            Transactions
                          </p>
                          <p className="font-bold text-primary text-lg">
                            {stats.nombre_total_transactions}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm font-medium text-muted-foreground">
                            Commissions perçues
                          </span>
                          <span className="font-semibold text-secondary">
                            {currency}{" "}
                            {parseFloat(stats.commission).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm font-medium text-muted-foreground">
                            Montant total des réceptions
                          </span>
                          <span className="font-semibold text-success">
                            {currency}{" "}
                            {parseFloat(
                              stats.montant_total_receptions
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm font-medium text-muted-foreground">
                            Nombre d'envois
                          </span>
                          <span className="font-semibold text-primary">
                            {stats.nombre_envois}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm font-medium text-muted-foreground">
                            Nombre de réceptions
                          </span>
                          <span className="font-semibold text-warning">
                            {stats.nombre_receptions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Montant moyen/transaction
                          </span>
                          <span className="font-semibold text-muted-foreground">
                            {currency}{" "}
                            {parseFloat(stats.montant_moyen).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-background/30 p-3 rounded border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Performance sur 7 jours
                        </p>
                        <div className="flex items-end gap-1 h-16">
                          {[65, 78, 82, 90, 85, 95, 88].map((height, index) => (
                            <div
                              key={index}
                              className="bg-gradient-primary flex-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Lun</span>
                          <span>Dim</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table des transactions  */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-primary">
            Historique des Transactions
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              Chargement des transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucune transaction disponible</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / Date</TableHead>
                  <TableHead>Expéditeur → Destinataire</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Pays / Opérateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary">
                          {formatTransactionId(transaction.id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {transaction.sender?.first_name || ""}{" "}
                          {transaction.sender?.last_name || ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          → {transaction.receiver?.first_name || ""}{" "}
                          {transaction.receiver?.last_name || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary">
                          {formatAmount(
                            transaction.amount_sent,
                            transaction.from_country?.name
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Frais:{" "}
                          {formatAmount(
                            transaction.trans_fees,
                            transaction.from_country?.name
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {getCountryFlag(transaction.from_country?.name)}{" "}
                          {transaction.operator_sender?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          → {transaction.operator_receiver?.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(transaction.trans_status)}
                      >
                        {transaction.trans_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Transaction</DialogTitle>
            <DialogDescription>
              Informations complètes de la transaction{" "}
              {selectedTransaction &&
                formatTransactionId(selectedTransaction.id)}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      N° Transaction
                    </Label>
                    <p className="text-lg font-bold text-primary">
                      {formatTransactionId(selectedTransaction.id)}
                    </p>
                  </div>
                 
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Type de Transaction
                    </Label>
                    <p className="text-sm">
                      {selectedTransaction.transaction_type}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Méthode de Paiement
                    </Label>
                    <p className="text-sm capitalize">
                      {selectedTransaction.payment_method?.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Statut
                    </Label>
                    <div className="mt-1">
                      <Badge
                        className={getStatusColor(
                          selectedTransaction.trans_status
                        )}
                      >
                        {selectedTransaction.trans_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Statut Système
                    </Label>
                    <p className="text-sm">
                      {selectedTransaction.status ? "Actif" : "Inactif"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Taux de Change
                    </Label>
                    <p className="text-sm font-mono">
                      {selectedTransaction.exchange_rate?.rate}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Date de Création
                    </Label>
                    <p className="text-sm">
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Dernière Mise à Jour
                    </Label>
                    <p className="text-sm">
                      {formatDate(selectedTransaction.updated_at)}
                    </p>
                  </div>
                   <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Référence
                    </Label>
                    <p className="text-sm font-mono">
                      {selectedTransaction.transaction_ref}
                    </p>
                  </div>
                  {selectedTransaction.completed_at && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Date de Completion
                      </Label>
                      <p className="text-sm">
                        {formatDate(selectedTransaction.completed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Montants */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Détails des Montants
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <Label className="text-sm font-medium text-blue-700">
                      Montant Envoyé
                    </Label>
                    <p className="text-xl font-bold text-blue-800">
                      {formatAmount(
                        selectedTransaction.amount_sent,
                        selectedTransaction.from_country?.name
                      )}
                    </p>
                    <p className="text-xs text-blue-600">
                      Code: {selectedTransaction.amount_send_code}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Label className="text-sm font-medium text-green-700">
                      Montant Reçu
                    </Label>
                    <p className="text-xl font-bold text-green-800">
                      {formatAmount(
                        selectedTransaction.amount_received,
                        selectedTransaction.to_country?.name
                      )}
                    </p>
                    <p className="text-xs text-green-600">
                      Code: {selectedTransaction.amount_received_code}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <Label className="text-sm font-medium text-orange-700">
                      Frais gagné sur la transaction
                    </Label>
                    <p className="text-xl font-bold text-orange-800">
                      {formatAmount(selectedTransaction.amount_win)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <Label className="text-sm font-medium text-purple-700">
                      Taux Appliqué
                    </Label>
                    <p className="text-xl font-bold text-purple-800">
                      {parseFloat(
                        selectedTransaction.exchange_rate?.rate || 0
                      ).toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personnes impliquées */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Personnes Impliquées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-accent/20 p-4 rounded-lg border">
                    <h4 className="font-semibold text-primary mb-3">
                      Expéditeur
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Nom Complet
                        </Label>
                        <p className="font-medium">
                          {selectedTransaction.sender?.first_name}{" "}
                          {selectedTransaction.sender?.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Email
                        </Label>
                        <p className="text-sm">
                          {selectedTransaction.sender?.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Téléphone
                        </Label>
                        <p className="text-sm">
                          {selectedTransaction.sender?.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/20 p-4 rounded-lg border">
                    <h4 className="font-semibold text-primary mb-3">
                      Destinataire
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Nom Complet
                        </Label>
                        <p className="font-medium">
                          {selectedTransaction.receiver?.first_name}{" "}
                          {selectedTransaction.receiver?.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Email
                        </Label>
                        <p className="text-sm">
                          {selectedTransaction.receiver?.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Téléphone
                        </Label>
                        <p className="text-sm">
                          {selectedTransaction.receiver?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pays et Opérateurs */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Pays et Opérateurs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">
                      Pays d'émission
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {getCountryFlag(selectedTransaction.from_country?.name)}
                      </span>
                      <span className="font-medium">
                        {selectedTransaction.from_country?.name}
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-600">Opérateur</Label>
                      <p className="font-medium text-blue-800">
                        {selectedTransaction.operator_sender?.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">
                      Pays de Destination
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {getCountryFlag(selectedTransaction.to_country?.name)}
                      </span>
                      <span className="font-medium">
                        {selectedTransaction.to_country?.name}
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs text-green-600">
                        Opérateur
                      </Label>
                      <p className="font-medium text-green-800">
                        {selectedTransaction.operator_receiver?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              {selectedTransaction.note && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Note
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700">
                      {selectedTransaction.note}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de remboursement */}
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Remboursement Utilisateur
            </DialogTitle>
            <DialogDescription>
              Envoyer un remboursement à un utilisateur pour un dédommagement ou erreur système
            </DialogDescription>
          </DialogHeader>
          
          {loadingRefundData ? (
            <div className="flex justify-center items-center py-8">
              <Activity className="h-6 w-6 animate-spin mr-2" />
              Chargement des données...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="refund-userId">Utilisateur</Label>
                  <Combobox
                    options={userOptions}
                    value={refundData.userId}
                    onValueChange={(value) => setRefundData({...refundData, userId: value})}
                    placeholder="Rechercher un utilisateur..."
                    searchPlaceholder="Rechercher par nom ou téléphone..."
                    emptyText="Aucun utilisateur trouvé."
                  />
                </div>
                <div>
                  <Label htmlFor="refund-paymentMethod">Moyen de paiement de l'utilisateur</Label>
                  <Input
                    id="refund-paymentMethod"
                    placeholder="Sélectionnez d'abord un utilisateur"
                    value={refundData.paymentMethod}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="refund-amount">Montant <span className="text-red-500">*</span></Label>
                <Input
                  id="refund-amount"
                  type="number"
                  placeholder="Montant (ex: 50000)"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({...refundData, amount: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="refund-transactionReason">Raison de la transaction <span className="text-red-500">*</span></Label>
                  <Input
                    id="refund-transactionReason"
                    placeholder="Ex: Erreur système..."
                    value={refundData.transactionReason}
                    onChange={(e) => setRefundData({...refundData, transactionReason: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="refund-exchangeRate">Taux de change <span className="text-red-500">*</span></Label>
                  <Select 
                    value={refundData.exchangeRateId} 
                    onValueChange={(value) => setRefundData({...refundData, exchangeRateId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {exchangeRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id.toString()}>
                          {formatExchangeRate(rate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="refund-sendMethod">Moyen d'envoi <span className="text-red-500">*</span></Label>
                  <Select 
                    value={refundData.sendMethod} 
                    onValueChange={(value) => setRefundData({...refundData, sendMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {sendOperators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id.toString()}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="refund-notes">Notes Administratives</Label>
                <Textarea
                  id="refund-notes"
                  placeholder="Détails du remboursement, référence transaction originale, etc..."
                  value={refundData.notes}
                  onChange={(e) => setRefundData({...refundData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundData({
                      userId: "",
                      paymentMethod: "",
                      amount: "",
                      transactionReason: "",
                      exchangeRateId: "",
                      sendMethod: "",
                      notes: "",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleRefund} 
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  disabled={!refundData.userId || !refundData.amount || !refundData.transactionReason || !refundData.exchangeRateId || !refundData.sendMethod}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Envoyer Remboursement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}