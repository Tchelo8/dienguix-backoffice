import { useState } from "react"
import { Navigate } from "react-router-dom"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"

interface AuthProps {
  isAuthenticated: boolean
  onLogin: (email: string, password: string) => void
  onRegister: (data: any) => void
}

export default function Auth({ isAuthenticated, onLogin, onRegister }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-secondary rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-primary rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-secondary rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-primary rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Auth Form */}
      <div className="relative z-10 w-full max-w-md">
        {isLogin ? (
          <LoginForm 
            onToggleForm={() => setIsLogin(false)} 
            onLogin={onLogin}
          />
        ) : (
          <RegisterForm 
            onToggleForm={() => setIsLogin(true)} 
            onRegister={onRegister}
          />
        )}
      </div>

      {/* Company Info */}
      <div className="absolute bottom-8 left-8 text-primary-foreground/70 text-sm">
        <p>DIENGUIX Administration Panel</p>
        <p>Version 1.0.0, développé par Henoc BESSA</p>
      </div>
    </div>
  )
}