'use client'

import { createClient } from '@/lib/supabase'
import { api, DashboardUserData } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import { 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Users, 
  FileText, 
  Plus,
  LogOut,
  TrendingUp,
  Calendar,
  Filter,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

// Mock data for the dashboard
const mockIncidents = [
  { id: 1, type: 'Slip & Fall', location: 'Warehouse A', status: 'Open', date: '2024-01-15', severity: 'Medium', cost: 2500 },
  { id: 2, type: 'Equipment Failure', location: 'Production Line 2', status: 'Resolved', date: '2024-01-14', severity: 'High', cost: 15000 },
  { id: 3, type: 'Near Miss', location: 'Loading Dock', status: 'Open', date: '2024-01-13', severity: 'Low', cost: 0 },
  { id: 4, type: 'Chemical Spill', location: 'Lab B', status: 'Resolved', date: '2024-01-12', severity: 'High', cost: 8500 },
  { id: 5, type: 'Ergonomic Issue', location: 'Office Floor 3', status: 'Open', date: '2024-01-11', severity: 'Medium', cost: 1200 },
]

const mockChartData = [
  { month: 'Jan', incidents: 12, resolved: 8 },
  { month: 'Feb', incidents: 8, resolved: 10 },
  { month: 'Mar', incidents: 15, resolved: 12 },
  { month: 'Apr', incidents: 6, resolved: 9 },
  { month: 'May', incidents: 10, resolved: 14 },
  { month: 'Jun', incidents: 4, resolved: 8 },
]

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: AlertTriangle, label: 'Incidents', href: '/incidents', active: false },
  { icon: Shield, label: 'Compliance', href: '#', active: false },
  { icon: Users, label: 'Training', href: '#', active: false },
  { icon: FileText, label: 'Reports', href: '#', active: false },
]

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  // const [dashboardData, setDashboardData] = useState<DashboardUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Fetch dashboard data from backend
        // const dashboardData = await api.getDashboardUser()
        // setDashboardData(dashboardData)
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase.auth, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-lg">
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-72 border-r bg-card flex flex-col">
        {/* Logo and Title */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Image 
                src="/logo_transparent.png" 
                alt="Global Safety Agent Logo" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
              Global Safety Agent
              </h1>
              <p className="text-xs text-muted-foreground">
                Safety Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.label}>
                  <a 
                    href={item.href} 
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      item.active 
                        ? "bg-primary text-primary-foreground" 
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Dashboard Overview
              </h2>
                          <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your safety metrics.
            </p>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Last 30 days
              </Button>
              <Button size="sm" onClick={() => router.push('/incidents')}>
                <Plus className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cost Impact
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">€27,200</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Compliance Score
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">94%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Training Complete
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">85%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Incidents
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">3</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">+1</span> from last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incidents Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incidents Overview</CardTitle>
                    <CardDescription>
                      Monthly incident trends and resolution rates
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Weekly
                    </Button>
                    <Button variant="ghost" size="sm">
                      Daily
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockChartData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-muted-foreground">
                        {item.month}
                      </div>
                      <div className="flex-1 flex items-center space-x-3">
                        <div className="flex-1 bg-secondary rounded-full h-2 relative overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300" 
                            style={{ width: `${(item.incidents / 20) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {item.incidents}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Incidents</CardTitle>
                    <CardDescription>
                      Latest safety incidents and their status
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => router.push('/incidents')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Incident
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockIncidents.slice(0, 5).map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <AlertTriangle className={cn(
                              "h-4 w-4",
                              incident.severity === 'High' ? "text-red-500" :
                              incident.severity === 'Medium' ? "text-yellow-500" :
                              "text-green-500"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {incident.type}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {incident.location} • {incident.date}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={incident.status === 'Open' ? 'warning' : 'success'}>
                          {incident.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="ghost" className="w-full">
                    View all incidents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 