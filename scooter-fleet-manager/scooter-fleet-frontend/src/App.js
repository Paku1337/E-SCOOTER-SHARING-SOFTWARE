import React, { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { 
  BarChart3, Map, Package, Zap, Users, DollarSign, LogOut, Menu, X,
  Plus, Edit2, Trash2, MapPin, Battery, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Activity, Lock, Unlock, Settings, Search, Download,
  FileText, AlertCircle, Info, ChevronRight, Home, MoreVertical, 
  RadioTower, Cpu, Wind, ShoppingCart, Wrench, BarChart2, PieChart,
  TrendingDown, Eye, EyeOff, Bell, MessageSquare, Phone, Mail,
  Calendar, ArrowUp, ArrowDown, Zap as ZapIcon, Navigation2, MapPinned
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Comprehensive Fleet Management Dashboard
export default function ScooterFleetManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scooters, setScooters] = useState([]);
  const [spots, setSpots] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedScooter, setSelectedScooter] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [expandedSections, setExpandedSections] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setShowAuthForm(false);
      fetchDashboardData();
      // Simulate real-time updates
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (activeTab === 'map' && mapRef.current && !mapInstanceRef.current) {
      try {
        const map = L.map(mapRef.current).setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }
  }, [activeTab, mapRef]);

  // Update map markers when scooters or spots change
  useEffect(() => {
    if (mapInstanceRef.current && activeTab === 'map' && scooters.length > 0) {
      // Clear existing markers
      mapInstanceRef.current.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Add scooter markers
      scooters.forEach(scooter => {
        if (scooter.latitude && scooter.longitude) {
          const markerColor = scooter.status === 'available' ? 'green' : 
                            scooter.status === 'in_use' ? 'blue' : 
                            scooter.status === 'maintenance' ? 'orange' : 'red';
          
          const customIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs" style="background: ${markerColor === 'green' ? '#10b981' : markerColor === 'blue' ? '#3b82f6' : markerColor === 'orange' ? '#f59e0b' : '#ef4444'}">🛴</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });
          
          L.marker([scooter.latitude, scooter.longitude], { icon: customIcon })
            .bindPopup(`<strong>${scooter.name}</strong><br/>Status: ${scooter.status}<br/>Battery: ${scooter.battery_level}%`)
            .addTo(mapInstanceRef.current);
        }
      });

      // Add spot markers
      spots.forEach(spot => {
        if (spot.latitude && spot.longitude) {
          const spotIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold" style="background: #8b5cf6">📍</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });
          
          L.marker([spot.latitude, spot.longitude], { icon: spotIcon })
            .bindPopup(`<strong>${spot.name}</strong><br/>Capacity: ${spot.capacity}`)
            .addTo(mapInstanceRef.current);
        }
      });

      // Fit bounds if markers exist
      if (scooters.some(s => s.latitude && s.longitude) || spots.some(s => s.latitude && s.longitude)) {
        const group = new L.featureGroup(mapInstanceRef.current._layers);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [scooters, spots, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        setShowAuthForm(false);
        fetchDashboardData();
        setNotifications([{ id: 1, type: 'success', message: 'Welcome back!' }]);
      } else {
        setNotifications([{ id: 1, type: 'error', message: data.error }]);
      }
    } catch (error) {
      setNotifications([{ id: 1, type: 'error', message: 'Login failed: ' + error.message }]);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setShowAuthForm(true);
    setLoginEmail('');
    setLoginPassword('');
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [scootersRes, spotsRes, tasksRes, statsRes, usersRes] = await Promise.all([
        fetchWithAuth('/scooters'),
        fetchWithAuth('/spots'),
        fetchWithAuth('/tasks'),
        fetchWithAuth('/admin/stats'),
        currentUser?.role === 'admin' ? fetchWithAuth('/admin/users') : Promise.resolve({ ok: false })
      ]);

      if (scootersRes.ok) setScooters(await scootersRes.json());
      if (spotsRes.ok) setSpots(await spotsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes?.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
      setNotifications([{ id: Date.now(), type: 'error', message: 'Failed to load data' }]);
    }
    setIsLoading(false);
  };

  const createTask = async (scooterId, taskType, priority = 'normal') => {
    try {
      const response = await fetchWithAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          scooterId: parseInt(scooterId),
          taskType,
          priority,
          description: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task for scooter`
        })
      });
      if (response.ok) {
        setNotifications([{ id: Date.now(), type: 'success', message: `${taskType} task created!` }]);
        await fetchDashboardData();
      } else {
        setNotifications([{ id: Date.now(), type: 'error', message: 'Failed to create task' }]);
      }
    } catch (error) {
      setNotifications([{ id: Date.now(), type: 'error', message: 'Error: ' + error.message }]);
    }
  };

  const updateScooterStatus = async (scooterId, status) => {
    try {
      const response = await fetchWithAuth(`/scooters/${scooterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setNotifications([{ id: Date.now(), type: 'success', message: 'Status updated!' }]);
        await fetchDashboardData();
      }
    } catch (error) {
      setNotifications([{ id: Date.now(), type: 'error', message: 'Error: ' + error.message }]);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredScooters = scooters.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchSearch = searchTerm === '' || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.device_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Login Screen
  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/95 border border-gray-200 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">Fleet Pro</h1>
            <p className="text-gray-600 text-center mb-2 text-lg">Enterprise E-Scooter Management</p>
            <p className="text-gray-500 text-center mb-8 text-sm">Professional fleet operations platform</p>

            {notifications.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {notifications[0].message}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="admin@fleet.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm text-center mb-3"><strong>Demo Credentials:</strong></p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                <p><strong>Admin:</strong> admin@fleet.com / password123</p>
                <p><strong>Worker:</strong> worker@fleet.com / password123</p>
                <p><strong>Client:</strong> client@fleet.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg shadow-lg backdrop-blur ${
              notif.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
              notif.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            } pointer-events-auto animate-fade-in`}
          >
            <div className="flex items-center gap-2">
              {notif.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notif.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {notif.type === 'info' && <Bell className="w-5 h-5" />}
              <span>{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fleet Pro</h1>
                <p className="text-xs text-gray-500">Enterprise Management</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-emerald-500" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
                  <p className="text-xs text-gray-500 uppercase">{currentUser?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition flex items-center gap-2 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-900"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row gap-2 py-4 ${menuOpen ? 'flex' : 'hidden md:flex'}`}>
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard', roles: ['admin', 'worker', 'client'] },
              { id: 'map', icon: Map, label: 'Live Map', roles: ['admin', 'worker'] },
              { id: 'scooters', icon: Package, label: 'Fleet', roles: ['admin', 'worker', 'client'] },
              { id: 'spots', icon: MapPin, label: 'Spots', roles: ['admin', 'worker'] },
              { id: 'tasks', icon: Zap, label: 'Tasks', roles: ['admin', 'worker'] },
              { id: 'maintenance', icon: Wrench, label: 'Maintenance', roles: ['admin', 'worker'] },
              { id: 'analytics', icon: BarChart2, label: 'Analytics', roles: ['admin'] },
              { id: 'users', icon: Users, label: 'Users', roles: ['admin'] },
              { id: 'billing', icon: DollarSign, label: 'Billing', roles: ['admin', 'client'] },
              { id: 'support', icon: MessageSquare, label: 'Support', roles: ['admin', 'client'] }
            ]
              .filter(item => item.roles.includes(currentUser?.role))
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Fleet Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { icon: Package, label: 'Total Fleet', value: stats.total_scooters, color: 'from-emerald-500', trend: '+2.5%' },
                  { icon: Activity, label: 'Active Rides', value: stats.in_use_scooters, color: 'from-blue-500', trend: '+12%' },
                  { icon: Battery, label: 'Low Battery', value: Math.floor(stats.total_scooters * 0.15), color: 'from-orange-500', trend: '-5%' },
                  { icon: AlertTriangle, label: 'Lost', value: stats.lost_scooters, color: 'from-red-500', trend: '0%' },
                  { icon: DollarSign, label: 'Daily Revenue', value: `$${(stats.pending_revenue || 0).toFixed(0)}`, color: 'from-yellow-500', trend: '+8.3%' }
                ].map((stat, i) => (
                  <div key={i} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm mb-1 font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className={`text-xs font-semibold mt-2 ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-gray-600'}`}>
                          {stat.trend} vs yesterday
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} to-opacity-20 rounded-xl flex items-center justify-center opacity-80 group-hover:opacity-100 transition`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts & Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tasks Status */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Pending Tasks
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'pending').slice(0, 6).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.task_type}</p>
                        <p className="text-xs text-gray-500">ID: {task.id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fleet Status Distribution */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-500" />
                  Fleet Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Available', value: stats.available_scooters, color: 'bg-emerald-100 text-emerald-700', pct: Math.round((stats.available_scooters / stats.total_scooters) * 100) },
                    { label: 'In Use', value: stats.in_use_scooters, color: 'bg-blue-100 text-blue-700', pct: Math.round((stats.in_use_scooters / stats.total_scooters) * 100) },
                    { label: 'Maintenance', value: 0, color: 'bg-yellow-100 text-yellow-700', pct: 0 },
                    { label: 'Reserved', value: 0, color: 'bg-purple-100 text-purple-700', pct: 0 }
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{s.label}</span>
                        <span className={`text-sm font-bold ${s.color}`}>{s.pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${
                            s.value > 0 ? (s.label === 'Available' ? 'from-emerald-400 to-emerald-500' : 
                                        s.label === 'In Use' ? 'from-blue-400 to-blue-500' :
                                        s.label === 'Maintenance' ? 'from-yellow-400 to-yellow-500' :
                                        'from-purple-400 to-purple-500') : 'from-gray-300 to-gray-300'
                          }`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                  Revenue Status
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">This Week</span>
                      <span className="text-sm font-bold text-green-600">$2,341</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">This Month</span>
                      <span className="text-sm font-bold text-blue-600">$12,890</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Pending Settlements</p>
                    <p className="text-2xl font-bold text-amber-600">${(stats.pending_revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {tasks.slice(0, 8).map((task, idx) => (
                  <div key={task.id} className="flex items-center gap-4 pb-3 border-b border-gray-100 last:border-0">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-emerald-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-amber-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">{task.task_type} - Task #{task.id}</p>
                      <p className="text-xs text-gray-500">{new Date(task.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Live Fleet Map</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" style={{ height: '600px' }}>
              <div 
                ref={mapRef} 
                className="w-full h-full"
                style={{ background: '#f0f0f0' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">GPS Active</p>
                <p className="text-2xl font-bold text-emerald-600">{scooters.filter(s => s.latitude && s.longitude).length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Signal Strong</p>
                <p className="text-2xl font-bold text-blue-600">{Math.floor(scooters.length * 0.9)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Geofence Zones</p>
                <p className="text-2xl font-bold text-purple-600">{spots.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">GPS Loss</p>
                <p className="text-2xl font-bold text-red-600">{scooters.length - scooters.filter(s => s.latitude && s.longitude).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Management Tab */}
        {activeTab === 'scooters' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Fleet Management</h2>
              {currentUser?.role === 'admin' && (
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" />
                  Add Scooter
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Latest Added</option>
                    <option>Battery Low</option>
                    <option>Most Used</option>
                    <option>Least Maintained</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scooter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScooters.map(scooter => (
                <div key={scooter.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition group cursor-pointer" onClick={() => setSelectedScooter(scooter)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{scooter.name}</h3>
                      <p className="text-sm text-gray-600">{scooter.model}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        scooter.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                        scooter.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                        scooter.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {scooter.status}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Battery className="w-4 h-4" /> Battery
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              (scooter.battery_level || 0) > 50 ? 'bg-emerald-500' :
                              (scooter.battery_level || 0) > 20 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${scooter.battery_level || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 w-8 text-right">{scooter.battery_level || '0'}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Navigation2 className="w-4 h-4" /> Distance
                      </span>
                      <span className="font-medium text-gray-900">2.3 km</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <RadioTower className="w-4 h-4" /> GPS Signal
                      </span>
                      <span className="font-medium text-emerald-600">Strong</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Device ID</span>
                      <span className="text-gray-900 font-mono text-xs">{scooter.device_id.substring(0, 8)}...</span>
                    </div>
                  </div>

                  {currentUser?.role !== 'client' && (
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                      {['lock', 'unlock', 'beep', 'collect'].map(action => (
                        <button
                          key={action}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (action === 'collect') createTask(scooter.id, 'collect', 'normal');
                          }}
                          className="px-2 py-2 text-xs font-medium bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-lg transition capitalize"
                          title={action}
                        >
                          {action === 'lock' ? '🔒' : action === 'unlock' ? '🔓' : action === 'beep' ? '🔔' : '📦'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Fleet Summary */}
            {filteredScooters.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl p-6">
                <p className="text-sm text-gray-700">
                  Showing <strong>{filteredScooters.length}</strong> of <strong>{scooters.length}</strong> scooters
                  {filterStatus !== 'all' && ` • Status: ${filterStatus}`}
                  {searchTerm && ` • Search: "${searchTerm}"`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Spots Management Tab */}
        {activeTab === 'spots' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Parking Zones</h2>
              {currentUser?.role === 'admin' && (
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" />
                  Create Zone
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spots.map(spot => {
                const scootersInSpot = scooters.filter(s => Math.random() > 0.5).length;
                const occupancy = (scootersInSpot / spot.capacity) * 100;
                return (
                  <div key={spot.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition" onClick={() => setSelectedSpot(spot)}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-500" />
                          {spot.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{spot.address}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Active</span>
                    </div>

                    <div className="space-y-4 mb-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Occupancy</span>
                          <span className="text-sm font-bold text-gray-900">{scootersInSpot}/{spot.capacity}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${
                              occupancy < 60 ? 'from-emerald-400 to-emerald-500' :
                              occupancy < 80 ? 'from-yellow-400 to-yellow-500' :
                              'from-red-400 to-red-500'
                            }`}
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 space-y-2">
                        <div>
                          <p className="text-xs text-gray-600">Coordinates</p>
                          <p className="text-xs font-mono text-gray-900">{spot.latitude?.toFixed(3)}, {spot.longitude?.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Capacity</p>
                          <p className="text-sm font-bold text-gray-900">{spot.capacity} scooters</p>
                        </div>
                      </div>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-lg transition flex items-center justify-center gap-2">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tasks Management Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Task ID</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Scooter</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 15).map(task => (
                      <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">#{task.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">{task.task_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Scooter {task.scooter_id}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded text-xs font-bold ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(task.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          <button className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded transition font-medium text-xs">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Maintenance Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Pending Service</p>
                    <p className="text-3xl font-bold text-yellow-600">{Math.floor(scooters.length * 0.12)}</p>
                  </div>
                  <Wrench className="w-8 h-8 text-yellow-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Completed Today</p>
                    <p className="text-3xl font-bold text-emerald-600">3</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Scheduled</p>
                    <p className="text-3xl font-bold text-blue-600">7</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Maintenance History</h3>
              <div className="space-y-3">
                {[1,2,3,4,5].map((idx) => (
                  <div key={idx} className="flex items-center gap-4 pb-3 border-b border-gray-100 last:border-0">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Scooter S-10245 • Battery replacement</p>
                      <p className="text-xs text-gray-500">Completed 2 hours ago • By: John Doe</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Done</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Fleet Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Avg Daily Rides</p>
                <p className="text-3xl font-bold text-blue-600">328</p>
                <p className="text-xs text-emerald-600 mt-2">↑ 12% vs last week</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Utilization Rate</p>
                <p className="text-3xl font-bold text-emerald-600">76%</p>
                <p className="text-xs text-emerald-600 mt-2">↑ 5% vs last week</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Avg Trip Duration</p>
                <p className="text-3xl font-bold text-purple-600">12.5m</p>
                <p className="text-xs text-gray-500 mt-2">Stable</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Revenue per Unit</p>
                <p className="text-3xl font-bold text-yellow-600">$45.2</p>
                <p className="text-xs text-emerald-600 mt-2">↑ 8% vs last week</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Popular Zones</h3>
              <div className="space-y-4">
                {spots.map((spot, idx) => (
                  <div key={spot.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{idx + 1}. {spot.name}</span>
                      <span className="text-sm font-bold text-gray-900">{142 - idx * 15} pickups</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ width: `${100 - idx * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2 shadow-md">
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { email: 'admin@fleet.com', role: 'admin', status: 'active', joined: '2024-01-15' },
                      { email: 'worker1@fleet.com', role: 'worker', status: 'active', joined: '2024-02-01' },
                      { email: 'worker2@fleet.com', role: 'worker', status: 'active', joined: '2024-02-01' },
                      { email: 'client@fleet.com', role: 'client', status: 'active', joined: '2024-03-01' }
                    ].map(user => (
                      <tr key={user.email} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold capitalize">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.joined}</td>
                        <td className="px-6 py-4 text-sm">
                          <button className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded transition font-medium text-xs">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (currentUser?.role === 'admin' || currentUser?.role === 'client') && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Billing & Invoices</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2 font-medium">Pending Invoices</p>
                <p className="text-3xl font-bold text-amber-600">${(stats?.pending_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-amber-600 mt-2">Due within 30 days</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2 font-medium">Paid Invoices</p>
                <p className="text-3xl font-bold text-emerald-600">${(stats?.paid_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-emerald-600 mt-2">This month</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-2 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600">${((stats?.pending_revenue || 0) + (stats?.paid_revenue || 0)).toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-2">All time</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Invoice</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5].map(idx => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">INV-2024-00{idx}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">${(2000 + idx * 500).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            idx % 2 === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {idx % 2 === 0 ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">2024-0{idx}-15</td>
                        <td className="px-6 py-4 text-sm">
                          <button className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded transition font-medium text-xs flex items-center gap-1">
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support & Help</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Open Tickets
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">Scooter S-10234 won't unlock</p>
                    <p className="text-xs text-gray-500 mt-1">Reported 2 hours ago</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">GPS signal lost on multiple units</p>
                    <p className="text-xs text-gray-500 mt-1">Reported 5 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-500" />
                  Contact Support
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Phone</p>
                    <p className="text-sm text-gray-900">+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
                    <p className="text-sm text-gray-900">support@fleetpro.com</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Hours</p>
                    <p className="text-sm text-gray-900">24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Fleet Pro</p>
              <p className="text-xs text-gray-600">Enterprise-grade e-scooter fleet management platform</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Product</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#" className="hover:text-emerald-600">Features</a></li>
                <li><a href="#" className="hover:text-emerald-600">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-600">API Docs</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Company</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#" className="hover:text-emerald-600">About</a></li>
                <li><a href="#" className="hover:text-emerald-600">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-600">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Legal</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#" className="hover:text-emerald-600">Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-600">Terms</a></li>
                <li><a href="#" className="hover:text-emerald-600">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <p className="text-xs text-gray-600 text-center">© 2024 Fleet Pro. All rights reserved. | Enterprise Fleet Management Solution</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
