'use client'

import { createClient } from '@/lib/supabase'
import { api, AccidentData } from '@/lib/api'
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
  UserX,
  Search,
  ChevronRight,
  Ship,
  Anchor,
  Waves,
  Wrench,
  HardHat,
  ClipboardCheck,
  Activity,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: false },
  { icon: AlertTriangle, label: 'Incidents', href: '/incidents', active: true },
  { icon: Shield, label: 'Compliance', href: '#', active: false },
  { icon: Users, label: 'Training', href: '#', active: false },
  { icon: FileText, label: 'Reports', href: '#', active: false },
]

export default function IncidentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [accidentData, setAccidentData] = useState<AccidentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please select a PDF file')
      return
    }

    setUploading(true)
    setUploadError(null)
    setAccidentData(null)

    try {
      const result = await api.uploadIncidentReport(file)
      setAccidentData(result)
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to process the PDF file')
    } finally {
      setUploading(false)
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

  const formatDateTime = (dateTimeString: string) => {
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateTimeString
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
                  Incident Reporting
                </h2>
                <p className="text-muted-foreground mt-1">
                  Upload PDF reports to extract and analyze incident data
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
          {!accidentData ? (
            /* File Upload Section */
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    <Upload className="h-6 w-6" />
                    <span>Upload Incident Report</span>
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF file containing incident details for automated data extraction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Choose a PDF file</h3>
                        <p className="text-sm text-muted-foreground">
                          Select an incident report in PDF format to process
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
                              {uploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Select PDF File
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Upload Error</span>
                        </div>
                        <p className="text-sm mt-1">{uploadError}</p>
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Supported formats:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• PDF files (.pdf)</li>
                        <li>• Files will be processed to extract incident data automatically</li>
                        <li>• Processing may take a few moments</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results Display Section */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Extracted Incident Data</h3>
                  <p className="text-muted-foreground">Review the automatically extracted information</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAccidentData(null)
                    setUploadError(null)
                  }}
                >
                  Upload Another File
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-sm text-muted-foreground">{formatDate(accidentData.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Time of Day</p>
                        <p className="text-sm text-muted-foreground">{displayValue(accidentData.time_of_day)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{displayValue(accidentData.vessel_location)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Job Role</p>
                        <p className="text-sm text-muted-foreground">{displayValue(accidentData.job_role)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vessel Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Ship className="h-5 w-5" />
                      <span>Vessel & Project</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Ship className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Vessel</p>
                        <p className="text-sm text-muted-foreground">{accidentData.vessel_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Client</p>
                        <p className="text-sm text-muted-foreground">{accidentData.client}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Project/Well</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {accidentData.project_no_well_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Anchor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Connected to Well:</span>
                      <Badge variant={accidentData.vessel_connected_to_well ? "default" : "secondary"}>
                        {accidentData.vessel_connected_to_well ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Incident Classification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Classification</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Type</p>
                      <Badge variant="outline">{displayValue(accidentData.type_of_event)}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Classification</p>
                      <Badge variant="secondary">{displayValue(accidentData.classification)}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Work Related:</span>
                      <Badge variant={accidentData.related_to_work ? "destructive" : "secondary"}>
                        {accidentData.related_to_work ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Investigation Level</p>
                      <Badge variant="outline">{accidentData.level_of_investigation}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Injury Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Injury Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Status</p>
                      {getInjuryStatusBadge(accidentData.injury_status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">First Aid:</span>
                      <Badge variant={accidentData.first_aid_provided ? "default" : "secondary"}>
                        {accidentData.first_aid_provided ? "Provided" : "Not Needed"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Medivac:</span>
                      <Badge variant={accidentData.injured_person_medivac ? "destructive" : "secondary"}>
                        {accidentData.injured_person_medivac ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {accidentData.injured_person_transported && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Transported To</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {accidentData.injured_person_transported}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Marine Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Waves className="h-5 w-5" />
                      <span>Marine Conditions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sea State</p>
                      <Badge variant="outline">{accidentData.sea_state}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Swell</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Height: {accidentData.swell_height_m}m</p>
                        <p>Period: {accidentData.swell_period_s}s</p>
                        <p>Direction: {accidentData.swell_direction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Work Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wrench className="h-5 w-5" />
                      <span>Work Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Task Being Performed</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {accidentData.task_being_performed}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tools Used</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {accidentData.tools_used}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {accidentData.work_at_height && <Badge variant="secondary">Work at Height</Badge>}
                      {accidentData.work_in_confined_space && <Badge variant="secondary">Confined Space</Badge>}
                      {accidentData.lifting_operation_incident && <Badge variant="secondary">Lifting Operation</Badge>}
                      {accidentData.dropped_object && <Badge variant="secondary">Dropped Object</Badge>}
                      {accidentData.environmental_loss_of_containment && <Badge variant="secondary">Environmental Loss</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full-width cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incident Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Incident Description</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
                      {accidentData.incident_description}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Location on Vessel</p>
                      <Badge variant="outline">{accidentData.incident_location_on_vessel}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Safety & Equipment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <HardHat className="h-5 w-5" />
                      <span>Safety & Equipment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">PPE Worn</p>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {accidentData.ppe_worn}
                      </p>
                    </div>
                    {accidentData.equipment_involved_affected && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Equipment Involved</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {accidentData.equipment_involved_affected}
                        </p>
                      </div>
                    )}
                    {accidentData.equipment_damaged && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Equipment Damage</p>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {accidentData.equipment_damaged}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Investigation & Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClipboardCheck className="h-5 w-5" />
                    <span>Investigation & Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Human Factor Identified:</span>
                        <Badge variant={accidentData.human_factor_identified ? "destructive" : "secondary"}>
                          {accidentData.human_factor_identified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">HIT Investigation:</span>
                        <Badge variant={accidentData.investigated_with_hit ? "default" : "secondary"}>
                          {accidentData.investigated_with_hit ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">TRAC/JSA Completed:</span>
                        <Badge variant={accidentData.trac_jsa_completed ? "default" : "secondary"}>
                          {accidentData.trac_jsa_completed ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">PTW Details</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Type: {accidentData.ptw_type}</p>
                          <p>Number: {accidentData.ptw_number}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Photos/CCTV Available:</span>
                        <Badge variant={accidentData.photos_cctv_available ? "default" : "secondary"}>
                          {accidentData.photos_cctv_available ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Personnel Details</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {accidentData.ip_sign_on_datetime ? (
                            <p>Sign-on: {formatDateTime(accidentData.ip_sign_on_datetime)}</p>
                          ) : (
                            <p>Sign-on: Not available</p>
                          )}
                          <p>First shift: {accidentData.first_shift_on_board ? "Yes" : "No"}</p>
                          <p>Hours after sign-on: {accidentData.hours_after_sign_on}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Corrective/Preventive Actions</span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg ml-6">
                      {accidentData.corrective_preventive_actions_assigned}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 