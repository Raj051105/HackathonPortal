import React, { useState, useEffect } from 'react'
import Header from '../Components/Header'
import { Link } from 'react-router-dom'
import { Eye, SquarePen, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const Dashboard = () => {
  // Export function
  const handleExport = () => {
    const exportData = problemStatements.map(item => ({
      'Team ID': item.teamId,
      'Team Name': item.teamName,
      'Problem Statement Title': item.title,
      'Status': item.progress,
      'Marks': item.marks || 'Not graded',
      'Approved Ideas': item.approvedCount || 'N/A',
      'Approved Idea Titles': item.approvedTitles && item.approvedTitles.length > 0 ? item.approvedTitles.join('; ') : 'None'
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Problem Statements')
    XLSX.writeFile(wb, 'problem_statements_data.xlsx')
  }

  const [loading, setLoading] = useState(true)
  const BASE_URL = 'http://127.0.0.1:8000'
  const [error, setError] = useState(null)

  const [stats, setStats] = useState({
    totalProblemStatements: 0,
    reviewedProblemStatements: 0,
    notReviewedProblemStatements: 0
  })

  const [problemStatements, setProblemStatements] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log("token", token)
        if (!token) throw new Error('No authentication token found')

        const response = await fetch(`${BASE_URL}/api/landing/landing_data/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) throw new Error('Failed to fetch data')

        const data = await response.json()

        const transformedData = data.map(item => ({
          id: item.team_id,
          teamId: item.team_id,
          teamName: item.team_name,
          psId: item.primary_ps_id,
          title: item.primary_ps_title,
          pptLink: item.ppt_link,
          approvedCount: item.approved_count,
          approvedTitles: item.approved_titles || [],
          progress: item.progress ? 'Reviewed' : 'In Review',
          marks: item.marks
        }))

        setProblemStatements(transformedData)
        setStats({
          totalProblemStatements: data.length,
          reviewedProblemStatements: data.filter(item => item.progress).length,
          notReviewedProblemStatements: data.filter(item => !item.progress).length
        })
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterProgress, setFilterProgress] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  const filteredData = problemStatements.filter(item => {
    const matchesSearch =
      item.teamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.psId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterProgress === 'All' || item.progress === filterProgress
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber)

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <svg className={`w-4 h-4 mr-1 ${trend.positive ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {trend.value}
            </div>
          )}
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${color}`}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Overview of problem statements and review progress</p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Problem Statements"
            value={stats.totalProblemStatements}
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            color="bg-blue-500"
          />
          <StatCard
            title="Problem Statements Reviewed"
            value={stats.reviewedProblemStatements}
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="bg-green-500"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.notReviewedProblemStatements}
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            color="bg-orange-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Problem Statements</h2>
                <p className="text-sm text-gray-600">Manage and track all submitted problem statements</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by team ID, team name, PS ID, or PS title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterProgress}
                  onChange={(e) => setFilterProgress(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Status</option>
                  <option value="In Review">In Review</option>
                  <option value="Reviewed">Reviewed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PS ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PS Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{item.teamId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{item.teamName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">{item.psId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          item.progress === 'Reviewed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.progress}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.marks ? (
                        <div className="flex items-center">
                          <span
                            className={`text-sm font-semibold ${
                              item.marks >= 85
                                ? 'text-green-600'
                                : item.marks >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.marks}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">/100</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {item.progress === 'Reviewed' ? (
                          <span
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
                            title="Already reviewed"
                          >
                            <SquarePen />
                          </span>
                        ) : (
                          <Link
                            to={`/mark/${item.id}`}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <SquarePen />
                          </Link>
                        )}
                        {item.pptLink && (
                          <a
                            href={item.pptLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of{' '}
                {filteredData.length} entries
              </div>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        currentPage === index + 1
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
