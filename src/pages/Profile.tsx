import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Key, 
  Bell,
  Eye,
  EyeOff,
  Camera,
  Save,
  Settings,
  Activity,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { obtenirUtilisateur,envoyerSafeWithToken } from "@/lib/transmission" 

const profileSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  address: z.string().optional(),
  bio: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Au moins 8 caractères"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// Interface pour les données utilisateur
interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: boolean
  status: boolean
  created_at: string
  updated_at: string
  last_login_at: string
  country: {
    id: number
    name: string
  }
  role: {
    id: number
    name: string
  }
  user_profile: {
    id: number
    address: string
    photo: string | null
    city: string
    birth_date: string
    verified: boolean
    gender: string
    status: boolean
    document_number: string
    document_file: string
    created_at: string
    updated_at: string
    document: any
  }
}

const mockActivityLog = [
  { date: "2024-01-15 14:30", action: "Connexion à l'administration", ip: "192.168.1.100" },
  { date: "2024-01-15 14:25", action: "Modification du taux USD/XOF", ip: "192.168.1.100" },
  { date: "2024-01-15 14:20", action: "Validation transaction #TR123456", ip: "192.168.1.100" },
  { date: "2024-01-15 14:15", action: "Ajout nouvel utilisateur", ip: "192.168.1.100" },
  { date: "2024-01-15 14:10", action: "Export rapport mensuel", ip: "192.168.1.100" },
]

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    security: true
  })
  const { toast } = useToast()

  // Chargement des données utilisateur au montage du composant
  useEffect(() => {
    const user = obtenirUtilisateur()
    if (user) {
      setUserData(user)
    }
  }, [])

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userData?.first_name || "",
      lastName: userData?.last_name || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      address: userData?.user_profile?.address || "",
      bio: "",
    }
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  // Mettre à jour les valeurs du formulaire quand userData change
  useEffect(() => {
    if (userData) {
      profileForm.reset({
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        address: userData.user_profile?.address || "",
        bio: "",
      })
    }
  }, [userData, profileForm])

  const handleProfileSubmit = (data: ProfileForm) => {
    
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
    })
  }

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPassword(true)

    
    try {
      // Appel à l'API pour changer le mot de passe
      const response = await envoyerSafeWithToken(
        "user/security/change-password",
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        },
        {
          showSuccessToast: false, // On gère le toast manuellement
          showErrorToast: false,   // On gère les erreurs manuellement
        }
      )

      if (response.success) {
        // Succès - réinitialiser le formulaire et afficher le toast
        passwordForm.reset()
        toast({
          title: "Mot de passe modifié",
          description: response.data?.message || "Votre mot de passe a été mis à jour avec succès.",
          className: "bg-green-500 text-white",
        })
      } else {
        // Erreur retournée par l'API
        toast({
          variant: "destructive",
          title: "Erreur",
          description: response.error || "Une erreur est survenue lors du changement de mot de passe.",
        })
      }
    } catch (error) {
      // Erreur inattendue
      console.error("Erreur lors du changement de mot de passe:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue. Veuillez réessayer.",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAvatarChange = () => {
    // Simulate avatar upload
    toast({
      title: "Photo de profil",
      description: "Votre photo de profil a été mise à jour.",
    })
  }

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    toast({
      title: "Préférences mises à jour",
      description: "Vos préférences de notification ont été sauvegardées.",
    })
  }

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  // Si les données ne sont pas encore chargées
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Chargement des données utilisateur...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et paramètres</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Profil</CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.user_profile?.photo || ""} />
                    <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-xl">
                      {userData.first_name[0]}{userData.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{userData.first_name} {userData.last_name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-gradient-secondary">
                      <Shield className="mr-1 h-3 w-3" />
                      {userData.role.name}
                    </Badge>
                    <Badge variant={userData.is_active ? "default" : "destructive"}>
                      {userData.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membre depuis {formatDate(userData.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      Dernière connexion: {formatDateTime(userData.last_login_at)}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="Votre adresse..." {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biographie</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Parlez-nous de vous..." 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder les modifications
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Informations Complémentaires */}
          <Card>
            <CardHeader>
              <CardTitle>Informations Supplémentaires</CardTitle>
              <CardDescription>
                Détails complémentaires de votre profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Ville</label>
                  <p className="text-sm">{userData.user_profile?.city || "Non renseignée"}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                  <p className="text-sm">{userData.user_profile?.birth_date ? formatDate(userData.user_profile.birth_date) : "Non renseignée"}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Genre</label>
                  <p className="text-sm">{userData.user_profile?.gender === "unknown" ? "Non spécifié" : userData.user_profile?.gender || "Non renseigné"}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Statut de vérification  </label>
                  <Badge variant={userData.user_profile?.verified ? "default" : "secondary"}>
                    {userData.user_profile?.verified ? "Vérifié" : "Non vérifié"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations du Compte */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Compte</CardTitle>
              <CardDescription>
                Détails techniques de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">N° Utilisateur</label>
                  <p className="text-sm font-mono">#00{userData.id}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Pays</label>
                  <p className="text-sm">{userData.country.name || "Non renseigné"}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Compte créé le</label>
                  <p className="text-sm">{formatDateTime(userData.created_at)}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
                  <p className="text-sm">{formatDateTime(userData.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du Compte</CardTitle>
              <CardDescription>
                Modifiez votre mot de passe et gérez la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showCurrentPassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              disabled={isChangingPassword}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              disabled={isChangingPassword}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showNewPassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              disabled={isChangingPassword}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              disabled={isChangingPassword}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              className="pl-10 pr-10"
                              disabled={isChangingPassword}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={isChangingPassword}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Votre mot de passe doit contenir au moins 8 caractères avec une combinaison 
                      de lettres, chiffres et caractères spéciaux.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Modification en cours...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Modifier le mot de passe
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de Notification</CardTitle>
              <CardDescription>
                Configurez comment vous souhaitez recevoir les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Notifications Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recevez les notifications importantes par email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Notifications SMS</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recevez les alertes critiques par SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(value) => handleNotificationChange('sms', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="font-medium">Notifications Push</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Notifications instantanées dans le navigateur
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Alertes de Sécurité</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Notifications de sécurité et connexions suspectes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.security}
                    onCheckedChange={(value) => handleNotificationChange('security', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'Activité</CardTitle>
              <CardDescription>
                Historique de vos dernières actions dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivityLog.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{activity.date}</span>
                        <span>IP: {activity.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}