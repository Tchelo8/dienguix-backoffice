import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Button } from "@/components/ui/button"
import { Bell, Settings, User, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Link } from "react-router-dom"
import { deconnecter, obtenirUtilisateur } from "@/lib/transmission"

interface DashboardLayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

interface UserData {
  first_name?: string
  last_name?: string
  email?: string
  // Ajoutez d'autres propriétés selon votre structure de données
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const user = obtenirUtilisateur()
    setUserData(user)
  }, [])

  // Fonction pour générer les initiales
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "AD" // Fallback par défaut
    
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : ""
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ""
    
    return (firstInitial + lastInitial) || "AD"
  }

  // Fonction pour afficher le nom complet
  const getDisplayName = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "Admin" // Fallback par défaut
    
    const parts = []
    if (firstName) parts.push(firstName)
    if (lastName) parts.push(lastName)
    
    return parts.join(" ") || "Admin"
  }

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false)
    onLogout()
    deconnecter()
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary hover:bg-primary/10" />
              <h1 className="text-xl font-semibold text-primary">DIENGUIX Admin</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <Bell className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground text-sm">
                        {getInitials(userData?.first_name, userData?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-primary">
                      {getDisplayName(userData?.first_name, userData?.last_name)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mon Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    {/* <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link> */}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 text-destructive"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder de nouveau à l'administration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}