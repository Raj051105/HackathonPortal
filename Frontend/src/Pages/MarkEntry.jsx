import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../Components/Header'

const BASE_URL = "http://127.0.0.1:8000"

const MarkEntry = () => {
  const { id: team_id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mainProblem, setMainProblem] = useState(null)
  const [otherProblems, setOtherProblems] = useState([])
  const [approvedIdeas, setApprovedIdeas] = useState({})
  
  // Marking criteria state
  const [marks, setMarks] = useState({
    'Relevance to the Problem Statement': '',
    'Innovativeness & Creativity': '',
    'Technical Feasibility': '',
    'Implementation & Prototype Quality': '',
    'Impact & Usefulness': '',
    'Presentation & Teamwork': ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(`${BASE_URL}/api/teams/${team_id}/details/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Validate required data structure
        if (!data || !data.primary_idea) {
          throw new Error('Invalid data structure received from server')
        }

        // Transform the data to match our component structure
        const transformedMainProblem = {
          id: team_id,
          teamId: data.team_id || 'N/A',
          teamName: data.team_name || 'Unknown Team',
          title: data.primary_idea.idea_title || 'No title provided',
          description: data.primary_idea.idea_description || 'No description provided',
        }

        // Set the marks if they exist
        if (data.rubric_scores && typeof data.rubric_scores === 'object') {
          setMarks(prevMarks => ({
            ...prevMarks,
            ...data.rubric_scores
          }))
        }

        // Transform secondary ideas (handle case where secondary_ideas might not exist)
        const transformedSecondaryIdeas = (data.secondary_ideas || []).map((idea, index) => ({
          id: index + 1,
          teamId: data.team_id || 'N/A',
          title: idea.idea_title || 'No title provided',
          description: idea.idea_description || 'No description provided',
        }))

        setMainProblem(transformedMainProblem)
        setOtherProblems(transformedSecondaryIdeas)
        // initialize approvedIdeas map (no idea approved by default)
        setApprovedIdeas(() => {
          const map = {}
          // main idea
          map[transformedMainProblem.title] = false
          // secondary ideas
          transformedSecondaryIdeas.forEach(i => { map[i.title] = false })
          return map
        })
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (team_id) {
      fetchData()
    } else {
      setError('No team ID provided')
      setLoading(false)
    }
  }, [team_id])

  const toggleApprove = (title) => {
    setApprovedIdeas(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const handleMarkChange = (criteria, value) => {
    // Find the maximum marks for this criteria
    const maxMarks = markingCriteria.find(c => c.id === criteria)?.maxMarks || 20
    // Ensure value is between 0 and maxMarks
    const numValue = Math.min(Math.max(parseInt(value) || 0, 0), maxMarks)
    setMarks(prev => ({
      ...prev,
      [criteria]: numValue
    }))
  }

  const getTotalMarks = () => {
    return Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Prepare data in the required format
      const submitData = {
        team_id: team_id,
        ...Object.keys(marks).reduce((acc, key) => ({
          ...acc,
          [key]: parseInt(marks[key]) // Convert marks to integers
        }), {})
      }

      // Build approval titles list from checked boxes
      const approveTitles = Object.entries(approvedIdeas)
        .filter(([title, checked]) => checked)
        .map(([title]) => title)

      // Prepare fetches: submit marks and (optionally) submit approvals concurrently
      const response = await fetch(`${BASE_URL}/api/teams/scores/submit/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      // If approval list is non-empty, send approval request as well
      let approveResponse = { ok: true }
      if (approveTitles.length > 0) {
        // NOTE: assuming backend expects { titles: [..] } as body. Change if your API needs a different key.
        const approvePromise = fetch(`${BASE_URL}/api/teams/${team_id}/ideas/approve/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // send raw array of titles as the request body
          body: JSON.stringify({ approved_ideas: approveTitles })
        })

        // We already have marks response; await the approval response now
        approveResponse = await approvePromise
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to submit marks: ${response.status}`)
      }

      if (approveTitles.length > 0 && !approveResponse.ok) {
        const errorData = await approveResponse.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to approve ideas: ${approveResponse.status}`)
      }

      alert('Marks submitted successfully!')
      // Redirect to dashboard after successful submission
      navigate('/dashboard')
    } catch (err) {
      console.error('Error submitting marks:', err)
      alert(`Failed to submit marks: ${err.message}`)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main problem not found
  if (!mainProblem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">No team data found.</p>
          </div>
        </div>
      </div>
    )
  }

  const markingCriteria = [
    { 
      id: 'Relevance to the Problem Statement', 
      label: 'Relevance to the Problem Statement',
      maxMarks: 20,
      description: [
        'Clarity in explaining the problem statement.',
        'Understanding of target users & real-world context.',
        'Fit with the SIH problem theme.'
      ]
    },
    { 
      id: 'Innovativeness & Creativity', 
      label: 'Innovativeness & Creativity',
      maxMarks: 20,
      description: [
        'Originality of the idea compared to existing solutions.',
        'Creativity in approach/solution design.',
        'Potential to disrupt or significantly improve current practices.'
      ]
    },
    { 
      id: 'Technical Feasibility', 
      label: 'Technical Feasibility',
      maxMarks: 20,
      description: [
        'Suitability of chosen technologies for solving the problem.',
        'Scalability and practicality of the proposed solution.',
        'Soundness of architecture/algorithm/workflow.'
      ]
    },
    { 
      id: 'Implementation & Prototype Quality', 
      label: 'Implementation & Prototype Quality',
      maxMarks: 25,
      description: [
        'Stage-appropriate proof (simulation, PoC, UI/UX, architecture diagram, or working demo).',
        'Completeness and clarity of demonstration.',
        'Technical depth/effort shown in execution.'
      ]
    },
    { 
      id: 'Impact & Usefulness', 
      label: 'Impact & Usefulness',
      maxMarks: 10,
      description: [
        'Potential benefit to society, industry, or environment.',
        'Relevance to intended end-users and problem scope.',
        'Long-term sustainability and adaptability'
      ]
    },
    { 
      id: 'Presentation & Teamwork', 
      label: 'Presentation & Teamwork',
      maxMarks: 5,
      description: [
        'Clarity, structure, and persuasiveness of presentation.',
        'Team coordination, role clarity, and equal participation.',
        'Confidence and accuracy in Q&A handling.'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Primary Information</h2>
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!approvedIdeas[mainProblem.title]}
                onChange={() => toggleApprove(mainProblem.title)}
                className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Approve Idea</span>
            </label>
          </div>
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
                    <span className="text-gray-500">(Max: {criteria.maxMarks})</span>
                  </label>
                  <input
                    type="number"
                    id={criteria.id}
                    value={marks[criteria.id]}
                    onChange={(e) => handleMarkChange(criteria.id, e.target.value)}
                    min="0"
                    max={criteria.maxMarks}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <div className="mt-2 space-y-1">
                    {criteria.description.map((desc, index) => (
                      <p key={index} className="text-sm text-gray-600 pl-4 relative">
                        <span className="absolute left-0">•</span>
                        {desc}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-lg font-semibold">
                Total Marks: <span className="text-blue-600">{getTotalMarks()}</span>
                <span className="text-gray-500 text-base ml-2">/100</span>
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
        {otherProblems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Problem Statements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherProblems.map(problem => (
                <div key={problem.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Team ID</p>
                        <p className="text-base font-semibold text-gray-900">{problem.teamId}</p>
                      </div>
                      <label className="flex items-center space-x-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!approvedIdeas[problem.title]}
                          onChange={() => toggleApprove(problem.title)}
                          className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Approve Idea</span>
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Idea Name</p>
                      <p className="text-base font-semibold text-gray-900" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{problem.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Idea Description</p>
                      <p className="text-sm text-gray-700" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{problem.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkEntry