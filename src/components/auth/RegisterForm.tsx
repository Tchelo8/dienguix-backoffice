import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EyeIcon, EyeOffIcon, Lock, Mail, User, Phone, Loader2 } from "lucide-react"
import { recupererSafe, afficherToast, envoyerSafe } from "@/lib/transmission"

interface RegisterFormProps {
  onToggleForm: () => void
  onRegister: (data: RegisterData) => void
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  role: string
  country: string
}

interface Role {
  id: number
  name: string
  description: string
  is_active: boolean
  updated_at: string
  created_at: string
  users_count: number
}

interface Country {
  id: number
  name: string
  iso_code: string
  currency_code: string
  is_active: boolean
  status: boolean
}

// Interface pour les données à envoyer à l'API
interface ApiUserData {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  role: number // ID du rôle au lieu du nom
  country: number // ID du pays
}

// Interface pour la réponse de l'API
interface ApiResponse {
  success: boolean
  id?: number
  email?: string
  role?: string
  profile_created?: boolean
  error?: string
}

export function RegisterForm({ onToggleForm, onRegister }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "1",
    country: "1"
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)

  // Récupération des rôles au montage du composant
  useEffect(() => {
    const chargerRoles = async () => {
      try {
        setRolesLoading(true)

        // Utilisation de recupererSafe pour une meilleure gestion des erreurs
        const response = await recupererSafe<Role[]>('api/role/listing', {
          showErrorToast: false, // On gère nous-mêmes les erreurs
          showSuccessToast: false,
          errorMessage: "Erreur lors du chargement des rôles"
        })

        // console.log('Réponse chargement rôles:', response)

        if (response.success && response.data && Array.isArray(response.data)) {
          // Filtrer seulement les rôles actifs
          const rolesActifs = response.data.filter(role => role.is_active)
          setRoles(rolesActifs)

          // console.log('Rôles actifs chargés:', rolesActifs)

          // Définir un rôle par défaut si disponible
          if (rolesActifs.length > 0) {
            // Chercher un rôle "Administrateur" ou "Opérateur" ou prendre le premier
            const defaultRole = rolesActifs.find(role =>
              role.name.toLowerCase().includes('opérateur') ||
              role.name.toLowerCase().includes('operator')
            ) || rolesActifs[0]

            if (defaultRole && defaultRole.id) {
              setFormData(prev => ({ ...prev, role: defaultRole.id.toString() }))
            }
          }
        } else {
          // Si erreur ou pas de données, utiliser des rôles par défaut
          console.warn('Erreur lors du chargement des rôles:', response.error)
          const defaultRoles: Role[] = [
            {
              id: 1,
              name: "Administrateur",
              description: "Profil destiné à administrer la plateforme",
              is_active: true,
              updated_at: "",
              created_at: "",
              users_count: 0
            },
            {
              id: 2,
              name: "Opérateur",
              description: "Profil destiné aux opérations courantes",
              is_active: true,
              updated_at: "",
              created_at: "",
              users_count: 0
            }
          ]
          setRoles(defaultRoles)
          setFormData(prev => ({ ...prev, role: "1" }))

          // Afficher un avertissement si échec du chargement
          if (!response.success) {
            afficherToast.avertissement(
              "Impossible de charger les rôles du serveur. Utilisation des rôles par défaut.",
              "Avertissement"
            )
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des rôles:', error)
        // En cas d'erreur, utiliser des rôles par défaut
        const defaultRoles: Role[] = [
          {
            id: 1,
            name: "Administrateur",
            description: "Profil destiné à administrer la plateforme",
            is_active: true,
            updated_at: "",
            created_at: "",
            users_count: 0
          },
          {
            id: 2,
            name: "Opérateur",
            description: "Profil destiné aux opérations courantes",
            is_active: true,
            updated_at: "",
            created_at: "",
            users_count: 0
          }
        ]
        setRoles(defaultRoles)
        setFormData(prev => ({ ...prev, role: "1" }))

        afficherToast.erreur(
          "Erreur lors du chargement des rôles. Utilisation des rôles par défaut.",
          "Erreur de connexion"
        )
      } finally {
        setRolesLoading(false)
      }
    }

    chargerRoles()
  }, [])

  // Récupération des pays au montage du composant
  useEffect(() => {
    const chargerPays = async () => {
      try {
        setCountriesLoading(true)
        const response = await recupererSafe('api/countries/get', {
          showErrorToast: false,
          showSuccessToast: false
        })

        // console.log('Réponse chargement pays:', response)

        if (response.success && response.data && Array.isArray(response.data)) {
          const paysActifs = response.data.filter((country: Country) => country.is_active && country.status)
          setCountries(paysActifs)
          // console.log('Pays actifs chargés:', paysActifs)
          
          if (paysActifs.length > 0) {
            setFormData(prev => ({ ...prev, country: paysActifs[0].id.toString() }))
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des pays:', error)
      } finally {
        setCountriesLoading(false)
      }
    }

    chargerPays()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation des mots de passe
    if (formData.password !== confirmPassword) {
      afficherToast.erreur("Les mots de passe ne correspondent pas", "Erreur de validation")
      return
    }

    // Validation de la sélection du rôle
    if (!formData.role) {
      afficherToast.erreur("Veuillez sélectionner un rôle", "Erreur de validation")
      return
    }

    // Validation de la sélection du pays
    if (!formData.country) {
      afficherToast.erreur("Veuillez sélectionner un pays", "Erreur de validation")
      return
    }

    // Validation basique des champs requis
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      afficherToast.erreur("Tous les champs sont obligatoires", "Erreur de validation")
      return
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      afficherToast.erreur("Veuillez saisir une adresse email valide", "Erreur de validation")
      return
    }

    // Validation du mot de passe (minimum 8 caractères)
    if (formData.password.length < 8) {
      afficherToast.erreur("Le mot de passe doit contenir au moins 8 caractères", "Erreur de validation")
      return
    }

    setIsLoading(true)

    try {
      // Trouver le rôle sélectionné pour l'affichage
      const selectedRole = roles.find(role => role.id.toString() === formData.role)

      // Préparer les données pour l'API selon le format attendu par le backend
      const apiData: ApiUserData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: parseInt(formData.role), // Envoyer l'ID du rôle comme nombre
        country: parseInt(formData.country) // Envoyer l'ID du pays comme nombre
      }

      console.log('Données envoyées à l\'API:', apiData)

      // Appel API pour créer l'utilisateur avec envoyerSafe
      const response = await envoyerSafe<ApiResponse>('api/users/v1', apiData, {
        showSuccessToast: false, // On gère nous-même le toast de succès
        showErrorToast: false,   // On gère nous-même les erreurs
        successMessage: "Compte créé avec succès",
        errorMessage: "Erreur lors de la création du compte"
      })

      // console.log('Réponse de l\'API:', response)

      if (response.success && response.data) {
        // Succès - response.data contient les données de l'utilisateur créé
        const roleName = selectedRole ? selectedRole.name : response.data.role || 'Inconnu'

        afficherToast.succes(
          `Compte créé avec succès pour ${response.data.email}. Rôle: ${roleName}${response.data.profile_created ? ' - Profil créé automatiquement' : ''}`,
          "Inscription réussie"
        )

        // Réinitialiser le formulaire
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          role: roles.length > 0 ? roles[0].id.toString() : "1",
          country: countries.length > 0 ? countries[0].id.toString() : "1"
        })
        setConfirmPassword("")

        // Appeler la fonction onRegister du parent
        // onRegister(formData) supprimer car provoquait une mésentente lors de l'inscription

        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          onToggleForm()
        }, 2000)

      } else {
        // Erreur - maintenant on peut récupérer l'erreur exacte du backend !
        const errorMessage = response.error || "Erreur lors de la création du compte"

        console.error('Erreur lors de la création:', {
          error: response.error,
          statusCode: response.statusCode,
          success: response.success
        })

        // Gestion spécifique selon le type d'erreur
        if (response.statusCode === 400) {
          // Erreur de validation
          afficherToast.erreur(errorMessage, "Données invalides")
        } else if (response.statusCode === 409) {
          // Conflit - probablement email déjà existant
          afficherToast.erreur(errorMessage, "Email déjà utilisé")
          // Focus sur le champ email si erreur liée à l'email
          const emailInput = document.getElementById('email') as HTMLInputElement
          if (emailInput) {
            emailInput.focus()
            emailInput.select()
          }
        } else if (response.statusCode === 422) {
          // Erreur de validation côté serveur
          afficherToast.erreur("Vérifiez les données saisies", "Validation échouée")
        } else {
          // Autres erreurs
          afficherToast.erreur(errorMessage, "Erreur de création")
        }

        // Gestion spécifique si erreur contient certains mots clés
        if (errorMessage.toLowerCase().includes('email')) {
          // Focus sur le champ email si erreur liée à l'email
          const emailInput = document.getElementById('email') as HTMLInputElement
          if (emailInput) {
            emailInput.focus()
            emailInput.select()
          }
        } else if (errorMessage.toLowerCase().includes('password')) {
          // Focus sur le champ password si erreur liée au mot de passe
          const passwordInput = document.getElementById('password') as HTMLInputElement
          if (passwordInput) {
            passwordInput.focus()
            passwordInput.select()
          }
        } else if (errorMessage.toLowerCase().includes('phone')) {
          // Focus sur le champ téléphone si erreur liée au téléphone
          const phoneInput = document.getElementById('phone') as HTMLInputElement
          if (phoneInput) {
            phoneInput.focus()
            phoneInput.select()
          }
        }
      }

    } catch (error) {
      // Cette partie gère les erreurs inattendues (problèmes de réseau, etc.)
      console.error('Erreur inattendue lors de la création du compte:', error)

      const errorMessage = error instanceof Error
        ? error.message
        : "Une erreur inattendue s'est produite lors de la création du compte"

      afficherToast.erreur(errorMessage, "Erreur système")

    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-5xl animate-fade-in">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden">
          <img
            src="/images/Dienguix.jpeg"
            alt="Dienguix Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <CardTitle className="text-2xl text-primary">Créer un compte</CardTitle>
          <CardDescription className="text-muted-foreground">
            Interface d'administration - Créez votre compte admin
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-primary">Prénom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-primary">Nom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@dienguix.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-primary">Téléphone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="+237 6XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-primary">Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => updateFormData("role", value)}
                disabled={rolesLoading || isLoading}
              >
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  {rolesLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement des rôles...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>

                      </div>
                    </SelectItem>
                  ))}
                  {roles.length === 0 && !rolesLoading && (
                    <SelectItem value="no-roles" disabled>
                      Aucun rôle disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-primary">Pays *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => updateFormData("country", value)}
                disabled={countriesLoading || isLoading}
              >
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  {countriesLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Sélectionnez un pays" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary">Mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="pl-10 pr-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-primary">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 border-primary/20 focus:border-primary"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading || rolesLoading || countriesLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Création en cours...</span>
              </div>
            ) : (
              "Créer le compte"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Déjà un compte? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-secondary hover:text-secondary/80"
              onClick={onToggleForm}
              disabled={isLoading}
            >
              Se connecter
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}