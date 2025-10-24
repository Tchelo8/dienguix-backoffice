import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Settings as SettingsIcon, 
  Globe, 
  Shield, 
  Bell, 
  Mail, 
  Database, 
  Server, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const generalSchema = z.object({
  platformName: z.string().min(1, "Nom de plateforme requis"),
  defaultCurrency: z.string().min(1, "Devise par défaut requise"),
  timezone: z.string().min(1, "Fuseau horaire requis"),
  language: z.string().min(1, "Langue par défaut requise"),
  maintenanceMode: z.boolean().default(false),
  registrationEnabled: z.boolean().default(true),
})

const securitySchema = z.object({
  sessionTimeout: z.string().min(1, "Timeout requis"),
  maxLoginAttempts: z.string().min(1, "Nombre max requis"),
  passwordMinLength: z.string().min(1, "Longueur min requise"),
  twoFactorRequired: z.boolean().default(false),
  ipWhitelist: z.string().optional(),
})

const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  webhookUrl: z.string().optional(),
  adminAlerts: z.boolean().default(true),
})

const apiSchema = z.object({
  apiKey: z.string().min(1, "Clé API requise"),
  webhookSecret: z.string().optional(),
  rateLimit: z.string().min(1, "Limite requise"),
  enableLogging: z.boolean().default(true),
})

type GeneralForm = z.infer<typeof generalSchema>
type SecurityForm = z.infer<typeof securitySchema>
type NotificationForm = z.infer<typeof notificationSchema>
type ApiForm = z.infer<typeof apiSchema>

