/**
 * AdminPage — Admin Panel with tabs for Users, Crops, and Courses management.
 * Protected by role === 'ADMIN' in the route guard.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/axios';
import { supabase } from '../lib/supabaseClient';
import { BarChart3, Users, Sprout, BookOpen } from 'lucide-react';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'USER' | 'RESEARCHER' | 'ADMIN';
  phone_number: string | null;
  created_at: string;
}

interface AdminCrop {
  id: string;
  name_en: string;
  name_si: string;
  category: string;
  growing_cycle_duration_days: number | null;
  min_soil_ph: number | null;
  max_soil_ph: number | null;
  preferred_soil_type: string | null;
  min_temp_celsius: number | null;
  max_temp_celsius: number | null;
  water_requirement_summary: string | null;
  pests_and_diseases: string | null;
  suitable_climate: string | null;
  image_url: string | null;
}

interface AdminCourse {
  id: string;
  title: string;
  institution: string;
  institution_type: string | null;
  nvq_level: string | null;
  certification_type: string | null;
  duration: string | null;
  mode: string | null;
  estimated_fee_lkr: number | null;
  description: string | null;
  applicable_crops: string[] | null;
  applicable_methods: string[] | null;
  apply_url: string | null;
  inquiry_url: string | null;
  is_active: boolean;
}

interface Stats {
  total_users: number;
  total_crops: number;
  total_courses: number;
}

type Tab = 'overview' | 'users' | 'crops' | 'courses';
type Role = 'USER' | 'RESEARCHER' | 'ADMIN';

const ROLE_COLORS: Record<Role, string> = {
  USER: 'bg-gray-100 text-gray-600',
  RESEARCHER: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-agri-primary/10 text-agri-primary',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const useAuthHeader = () => {
  const headerRef = useRef<Record<string, string>>({});
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        headerRef.current = { Authorization: `Bearer ${session.access_token}` };
      }
    });
  }, []);
  return headerRef;
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-agri-border">
          <h3 className="text-base font-bold text-agri-text">{title}</h3>
          <button onClick={onClose} className="text-agri-subtext hover:text-agri-text transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  </>
);

// ─── Form field ───────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-agri-text">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-agri-border bg-agri-bg text-agri-text text-sm
      placeholder:text-agri-subtext/50 focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary transition-colors ${props.className ?? ''}`}
  />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-agri-border bg-agri-bg text-agri-text text-sm
      placeholder:text-agri-subtext/50 focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary transition-colors resize-none ${props.className ?? ''}`}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-agri-border bg-agri-bg text-agri-text text-sm
      focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary transition-colors ${props.className ?? ''}`}
  />
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const authHeader = useAuthHeader();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Crops state
  const [crops, setCrops] = useState<AdminCrop[]>([]);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [cropModal, setCropModal] = useState<{ open: boolean; crop: Partial<AdminCrop> | null }>({ open: false, crop: null });
  const [cropSaving, setCropSaving] = useState(false);

  // Courses state
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseModal, setCourseModal] = useState<{ open: boolean; course: Partial<AdminCourse> | null }>({ open: false, course: null });
  const [courseSaving, setCourseSaving] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch functions ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<Stats>('/admin/stats', { headers: authHeader.current });
      setStats(res.data);
    } catch { /* silent */ }
  }, [authHeader]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await api.get<{ data: AdminUser[] }>(`/admin/users?search=${userSearch}`, { headers: authHeader.current });
      setUsers(res.data.data);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setUsersLoading(false); }
  }, [userSearch, authHeader]);

  const fetchCrops = useCallback(async () => {
    setCropsLoading(true);
    try {
      const res = await api.get<AdminCrop[]>('/admin/crops', { headers: authHeader.current });
      setCrops(res.data);
    } catch { showToast('Failed to load crops', 'error'); }
    finally { setCropsLoading(false); }
  }, [authHeader]);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await api.get<AdminCourse[]>('/admin/courses', { headers: authHeader.current });
      setCourses(res.data);
    } catch { showToast('Failed to load courses', 'error'); }
    finally { setCoursesLoading(false); }
  }, [authHeader]);

  useEffect(() => {
    fetchStats();
    const t = setTimeout(fetchStats, 600);
    return () => clearTimeout(t);
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'crops') fetchCrops();
    if (activeTab === 'courses') fetchCourses();
  }, [activeTab, fetchUsers, fetchCrops, fetchCourses]);

  // Debounced user search
  useEffect(() => {
    if (activeTab !== 'users') return;
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  // ── User actions ─────────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role }, { headers: authHeader.current });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      showToast('Role updated');
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`, { headers: authHeader.current });
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('User deleted');
    } catch { showToast('Failed to delete user', 'error'); }
  };

  // ── Crop actions ─────────────────────────────────────────────────────────────
  const handleSaveCrop = async () => {
    if (!cropModal.crop) return;
    setCropSaving(true);
    try {
      if (cropModal.crop.id) {
        const { id, ...payload } = cropModal.crop;
        await api.patch(`/admin/crops/${id}`, payload, { headers: authHeader.current });
        showToast('Crop updated');
      } else {
        await api.post('/admin/crops', cropModal.crop, { headers: authHeader.current });
        showToast('Crop created');
      }
      setCropModal({ open: false, crop: null });
      fetchCrops();
    } catch { showToast('Failed to save crop', 'error'); }
    finally { setCropSaving(false); }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm('Delete this crop? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/crops/${cropId}`, { headers: authHeader.current });
      setCrops(prev => prev.filter(c => c.id !== cropId));
      showToast('Crop deleted');
    } catch { showToast('Failed to delete crop', 'error'); }
  };

  // ── Course actions ────────────────────────────────────────────────────────────
  const handleSaveCourse = async () => {
    if (!courseModal.course) return;
    setCourseSaving(true);
    try {
      // Parse comma-separated arrays
      const payload = { ...courseModal.course };
      if (typeof payload.applicable_crops === 'string') {
        payload.applicable_crops = (payload.applicable_crops as unknown as string).split(',').map(s => s.trim()).filter(Boolean);
      }
      if (typeof payload.applicable_methods === 'string') {
        payload.applicable_methods = (payload.applicable_methods as unknown as string).split(',').map(s => s.trim()).filter(Boolean);
      }

      if (payload.id) {
        const { id, ...body } = payload;
        await api.patch(`/admin/courses/${id}`, body, { headers: authHeader.current });
        showToast('Course updated');
      } else {
        await api.post('/admin/courses', payload, { headers: authHeader.current });
        showToast('Course created');
      }
      setCourseModal({ open: false, course: null });
      fetchCourses();
    } catch { showToast('Failed to save course', 'error'); }
    finally { setCourseSaving(false); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${courseId}`, { headers: authHeader.current });
      setCourses(prev => prev.filter(c => c.id !== courseId));
      showToast('Course deleted');
    } catch { showToast('Failed to delete course', 'error'); }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { id: 'crops', label: 'Crops', icon: <Sprout className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-agri-bg flex">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
          ${toast.type === 'success' ? 'bg-agri-primary text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-agri-dark min-h-screen flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AgriPiyasa Logo" className="h-8 w-auto object-contain" />
            <div>
              <p className="text-white font-bold text-sm">Agri පියස</p>
              <p className="text-white/40 text-[10px] font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-agri-primary text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User + actions */}
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <div className="px-2">
            <p className="text-white text-xs font-semibold truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-white/40 text-[10px] truncate">{profile?.email}</p>
          </div>
          <div className="px-2 pb-1">
            <LanguageSwitcher className="w-full" />
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {t('nav.backToDashboard')}
          </button>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/5 text-xs font-medium transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-8 py-8 overflow-auto">
        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-agri-text">Admin Overview</h1>
              <p className="text-agri-subtext text-sm mt-1">Platform-wide statistics and quick actions</p>
            </div>
            {stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Total Users', value: stats.total_users, icon: <Users className="h-6 w-6 text-agri-primary" />, tab: 'users' as Tab },
                  { label: 'Total Crops', value: stats.total_crops, icon: <Sprout className="h-6 w-6 text-agri-primary" />, tab: 'crops' as Tab },
                  { label: 'Total Courses', value: stats.total_courses, icon: <BookOpen className="h-6 w-6 text-agri-primary" />, tab: 'courses' as Tab },
                ].map(s => (
                  <button key={s.label} onClick={() => setActiveTab(s.tab)}
                    className="bg-white rounded-2xl border border-agri-border p-6 text-left hover:border-agri-primary hover:shadow-lg transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-agri-primary/10 flex items-center justify-center mb-3">{s.icon}</div>
                    <p className="text-3xl font-bold text-agri-text">{s.value}</p>
                    <p className="text-sm text-agri-subtext mt-1">{s.label}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {['Total Users', 'Total Crops', 'Total Courses'].map(label => (
                  <div key={label} className="bg-white rounded-2xl border border-agri-border p-6 animate-pulse">
                    <div className="h-8 w-8 bg-agri-border/50 rounded-xl mb-3" />
                    <div className="h-8 w-16 bg-agri-border/60 rounded mb-2" />
                    <p className="text-sm text-agri-subtext">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ──────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-agri-text">Users</h1>
                <p className="text-agri-subtext text-sm mt-1">Manage user accounts and roles</p>
              </div>
            </div>
            <div className="relative max-w-md">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="admin-user-search"
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-agri-border rounded-xl bg-white text-sm text-agri-text
                  placeholder:text-agri-subtext/50 focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary"
              />
            </div>

            <div className="bg-white rounded-2xl border border-agri-border overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center text-agri-subtext text-sm animate-pulse">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-agri-subtext text-sm">No users found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-agri-bg border-b border-agri-border">
                    <tr>
                      {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-agri-subtext uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agri-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-agri-bg/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-agri-text">{u.full_name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${ROLE_COLORS[u.role]}`}
                          >
                            <option value="USER">USER</option>
                            <option value="RESEARCHER">RESEARCHER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-agri-subtext text-xs">
                          {new Date(u.created_at).toLocaleDateString('en-LK')}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete user"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── CROPS ──────────────────────────────────────────────────────── */}
        {activeTab === 'crops' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-agri-text">Crops</h1>
                <p className="text-agri-subtext text-sm mt-1">Manage crop data and agronomic parameters</p>
              </div>
              <button
                id="add-crop-btn"
                onClick={() => setCropModal({ open: true, crop: { category: 'VEGETABLE' } })}
                className="flex items-center gap-2 bg-agri-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-agri-dark transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Crop
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-agri-border overflow-hidden">
              {cropsLoading ? (
                <div className="p-8 text-center text-agri-subtext text-sm animate-pulse">Loading crops...</div>
              ) : crops.length === 0 ? (
                <div className="p-8 text-center text-agri-subtext text-sm">No crops found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-agri-bg border-b border-agri-border">
                    <tr>
                      {['Crop (EN)', 'Sinhala', 'Category', 'Cycle (days)', 'pH Range', 'Temp (°C)', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-agri-subtext uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agri-border">
                    {crops.map(c => (
                      <tr key={c.id} className="hover:bg-agri-bg/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-agri-text">{c.name_en}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.name_si}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{c.category}</span>
                        </td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.growing_cycle_duration_days ?? '—'}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.min_soil_ph ?? '—'} – {c.max_soil_ph ?? '—'}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.min_temp_celsius ?? '—'} – {c.max_temp_celsius ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCropModal({ open: true, crop: c })}
                              className="text-agri-primary hover:text-agri-dark transition-colors"
                              title="Edit crop"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCrop(c.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Delete crop"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── COURSES ────────────────────────────────────────────────────── */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-agri-text">Courses</h1>
                <p className="text-agri-subtext text-sm mt-1">Add and manage agricultural training programs</p>
              </div>
              <button
                id="add-course-btn"
                onClick={() => setCourseModal({ open: true, course: { is_active: true } })}
                className="flex items-center gap-2 bg-agri-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-agri-dark transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Course
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-agri-border overflow-hidden">
              {coursesLoading ? (
                <div className="p-8 text-center text-agri-subtext text-sm animate-pulse">Loading courses...</div>
              ) : courses.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-agri-bg border border-agri-border flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-agri-subtext" />
                  </div>
                  <p className="font-semibold text-agri-text">No courses yet</p>
                  <p className="text-agri-subtext text-sm mt-1">Click "Add Course" to add training programs</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-agri-bg border-b border-agri-border">
                    <tr>
                      {['Title', 'Institution', 'Type', 'Mode', 'Duration', 'Fee (LKR)', 'Active', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-agri-subtext uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agri-border">
                    {courses.map(c => (
                      <tr key={c.id} className="hover:bg-agri-bg/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-agri-text max-w-xs">
                          <p className="truncate" title={c.title}>{c.title}</p>
                        </td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.institution}</td>
                        <td className="px-5 py-3.5">
                          {c.institution_type && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.institution_type}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.mode ?? '—'}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">{c.duration ?? '—'}</td>
                        <td className="px-5 py-3.5 text-agri-subtext">
                          {c.estimated_fee_lkr ? c.estimated_fee_lkr.toLocaleString() : 'Free'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`h-2 w-2 rounded-full inline-block ${c.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCourseModal({ open: true, course: {
                                ...c,
                                applicable_crops: c.applicable_crops ?? [],
                                applicable_methods: c.applicable_methods ?? [],
                              }})}
                              className="text-agri-primary hover:text-agri-dark transition-colors"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Crop modal ────────────────────────────────────────────────────── */}
      {cropModal.open && cropModal.crop && (
        <Modal title={cropModal.crop.id ? 'Edit Crop' : 'Add New Crop'} onClose={() => setCropModal({ open: false, crop: null })}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name (English)" required>
                <Input value={cropModal.crop.name_en ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, name_en: e.target.value } }))} placeholder="e.g. Tomato" />
              </Field>
              <Field label="Name (Sinhala)" required>
                <Input value={cropModal.crop.name_si ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, name_si: e.target.value } }))} placeholder="e.g. තක්කාලි" />
              </Field>
            </div>
            <Field label="Category">
              <Select value={cropModal.crop.category ?? 'VEGETABLE'} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, category: e.target.value } }))}>
                <option value="VEGETABLE">Vegetable</option>
                <option value="FRUIT">Fruit</option>
                <option value="GRAIN">Grain</option>
                <option value="CASH_CROP">Cash Crop</option>
                <option value="HERB_SPICE">Herb / Spice</option>
              </Select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Cycle (days)">
                <Input type="number" value={cropModal.crop.growing_cycle_duration_days ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, growing_cycle_duration_days: parseInt(e.target.value) || undefined } }))} />
              </Field>
              <Field label="Min Soil pH">
                <Input type="number" step="0.1" value={cropModal.crop.min_soil_ph ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, min_soil_ph: parseFloat(e.target.value) || undefined } }))} />
              </Field>
              <Field label="Max Soil pH">
                <Input type="number" step="0.1" value={cropModal.crop.max_soil_ph ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, max_soil_ph: parseFloat(e.target.value) || undefined } }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Temp (°C)">
                <Input type="number" value={cropModal.crop.min_temp_celsius ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, min_temp_celsius: parseFloat(e.target.value) || undefined } }))} />
              </Field>
              <Field label="Max Temp (°C)">
                <Input type="number" value={cropModal.crop.max_temp_celsius ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, max_temp_celsius: parseFloat(e.target.value) || undefined } }))} />
              </Field>
            </div>
            <Field label="Preferred Soil Type">
              <Input value={cropModal.crop.preferred_soil_type ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, preferred_soil_type: e.target.value } }))} placeholder="e.g. Well-drained loamy soil" />
            </Field>
            <Field label="Water Requirement">
              <Input value={cropModal.crop.water_requirement_summary ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, water_requirement_summary: e.target.value } }))} />
            </Field>
            <Field label="Pests & Diseases">
              <Textarea rows={2} value={cropModal.crop.pests_and_diseases ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, pests_and_diseases: e.target.value } }))} />
            </Field>
            <Field label="Image URL">
              <Input type="url" value={cropModal.crop.image_url ?? ''} onChange={e => setCropModal(m => ({ ...m, crop: { ...m.crop!, image_url: e.target.value } }))} placeholder="https://..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveCrop} disabled={cropSaving}
                className="flex-1 bg-agri-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-agri-dark transition-colors disabled:opacity-50">
                {cropSaving ? 'Saving...' : (cropModal.crop.id ? 'Update Crop' : 'Create Crop')}
              </button>
              <button onClick={() => setCropModal({ open: false, crop: null })}
                className="flex-1 bg-agri-bg border border-agri-border text-agri-text text-sm font-semibold py-3 rounded-xl hover:bg-agri-border transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Course modal ──────────────────────────────────────────────────── */}
      {courseModal.open && courseModal.course && (
        <Modal title={courseModal.course.id ? 'Edit Course' : 'Add New Course'} onClose={() => setCourseModal({ open: false, course: null })}>
          <div className="space-y-4">
            <Field label="Course Title" required>
              <Input value={courseModal.course.title ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, title: e.target.value } }))} placeholder="e.g. Protected Agriculture & Greenhouse Management" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Institution" required>
                <Input value={courseModal.course.institution ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, institution: e.target.value } }))} placeholder="e.g. NAITA" />
              </Field>
              <Field label="Institution Type">
                <Select value={courseModal.course.institution_type ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, institution_type: e.target.value } }))}>
                  <option value="">Select type</option>
                  <option value="DOA">DOA</option>
                  <option value="NAITA">NAITA</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="PRIVATE">Private</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NVQ Level">
                <Input value={courseModal.course.nvq_level ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, nvq_level: e.target.value } }))} placeholder="e.g. NVQ Level 3" />
              </Field>
              <Field label="Certification Type">
                <Input value={courseModal.course.certification_type ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, certification_type: e.target.value } }))} placeholder="e.g. Certificate, Diploma" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration">
                <Input value={courseModal.course.duration ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, duration: e.target.value } }))} placeholder="e.g. 3 months" />
              </Field>
              <Field label="Mode">
                <Select value={courseModal.course.mode ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, mode: e.target.value } }))}>
                  <option value="">Select mode</option>
                  <option value="Online">Online</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </Select>
              </Field>
            </div>
            <Field label="Estimated Fee (LKR)">
              <Input type="number" value={courseModal.course.estimated_fee_lkr ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, estimated_fee_lkr: parseFloat(e.target.value) || undefined } }))} placeholder="e.g. 15000" />
            </Field>
            <Field label="Description">
              <Textarea rows={3} value={courseModal.course.description ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, description: e.target.value } }))} />
            </Field>
            <Field label="Applicable Crops (comma-separated)">
              <Input
                value={Array.isArray(courseModal.course.applicable_crops) ? courseModal.course.applicable_crops.join(', ') : (courseModal.course.applicable_crops ?? '')}
                onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, applicable_crops: e.target.value as unknown as string[] } }))}
                placeholder="e.g. Tomato, Cucumber, Brinjal"
              />
            </Field>
            <Field label="Applicable Methods (comma-separated)">
              <Input
                value={Array.isArray(courseModal.course.applicable_methods) ? courseModal.course.applicable_methods.join(', ') : (courseModal.course.applicable_methods ?? '')}
                onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, applicable_methods: e.target.value as unknown as string[] } }))}
                placeholder="e.g. HYDROPONICS, OPEN_FIELD"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Apply URL">
                <Input type="url" value={courseModal.course.apply_url ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, apply_url: e.target.value } }))} placeholder="https://..." />
              </Field>
              <Field label="Inquiry URL">
                <Input type="url" value={courseModal.course.inquiry_url ?? ''} onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, inquiry_url: e.target.value } }))} placeholder="https://..." />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="course-active" checked={courseModal.course.is_active ?? true}
                onChange={e => setCourseModal(m => ({ ...m, course: { ...m.course!, is_active: e.target.checked } }))}
                className="h-4 w-4 rounded border-agri-border accent-agri-primary"
              />
              <label htmlFor="course-active" className="text-sm text-agri-text">Active (visible to users)</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveCourse} disabled={courseSaving}
                className="flex-1 bg-agri-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-agri-dark transition-colors disabled:opacity-50">
                {courseSaving ? 'Saving...' : (courseModal.course.id ? 'Update Course' : 'Create Course')}
              </button>
              <button onClick={() => setCourseModal({ open: false, course: null })}
                className="flex-1 bg-agri-bg border border-agri-border text-agri-text text-sm font-semibold py-3 rounded-xl hover:bg-agri-border transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPage;
