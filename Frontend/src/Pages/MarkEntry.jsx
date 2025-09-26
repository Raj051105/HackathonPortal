import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../Components/Header'

const MarkEntry = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [mainProblem, setMainProblem] = useState(null)
  const [otherProblems, setOtherProblems] = useState([])
  
  // Marking criteria state
  const [marks, setMarks] = useState({
    problemUnderstanding: '',
    innovativeness: '',
    technicalFeasibility: '',
    implementation: '',
    impact: '',
    presentation: ''
  })

  // Mock data fetch (replace with actual API call)
  useEffect(() => {
    // Simulating API call
    const mockData = {
      id: parseInt(id),
      teamId: 'SIH2024_001',
      teamName: 'Tech Innovators',
      title: 'AI-Powered Healthcare Management System',
      description: 'Develop an AI-driven platform for efficient healthcare management including patient records, appointment scheduling, and treatment recommendations.',
      pptLink: 'https://docs.google.com/presentation/d/1abc123',
      progress: 'In Review',
      marks: null
    }

    const mockOtherProblems = [
      {
        id: 2,
        teamId: 'SIH2024_002',
        title: 'Smart Traffic Management',
        description: 'Create an intelligent traffic management system using IoT sensors and machine learning to optimize traffic flow in urban areas. The system includes real-time monitoring, adaptive signal control, and predictive analytics.',
        pptLink: 'https://docs.google.com/presentation/d/2def456',
        progress: 'In Review'
      },
      {
        id: 3,
        teamId: 'SIH2024_003',
        title: 'Blockchain Voting',
        description: 'Design and implement a secure and transparent voting system using blockchain technology. Features include voter authentication, vote encryption, and immutable record keeping.',
        pptLink: 'https://docs.google.com/presentation/d/3ghi789',
        progress: 'Reviewed'
      },
      {
        id: 4,
        teamId: 'SIH2024_004',
        title: 'Smart Agriculture',
        description: 'Develop an IoT-based smart agriculture system with sensors for soil moisture, temperature, and humidity monitoring. Includes automated irrigation control and crop health analysis.',
        pptLink: 'https://docs.google.com/presentation/d/4jkl012',
        progress: 'In Review'
      },
      {
        id: 5,
        teamId: 'SIH2024_005',
        title: 'Disaster Alert System',
        description: 'Create an early warning system for natural disasters using satellite data, weather forecasting, and machine learning. Includes mobile alerts and evacuation route planning.',
        pptLink: 'https://docs.google.com/presentation/d/5mno345',
        progress: 'In Review'
      }
    ]

    setMainProblem(mockData)
    setOtherProblems(mockOtherProblems)
    setLoading(false)
  }, [id])

  const handleMarkChange = (criteria, value) => {
    // Ensure value is between 0 and 20
    const numValue = Math.min(Math.max(parseInt(value) || 0, 0), 20)
    setMarks(prev => ({
      ...prev,
      [criteria]: numValue
    }))
  }

  const getTotalMarks = () => {
    return Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Add API call to save marks
    console.log('Submitting marks:', marks)
  }

  if (loading || !mainProblem) {
    return (
      <div>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          Loading...
        </div>
      </div>
    )
  }

  const markingCriteria = [
    { id: 'problemUnderstanding', label: 'Problem Understanding & Relevance' },
    { id: 'innovativeness', label: 'Innovativeness & Creativity' },
    { id: 'technicalFeasibility', label: 'Technical Feasibility' },
    { id: 'implementation', label: 'Implementation & Prototype Quality' },
    { id: 'impact', label: 'Impact & Usefulness' },
    { id: 'presentation', label: 'Presentation & Teamwork' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Primary Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Team ID</p>
              <p className="text-lg font-semibold text-gray-900">{mainProblem.teamId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Team Name</p>
              <p className="text-lg font-semibold text-gray-900">{mainProblem.teamName}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Idea Name</p>
              <p className="text-lg font-semibold text-gray-900">{mainProblem.title}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Idea Description</p>
              <p className="text-base text-gray-700">{mainProblem.description}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">PPT Link</p>
              <a 
                href={mainProblem.pptLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Presentation
              </a>
            </div>
          </div>
        </div>

        {/* Marking Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Evaluation Criteria</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {markingCriteria.map(criteria => (
                <div key={criteria.id} className="space-y-2">
                  <label htmlFor={criteria.id} className="text-sm font-medium text-gray-700 flex justify-between">
                    {criteria.label}
                    <span className="text-gray-500">(Max: 20)</span>
                  </label>
                  <input
                    type="number"
                    id={criteria.id}
                    value={marks[criteria.id]}
                    onChange={(e) => handleMarkChange(criteria.id, e.target.value)}
                    min="0"
                    max="20"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-lg font-semibold">
                Total Marks: <span className="text-blue-600">{getTotalMarks()}</span>
                <span className="text-gray-500 text-base ml-2">/120</span>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Submit Evaluation
              </button>
            </div>
          </form>
        </div>

        {/* Other Problem Statements */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Problem Statements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherProblems.map(problem => (
              <div key={problem.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Team ID</p>
                    <p className="text-base font-semibold text-gray-900">{problem.teamId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Idea Name</p>
                    <p className="text-base font-semibold text-gray-900 line-clamp-2">{problem.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Idea Description</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{problem.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">PPT Link</p>
                    <a 
                      href={problem.pptLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Presentation
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarkEntry