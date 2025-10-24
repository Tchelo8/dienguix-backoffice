import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield } from "lucide-react"
import { envoyerSafe, sauvegarderAuth, afficherToast } from "@/lib/transmission"

interface CodeOtpFormProps {
  email: string
  onSuccess: (token: string, userData: any) => void
  onBack: () => void
}

export function CodeOtpForm({ email, onSuccess, onBack }: CodeOtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes en secondes
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer pour le compte à rebours
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Focus sur le premier input au montage
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Formatage du temps restant
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Empêche la saisie de plusieurs caractères

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus vers le prochain input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Gérer la touche Backspace
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    // Gérer la touche flèche gauche/droite
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6)
    setOtp(newOtp)

    // Focus sur le dernier input rempli ou le suivant
    const lastFilledIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastFilledIndex]?.focus()
  }

  const handleSubmit = async () => {
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      afficherToast.avertissement("Le code OTP doit contenir 6 chiffres", "Code invalide")
      return
    }

    setIsLoading(true)

    try {
      const response = await envoyerSafe(
        "api/auth/verify-otp/dgapp",
        {
          email,
          otp_code: otpCode
        },
        {
          showSuccessToast: false,
          showErrorToast: false
        }
      )

      if (response.success && response.data) {
        // Sauvegarder le token et les données utilisateur
        sauvegarderAuth(response.data.token, response.data.user)
        afficherToast.succes("Connexion réussie ! Redirection en cours...", "Bienvenue")
        onSuccess(response.data.token, response.data.user)
      } else {
        // Gérer les erreurs spécifiques du serveur
        if (response.statusCode === 429) {
          afficherToast.avertissement("Trop de tentatives de vérification. Réessayez plus tard.", "Limite atteinte")
        } else if (response.statusCode === 422) {
          afficherToast.erreur("Code OTP invalide ou expiré", "Code incorrect")
        } else {
          afficherToast.erreur(response.error || "Erreur lors de la vérification", "Erreur de vérification")
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification OTP:", error)
      afficherToast.erreur("Impossible de vérifier le code", "Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)

    try {
      const response = await envoyerSafe(
        "api/auth/login/dgapp",
        {
          email,
          password: ""
        },
        {
          showSuccessToast: false,
          showErrorToast: false
        }
      )

      if (response.success) {
        setTimeLeft(600) // Reset le timer
        setCanResend(false)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        afficherToast.succes("Nouveau code envoyé par email", "Code renvoyé")
      } else {
        afficherToast.erreur("Impossible de renvoyer le code", "Erreur de renvoi")
      }
    } catch (error) {
      afficherToast.erreur("Erreur lors du renvoi du code", "Erreur réseau")
    } finally {
      setIsResending(false)
    }
  }

  const isComplete = otp.every(digit => digit !== "")

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
          <CardTitle className="text-2xl text-primary">Vérification OTP</CardTitle>
          <CardDescription className="text-muted-foreground">
            Nous avons envoyé un code à 6 chiffres à<br />
            <span className="font-medium text-primary">{email}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-primary font-medium">Code de vérification</Label>
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-xl font-bold border-primary/20 focus:border-primary rounded-lg"
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-sm space-y-2">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <span>Code expire dans:</span>
            <span className="font-mono font-medium text-primary">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isLoading || !isComplete}
        >
          {isLoading ? "Vérification..." : "Vérifier le code"}
        </Button>

        <div className="flex flex-col items-center space-y-2 text-sm">
          <span className="text-muted-foreground">Vous n'avez pas reçu le code ?</span>
          {canResend ? (
            <Button
              variant="link"
              className="p-0 h-auto text-secondary hover:text-secondary/80 font-medium"
              onClick={handleResendCode}
              disabled={isResending}
            >
              {isResending ? "Renvoi..." : "Renvoyer le code"}
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">
              Vous pourrez renvoyer le code dans {formatTime(timeLeft)}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la connexion
        </Button>
      </CardFooter>
    </Card>
  )
}