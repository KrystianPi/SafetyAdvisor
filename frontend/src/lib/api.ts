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

// Typed API functions
export const api = {
  // Dashboard endpoints
  getDashboardUser: (): Promise<DashboardUserData> => apiClient.get('/dashboard/user'),
} 