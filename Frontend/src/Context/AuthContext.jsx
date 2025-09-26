import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

const API_BASE_URL = 'http://127.0.0.1:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser) {
          // Parse stored user data
          const userData = JSON.parse(storedUser)
          
          // Set the auth state directly from localStorage
          // This prevents logout on refresh
          setToken(storedToken)
          setUser(userData)
          
          // Optional: Verify token validity in the background
          // Don't logout on verification failure to handle network issues
          try {
            const response = await fetch(`${API_BASE_URL}/api/token/verify/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: storedToken }),
            })
            
            // If token is invalid, try to refresh it
            if (!response.ok) {
              await refreshToken()
            }
          } catch (error) {
            console.error('Token verification failed (network issue):', error)
            // Don't logout on network errors - keep user logged in
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid data
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Function to refresh access token using refresh token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      // Update access token
      localStorage.setItem('token', data.access)
      setToken(data.access)
      
      return data.access
    } catch (error) {
      console.error('Token refresh error:', error)
      // If refresh fails, logout user
      logout()
      throw error
    }
  }

  const login = async (username, password) => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed')
      }

      // Store tokens
      localStorage.setItem('token', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      
      // Create user object
      const userData = { 
        username: username,
        // Add any other user data you receive from the API
      }
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Update state
      setToken(data.access)
      setUser(userData)
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // Clear state
    setToken(null)
    setUser(null)
    
    // Optional: Redirect to login
    window.location.href = '/login'
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Auto login after successful registration if tokens are provided
      if (data.access && data.refresh) {
        localStorage.setItem('token', data.access)
        localStorage.setItem('refreshToken', data.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
        setToken(data.access)
        setUser(data.user)
      }
      
      return data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // Helper function to make authenticated API calls with automatic token refresh
  const authenticatedFetch = async (url, options = {}) => {
    let currentToken = token

    const makeRequest = async (authToken) => {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      return fetch(url, {
        ...options,
        headers,
      })
    }

    try {
      // First attempt with current token
      let response = await makeRequest(currentToken)

      // If token is expired (401), try to refresh and retry
      if (response.status === 401 && localStorage.getItem('refreshToken')) {
        try {
          currentToken = await refreshToken()
          response = await makeRequest(currentToken)
        } catch (refreshError) {
          // If refresh fails, logout and redirect
          logout()
          return response
        }
      }

      // If still unauthorized after refresh attempt, logout
      if (response.status === 401) {
        logout()
      }

      return response
    } catch (error) {
      console.error('Authenticated fetch error:', error)
      throw error
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    updateUser,
    refreshToken,
    authenticatedFetch,
    isAuthenticated: !!user && !!token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}