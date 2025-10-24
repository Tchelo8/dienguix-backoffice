import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Mail,
  Edit,
  Shield,
  Users as UsersIcon,
  Crown,
  RefreshCw,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  envoyerSafe,
  mettreAJourSafe,
  recupererSafe,
} from "@/lib/transmission";

// Interface pour les données de l'API
interface ApiUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string;
  country: {
    id: number;
    name: string;
  };
  role: {
    id: number;
    name: string;
  };
  profile: {
    id: number;
    address: string;
    city: string;
    gender: string;
    birth_date: string;
    verified: boolean;
    status: boolean;
    document_number: string;
    document_file: string;
    created_at: string;
    updated_at: string;
  };
  transactions_stats: {
    sent_count: number;
    received_count: number;
    total_transactions: number;
  };
}

// Interface pour la réponse de l'API
interface ApiResponse {
  success: boolean;
  data: ApiUser[];
  count: number;
}

const Users = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageNormal, setCurrentPageNormal] = useState(1);
  const [currentPageAdmin, setCurrentPageAdmin] = useState(1);
  const [roles, setRoles] = useState<any[]>([]);
  const itemsPerPage = 10;

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    const chargerUtilisateurs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await recupererSafe("api/users/list/all/dgapp", {
          showSuccessToast: false,
          showErrorToast: true,
        });

        if (response.success && response.data) {
          // Les utilisateurs sont directement dans response.data, pas response.data.data
          setUsers(response.data);
        } else {
          setError(
            response.error || "Erreur lors du chargement des utilisateurs"
          );
        }
      } catch (error) {
        setError("Erreur de connexion");
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    };

    const chargerRoles = async () => {
      try {
        const response = await recupererSafe("api/role/listing", {
          showSuccessToast: false,
          showErrorToast: false,
        });

        if (response.success && response.data) {
          setRoles(response.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des rôles:", error);
      }
    };

    chargerRoles();
    chargerUtilisateurs();
  }, []);

  // Séparer les utilisateurs par rôle (avec vérification de sécurité)
  const adminUsers = users
    ? users.filter((user) => user.role.name === "Administrateur")
    : [];
  const clientUsers = users
    ? users.filter((user) => user.role.name !== "Administrateur")
    : [];

  const filteredUsers = (userList: ApiUser[]) => {
    return userList.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole =
        filterRole === "all" ||
        (filterRole === "admin" && user.role.name === "Administrateur") ||
        (filterRole === "client" && user.role.name !== "Administrateur");
      return matchesSearch && matchesRole;
    });
  };

  const paginatedClientUsers = () => {
    const filtered = filteredUsers(clientUsers);
    const startIndex = (currentPageNormal - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const paginatedAdminUsers = () => {
    const filtered = filteredUsers(adminUsers);
    const startIndex = (currentPageAdmin - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPagesClient = Math.ceil(
    filteredUsers(clientUsers).length / itemsPerPage
  );
  const totalPagesAdmin = Math.ceil(
    filteredUsers(adminUsers).length / itemsPerPage
  );

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await recupererSafe("api/users/list/all/dgapp", {
        showSuccessToast: false,
        showErrorToast: true,
      });

      if (response.success && response.data) {

        setUsers(response.data);
      } else {
        setError(response.error || "Erreur lors de l'actualisation");
      }
    } catch (error) {
      setError("Erreur de connexion");
      console.error("Erreur lors de l'actualisation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      const response = await envoyerSafe(
        `api/users/${userId}/status`,
        {
          is_active: !user.is_active,
        },
        {
          showSuccessToast: true,
          showErrorToast: true,
          successMessage: `Utilisateur ${
            !user.is_active ? "activé" : "désactivé"
          } avec succès`,
        }
      );

      if (response.success) {
        // Mettre à jour l'état local
        setUsers(
          users.map((u) =>
            u.id === userId
              ? { ...u, is_active: !u.is_active, status: !u.status }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
    }
  };

  const handleSendInvitation = async (formData: any) => {
    try {
      const response = await envoyerSafe(
        "api/users/invite",
        {
          email: formData.email,
          role: formData.role,
          message: formData.message,
        },
        {
          showSuccessToast: true,
          showErrorToast: true,
          successMessage: "Invitation envoyée avec succès",
        }
      );

      if (response.success) {
        setIsInviteModalOpen(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await mettreAJourSafe(
        `api/users/${userId}/role`,
        {
          role: newRole,
        },
        {
          showSuccessToast: true,
          showErrorToast: true,
          successMessage: "Rôle modifié avec succès",
        }
      );

      if (response.success) {
        // Mettre à jour l'utilisateur dans la liste
        setUsers(
          users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  role: {
                    ...user.role,
                    name: newRole === "client" ? "Client" : "Administrateur",
                  },
                }
              : user
          )
        );
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Erreur lors de la modification du rôle:", error);
    }
  };

  const handleAddUser = (formData: any) => {
    console.log("Utilisateur ajouté:", formData);
    setIsAddModalOpen(false);
  };

  const getRoleColor = (roleName: string) => {
    return roleName === "Administrateur" ? "bg-red-500" : "bg-green-500";
  };

  const getRoleIcon = (roleName: string) => {
    return roleName === "Administrateur" ? (
      <Crown className="h-3 w-3" />
    ) : (
      <UsersIcon className="h-3 w-3" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Calculer les statistiques (avec vérification de sécurité)
  const totalUsers = users ? users.length : 0;
  const activeUsers = users ? users.filter((u) => u.is_active).length : 0;
  const totalAdmins = adminUsers.length;
  const totalClients = clientUsers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs, leurs rôles et permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>

          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Inviter par Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envoyer une Invitation</DialogTitle>
                <DialogDescription>
                  Invitez un nouvel utilisateur à rejoindre la plateforme
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSendInvitation({
                    email: formData.get("email"),
                    role: formData.get("role"),
                    message: formData.get("message"),
                  });
                }}
              >
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="administrateur">
                          Administrateur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">
                      Message personnalisé (optionnel)
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Message d'invitation personnalisé..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Envoyer l'Invitation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              {/*   <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter Utilisateur
              </Button>
              */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Nouvel Utilisateur</DialogTitle>
                <DialogDescription>
                  Créez un nouveau compte utilisateur avec un rôle assigné
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddUser({
                    first_name: formData.get("first_name"),
                    last_name: formData.get("last_name"),
                    email: formData.get("email"),
                    phone: formData.get("phone"),
                    role: formData.get("role"),
                    country: formData.get("country"),
                  });
                }}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        placeholder="Jean"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        placeholder="Dupont"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+241 06 12 34 56"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Select name="country" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gabon">Gabon</SelectItem>
                        <SelectItem value="russie">Russie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="administrateur">
                          Administrateur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Créer l'Utilisateur
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Utilisateurs
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs Actifs
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administrateurs
            </CardTitle>
            <Crown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdmins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs Clients
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux par onglets */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">
            Utilisateurs Clients ({totalClients})
          </TabsTrigger>
          <TabsTrigger value="admin">
            Administrateurs ({totalAdmins})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs Clients</CardTitle>
              <CardDescription>
                Liste des utilisateurs inscrits depuis l'application mobile en
                tant que client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClientUsers().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <UsersIcon className="h-12 w-12 text-muted-foreground" />
                          <div className="text-lg font-medium text-muted-foreground">
                            Aucun utilisateur client trouvé
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {searchTerm || filterRole !== "all"
                              ? "Aucun utilisateur ne correspond aux critères de recherche"
                              : "Il n'y a pas encore d'utilisateurs clients dans le système"}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClientUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.country.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {user.transactions_stats.total_transactions}{" "}
                              transactions
                            </div>
                            <div className="text-muted-foreground">
                              {user.transactions_stats.sent_count} envoyées,{" "}
                              {user.transactions_stats.received_count} reçues
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={() =>
                                handleToggleStatus(user.id)
                              }
                            />
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                              className={
                                user.is_active ? "bg-green-500" : "bg-gray-500"
                              }
                            >
                              {user.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog
                              open={
                                isViewModalOpen && selectedUser?.id === user.id
                              }
                              onOpenChange={(open) => {
                                setIsViewModalOpen(open);
                                if (open) setSelectedUser(user);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Détails Complets - {user.full_name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Toutes les informations de l'utilisateur
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Informations Personnelles
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Nom complet
                                              </Label>
                                              <div className="font-medium">
                                                {selectedUser.full_name}
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Genre
                                              </Label>
                                              <div className="capitalize">
                                                {selectedUser.profile.gender}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Date de naissance
                                              </Label>
                                              <div>
                                                {formatDate(
                                                  selectedUser.profile
                                                    .birth_date
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Téléphone
                                              </Label>
                                              <div>{selectedUser.phone}</div>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Email
                                            </Label>
                                            <div>{selectedUser.email}</div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Adresse complète
                                            </Label>
                                            <div>
                                              <div>
                                                {selectedUser.profile.address}
                                              </div>
                                              <div>
                                                {selectedUser.profile.city}
                                              </div>
                                              <div>
                                                {selectedUser.country.name}
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Informations Système
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Rôle
                                            </Label>
                                            <div>
                                              <Badge
                                                className={getRoleColor(
                                                  selectedUser.role.name
                                                )}
                                              >
                                                {getRoleIcon(
                                                  selectedUser.role.name
                                                )}
                                                <span className="ml-1">
                                                  {selectedUser.role.name}
                                                </span>
                                              </Badge>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Statut
                                            </Label>
                                            <div>
                                              <Badge
                                                variant={
                                                  selectedUser.is_active
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={
                                                  selectedUser.is_active
                                                    ? "bg-green-500"
                                                    : "bg-gray-500"
                                                }
                                              >
                                                {selectedUser.is_active
                                                  ? "Actif"
                                                  : "Inactif"}
                                              </Badge>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Vérification
                                            </Label>
                                            <div>
                                              <Badge
                                                variant={
                                                  selectedUser.profile.verified
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={
                                                  selectedUser.profile.verified
                                                    ? "bg-blue-500"
                                                    : "bg-orange-500"
                                                }
                                              >
                                                {selectedUser.profile.verified
                                                  ? "Vérifié"
                                                  : "Non vérifié"}
                                              </Badge>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">
                                          Document d'Identité
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Numéro de document
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              {selectedUser.profile
                                                .document_number ||
                                                "Non renseigné"}
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Document PDF
                                            </Label>
                                            <div>
                                              {selectedUser.profile
                                                .document_file ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  asChild
                                                >
                                                  <a
                                                    href={
                                                      selectedUser.profile
                                                        .document_file
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Télécharger
                                                  </a>
                                                </Button>
                                              ) : (
                                                <span className="text-muted-foreground">
                                                  Aucun document
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Date d'inscription
                                            </Label>
                                            <div>
                                              {formatDate(
                                                selectedUser.created_at
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">
                                          Statistiques des Transactions
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                              {
                                                selectedUser.transactions_stats
                                                  .total_transactions
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions totales
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-chart-2">
                                              {
                                                selectedUser.transactions_stats
                                                  .sent_count
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions envoyées
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-chart-3">
                                              {
                                                selectedUser.transactions_stats
                                                  .received_count
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions reçues
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold">
                                              {formatDate(
                                                selectedUser.last_login_at
                                              )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Dernière connexion
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={
                                isEditModalOpen && selectedUser?.id === user.id
                              }
                              onOpenChange={(open) => {
                                setIsEditModalOpen(open);
                                if (open) setSelectedUser(user);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier Rôle
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier le Rôle</DialogTitle>
                                  <DialogDescription>
                                    Changer le rôle de {user.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rôle actuel</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        className={getRoleColor(user.role.name)}
                                      >
                                        {getRoleIcon(user.role.name)}
                                        <span className="ml-1">
                                          {user.role.name}
                                        </span>
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Nouveau rôle</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        handleRoleChange(user.id, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un nouveau rôle" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roles.map((role) => (
                                          <SelectItem
                                            key={role.id}
                                            value={role.name}
                                          >
                                            {role.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination pour utilisateurs clients */}
          {totalPagesClient > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPageNormal(
                          Math.max(1, currentPageNormal - 1)
                        );
                      }}
                      className={
                        currentPageNormal === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: totalPagesClient },
                    (_, i) => i + 1
                  ).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPageNormal(page);
                        }}
                        isActive={currentPageNormal === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPageNormal(
                          Math.min(totalPagesClient, currentPageNormal + 1)
                        );
                      }}
                      className={
                        currentPageNormal === totalPagesClient
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrateurs</CardTitle>
              <CardDescription>
                Liste des utilisateurs avec privilèges administratifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Dernière Connexion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAdminUsers().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Crown className="h-12 w-12 text-muted-foreground" />
                          <div className="text-lg font-medium text-muted-foreground">
                            Aucun administrateur trouvé
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {searchTerm || filterRole !== "all"
                              ? "Aucun administrateur ne correspond aux critères de recherche"
                              : "Il n'y a pas encore d'administrateurs dans le système"}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAdminUsers().map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role.name)}>
                            {getRoleIcon(user.role.name)}
                            <span className="ml-1">{user.role.name}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.country.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.last_login_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={() =>
                                handleToggleStatus(user.id)
                              }
                            />
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                              className={
                                user.is_active ? "bg-green-500" : "bg-gray-500"
                              }
                            >
                              {user.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog
                              open={
                                isViewModalOpen && selectedUser?.id === user.id
                              }
                              onOpenChange={(open) => {
                                setIsViewModalOpen(open);
                                if (open) setSelectedUser(user);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Détails Complets - {user.full_name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Toutes les informations de l'utilisateur
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUser && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Informations Personnelles
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Nom complet
                                              </Label>
                                              <div className="font-medium">
                                                {selectedUser.full_name}
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Genre
                                              </Label>
                                              <div className="capitalize">
                                                {selectedUser.profile.gender}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Date de naissance
                                              </Label>
                                              <div>
                                                {formatDate(
                                                  selectedUser.profile
                                                    .birth_date
                                                )}
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">
                                                Téléphone
                                              </Label>
                                              <div>{selectedUser.phone}</div>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Email
                                            </Label>
                                            <div>{selectedUser.email}</div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Adresse complète
                                            </Label>
                                            <div>
                                              <div>
                                                {selectedUser.profile.address}
                                              </div>
                                              <div>
                                                {selectedUser.profile.city}
                                              </div>
                                              <div>
                                                {selectedUser.country.name}
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>

                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Informations Système
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Rôle
                                            </Label>
                                            <div>
                                              <Badge
                                                className={getRoleColor(
                                                  selectedUser.role.name
                                                )}
                                              >
                                                {getRoleIcon(
                                                  selectedUser.role.name
                                                )}
                                                <span className="ml-1">
                                                  {selectedUser.role.name}
                                                </span>
                                              </Badge>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Statut
                                            </Label>
                                            <div>
                                              <Badge
                                                variant={
                                                  selectedUser.is_active
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={
                                                  selectedUser.is_active
                                                    ? "bg-green-500"
                                                    : "bg-gray-500"
                                                }
                                              >
                                                {selectedUser.is_active
                                                  ? "Actif"
                                                  : "Inactif"}
                                              </Badge>
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Vérification
                                            </Label>
                                            <div>
                                              <Badge
                                                variant={
                                                  selectedUser.profile.verified
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={
                                                  selectedUser.profile.verified
                                                    ? "bg-blue-500"
                                                    : "bg-orange-500"
                                                }
                                              >
                                                {selectedUser.profile.verified
                                                  ? "Vérifié"
                                                  : "Non vérifié"}
                                              </Badge>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">
                                          Document d'Identité
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Numéro de document
                                            </Label>
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4" />
                                              {selectedUser.profile
                                                .document_number ||
                                                "Non renseigné"}
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Document PDF
                                            </Label>
                                            <div>
                                              {selectedUser.profile
                                                .document_file ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  asChild
                                                >
                                                  <a
                                                    href={
                                                      selectedUser.profile
                                                        .document_file
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                  >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Télécharger
                                                  </a>
                                                </Button>
                                              ) : (
                                                <span className="text-muted-foreground">
                                                  Aucun document
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <Label className="text-sm font-medium text-muted-foreground">
                                              Date d'inscription
                                            </Label>
                                            <div>
                                              {formatDate(
                                                selectedUser.created_at
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-lg">
                                          Statistiques des Transactions
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                              {
                                                selectedUser.transactions_stats
                                                  .total_transactions
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions totales
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-chart-2">
                                              {
                                                selectedUser.transactions_stats
                                                  .sent_count
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions envoyées
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold text-chart-3">
                                              {
                                                selectedUser.transactions_stats
                                                  .received_count
                                              }
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Transactions reçues
                                            </div>
                                          </div>

                                          <div className="text-center p-4 bg-accent/50 rounded-lg">
                                            <div className="text-2xl font-bold">
                                              {formatDate(
                                                selectedUser.last_login_at
                                              )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              Dernière connexion
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={
                                isEditModalOpen && selectedUser?.id === user.id
                              }
                              onOpenChange={(open) => {
                                setIsEditModalOpen(open);
                                if (open) setSelectedUser(user);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="mr-2 h-4 w-4" />
                                  Modifier Rôle
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modifier le Rôle</DialogTitle>
                                  <DialogDescription>
                                    Changer le rôle de {user.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rôle actuel</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        className={getRoleColor(user.role.name)}
                                      >
                                        {getRoleIcon(user.role.name)}
                                        <span className="ml-1">
                                          {user.role.name}
                                        </span>
                                      </Badge>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Nouveau rôle</Label>
                                    <Select
                                      onValueChange={(value) =>
                                        handleRoleChange(user.id, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un nouveau rôle" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roles.map((role) => (
                                          <SelectItem
                                            key={role.id}
                                            value={role.name}
                                          >
                                            {role.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination pour administrateurs */}
          {totalPagesAdmin > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPageAdmin(Math.max(1, currentPageAdmin - 1));
                      }}
                      className={
                        currentPageAdmin === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPagesAdmin }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPageAdmin(page);
                          }}
                          isActive={currentPageAdmin === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPageAdmin(
                          Math.min(totalPagesAdmin, currentPageAdmin + 1)
                        );
                      }}
                      className={
                        currentPageAdmin === totalPagesAdmin
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Users;
