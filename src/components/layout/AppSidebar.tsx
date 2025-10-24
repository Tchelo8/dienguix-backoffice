import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCheck,
  TrendingUp,
  Settings,
  DollarSign,
  BarChart3,
  FileText,
  Shield,
  LogOut,
  ChevronDown,
  User
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Utilisateurs", url: "/users", icon: Users },
  // { title: "Statistiques", url: "/analytics", icon: BarChart3 },
]

const managementItems = [
  { title: "Taux de Change", url: "/exchange-rates", icon: DollarSign },
  // { title: "Rapports", url: "/reports", icon: FileText },
]

const accountItems = [
  { title: "Mon Profil", url: "/profile", icon: User },
  // { title: "Paramètres", url: "/settings", icon: Settings },
]

const userItems = [
  { title: "Utilisateurs Actifs", url: "/active-users", icon: UserCheck },
  // { title: "Top Envoyeurs", url: "/top-senders", icon: TrendingUp },
  { title: "Piste d'Audit", url: "/user-history", icon: Users },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const [isManagementOpen, setIsManagementOpen] = useState(true)
  const [isUserAnalyticsOpen, setIsUserAnalyticsOpen] = useState(true)

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src="/images/Dienguix.jpeg"
              alt="DX"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">DIENGUIX</h2>
              <p className="text-xs text-sidebar-foreground/70">Administration</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!collapsed && "Menu Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestion et Administration */}
        {!collapsed && (
          <Collapsible open={isManagementOpen} onOpenChange={setIsManagementOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-sidebar-foreground text-sidebar-foreground/70">
                  <span>Gestion</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isManagementOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {managementItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Analytics Utilisateurs */}
        {!collapsed && (
          <Collapsible open={isUserAnalyticsOpen} onOpenChange={setIsUserAnalyticsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-sidebar-foreground text-sidebar-foreground/70">
                  <span>Analytics Utilisateurs</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isUserAnalyticsOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {userItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Compte */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!collapsed && "Compte"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}