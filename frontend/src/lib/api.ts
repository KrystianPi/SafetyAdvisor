import { createClient } from './supabase'

// Function to get the correct API URL based on environment
function getApiUrl(): string {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT

  // For production environment, use the explicit API URL
  if (environment === 'prod' && process.env.NEXT_PUBLIC_API_URL) {
    console.log('✅ Using production API URL:', process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL
  }

  // For preview environment, construct the URL dynamically using PR ID
  if (environment === 'preview' && process.env.NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID) {
    const railwayServiceName = 'safetyadvisor'
    // Railway URL pattern: service-name-service-name-pr-number.up.railway.app
    const previewUrl = `https://${railwayServiceName}-${railwayServiceName}-pr-${process.env.NEXT_PUBLIC_VERCEL_GIT_PULL_REQUEST_ID}.up.railway.app`
    console.log('✅ Using preview API URL:', previewUrl)
    return previewUrl
  }

  // Fallback: try to use explicit API URL if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('✅ Using fallback API URL:', process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL
  }

  return 'http://localhost:8000'
}

const API_URL = getApiUrl()

class ApiClient {
  private async getAuthHeaders() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async get(endpoint: string) {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async post(endpoint: string, data: Record<string, unknown>) {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async put(endpoint: string, data: Record<string, unknown>) {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async delete(endpoint: string) {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async uploadFile(endpoint: string, file: File) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()

// Types for API responses
export interface DashboardUserData {
  user_id: string
  user_email: string
  account_created: string
  total_sessions: number
  last_login: string | null
}

export interface AccidentData {
  // Basic incident information
  date: string
  time_of_day: string
  vessel_name: string
  vessel_location: string
  
  // Client information
  client: string
  client_advised: boolean
  project_no_well_name: string
  vessel_connected_to_well: boolean
  
  // Incident classification
  related_to_work: boolean
  classification: string
  type_of_event: string
  
  // Investigation details
  human_factor_identified: boolean
  investigated_with_hit: boolean
  level_of_investigation: string
  
  // Marine conditions
  sea_state: string
  swell_direction: string
  swell_period_s: number
  swell_height_m: number
  
  // Incident details
  incident_location_on_vessel: string
  incident_description: string
  job_role: string
  
  // Work type flags
  work_at_height: boolean
  work_in_confined_space: boolean
  lifting_operation_incident: boolean
  dropped_object: boolean
  environmental_loss_of_containment: boolean
  
  // Personnel information
  ip_sign_on_datetime?: string | null
  first_shift_on_board: boolean
  hours_after_sign_on: number
  
  // Injury information
  injury_status: string
  injured_person_transported: string
  first_aid_provided: boolean
  injured_person_medivac: boolean
  injured_person_returned_to_work: boolean
  hours_until_return_to_work?: number | null
  
  // Equipment and tools
  tools_used: string
  equipment_involved_affected: string
  equipment_isolated_inhibited: boolean
  equipment_damaged: string
  
  // Permit to Work information
  ptw_type: string
  ptw_number: string
  trac_jsa_completed: boolean
  
  // Task and safety information
  task_being_performed: string
  ppe_worn: string
  photos_cctv_available: boolean
  corrective_preventive_actions_assigned: string
}

// Typed API functions
export const api = {
  // Dashboard endpoints
  getDashboardUser: (): Promise<DashboardUserData> => apiClient.get('/dashboard/user'),
  
  // Incident endpoints
  uploadIncidentReport: (file: File): Promise<AccidentData> => apiClient.uploadFile('/dashboard/upload', file),
} 