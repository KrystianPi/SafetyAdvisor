'use client'

import { createClient } from '@/lib/supabase'
import { api, PTWData, SimilarIncident, AccidentData } from '@/lib/api'
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
  Upload,
  LogOut,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Search,
  ChevronRight,
  Ship,
  Wrench,
  HardHat,
  ClipboardCheck,
  Eye,
  History,
  X
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: false },
  { icon: AlertTriangle, label: 'Add Incident', href: '/incidents', active: false },
  { icon: Shield, label: 'PTW', href: '/ptw', active: true },
]

const progressStages = [
  { message: "Reading PDF...", description: "Analyzing PTW document structure", progress: 25 },
  { message: "Thinking...", description: "Processing content with AI", progress: 50 },
  { message: "Extracting data...", description: "Identifying PTW details", progress: 75 },
  { message: "Generating response...", description: "Finalizing structured data", progress: 99 }
]

export default function PTWPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progressStage, setProgressStage] = useState(0)
  const [ptwData, setPTWData] = useState<PTWData | null>(null)
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>([])
  const [incidentsSummary, setIncidentsSummary] = useState<string>('')
  const [selectedIncident, setSelectedIncident] = useState<AccidentData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingIncident, setLoadingIncident] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadPage = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)
      } catch (err) {
        console.error('Page error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [supabase.auth, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSeeDetails = async (incidentId: string) => {
    setLoadingIncident(true)
    setIsModalOpen(true)
    setSelectedIncident(null)
    
    try {
      const response = await api.getIncidentDetails(incidentId)
      setSelectedIncident(response.incident)
    } catch (err) {
      console.error('Error loading incident details:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to load incident details')
      setIsModalOpen(false)
    } finally {
      setLoadingIncident(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedIncident(null)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please select a PDF file')
      return
    }

    setUploading(true)
    setUploadError(null)
    setPTWData(null)
    setSimilarIncidents([])
    setProgressStage(0)

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgressStage(prev => {
        if (prev < progressStages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 8000) // Change stage every 8 seconds

    try {
      const result = await api.uploadPTWReport(file)
      setPTWData(result)
      setProgressStage(progressStages.length - 1) // Ensure we're at final stage
      
      // Load similar incidents after successful PTW processing
      setLoadingSimilar(true)
      try {
        const similarData = await api.getSimilarIncidents()
        setSimilarIncidents(similarData.similar_incidents)
        setIncidentsSummary(similarData.summary)
      } catch (err) {
        console.error('Error loading similar incidents:', err)
        // Don't fail the whole process if similar incidents fail
      } finally {
        setLoadingSimilar(false)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to process the PDF file')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      setProgressStage(0)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getInjuryStatusBadge = (status: string) => {
    if (!status || status.trim() === '') {
      return <Badge variant="outline">Not Specified</Badge>
    }
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('fatal') || lowerStatus.includes('death')) {
      return <Badge variant="destructive">Fatal</Badge>
    } else if (lowerStatus.includes('serious') || lowerStatus.includes('severe')) {
      return <Badge variant="destructive">Serious Injury</Badge>
    } else if (lowerStatus.includes('minor') || lowerStatus.includes('first aid')) {
      return <Badge variant="secondary">Minor Injury</Badge>
    } else if (lowerStatus.includes('no injury') || lowerStatus.includes('none')) {
      return <Badge variant="outline">No Injury</Badge>
    } else {
      return <Badge>{status}</Badge>
    }
  }

  const displayValue = (value: string, fallback: string = "Not specified") => {
    return value && value.trim() !== '' ? value : fallback
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading page...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-lg">
            <p className="font-semibold">Error loading page</p>
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Permit to Work (PTW) Analysis
                </h2>
                <p className="text-muted-foreground mt-1">
                  Upload PTW documents to extract data and find similar incidents
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 space-y-8">
          {!ptwData ? (
            /* File Upload Section */
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <Shield className="h-6 w-6" />
                    <span>Upload PTW Document</span>
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF file containing Permit to Work details for automated data extraction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {!uploading ? (
                      /* Upload Interface */
                      <>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <div className="space-y-2">
                            <h3 className="text-lg font-medium">Choose a PDF file</h3>
                            <p className="text-sm text-muted-foreground">
                              Select a PTW document in PDF format to process
                            </p>
                          </div>
                          <div className="mt-6">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                              id="file-upload"
                            />
                            <label htmlFor="file-upload">
                              <Button 
                                variant="outline" 
                                disabled={uploading}
                                className="cursor-pointer"
                                asChild
                              >
                                <span>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Select PDF File
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Supported formats:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• PDF files (.pdf)</li>
                            <li>• Files will be processed to extract PTW data automatically</li>
                            <li>• Processing may take a few moments</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      /* Progress Interface */
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-primary animate-pulse" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">
                            Processing Your PTW Document
                          </h3>
                          <p className="text-muted-foreground">
                            Our AI is analyzing your PDF and extracting PTW data
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {progressStages[progressStage]?.message}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {progressStages[progressStage]?.progress}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                              style={{ 
                                width: `${progressStages[progressStage]?.progress || 0}%`,
                                transition: 'width 1000ms ease-out'
                              }}
                            />
                          </div>
                          
                          <p className="text-sm text-muted-foreground text-center">
                            {progressStages[progressStage]?.description}
                          </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="grid grid-cols-4 gap-2">
                          {progressStages.map((stage, index) => (
                            <div 
                              key={index}
                              className={cn(
                                "text-center p-3 rounded-lg border transition-all duration-300",
                                index <= progressStage 
                                  ? "bg-primary/10 border-primary/20 text-primary" 
                                  : "bg-muted/50 border-muted text-muted-foreground"
                              )}
                            >
                              <div className="text-xs font-medium">
                                Step {index + 1}
                              </div>
                              <div className="text-xs mt-1 truncate">
                                {stage.message.replace('...', '')}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Estimated Time */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-blue-800">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Estimated processing time: 20-30 seconds
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Upload Error</span>
                        </div>
                        <p className="text-sm mt-1">{uploadError}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results Display Section */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Extracted PTW Data</h3>
                  <p className="text-muted-foreground">Review the automatically extracted information</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPTWData(null)
                      setSimilarIncidents([])
                      setIncidentsSummary('')
                      setUploadError(null)
                    }}
                  >
                    Upload Another File
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm mt-1">{uploadError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PTW Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Work Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Ship className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Vessel</p>
                        <p className="text-sm text-muted-foreground">{displayValue(ptwData.vessel_name)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Work Location</p>
                        <p className="text-sm text-muted-foreground">{displayValue(ptwData.work_location)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Description of Work</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {displayValue(ptwData.description_of_work)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">JSA Number</p>
                        <p className="text-sm text-muted-foreground">{displayValue(ptwData.job_safety_analysis_number)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Safety Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <HardHat className="h-5 w-5" />
                      <span>Safety & Equipment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Equipment Required</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {displayValue(ptwData.equipment_required)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Similar Incidents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Similar Historical Incidents</span>
                  </CardTitle>
                  <CardDescription>
                    Incidents with similar work patterns or hazards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSimilar ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading similar incidents...</p>
                    </div>
                  ) : similarIncidents.length > 0 ? (
                    <div className="space-y-4">
                      {similarIncidents.map((incident, index) => (
                        <div key={incident.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  Incident #{index + 1}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(incident.date)} • {displayValue(incident.time_of_day)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getInjuryStatusBadge(incident.injury_status)}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSeeDetails(incident.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                See Details
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Vessel:</p>
                              <p className="text-foreground">{displayValue(incident.vessel_name)}</p>
                            </div>
                            <div>
                              <p className="font-medium text-muted-foreground">Location:</p>
                              <p className="text-foreground">{displayValue(incident.incident_location_on_vessel)}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="font-medium text-muted-foreground">Description:</p>
                              <p className="text-foreground bg-muted/50 p-2 rounded mt-1">
                                {displayValue(incident.incident_description)}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="font-medium text-muted-foreground">Tools Used:</p>
                              <p className="text-foreground">{displayValue(incident.tools_used)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No similar incidents found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Section */}
              {incidentsSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Safety Analysis & Risk Assessment</span>
                    </CardTitle>
                    <CardDescription>
                      Critical insights from historical incidents for PTW decision making
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: incidentsSummary }}
                      style={{
                        '--tw-prose-body': 'hsl(var(--foreground))',
                        '--tw-prose-headings': 'hsl(var(--foreground))',
                        '--tw-prose-lead': 'hsl(var(--muted-foreground))',
                        '--tw-prose-links': 'hsl(var(--primary))',
                        '--tw-prose-bold': 'hsl(var(--foreground))',
                        '--tw-prose-counters': 'hsl(var(--muted-foreground))',
                        '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
                        '--tw-prose-hr': 'hsl(var(--border))',
                        '--tw-prose-quotes': 'hsl(var(--foreground))',
                        '--tw-prose-quote-borders': 'hsl(var(--border))',
                        '--tw-prose-captions': 'hsl(var(--muted-foreground))',
                        '--tw-prose-code': 'hsl(var(--foreground))',
                        '--tw-prose-pre-code': 'hsl(var(--muted-foreground))',
                        '--tw-prose-pre-bg': 'hsl(var(--muted))',
                        '--tw-prose-th-borders': 'hsl(var(--border))',
                        '--tw-prose-td-borders': 'hsl(var(--border))',
                      } as React.CSSProperties}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Incident Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Incident Details</h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              {loadingIncident ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading incident details...</p>
                </div>
              ) : selectedIncident ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Date:</strong> {formatDate(selectedIncident.date)}</p>
                        <p><strong>Time:</strong> {displayValue(selectedIncident.time_of_day)}</p>
                        <p><strong>Vessel:</strong> {displayValue(selectedIncident.vessel_name)}</p>
                        <p><strong>Location:</strong> {displayValue(selectedIncident.vessel_location)}</p>
                        <p><strong>Client:</strong> {displayValue(selectedIncident.client)}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Classification</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {displayValue(selectedIncident.type_of_event)}</p>
                        <p><strong>Classification:</strong> {displayValue(selectedIncident.classification)}</p>
                        <p><strong>Work Related:</strong> {selectedIncident.related_to_work ? 'Yes' : 'No'}</p>
                        <p><strong>Investigation Level:</strong> {displayValue(selectedIncident.level_of_investigation)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Incident Description</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">{displayValue(selectedIncident.incident_description)}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <p><strong>Location on Vessel:</strong> {displayValue(selectedIncident.incident_location_on_vessel)}</p>
                      <p><strong>Job Role:</strong> {displayValue(selectedIncident.job_role)}</p>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Work Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Task Being Performed:</strong></p>
                        <p className="bg-muted/50 p-2 rounded mt-1">{displayValue(selectedIncident.task_being_performed)}</p>
                      </div>
                      <div>
                        <p><strong>Tools Used:</strong></p>
                        <p className="bg-muted/50 p-2 rounded mt-1">{displayValue(selectedIncident.tools_used)}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <p><strong>PPE Worn:</strong></p>
                      <p className="bg-muted/50 p-2 rounded mt-1">{displayValue(selectedIncident.ppe_worn)}</p>
                    </div>
                  </div>

                  {/* Injury Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Injury Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Injury Status:</strong> {getInjuryStatusBadge(selectedIncident.injury_status)}</p>
                        <p><strong>First Aid Provided:</strong> {selectedIncident.first_aid_provided ? 'Yes' : 'No'}</p>
                        <p><strong>Medivac Required:</strong> {selectedIncident.injured_person_medivac ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p><strong>Returned to Work:</strong> {selectedIncident.injured_person_returned_to_work ? 'Yes' : 'No'}</p>
                        {selectedIncident.injured_person_transported && (
                          <p><strong>Transported To:</strong> {selectedIncident.injured_person_transported}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Marine Conditions */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Marine Conditions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <p><strong>Sea State:</strong> {displayValue(selectedIncident.sea_state)}</p>
                      <p><strong>Swell Height:</strong> {selectedIncident.swell_height_m}m</p>
                      <p><strong>Swell Period:</strong> {selectedIncident.swell_period_s}s</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedIncident.corrective_preventive_actions_assigned && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Corrective/Preventive Actions</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm">{selectedIncident.corrective_preventive_actions_assigned}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Failed to load incident details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 