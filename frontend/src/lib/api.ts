import { createClient } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

  async post(endpoint: string, data: any) {
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

  async put(endpoint: string, data: any) {
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

// Typed API functions
export const api = {
  // User endpoints
  getCurrentUser: () => apiClient.get('/me'),
  
  // Dashboard endpoints
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getRecentActivity: () => apiClient.get('/activity'),
  
  // Safety Reports endpoints
  getSafetyReports: () => apiClient.get('/safety-reports'),
  createSafetyReport: (data: {
    title: string
    description: string
    severity: string
    location: string
  }) => apiClient.post('/safety-reports', data),
} 