const mockSettings = {
  general: {
    platformName: "DIENGUIX",
    defaultCurrency: "XAF",
    timezone: "Africa/Douala",
    language: "fr",
    maintenanceMode: false,
    registrationEnabled: true,
  },
  security: {
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordMinLength: "8",
    twoFactorRequired: false,
    ipWhitelist: "",
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    webhookUrl: "",
    adminAlerts: true,
  },
  api: {
    apiKey: "dxp_live_kj8s9df0sdf90sdf90sd",
    webhookSecret: "",
    rateLimit: "1000",
    enableLogging: true,
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(mockSettings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const { toast } = useToast()

  const generalForm = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: settings.general
  })

  const securityForm = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema),
    defaultValues: settings.security
  })

  const notificationForm = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: settings.notifications
  })

  const apiForm = useForm<ApiForm>({
    resolver: zodResolver(apiSchema),
    defaultValues: settings.api
  })

  const handleGeneralSubmit = (data: GeneralForm) => {
    setSettings(prev => ({ ...prev, general: { ...prev.general, ...data } }))
    toast({
      title: "Paramètres généraux mis à jour",
      description: "Les paramètres de la plateforme ont été sauvegardés.",
    })
  }

  const handleSecuritySubmit = (data: SecurityForm) => {
    setSettings(prev => ({ ...prev, security: { ...prev.security, ...data } }))
    toast({
      title: "Paramètres de sécurité mis à jour",
      description: "Les paramètres de sécurité ont été sauvegardés.",
    })
  }

  const handleNotificationSubmit = (data: NotificationForm) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, ...data } }))
    toast({
      title: "Paramètres de notification mis à jour", 
      description: "Les paramètres de notification ont été sauvegardés.",
    })
  }

  const handleApiSubmit = (data: ApiForm) => {
    setSettings(prev => ({ ...prev, api: { ...prev.api, ...data } }))
    toast({
      title: "Paramètres API mis à jour",
      description: "Les paramètres API ont été sauvegardés.",
    })
  }

  const regenerateApiKey = () => {
    const newKey = "dxp_live_" + Math.random().toString(36).substring(2, 25)
    apiForm.setValue("apiKey", newKey)
    toast({
      title: "Nouvelle clé API générée",
      description: "Une nouvelle clé API a été générée avec succès.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Paramètres</h1>
          <p className="text-muted-foreground">Configuration et administration de la plateforme</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>
                Configuration de base de la plateforme DIENGUIX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalForm.control}
                      name="platformName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la Plateforme</FormLabel>
                          <FormControl>
                            <Input placeholder="DIENGUIX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Devise par Défaut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une devise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="XAF">XAF - Franc CFA</SelectItem>
                              <SelectItem value="RUB">RUB - Rouble Russe</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="USD">USD - Dollar US</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={generalForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuseau Horaire</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le fuseau horaire" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Africa/Douala">Africa/Douala (GMT+1)</SelectItem>
                              <SelectItem value="Europe/Moscow">Europe/Moscow (GMT+3)</SelectItem>
                              <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Langue par Défaut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la langue" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Options de la Plateforme</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Mode Maintenance</div>
                        <div className="text-sm text-muted-foreground">
                          Désactiver temporairement l'accès à la plateforme
                        </div>
                      </div>
                      <FormField
                        control={generalForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Inscription Activée</div>
                        <div className="text-sm text-muted-foreground">
                          Permettre la création de nouveaux comptes
                        </div>
                      </div>
                      <FormField
                        control={generalForm.control}
                        name="registrationEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configuration de la sécurité et des accès
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeout de Session (min)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tentatives de Connexion Max</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="passwordMinLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longueur Min Mot de Passe</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={securityForm.control}
                    name="ipWhitelist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Liste Blanche IP (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Une adresse IP par ligne. Utilisez la notation CIDR pour les plages.
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Options Avancées</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Authentification à Double Facteur</div>
                        <div className="text-sm text-muted-foreground">
                          Exiger 2FA pour tous les administrateurs
                        </div>
                      </div>
                      <FormField
                        control={securityForm.control}
                        name="twoFactorRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Les modifications de sécurité prendront effet immédiatement. 
                      Assurez-vous de tester les paramètres avant de les appliquer en production.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
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
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de Notification
              </CardTitle>
              <CardDescription>
                Configuration des notifications système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="webhookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Webhook (optionnel)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://votre-domain.com/webhook"
                            {...field} 
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          URL pour recevoir les notifications webhook
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Types de Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm font-medium">Notifications Email</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Envoyer les notifications par email
                        </div>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm font-medium">Notifications SMS</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Envoyer les alertes critiques par SMS
                        </div>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Alertes Admin</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Notifications pour les événements critiques
                        </div>
                      </div>
                      <FormField
                        control={notificationForm.control}
                        name="adminAlerts"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Paramètres API & Webhooks
              </CardTitle>
              <CardDescription>
                Configuration de l'API et des intégrations externes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apiForm}>
                <form onSubmit={apiForm.handleSubmit(handleApiSubmit)} className="space-y-4">
                  <FormField
                    control={apiForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clé API</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input 
                                type={showApiKey ? "text" : "password"}
                                {...field} 
                                readOnly
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <Button type="button" variant="outline" onClick={regenerateApiKey}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Régénérer
                            </Button>
                          </div>
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Clé API pour les intégrations externes
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={apiForm.control}
                    name="webhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Webhook (optionnel)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showWebhookSecret ? "text" : "password"}
                              placeholder="Secret pour valider les webhooks"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                            >
                              {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={apiForm.control}
                    name="rateLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de Taux (requêtes/heure)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Nombre maximum de requêtes API par heure
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Options API</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Logging API Activé</div>
                        <div className="text-sm text-muted-foreground">
                          Enregistrer toutes les requêtes API
                        </div>
                      </div>
                      <FormField
                        control={apiForm.control}
                        name="enableLogging"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Gardez votre clé API et votre secret webhook confidentiels. 
                      Ne les partagez jamais dans du code source public.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle>État de l'API</CardTitle>
              <CardDescription>
                Statut actuel des services API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <div className="font-medium">API Principale</div>
                    <div className="text-sm text-muted-foreground">Opérationnelle</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <div className="font-medium">Webhooks</div>
                    <div className="text-sm text-muted-foreground">Actifs</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <div className="font-medium">Rate Limiting</div>
                    <div className="text-sm text-muted-foreground">Fonctionnel</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}