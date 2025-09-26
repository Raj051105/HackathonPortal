import React, { createContext, useState, useEffect } from 'react'
export const AuthContext = createContext()

const API_BASE_URL = 'http://127.0.0.1:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
            setToken(storedToken)
          } else {
            // Token is invalid, clear stored data
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          console.error('Auth verification failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

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
        throw new Error(data.message || 'Login failed')
      }

      // Store access and refresh tokens
      localStorage.setItem('token', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      
      setToken(data.access)
      // Store the username as basic user data
      const userData = { username: username }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    //   return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

//   const logout = async () => {
//     try {
//       // Optional: Call logout endpoint to invalidate token on server
//       if (token) {
//         await fetch(`${API_BASE_URL}/auth/logout`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         })
//       }
//     } catch (error) {
//       console.error('Logout API call failed:', error)
//     } finally {
//       // Always clear local storage and state
//       localStorage.removeItem('token')
//       localStorage.removeItem('refreshToken')
//       localStorage.removeItem('user')
//       setToken(null)
//       setUser(null)
//     }
//   }

  const register = async (userData) => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

      // Auto login after successful registration
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setToken(data.token)
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

  // Helper function to make authenticated API calls
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}` // Using access token for authentication
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // If token is expired, redirect to login
    if (response.status === 401) {
      logout()
      window.location.href = '/login'
      return
    }

    return response
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    updateUser,
    authenticatedFetch,
    isAuthenticated: !!user && !!token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}