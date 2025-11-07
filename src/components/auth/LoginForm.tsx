import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, Lock, Mail } from "lucide-react"
import { envoyerSafe, afficherToast } from "@/lib/transmission"
import { CodeOtpForm } from "./CodeOtpForm"

interface LoginFormProps {
  onToggleForm: () => void
  onLogin: (email: string, password: string) => void
}

export function LoginForm({ onToggleForm, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await envoyerSafe(
        "api/auth/login/dgapp",
        {
          email,
          password
        },
        {
          showSuccessToast: false,
          showErrorToast: false
        }
      )

      if (response.success) {
        // Connexion réussie, afficher le formulaire OTP
        afficherToast.succes("Code OTP envoyé par email", "Vérification requise")
        setShowOtpForm(true)
      } else {
        // Gérer les erreurs spécifiques du serveur
        if (response.statusCode === 429) {
          afficherToast.avertissement("Trop de tentatives de connexion. Réessayez plus tard.", "Limite atteinte")
        } else if (response.statusCode === 422) {
          afficherToast.erreur("Email ou mot de passe incorrect", "Identifiants invalides")
        } else {
          afficherToast.erreur(response.error || "Erreur lors de la connexion", "Erreur de connexion")
        }
        setError(response.error || "Erreur lors de la connexion frontend 1")
      }
    } catch (error) {
      console.error("Erreur lors de la connexion front end 2:", error)
      afficherToast.erreur("Impossible de se connecter au serveur", "Erreur de connexion")
      setError("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSuccess = (token: string, userData: any) => {
    // Sauvegarder les données d'authentification et rediriger
    onLogin(email, password)
  }

  const handleBackToLogin = () => {
    setShowOtpForm(false)
    setError("")
  }

  // Si on doit afficher le formulaire OTP
  if (showOtpForm) {
    return (
      <CodeOtpForm
        email={email}
        onSuccess={handleOtpSuccess}
        onBack={handleBackToLogin}
      />
    )
  }

  return (
    <Card className="w-full max-w-md animate-fade-in">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden">
          <img
            src="/images/Dienguix.jpeg"
            alt="Dienguix Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <CardTitle className="text-2xl text-primary">Bienvenue sur DIENGUIX</CardTitle>
          <CardDescription className="text-muted-foreground">
            Interface d'administration - Connectez-vous à votre compte
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@dienguix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-primary">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 border-primary/20 focus:border-primary"
                required
                disabled={isLoading}
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
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Pas encore de compte? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-secondary hover:text-secondary/80"
              onClick={onToggleForm}
              disabled={isLoading}
            >
              S'inscrire
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}