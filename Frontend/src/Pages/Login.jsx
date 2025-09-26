import React, { useState, useContext, useEffect } from 'react'
import Header from '../Components/Header'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useContext(AuthContext)
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])
  const [formData, setFormData] = useState({
    username: '', // Changed from email to username
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  
  const { login } = useContext(AuthContext)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.username) {
      newErrors.username = 'Username is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    
    setLoading(true)
    try {
      await login(formData.username, formData.password)
      // After successful login, navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className='min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white p-8 rounded-2xl shadow-xl border border-gray-100'>
            <div className='text-center mb-8'>
              <div className='mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4'>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome Back</h1>
              <p className='text-gray-600'>Sign in to access SIH Mark Entry Portal</p>
            </div>
            
            {errors.submit && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-600 text-sm'>{errors.submit}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label htmlFor='username' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Username
                </label>
                <input 
                  type="text" // Changed from email to text
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder='Enter your username' 
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.username 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.username && (
                  <p className='mt-1 text-sm text-red-600'>{errors.username}</p>
                )}
              </div>
              
              <div>
                <label htmlFor='password' className='block text-sm font-semibold text-gray-700 mb-2'>
                  Password
                </label>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='Enter your password' 
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.password && (
                  <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
                )}
              </div>
              
              <div className='flex items-center justify-between'>
                <label className='flex items-center'>
                  <input type="checkbox" className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded' />
                  <span className='ml-2 text-sm text-gray-600'>Remember me</span>
                </label>
              </div>
              
              <button 
                type='submit' 
                disabled={loading}
                className='w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? (
                  <div className='flex items-center justify-center'>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
