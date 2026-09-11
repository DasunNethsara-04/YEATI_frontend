/**
 * TrainingHubPage — Phase 5: Agricultural Education & Training Hub (Sri Lanka)
 *
 * Searchable, filterable catalog of agriculture programs.
 * Shows contextual recommendations based on the user's selected crop/method.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { api } from '../api/axios';
import {
  Globe,
  Landmark,
  GraduationCap,
  BookOpen,
  Building,
  Radio,
  Laptop,
  MapPin,
  RotateCcw,
  Sparkles,
  Sprout,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string;
  title: string;
  institution: string;
  institution_type: string | null;   // DOA | NAITA | UNIVERSITY | PRIVATE
  nvq_level: string | null;
  certification_type: string | null;
  duration: string | null;
  mode: string | null;               // Online | On-site | Hybrid
  estimated_fee_lkr: number | null;
  description: string | null;
  applicable_crops: string[] | null;
  applicable_methods: string[] | null;
  apply_url: string | null;
  inquiry_url: string | null;
  is_active: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const INSTITUTION_TYPES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: '', label: 'All', icon: <Globe className="h-3.5 w-3.5" /> },
  { value: 'DOA', label: 'DOA', icon: <Landmark className="h-3.5 w-3.5" /> },
  { value: 'NAITA', label: 'NAITA', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { value: 'UNIVERSITY', label: 'University', icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: 'PRIVATE', label: 'Private', icon: <Building className="h-3.5 w-3.5" /> },
];

const MODES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: '', label: 'All Modes', icon: <Radio className="h-3.5 w-3.5" /> },
  { value: 'Online', label: 'Online', icon: <Laptop className="h-3.5 w-3.5" /> },
  { value: 'On-site', label: 'On-site', icon: <MapPin className="h-3.5 w-3.5" /> },
  { value: 'Hybrid', label: 'Hybrid', icon: <RotateCcw className="h-3.5 w-3.5" /> },
];

const INST_COLORS: Record<string, string> = {
  DOA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  NAITA: 'bg-blue-100 text-blue-700 border-blue-200',
  UNIVERSITY: 'bg-purple-100 text-purple-700 border-purple-200',
  PRIVATE: 'bg-orange-100 text-orange-700 border-orange-200',
};

const MODE_COLORS: Record<string, string> = {
  'Online': 'bg-sky-100 text-sky-700',
  'On-site': 'bg-amber-100 text-amber-700',
  'Hybrid': 'bg-violet-100 text-violet-700',
};

const fmtFee = (fee: number | null) =>
  fee ? `Rs. ${new Intl.NumberFormat('en-LK').format(fee)}` : 'Free / TBD';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCourse = () => (
  <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-3 animate-pulse">
    <div className="h-4 bg-agri-bg rounded w-3/4" />
    <div className="h-3 bg-agri-bg rounded w-1/2" />
    <div className="flex gap-2">
      <div className="h-5 bg-agri-bg rounded-full w-16" />
      <div className="h-5 bg-agri-bg rounded-full w-20" />
    </div>
    <div className="h-10 bg-agri-bg rounded-xl" />
  </div>
);

const CourseCard: React.FC<{ course: Course; recommended?: boolean }> = ({ course, recommended }) => {
  const instColor = INST_COLORS[course.institution_type ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const modeColor = MODE_COLORS[course.mode ?? ''] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className={`group relative bg-white rounded-2xl border overflow-hidden
      hover:shadow-xl hover:shadow-agri-primary/8 hover:-translate-y-0.5 transition-all duration-300
      ${recommended ? 'border-agri-primary/50 ring-1 ring-agri-primary/20' : 'border-agri-border'}`}
    >
      {recommended && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-agri-primary to-agri-lime" />
      )}
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {recommended && (
                <span className="text-[9px] font-bold text-agri-primary bg-agri-primary/10 border border-agri-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Recommended
                </span>
              )}
              {course.institution_type && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${instColor}`}>
                  {course.institution_type}
                </span>
              )}
              {course.mode && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${modeColor}`}>
                  {course.mode}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-agri-text leading-tight group-hover:text-agri-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-xs text-agri-subtext mt-0.5">{course.institution}</p>
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-agri-subtext leading-relaxed line-clamp-2 mb-3">
            {course.description}
          </p>
        )}

        {/* Detail pills */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {course.nvq_level && (
            <div className="bg-agri-bg rounded-xl px-3 py-2">
              <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">NVQ / Level</p>
              <p className="text-xs font-bold text-agri-text mt-0.5">{course.nvq_level}</p>
            </div>
          )}
          {course.duration && (
            <div className="bg-agri-bg rounded-xl px-3 py-2">
              <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">Duration</p>
              <p className="text-xs font-bold text-agri-text mt-0.5">{course.duration}</p>
            </div>
          )}
          {course.certification_type && (
            <div className="bg-agri-bg rounded-xl px-3 py-2">
              <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">Certification</p>
              <p className="text-xs font-bold text-agri-text mt-0.5">{course.certification_type}</p>
            </div>
          )}
          <div className="bg-agri-bg rounded-xl px-3 py-2">
            <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">Est. Fee</p>
            <p className="text-xs font-bold text-agri-text mt-0.5">{fmtFee(course.estimated_fee_lkr)}</p>
          </div>
        </div>

        {/* Crop/method tags */}
        {(course.applicable_crops?.length ?? 0) > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {course.applicable_crops!.map(c => (
              <span key={c} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                <Sprout className="h-3 w-3 text-emerald-600" /> {c}
              </span>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 pt-1">
          {course.apply_url && (
            <a
              href={course.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              id={`apply-course-${course.id}`}
              className="flex-1 bg-agri-primary text-white text-xs font-bold px-3 py-2 rounded-xl text-center
                hover:bg-agri-dark transition-colors"
            >
              Apply Now
            </a>
          )}
          {course.inquiry_url && (
            <a
              href={course.inquiry_url}
              target="_blank"
              rel="noopener noreferrer"
              id={`inquire-course-${course.id}`}
              className="flex-1 bg-agri-bg border border-agri-border text-agri-text text-xs font-semibold px-3 py-2 rounded-xl text-center
                hover:border-agri-primary hover:text-agri-primary transition-colors"
            >
              Inquire
            </a>
          )}
          {!course.apply_url && !course.inquiry_url && (
            <span className="text-xs text-agri-subtext italic">Contact institution directly</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrainingHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCrop, selectedMethod, setCurrentPhase } = usePlan();

  const [courses, setCourses] = useState<Course[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [instType, setInstType] = useState('');
  const [mode, setMode] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (instType) params.set('institution_type', instType);
      if (mode) params.set('mode', mode);
      if (selectedCrop) params.set('crop', selectedCrop.name_en);

      const [coursesRes, recRes] = await Promise.all([
        api.get<Course[]>(`/courses?${params.toString()}`),
        selectedCrop || selectedMethod
          ? api.get<Course[]>(`/courses/recommendations?${selectedCrop ? `crop_name=${selectedCrop.name_en}&` : ''}${selectedMethod ? `method=${selectedMethod.method_type}` : ''}`)
          : Promise.resolve({ data: [] }),
      ]);

      setCourses(coursesRes.data);
      setRecommended((recRes as { data: Course[] }).data);
    } catch {
      setError('Could not load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, instType, mode, selectedCrop, selectedMethod]);

  useEffect(() => {
    fetchCourses();
  }, [instType, mode]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchCourses(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // IDs of recommended courses (to mark them in main list)
  const recommendedIds = new Set(recommended.map(c => c.id));
  // Courses not already in recommended
  const otherCourses = courses.filter(c => !recommendedIds.has(c.id));

  return (
    <div className="min-h-screen bg-agri-bg">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-agri-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 mr-1 flex-shrink-0">
            <img src="/logo.png" alt="AgriPiyasa Logo" className="h-8 w-auto object-contain" />
            <span className="text-agri-dark text-base font-bold tracking-tight hidden sm:inline">Agri පියස</span>
          </Link>
          <div className="h-4 w-px bg-agri-border hidden sm:block" />
          <button
            id="back-to-analytics"
            onClick={() => { setCurrentPhase(4); navigate('/analytics'); }}
            className="flex items-center gap-2 text-sm font-medium text-agri-subtext hover:text-agri-text transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <div className="h-4 w-px bg-agri-border" />
          <nav className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto">
            {[
              { label: 'Location & Crops', path: '/dashboard' },
              { label: 'Crop Profile', path: '/crop-detail' },
              { label: 'Analytics', path: '/analytics' },
              { label: 'Training Hub', path: '/training-hub' },
            ].map((item) => {
              const isActive = location.pathname === item.path || item.path === '/training-hub';
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-agri-primary text-white shadow-sm font-semibold'
                      : 'text-agri-subtext hover:text-agri-text hover:bg-agri-bg'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-agri-dark p-7 lg:p-9">
          <div className="absolute inset-0 bg-gradient-to-br from-agri-lime/10 to-agri-primary/20" />
          <div className="relative z-10">
            <p className="text-agri-lime/70 text-xs font-semibold uppercase tracking-widest mb-1">Phase 5 — Agricultural Education</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Training Hub</h1>
            <p className="text-white/60 text-sm max-w-xl">
              Discover agriculture courses and certifications from Sri Lankan institutions. 
              {selectedCrop && ` Showing recommendations for ${selectedCrop.name_en} farming.`}
            </p>
          </div>
        </div>

        {/* ── Search + filters ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-4">
          {/* Search input */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="course-search-input"
              type="text"
              placeholder="Search by course title, institution, or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-agri-border bg-agri-bg text-agri-text
                text-sm placeholder:text-agri-subtext/60 focus:outline-none focus:ring-2 focus:ring-agri-primary/30
                focus:border-agri-primary transition-colors"
            />
          </div>

          {/* Filter chips row */}
          <div className="flex flex-wrap gap-3">
            {/* Institution type */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs text-agri-subtext font-medium self-center mr-1">Institution:</span>
              {INSTITUTION_TYPES.map(it => (
                <button
                  key={it.value}
                  id={`filter-inst-${it.value || 'all'}`}
                  onClick={() => setInstType(it.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors inline-flex items-center gap-1.5 ${
                    instType === it.value
                      ? 'bg-agri-primary text-white border-agri-primary'
                      : 'border-agri-border text-agri-subtext hover:border-agri-primary hover:text-agri-primary'
                  }`}
                >
                  {it.icon}
                  <span>{it.label}</span>
                </button>
              ))}
            </div>

            <div className="w-px bg-agri-border hidden sm:block" />

            {/* Mode */}
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs text-agri-subtext font-medium self-center mr-1">Mode:</span>
              {MODES.map(m => (
                <button
                  key={m.value}
                  id={`filter-mode-${m.value || 'all'}`}
                  onClick={() => setMode(m.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors inline-flex items-center gap-1.5 ${
                    mode === m.value
                      ? 'bg-agri-primary text-white border-agri-primary'
                      : 'border-agri-border text-agri-subtext hover:border-agri-primary hover:text-agri-primary'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Recommended section ────────────────────────────────────────── */}
        {recommended.length > 0 && !loading && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-agri-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-agri-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-agri-text">Recommended for You</h2>
                <p className="text-xs text-agri-subtext">
                  Based on your selection: {selectedCrop?.name_en}
                  {selectedMethod && ` · ${selectedMethod.method_type.replace('_', ' ')}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map(c => (
                <CourseCard key={c.id} course={c} recommended />
              ))}
            </div>
          </section>
        )}

        {/* ── All courses ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-agri-text">
              {recommended.length > 0 ? 'All Other Courses' : 'All Courses'}
              {!loading && courses.length > 0 && (
                <span className="ml-2 text-xs font-normal text-agri-subtext">({courses.length} found)</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCourse key={i} />)}
            </div>
          ) : (recommended.length > 0 ? otherCourses : courses).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-agri-primary/10 flex items-center justify-center text-agri-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-agri-text">No courses found</p>
                <p className="text-agri-subtext text-sm mt-1 max-w-sm">
                  {search || instType || mode
                    ? 'Try adjusting your filters or clearing the search.'
                    : 'No courses have been added yet. Check back later or contact your administrator.'}
                </p>
              </div>
              {(search || instType || mode) && (
                <button
                  onClick={() => { setSearch(''); setInstType(''); setMode(''); }}
                  className="text-sm text-agri-primary font-medium hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(recommended.length > 0 ? otherCourses : courses).map(c => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TrainingHubPage;
