import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Map, Package, Zap, Users, DollarSign, LogOut, Menu, X,
  Plus, Edit2, Trash2, MapPin, Battery, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Activity, Lock, Unlock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ScooterFleetManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scooters, setScooters] = useState([]);
  const [spots, setSpots] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setShowAuthForm(false);
      fetchDashboardData();
    }
  }, []);

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
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
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
      const [scootersRes, spotsRes, tasksRes, statsRes] = await Promise.all([
        fetchWithAuth('/scooters'),
        fetchWithAuth('/spots'),
        fetchWithAuth('/tasks'),
        fetchWithAuth('/admin/stats')
      ]);

      if (scootersRes.ok) setScooters(await scootersRes.json());
      if (spotsRes.ok) setSpots(await spotsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setIsLoading(false);
  };

  const createTask = async (scooterId, taskType) => {
    try {
      const response = await fetchWithAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          scooterId: parseInt(scooterId),
          taskType,
          priority: 'normal',
          description: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} task for scooter`
        })
      });
      if (response.ok) {
        alert(`${taskType} task created!`);
        fetchDashboardData();
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const updateScooterStatus = async (scooterId, status) => {
    try {
      const response = await fetchWithAuth(`/scooters/${scooterId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-slate-900" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center mb-2">Fleet Manager</h1>
            <p className="text-slate-400 text-center mb-8">E-Scooter Management System</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-slate-400 text-sm text-center mt-6">Demo: admin@fleet.com / password123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Fleet Manager</h1>
              <p className="text-sm text-slate-400">{currentUser?.email}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 md:gap-4">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'scooters', icon: Package, label: 'Scooters' },
            { id: 'spots', icon: MapPin, label: 'Spots' },
            { id: 'tasks', icon: Zap, label: 'Tasks' },
            ...(currentUser?.role === 'admin' ? [
              { id: 'users', icon: Users, label: 'Users' },
              { id: 'billing', icon: DollarSign, label: 'Billing' }
            ] : [])
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === item.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Package, label: 'Total Scooters', value: stats.total_scooters, color: 'from-emerald-500' },
                { icon: Activity, label: 'In Use', value: stats.in_use_scooters, color: 'from-blue-500' },
                { icon: AlertTriangle, label: 'Lost', value: stats.lost_scooters, color: 'from-red-500' },
                { icon: DollarSign, label: 'Pending Revenue', value: `$${(stats.pending_revenue || 0).toFixed(2)}`, color: 'from-yellow-500' }
              ].map((stat, i) => (
                <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} to-opacity-20 rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Pending Tasks
                </h3>
                <div className="space-y-2">
                  {tasks.filter(t => t.status === 'pending').slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-slate-300">{task.task_type}</span>
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">{task.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scooter Status */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Scooter Status
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Available', value: stats.available_scooters, color: 'bg-emerald-500/20 text-emerald-300' },
                    { label: 'In Use', value: stats.in_use_scooters, color: 'bg-blue-500/20 text-blue-300' },
                    { label: 'Maintenance', value: 0, color: 'bg-yellow-500/20 text-yellow-300' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-slate-300">{s.label}</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scooters Tab */}
        {activeTab === 'scooters' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Scooters</h2>
              {currentUser?.role === 'admin' && (
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Scooter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scooters.map(scooter => (
                <div key={scooter.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{scooter.name}</h3>
                      <p className="text-sm text-slate-400">{scooter.model}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      scooter.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' :
                      scooter.status === 'in_use' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {scooter.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Battery className="w-4 h-4" /> Battery
                      </span>
                      <span className="text-white font-medium">{scooter.battery_level || 'N/A'}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">ID</span>
                      <span className="text-white font-mono text-xs">{scooter.device_id}</span>
                    </div>
                  </div>

                  {currentUser?.role !== 'client' && (
                    <div className="grid grid-cols-2 gap-2">
                      {['rebalance', 'collect', 'deploy', 'lost'].map(type => (
                        <button
                          key={type}
                          onClick={() => createTask(scooter.id, type)}
                          className="text-xs px-2 py-1 bg-white/10 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 rounded transition"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spots Tab */}
        {activeTab === 'spots' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Parking Spots</h2>
              {currentUser?.role === 'admin' && (
                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Spot
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spots.map(spot => (
                <div key={spot.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        {spot.name}
                      </h3>
                      <p className="text-sm text-slate-400">{spot.address}</p>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">Active</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">Capacity: {spot.capacity} scooters</p>
                    <p className="text-slate-300">Coordinates: {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Tasks</h2>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-6 py-4 text-sm text-white">{task.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{task.task_type}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{task.priority}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(task.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && currentUser?.role === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Billing & Revenue</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">${(stats?.pending_revenue || 0).toFixed(2)}</p>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Paid</p>
                <p className="text-2xl font-bold text-emerald-400">${(stats?.paid_revenue || 0).toFixed(2)}</p>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Total</p>
                <p className="text-2xl font-bold text-white">${((stats?.pending_revenue || 0) + (stats?.paid_revenue || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
