import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import api from '../api/api';
import { saveAs } from 'file-saver';

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchSubmissions();
  }, [token]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('form/getform',);
      const data = Array.isArray(response.data) ? response.data : [];
      setSubmissions(data);

      // Initialize selectedDate for each submission
      const dateState = {};
      data.forEach(sub => { dateState[sub._id] = null; });
      setSelectedDate(dateState);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load submissions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtered submissions based on status, search, and date range
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Status filter
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

      // Search filter (name or email)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = sub.name?.toLowerCase().includes(term);
        const emailMatch = sub.email?.toLowerCase().includes(term);
        if (!nameMatch && !emailMatch) return false;
      }

      // Date range filter (submittedAt)
      if (dateRange.start || dateRange.end) {
        const subDate = new Date(sub.submittedAt || sub.createdAt);
        if (dateRange.start && subDate < dateRange.start) return false;
        if (dateRange.end) {
          const endOfDay = new Date(dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (subDate > endOfDay) return false;
        }
      }

      return true;
    });
  }, [submissions, statusFilter, searchTerm, dateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateRange]);

  // Counters
  const totalCount = submissions.length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const handleApprove = async (id) => {
    if (!selectedDate[id]) {
      alert('Please select an appointment date first');
      return;
    }
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.post(`admin/submissions/${id}/approve`,
        { appointmentDate: selectedDate[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmissions(prev => prev.map(sub =>
        sub._id === id ? { ...sub, status: 'approved', appointmentDate: selectedDate[id] } : sub
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this appointment?')) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.post(`admin/submissions/${id}/reject`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmissions(prev => prev.map(sub =>
        sub._id === id ? { ...sub, status: 'rejected' } : sub
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return format(d, 'PPP p');
    } catch {
      return 'Invalid date';
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Location', 'Message', 'Status', 'Appointment Date', 'Submitted At'];
    const data = filteredSubmissions.map(sub => [
      sub.name,
      sub.email,
      sub.location,
      sub.message,
      sub.status,
      sub.appointmentDate ? formatDate(sub.appointmentDate) : '',
      sub.submittedAt ? formatDate(sub.submittedAt) : ''
    ]);
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `submissions_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {user?.username || user?.email || user?.name || 'Admin'}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
          </div>

          {/* Filters and Export */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-2 text-sm w-full sm:w-64"
                />

                <DatePicker
                  selectsRange
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onChange={(update) => setDateRange({ start: update[0], end: update[1] })}
                  placeholderText="Date range"
                  className="border rounded px-3 py-2 text-sm w-full sm:w-64"
                  isClearable
                />
              </div>

              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Table - Responsive */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No submissions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedSubmissions.map((sub) => (
                      <tr key={sub._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.location}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sub.message}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sub.status === 'approved' ? formatDate(sub.appointmentDate) : (
                            sub.status === 'pending' ? (
                              <DatePicker
                                selected={selectedDate[sub._id]}
                                onChange={(date) => setSelectedDate(prev => ({ ...prev, [sub._id]: date }))}
                                showTimeSelect
                                dateFormat="MMMM d, yyyy h:mm aa"
                                placeholderText="Select date/time"
                                className="border rounded p-1 text-sm w-40"
                                disabled={sub.status !== 'pending'}
                              />
                            ) : '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {sub.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => handleApprove(sub._id)}
                                disabled={actionLoading[sub._id]}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                {actionLoading[sub._id] ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(sub._id)}
                                disabled={actionLoading[sub._id]}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                {actionLoading[sub._id] ? '...' : 'Reject'}
                              </button>
                            </div>
                          )}
                          {sub.status === 'approved' && (
                            <span className="text-green-600">Approved</span>
                          )}
                          {sub.status === 'rejected' && (
                            <span className="text-red-600">Rejected</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredSubmissions.length > 0 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}