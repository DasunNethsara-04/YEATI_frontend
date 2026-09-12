import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Droplets,
  Sprout,
  Scissors,
  Bug,
  Sparkles,
  Wheat,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Printer,
  RotateCcw,
  Info,
  CalendarDays,
  ShoppingBag,
  Sunrise,
  Sunset,
  ArrowRight,
  Filter,
  MapPin,
} from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/axios';
import { getCropImageUrl } from '../utils/cropImages';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

interface Task {
  id: string;
  category: string;
  title: string;
  frequency: string;
  timing: string;
  description: string;
  beginner_tip: string;
  is_critical: boolean;
}

interface WeekSchedule {
  week_number: number;
  title: string;
  stage: string;
  start_day: number;
  end_day: number;
  start_date: string;
  end_date: string;
  calendar_range: string;
  tasks: Task[];
}

interface GrowthStage {
  name: string;
  start_day: number;
  end_day: number;
  start_date: string;
  end_date: string;
  date_range: string;
  description: string;
}

interface DailyRoutineItem {
  time: string;
  activity: string;
  notes: string;
}

interface ScheduleData {
  crop: {
    name_en: string;
    name_si: string;
    category: string;
    cultivation_method: string;
    total_cycle_days: number;
    pests_and_diseases: string[];
  };
  timeline: {
    start_date: string;
    first_harvest_date: string;
    final_harvest_date: string;
    duration_weeks: number;
    formatted_cycle: string;
  };
  growth_stages: GrowthStage[];
  daily_routine: DailyRoutineItem[];
  weekly_schedule: WeekSchedule[];
  total_tasks_count: number;
}

const CROPS_LIST = [
  { name_en: 'Tomato', name_si: 'තක්කාලි' },
  { name_en: 'Chilli', name_si: 'අමු මිරිස්' },
  { name_en: 'Cucumber', name_si: 'පිපිඤ්ඤා' },
  { name_en: 'Brinjal', name_si: 'වම්බටු' },
  { name_en: 'Capsicum', name_si: 'මාළු මිරිස්' },
  { name_en: 'Carrot', name_si: 'කැරට්' },
];

const METHODS_LIST = [
  { key: 'OPEN_FIELD', labelKey: 'cropDetail.methodOpenField' },
  { key: 'HYDROPONICS', labelKey: 'cropDetail.methodHydroponics' },
  { key: 'ORGANIC', labelKey: 'cropDetail.methodOrganic' },
];

const CATEGORIES = [
  { key: 'ALL', labelKey: 'schedule.catAll', icon: Filter },
  { key: 'LAND_PREPARATION', labelKey: 'schedule.catLandPrep', icon: Wheat },
  { key: 'PLANTING', labelKey: 'schedule.catPlanting', icon: Sprout },
  { key: 'IRRIGATION', labelKey: 'schedule.catIrrigation', icon: Droplets },
  { key: 'FERTILIZING', labelKey: 'schedule.catFertilizing', icon: Sparkles },
  { key: 'PRUNING', labelKey: 'schedule.catPruning', icon: Scissors },
  { key: 'PEST_MONITORING', labelKey: 'schedule.catPestMonitoring', icon: Bug },
  { key: 'HARVESTING', labelKey: 'schedule.catHarvesting', icon: ShoppingBag },
];

const STORAGE_COMPLETED_KEY = 'agripiyasa_schedule_completed_tasks';

const FarmingSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCrop, selectedMethod, selectedLocation, setCurrentPhase } = usePlan();
  const { t } = useLanguage();

  // Active crop and method state (defaults to context selection or Tomato + Open Field)
  const [activeCrop, setActiveCrop] = useState<string>(selectedCrop?.name_en || 'Tomato');
  const [activeMethod, setActiveMethod] = useState<string>(
    selectedMethod?.method_type || 'OPEN_FIELD'
  );
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);

  // Filter & UI views
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'DAILY'>('WEEKLY');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});

  // Interactive completed tasks state (stored in localStorage)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COMPLETED_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fetch schedule whenever crop, method, or start date changes
  useEffect(() => {
    let cancelled = false;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/schedules', {
          params: {
            crop: activeCrop,
            method: activeMethod,
            start_date: startDate,
          },
        });
        if (!cancelled) {
          setSchedule(res.data);
          // By default expand first 3 weeks
          const initialExpanded: Record<number, boolean> = {};
          (res.data.weekly_schedule || []).forEach((w: WeekSchedule, idx: number) => {
            initialExpanded[w.week_number] = idx < 3;
          });
          setExpandedWeeks(initialExpanded);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error('Failed to load farming schedule:', err);
          setError('Unable to load farming schedule. Please check backend connection.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSchedule();
    return () => {
      cancelled = true;
    };
  }, [activeCrop, activeMethod, startDate]);

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Reset completed tasks
  const handleResetTasks = () => {
    if (window.confirm('Reset all completed task checkmarks for this schedule?')) {
      setCompletedTasks({});
      localStorage.removeItem(STORAGE_COMPLETED_KEY);
    }
  };

  // Toggle week expansion
  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  const expandAll = () => {
    if (!schedule) return;
    const allExp: Record<number, boolean> = {};
    schedule.weekly_schedule.forEach((w) => {
      allExp[w.week_number] = true;
    });
    setExpandedWeeks(allExp);
  };

  const collapseAll = () => {
    setExpandedWeeks({});
  };

  // Filter tasks based on category
  const filteredWeeks = useMemo(() => {
    if (!schedule) return [];
    if (selectedCategory === 'ALL') return schedule.weekly_schedule;

    return schedule.weekly_schedule
      .map((week) => {
        const matchingTasks = week.tasks.filter((t) => t.category === selectedCategory);
        return {
          ...week,
          tasks: matchingTasks,
        };
      })
      .filter((week) => week.tasks.length > 0);
  }, [schedule, selectedCategory]);

  // Overall completion metrics
  const totalTasks = useMemo(() => {
    if (!schedule) return 0;
    return schedule.weekly_schedule.reduce((acc, w) => acc + w.tasks.length, 0);
  }, [schedule]);

  const completedCount = useMemo(() => {
    if (!schedule) return 0;
    let count = 0;
    schedule.weekly_schedule.forEach((w) => {
      w.tasks.forEach((t) => {
        if (completedTasks[t.id]) count++;
      });
    });
    return count;
  }, [schedule, completedTasks]);

  const completionPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Category badge helper
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'LAND_PREPARATION':
        return { label: t('schedule.catLandPrep'), bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'PLANTING':
        return { label: t('schedule.catPlanting'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'IRRIGATION':
        return { label: t('schedule.catIrrigation'), bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'FERTILIZING':
        return { label: t('schedule.catFertilizing'), bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'PRUNING':
        return { label: t('schedule.catPruning'), bg: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'PEST_MONITORING':
        return { label: t('schedule.catPestMonitoring'), bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'HARVESTING':
        return { label: t('schedule.catHarvesting'), bg: 'bg-lime-100 text-lime-900 border-lime-300' };
      default:
        return { label: category, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const cropImageUrl = getCropImageUrl(activeCrop);

  return (
    <div className="min-h-screen bg-agri-bg pb-16">
      {/* ── Top Navigation Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-agri-border shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 mr-1 flex-shrink-0">
            <img src="/logo.png" alt="AgriPiyasa Logo" className="h-8 w-auto object-contain" />
            <span className="text-agri-dark text-base font-bold tracking-tight hidden sm:inline">
              Agri පියස
            </span>
          </Link>

          <div className="h-4 w-px bg-agri-border hidden sm:block" />

          <button
            onClick={() => navigate('/crop-detail')}
            className="flex items-center gap-2 text-sm font-medium text-agri-subtext hover:text-agri-text transition-colors"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Crop Profile
          </button>

          <div className="h-4 w-px bg-agri-border" />

          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold overflow-x-auto flex-1 min-w-0">
            {[
              { labelKey: 'nav.locationCrops', path: '/dashboard' },
              { labelKey: 'nav.cropProfile', path: '/crop-detail' },
              { labelKey: 'nav.dailySchedule', path: '/farming-schedule' },
              { labelKey: 'nav.analytics', path: '/analytics' },
              { labelKey: 'nav.trainingHub', path: '/training-hub' },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.labelKey}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-agri-primary text-white shadow-sm font-semibold'
                      : 'text-agri-subtext hover:text-agri-text hover:bg-agri-bg'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => window.print()}
              className="hidden md:flex items-center gap-1.5 border border-agri-border bg-white text-agri-text text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-agri-bg transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              {t('schedule.print')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Hero Banner ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-agri-dark p-7 lg:p-9 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-agri-primary/30 via-transparent to-agri-lime/10" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 bg-white/10 rounded-2xl p-2.5 border border-white/20">
                {cropImageUrl ? (
                  <img
                    src={cropImageUrl}
                    alt={activeCrop}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <Sprout className="h-14 w-14 text-agri-lime" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-agri-lime text-xs font-bold uppercase tracking-wider">
                    {t('schedule.fieldGuide')}
                  </span>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/80 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full">
                    {t(METHODS_LIST.find((m) => m.key === activeMethod)?.labelKey || 'cropDetail.methodOpenField')}
                  </span>
                  {selectedLocation && (
                    <>
                      <span className="text-white/40 text-xs">•</span>
                      <span className="text-white/80 text-xs font-semibold bg-white/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-agri-lime" />
                        {selectedLocation.district_name}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2.5">
                  {activeCrop} {t('schedule.title')}
                  <span className="text-white/50 text-base font-normal">
                    (
                    {CROPS_LIST.find((c) => c.name_en.toLowerCase() === activeCrop.toLowerCase())
                      ?.name_si || ''}
                    )
                  </span>
                </h1>
                <p className="text-white/60 text-sm mt-1 max-w-2xl leading-relaxed">
                  {t('schedule.heroSubtitle')}
                </p>
              </div>
            </div>

            {/* Quick Stats Widget */}
            {schedule && (
              <div className="flex flex-wrap sm:flex-nowrap gap-3 bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                <div className="px-3 py-1">
                  <p className="text-[11px] text-white/60 uppercase font-semibold">{t('schedule.totalDuration')}</p>
                  <p className="text-lg font-bold text-agri-lime">
                    {schedule.crop.total_cycle_days} {t('schedule.days')}
                  </p>
                  <p className="text-[10px] text-white/40">~{schedule.timeline.duration_weeks} {t('schedule.wks')}</p>
                </div>
                <div className="h-auto w-px bg-white/20" />
                <div className="px-3 py-1">
                  <p className="text-[11px] text-white/60 uppercase font-semibold">{t('schedule.firstHarvest')}</p>
                  <p className="text-lg font-bold text-white">
                    {new Date(schedule.timeline.first_harvest_date).toLocaleDateString('en-LK', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] text-white/40">{t('schedule.estimated')}</p>
                </div>
                <div className="h-auto w-px bg-white/20" />
                <div className="px-3 py-1">
                  <p className="text-[11px] text-white/60 uppercase font-semibold">{t('schedule.completed')}</p>
                  <p className="text-lg font-bold text-emerald-400">{completionPercent}%</p>
                  <p className="text-[10px] text-white/40">
                    {completedCount}/{totalTasks} {t('schedule.tasks')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Interactive Crop, Method & Planting Date Switcher ────────────── */}
        <div className="bg-white rounded-3xl border border-agri-border p-6 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-agri-border">
            <div>
              <h2 className="text-base font-bold text-agri-text flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-agri-primary" />
                {t('schedule.customize')}
              </h2>
              <p className="text-xs text-agri-subtext mt-0.5">
                {t('schedule.customizeDesc')}
              </p>
            </div>

            {/* Planting start date picker */}
            <div className="flex items-center gap-3 bg-agri-bg border border-agri-border px-4 py-2.5 rounded-2xl w-full lg:w-auto">
              <label
                htmlFor="planting-date-input"
                className="text-xs font-bold text-agri-text whitespace-nowrap flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5 text-agri-primary" />
                {t('schedule.plantingStartDate')}
              </label>
              <input
                id="planting-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-agri-border rounded-xl px-3 py-1 text-xs font-semibold text-agri-text focus:outline-none focus:ring-2 focus:ring-agri-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-agri-subtext mb-2.5">
                {t('schedule.selectCrop')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CROPS_LIST.map((c) => {
                  const isSel = c.name_en.toLowerCase() === activeCrop.toLowerCase();
                  return (
                    <button
                      key={c.name_en}
                      type="button"
                      onClick={() => setActiveCrop(c.name_en)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                        isSel
                          ? 'bg-agri-primary text-white border-agri-primary shadow-sm shadow-agri-primary/20'
                          : 'bg-agri-bg text-agri-text border-agri-border hover:bg-white hover:border-agri-primary/30'
                      }`}
                    >
                      <span className="truncate">{c.name_en}</span>
                      <span className={`text-[10px] truncate ${isSel ? 'text-white/80' : 'text-agri-subtext'}`}>
                        {c.name_si}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-agri-subtext mb-2.5">
                {t('schedule.selectMethod')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {METHODS_LIST.map((m) => {
                  const isSel = m.key === activeMethod;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setActiveMethod(m.key)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all text-center ${
                        isSel
                          ? 'bg-agri-primary text-white border-agri-primary shadow-sm shadow-agri-primary/20'
                          : 'bg-agri-bg text-agri-text border-agri-border hover:bg-white hover:border-agri-primary/30'
                      }`}
                    >
                      {t(m.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Growth Stages Roadmap (Milestone Cards) ────────────────────── */}
        {schedule && (
          <div className="bg-white rounded-3xl border border-agri-border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-agri-text flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-agri-primary" />
                {t('schedule.growthStages')}
              </span>
              <span className="text-xs font-semibold text-agri-subtext">
                {schedule.timeline.formatted_cycle}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {schedule.growth_stages.map((stage, idx) => (
                <div
                  key={stage.name}
                  className="bg-agri-bg/70 border border-agri-border rounded-2xl p-4 flex flex-col justify-between hover:border-agri-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-agri-primary mb-1">
                      <span>{t('schedule.stage')} {idx + 1}</span>
                      <span>{t('schedule.day')} {stage.start_day}–{stage.end_day}</span>
                    </div>
                    <h4 className="font-bold text-xs text-agri-text leading-snug">{stage.name}</h4>
                    <p className="text-[11px] text-agri-subtext mt-1.5 leading-relaxed line-clamp-2">
                      {stage.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-agri-border/60 text-[11px] font-semibold text-agri-dark">
                    📅 {stage.date_range}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── View Mode Switcher & Category Filters ──────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSel = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSel
                      ? 'bg-agri-primary text-white shadow-sm'
                      : 'bg-white text-agri-subtext border border-agri-border hover:text-agri-text hover:bg-agri-bg'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(cat.labelKey)}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Weekly vs Daily Routine */}
          <div className="flex items-center gap-1 bg-white border border-agri-border p-1 rounded-2xl flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('WEEKLY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'WEEKLY'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'text-agri-subtext hover:text-agri-text'
              }`}
            >
              {t('schedule.weeklySchedule')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DAILY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'DAILY'
                  ? 'bg-agri-primary text-white shadow-sm'
                  : 'text-agri-subtext hover:text-agri-text'
              }`}
            >
              {t('schedule.dailyRoutine')}
            </button>
          </div>
        </div>

        {/* ── Main Content Area ───────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white border border-agri-border rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-sm text-center">
            {error}
          </div>
        ) : viewMode === 'DAILY' && schedule ? (
          /* ── Daily Routine Mode ───────────────────────────────────────── */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-agri-border p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-agri-text flex items-center gap-2">
                    <Clock className="h-5 w-5 text-agri-primary" />
                    {t('schedule.standardRoutine')} {schedule.crop.name_en}
                  </h3>
                  <p className="text-xs text-agri-subtext mt-1">
                    {t('schedule.routineHint')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schedule.daily_routine.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-agri-bg border border-agri-border rounded-2xl p-5 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-agri-primary/10 flex items-center justify-center text-agri-primary">
                        {idx === 0 ? (
                          <Sunrise className="h-4 w-4" />
                        ) : idx === 1 ? (
                          <Bug className="h-4 w-4" />
                        ) : (
                          <Sunset className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-agri-primary uppercase tracking-wide">
                          {item.time}
                        </span>
                        <h4 className="text-sm font-bold text-agri-text">{item.activity}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-agri-subtext leading-relaxed">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Crucial Pest Warning Card */}
            {schedule.crop.pests_and_diseases?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Bug className="h-4 w-4 text-amber-700" />
                  {t('schedule.primaryPests')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {schedule.crop.pests_and_diseases.map((p) => (
                    <span
                      key={p}
                      className="bg-white border border-amber-300 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs"
                    >
                      ⚠️ {p}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tip: Check 10 random plants across your plot every morning. Early detection enables
                  spot treatment with organic neem extracts before an outbreak forces crop loss.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── Weekly Timeline View ─────────────────────────────────────── */
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-agri-subtext px-1">
              <span>
                {t('schedule.showing')} <strong>{filteredWeeks.length} {t('schedule.showingWeeks')}</strong>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-agri-primary font-semibold transition-colors"
                >
                  {t('schedule.expandAll')}
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-agri-primary font-semibold transition-colors"
                >
                  {t('schedule.collapseAll')}
                </button>
                {completedCount > 0 && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleResetTasks}
                      className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t('schedule.resetCheckmarks')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {filteredWeeks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-agri-border p-12 text-center space-y-3">
                <Info className="h-10 w-10 text-agri-subtext mx-auto" />
                <h4 className="text-sm font-bold text-agri-text">{t('schedule.noTasks')}</h4>
                <p className="text-xs text-agri-subtext max-w-sm mx-auto">
                  {t('schedule.noTasksHint')}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="mt-2 text-xs font-bold text-agri-primary hover:underline"
                >
                  {t('schedule.showAllTasks')}
                </button>
              </div>
            ) : (
              filteredWeeks.map((week) => {
                const isExpanded = !!expandedWeeks[week.week_number];
                const weekTasksCompleted = week.tasks.filter((t) => completedTasks[t.id]).length;
                const isAllCompleted =
                  week.tasks.length > 0 && weekTasksCompleted === week.tasks.length;

                return (
                  <div
                    key={week.week_number}
                    className={`bg-white rounded-3xl border transition-all shadow-xs ${
                      isAllCompleted
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-agri-border'
                    }`}
                  >
                    {/* Week Header Accordion Bar */}
                    <div
                      onClick={() => toggleWeek(week.week_number)}
                      className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-agri-bg/40 rounded-3xl transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 pr-2">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isAllCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-agri-primary/10 text-agri-primary'
                          }`}
                        >
                          W{week.week_number}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-agri-text">
                              {week.title}
                            </h3>
                            <span className="text-[11px] font-semibold bg-agri-bg border border-agri-border px-2 py-0.5 rounded-lg text-agri-subtext">
                              {week.stage}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-agri-subtext">
                            <span className="font-medium">📅 {week.calendar_range}</span>
                            <span>•</span>
                            <span>
                              {weekTasksCompleted} / {week.tasks.length} {t('schedule.tasksDone')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isAllCompleted && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t('schedule.allDone')}
                          </span>
                        )}
                        <div className="h-8 w-8 rounded-full bg-agri-bg border border-agri-border flex items-center justify-center text-agri-subtext">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Week Task List */}
                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 space-y-4 border-t border-agri-border/60">
                        {week.tasks.map((task) => {
                          const isDone = !!completedTasks[task.id];
                          const badge = getCategoryBadge(task.category);

                          return (
                            <div
                              key={task.id}
                              className={`rounded-2xl p-4 border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/50 border-emerald-200 opacity-80'
                                  : 'bg-white border-agri-border hover:border-agri-primary/30 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                {/* Checkbox button */}
                                <button
                                  type="button"
                                  onClick={() => toggleTask(task.id)}
                                  className="mt-0.5 text-agri-subtext hover:text-agri-primary transition-colors flex-shrink-0"
                                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-agri-border hover:text-agri-primary" />
                                  )}
                                </button>

                                <div className="space-y-2 flex-1">
                                  {/* Task Badges and Title */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg}`}
                                    >
                                      {badge.label}
                                    </span>
                                    <span className="text-[10px] font-semibold bg-agri-bg text-agri-subtext border border-agri-border px-2 py-0.5 rounded-md">
                                      {task.frequency}
                                    </span>
                                    <span className="text-[10px] font-semibold text-agri-dark bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                      ⏰ {task.timing}
                                    </span>
                                  </div>

                                  <h4
                                    className={`font-bold text-sm text-agri-text ${
                                      isDone ? 'line-through text-agri-subtext' : ''
                                    }`}
                                  >
                                    {task.title}
                                  </h4>

                                  <p className="text-xs text-agri-subtext leading-relaxed">
                                    {task.description}
                                  </p>

                                  {/* Beginner Tip Box */}
                                  {task.beginner_tip && (
                                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2 mt-2">
                                      <span className="font-bold text-emerald-700 whitespace-nowrap">
                                        💡 {t('schedule.beginnerAdvice')}
                                      </span>
                                      <span className="leading-relaxed">{task.beginner_tip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Action Next Banners ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
          <div className="bg-white rounded-3xl border border-agri-border p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-agri-primary">
                {t('schedule.financialPlanning')}
              </span>
              <h4 className="font-bold text-base text-agri-text mt-1">
                {t('schedule.viewFinancialProj')}
              </h4>
              <p className="text-xs text-agri-subtext mt-1 leading-relaxed">
                {t('schedule.financialProjDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPhase(4);
                navigate('/analytics');
              }}
              className="bg-agri-primary text-white font-semibold text-xs py-2.5 px-4 rounded-xl hover:bg-agri-dark transition-colors flex items-center justify-center gap-2 self-start"
            >
              {t('schedule.viewAnalyticsBtn')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-agri-dark to-agri-primary rounded-3xl p-6 text-white flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-agri-lime">
                {t('schedule.agriEducation')}
              </span>
              <h4 className="font-bold text-base text-white mt-1">
                {t('schedule.exploreCourses')}
              </h4>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                {t('schedule.agriEducationDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPhase(5);
                navigate('/training-hub');
              }}
              className="bg-white text-agri-dark font-semibold text-xs py-2.5 px-4 rounded-xl hover:bg-agri-lime transition-colors flex items-center justify-center gap-2 self-start"
            >
              {t('schedule.browseCoursesBtn')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FarmingSchedulePage;
