'use client'

import { createClient } from '@/lib/supabase'
import { api, DashboardUserData, ChatResponse } from '@/lib/api'
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
  Eye,
  Cloud,
  Flame,
  Hand,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts'

interface SelectOption {
  value: string
  label: string
  type: 'categorical' | 'numerical'
}

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  loading?: boolean
}

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: AlertTriangle, label: 'Add Incident', href: '/incidents', active: false },
  { icon: Shield, label: 'PTW', href: '/ptw', active: false },
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347']

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedXAxis, setSelectedXAxis] = useState<string>('sea_state')
  const [selectedYAxis, setSelectedYAxis] = useState<string>('count')
  const [selectedHue, setSelectedHue] = useState<string>('vessel_name')
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  
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

        // Fetch incidents data from backend
        const incidentsData = await api.getDashboardIncidents()
        setIncidents(incidentsData.incidents || [])
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase.auth, router])

  // Data processing functions for visualizations
  const getMinorInjuriesAndNearMisses = () => {
    const minorInjuries = incidents.filter(i => 
      i.injury_status?.toLowerCase().includes('minor') || 
      i.injury_status?.toLowerCase().includes('first aid')
    ).length
    const nearMisses = incidents.filter(i => 
      i.type_of_event?.toLowerCase().includes('near miss') ||
      i.classification?.toLowerCase().includes('near miss')
    ).length
    
    return [
      { name: 'Minor Injuries', value: minorInjuries },
      { name: 'Near Misses', value: nearMisses },
      { name: 'Other', value: incidents.length - minorInjuries - nearMisses }
    ]
  }

  const getRoutineTaskIncidents = () => {
    const routineIncidents = incidents.filter(i => 
      i.task_being_performed?.toLowerCase().includes('routine') ||
      i.incident_description?.toLowerCase().includes('routine')
    )
    
    const grouped = routineIncidents.reduce((acc: any, incident) => {
      const task = incident.task_being_performed || 'Unknown Task'
      acc[task] = (acc[task] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(grouped).map(([task, count]) => ({
      task: task, // Keep full task name
      taskShort: task.length > 15 ? task.substring(0, 15) + '...' : task, // Shorter version for display
      count
    }))
  }

  const getDropObjectIncidents = () => {
    const dropObjectIncidents = incidents.filter(i => i.dropped_object === true)
    
    // Group by month
    const grouped = dropObjectIncidents.reduce((acc: any, incident) => {
      const date = new Date(incident.date)
      const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(grouped).map(([month, count]) => ({ month, count }))
  }

  const getHandInjuryIncidents = () => {
    const handInjuries = incidents.filter(i => 
      i.incident_description?.toLowerCase().includes('hand') ||
      i.incident_description?.toLowerCase().includes('finger') ||
      i.job_role?.toLowerCase().includes('hand')
    ).length
    
    const totalInjuries = incidents.filter(i => 
      i.injury_status && i.injury_status !== '' && !i.injury_status.toLowerCase().includes('no injury')
    ).length
    
    return [
      { name: 'Hand Injuries', value: handInjuries },
      { name: 'Other Injuries', value: totalInjuries - handInjuries }
    ]
  }

  const getHighPotentialIncidents = () => {
    const hiPos = incidents.filter(i => 
      i.classification?.toLowerCase().includes('high potential') ||
      i.classification?.toLowerCase().includes('hipo') ||
      i.level_of_investigation?.toLowerCase().includes('high')
    )
    
    // Group by month to show trend
    const grouped = hiPos.reduce((acc: any, incident) => {
      const date = new Date(incident.date)
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(grouped).map(([month, count]) => ({ month, count }))
  }

  const getWeatherSeaStateIncidents = () => {
    const weatherIncidents = incidents.filter(i => 
      i.sea_state && i.sea_state !== '' ||
      i.swell_height_m > 0 ||
      i.incident_description?.toLowerCase().includes('weather') ||
      i.incident_description?.toLowerCase().includes('sea')
    )
    
    const seaStates = weatherIncidents.reduce((acc: any, incident) => {
      const state = incident.sea_state || 'Unknown'
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {})
    
    // Define sea state order from smooth to very rough
    const seaStateOrder = [
      'Smooth',
      'Calm',
      'Slight',
      'Light',
      'Moderate',
      'Rough',
      'Very Rough',
      'High',
      'Very High',
      'Phenomenal',
      'Unknown'
    ]
    
    const result = Object.entries(seaStates).map(([state, count]) => ({ state, count }))
    
    // Sort according to sea state severity
    return result.sort((a, b) => {
      const aIndex = seaStateOrder.findIndex(s => s.toLowerCase() === a.state.toLowerCase())
      const bIndex = seaStateOrder.findIndex(s => s.toLowerCase() === b.state.toLowerCase())
      
      // If not found in order, put at end
      const aPos = aIndex === -1 ? seaStateOrder.length : aIndex
      const bPos = bIndex === -1 ? seaStateOrder.length : bIndex
      
      return aPos - bPos
    })
  }

  const getFireWatchHotWorkIncidents = () => {
    const fireWatchIncidents = incidents.filter(i => 
      i.ptw_type?.toLowerCase().includes('hot work') ||
      i.task_being_performed?.toLowerCase().includes('fire watch') ||
      i.task_being_performed?.toLowerCase().includes('hot work') ||
      i.incident_description?.toLowerCase().includes('fire') ||
      i.incident_description?.toLowerCase().includes('hot work')
    )
    
    const nearMisses = fireWatchIncidents.filter(i =>
      i.type_of_event?.toLowerCase().includes('near miss') ||
      i.classification?.toLowerCase().includes('near miss')
    ).length
    
    const incidents_count = fireWatchIncidents.length - nearMisses
    
    return [
      { name: 'Near Misses', value: nearMisses },
      { name: 'Actual Incidents', value: incidents_count }
    ]
  }

  // Define available data options for the interactive plot
  const dataOptions: SelectOption[] = [
    { value: 'vessel_name', label: 'Vessel Name', type: 'categorical' },
    { value: 'classification', label: 'Classification', type: 'categorical' },
    { value: 'type_of_event', label: 'Type of Event', type: 'categorical' },
    { value: 'injury_status', label: 'Injury Status', type: 'categorical' },
    { value: 'job_role', label: 'Job Role', type: 'categorical' },
    { value: 'client', label: 'Client', type: 'categorical' },
    { value: 'sea_state', label: 'Sea State', type: 'categorical' },
    { value: 'swell_height_m', label: 'Swell Height (m)', type: 'numerical' },
    { value: 'swell_period_s', label: 'Swell Period (s)', type: 'numerical' },
    { value: 'hours_after_sign_on', label: 'Hours After Sign On', type: 'numerical' },
    { value: 'count', label: 'Count of Incidents', type: 'numerical' },
  ]

  const generateInteractiveChartData = () => {
    if (!incidents.length) return []

    const xOption = dataOptions.find(opt => opt.value === selectedXAxis)
    const yOption = dataOptions.find(opt => opt.value === selectedYAxis)
    const hueOption = dataOptions.find(opt => opt.value === selectedHue)

    if (!xOption || !yOption || !hueOption) return []

    const isCounting = selectedYAxis === 'count'
    const grouped: { [key: string]: { [hue: string]: number[] } } = {}

    incidents.forEach(incident => {
      const xValue = incident[selectedXAxis] || 'Unknown'
      const hueValue = incident[selectedHue] || 'Unknown'
      
      if (!xValue || !hueValue) return

      if (!grouped[xValue]) grouped[xValue] = {}
      if (!grouped[xValue][hueValue]) grouped[xValue][hueValue] = []

      if (isCounting) {
        grouped[xValue][hueValue].push(1)
      } else {
        const yValue = parseFloat(incident[selectedYAxis])
        if (!isNaN(yValue)) {
          grouped[xValue][hueValue].push(yValue)
        }
      }
    })

    const result: any[] = []
    Object.entries(grouped).forEach(([xValue, hueData]) => {
      const dataPoint: any = { 
        name: xValue,
        [selectedXAxis]: xValue 
      }
      Object.entries(hueData).forEach(([hueValue, values]) => {
        if (values.length === 0) return

        if (isCounting) {
          dataPoint[hueValue] = values.length
        } else {
          // Calculate average for numerical data
          const sum = values.reduce((a, b) => a + b, 0)
          dataPoint[hueValue] = sum / values.length
        }
      })
      result.push(dataPoint)
    })

    // Sort the result based on the X-axis selection
    if (selectedXAxis === 'sea_state') {
      // Define sea state order from smooth to very rough
      const seaStateOrder = [
        'Smooth',
        'Calm',
        'Slight',
        'Light',
        'Moderate',
        'Rough',
        'Very Rough',
        'High',
        'Very High',
        'Phenomenal',
        'Unknown'
      ]
      
      result.sort((a, b) => {
        const aIndex = seaStateOrder.findIndex(s => s.toLowerCase() === a.name.toLowerCase())
        const bIndex = seaStateOrder.findIndex(s => s.toLowerCase() === b.name.toLowerCase())
        
        // If not found in order, put at end
        const aPos = aIndex === -1 ? seaStateOrder.length : aIndex
        const bPos = bIndex === -1 ? seaStateOrder.length : bIndex
        
        return aPos - bPos
      })
    } else {
      // For other categorical data, sort alphabetically
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }

  const getUniqueHueValues = () => {
    if (!incidents.length || !selectedHue) return []
    const uniqueHues = new Set<string>()
    incidents.forEach(incident => {
      const hueValue = incident[selectedHue]
      if (hueValue && String(hueValue).trim()) {
        uniqueHues.add(String(hueValue))
      }
    })
    
    if (incidents.some(i => !i[selectedHue] || !String(i[selectedHue]).trim())) {
        uniqueHues.add('Unknown');
    }

    return Array.from(uniqueHues).slice(0, 7)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Chat functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    }

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: 'Analyzing your question...',
      timestamp: new Date(),
      loading: true
    }

    setChatMessages(prev => [...prev, userMessage, loadingMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      // Prepare chat history for API (exclude loading messages and convert format)
      const historyForApi = chatMessages
        .filter(msg => !msg.loading)
        .map(msg => ({
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }))
      
      const response = await api.askQuestion(userMessage.content, historyForApi)
      
      // Remove loading message and add real response
      setChatMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading)
        const botMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: response.answer,
          timestamp: new Date()
        }
        return [...filtered, botMessage]
      })
    } catch (error) {
      // Remove loading message and add error response
      setChatMessages(prev => {
        const filtered = prev.filter(msg => !msg.loading)
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: 'Sorry, I encountered an error while processing your question. Please try again.',
          timestamp: new Date()
        }
        return [...filtered, errorMessage]
      })
      console.error('Chat error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
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

  // Calculate stats from real data
  const totalIncidents = incidents.length
  const openIncidents = incidents.filter(i => 
    !i.injured_person_returned_to_work && i.injury_status !== 'No injury'
  ).length
  const dropObjectCount = incidents.filter(i => i.dropped_object === true).length
  const handInjuryCount = incidents.filter(i => 
    i.incident_description?.toLowerCase().includes('hand') ||
    i.incident_description?.toLowerCase().includes('finger')
  ).length

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
                Safety Analytics Dashboard
              </h2>
              <p className="text-muted-foreground mt-1">
                Real-time insights from {totalIncidents} incidents in your database
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                All Data
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
                  Total Incidents
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  All recorded incidents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Dropped Objects
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dropObjectCount}</div>
                <p className="text-xs text-muted-foreground">
                  Dropped object incidents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hand Injuries
                </CardTitle>
                <Hand className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{handInjuryCount}</div>
                <p className="text-xs text-muted-foreground">
                  Hand-related incidents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Cases
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{openIncidents}</div>
                <p className="text-xs text-muted-foreground">
                  Unresolved incidents
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Minor Injuries and Near Misses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Minor Injuries & Near Misses
                </CardTitle>
                <CardDescription>Distribution of incident severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getMinorInjuriesAndNearMisses()}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getMinorInjuriesAndNearMisses().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Routine Task Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Routine Task Incidents
                </CardTitle>
                <CardDescription>Repetitive task-related incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getRoutineTaskIncidents()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="taskShort" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: any) => [value, 'Incidents']}
                      labelFormatter={(label: any) => {
                        const item = getRoutineTaskIncidents().find(i => i.taskShort === label)
                        return item ? item.task : label
                      }}
                    />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dropped Object Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dropped Object Trend
                </CardTitle>
                <CardDescription>Monthly dropped object incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={getDropObjectIncidents()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hand Injury Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hand className="h-5 w-5" />
                  Hand Injury Distribution
                </CardTitle>
                <CardDescription>Hand vs other injury types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getHandInjuryIncidents()}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getHandInjuryIncidents().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* High Potential Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  High Potential Incidents
                </CardTitle>
                <CardDescription>HiPo incident trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={getHighPotentialIncidents()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7c7c" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weather/Sea State Incidents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Weather & Sea State
                </CardTitle>
                <CardDescription>Weather-related incident breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={getWeatherSeaStateIncidents()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8dd1e1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fire Watch & Hot Work */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Fire Watch & Hot Work
                </CardTitle>
                <CardDescription>Hot work near misses vs incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={getFireWatchHotWorkIncidents()}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getFireWatchHotWorkIncidents().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Data Explorer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Interactive Data Explorer
              </CardTitle>
              <CardDescription>
                Customize your data visualization by selecting different variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Controls Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X-Axis</label>
                    <select 
                      value={selectedXAxis} 
                      onChange={(e) => setSelectedXAxis(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    >
                      {dataOptions.filter(opt => opt.type === 'categorical').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y-Axis</label>
                    <select 
                      value={selectedYAxis} 
                      onChange={(e) => setSelectedYAxis(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    >
                      {dataOptions.filter(opt => opt.type === 'numerical').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color By</label>
                    <select 
                      value={selectedHue} 
                      onChange={(e) => setSelectedHue(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                    >
                      {dataOptions.filter(opt => opt.type === 'categorical').map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={generateInteractiveChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                      <YAxis 
                        label={{ 
                          value: dataOptions.find(o => o.value === selectedYAxis)?.label, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' },
                        }} 
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          typeof value === 'number' ? value.toFixed(2) : value, 
                          name
                        ]}
                      />
                      {getUniqueHueValues().map((hueValue, index) => (
                        <Bar 
                          key={hueValue}
                          dataKey={hueValue}
                          stackId="a"
                          name={hueValue}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center">
                  {getUniqueHueValues().map((hueValue, index) => (
                    <div key={hueValue} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{hueValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Incidents Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Incidents</CardTitle>
                  <CardDescription>
                    Latest incidents from the database
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
                {incidents.slice(0, 5).map((incident, index) => (
                  <div key={incident.id || index} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <AlertTriangle className={cn(
                            "h-4 w-4",
                            incident.classification?.toLowerCase().includes('high') ? "text-red-500" :
                            incident.injury_status?.toLowerCase().includes('minor') ? "text-yellow-500" :
                            "text-green-500"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {incident.type_of_event || incident.classification || 'Unknown Type'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {incident.vessel_name} • {incident.date}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={incident.injured_person_returned_to_work ? 'success' : 'warning'}>
                        {incident.injured_person_returned_to_work ? 'Resolved' : 'Open'}
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
                  View all {totalIncidents} incidents
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Chatbot Interface */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isChatOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 w-96 shadow-xl transition-all duration-300",
          isChatMinimized ? "h-16" : "h-96"
        )}>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Data Assistant</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                >
                  {isChatMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isChatMinimized && (
            <CardContent className="p-4 pt-0 flex flex-col h-80">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ask me anything about your incident data!</p>
                    <p className="text-xs mt-1">
                      Try: "How many incidents involved hand injuries?" or "Show me incidents by vessel"
                    </p>
                    <p className="text-xs mt-1 italic">
                      I remember our conversation history for better context!
                    </p>
                  </div>
                )}
                
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 max-w-[85%]",
                      message.type === 'user' ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "flex gap-2 items-start",
                      message.type === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        message.type === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {message.type === 'user' ? (
                          <UserIcon className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </div>
                      <div className={cn(
                        "px-3 py-2 rounded-lg text-sm",
                        message.type === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                        message.loading && "animate-pulse"
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.loading && (
                          <div className="flex gap-1 mt-1">
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Ask about your incident data..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={sendChatMessage}
                  size="icon"
                  className="h-9 w-9"
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
} 