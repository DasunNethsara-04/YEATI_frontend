import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan, type PlanCrop } from '../context/PlanContext';
import { api } from '../api/axios';
import Button from '../components/ui/Button';
import { Salad, Apple, Leaf, Wheat, Sprout, Droplets, MapPin } from 'lucide-react';
import { getCropImageUrl } from '../utils/cropImages';
import { getEnrichedLocation } from '../utils/districtData';
import { SmartRecommendationSection } from '../components/SmartRecommendationSection';
import { type PlanRecommendation } from '../context/PlanContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Location {
  id: string;
  district_name: string;
  province: string;
  agro_ecological_zone: string;
  default_soil_type: string | null;
  avg_annual_rainfall_mm: number | null;
}

type Crop = PlanCrop;

// ─── Category badge config ────────────────────────────────────────────────────
const categoryConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  VEGETABLE:  { label: 'Vegetable',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Salad className="h-10 w-10 text-emerald-600" /> },
  FRUIT:      { label: 'Fruit',      color: 'bg-orange-100  text-orange-700  border-orange-200',  icon: <Apple className="h-10 w-10 text-orange-600" /> },
  CASH_CROP:  { label: 'Cash Crop',  color: 'bg-yellow-100  text-yellow-700  border-yellow-200',  icon: <Leaf className="h-10 w-10 text-yellow-600" /> },
  GRAIN:      { label: 'Grain',      color: 'bg-amber-100   text-amber-700   border-amber-200',   icon: <Wheat className="h-10 w-10 text-amber-600" /> },
  HERB_SPICE: { label: 'Herb/Spice', color: 'bg-purple-100  text-purple-700  border-purple-200',  icon: <Sprout className="h-10 w-10 text-purple-600" /> },
};

const suitabilityConfig: Record<string, { label: string; dot: string }> = {
  OPTIMAL:    { label: 'Optimal',    dot: 'bg-agri-primary' },
  MODERATE:   { label: 'Moderate',   dot: 'bg-agri-lime'    },
  MARGINAL:   { label: 'Marginal',   dot: 'bg-orange-400'   },
  UNSUITABLE: { label: 'Unsuitable', dot: 'bg-red-400'      },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-agri-border p-5 animate-pulse space-y-3">
    <div className="h-36 bg-agri-bg rounded-xl" />
    <div className="h-4 bg-agri-bg rounded w-2/3" />
    <div className="h-3 bg-agri-bg rounded w-1/3" />
    <div className="flex gap-2">
      <div className="h-6 bg-agri-bg rounded-full w-16" />
      <div className="h-6 bg-agri-bg rounded-full w-20" />
    </div>
  </div>
);

const CropCard: React.FC<{ crop: Crop }> = ({ crop }) => {
  const cat = categoryConfig[crop.category] ?? { label: crop.category, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Sprout className="h-10 w-10 text-agri-primary" /> };
  const suit = crop.suitability ? suitabilityConfig[crop.suitability] : null;
  const cropImg = getCropImageUrl(crop.name_en, crop.image_url);

  return (
    <div
      className="group bg-white rounded-2xl border border-agri-border overflow-hidden
        hover:border-agri-primary/40 hover:shadow-xl hover:shadow-agri-primary/8
        transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Image area */}
      <div className="relative h-36 bg-gradient-to-br from-agri-bg to-agri-border flex items-center justify-center text-5xl overflow-hidden">
        {cropImg ? (
          <img
            src={cropImg}
            alt={crop.name_en}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
        )}
        {/* Suitability badge */}
        {suit && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm border border-agri-border/60">
            <span className={`h-1.5 w-1.5 rounded-full ${suit.dot}`} />
            <span className="text-xs font-semibold text-agri-text">{suit.label}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-agri-text group-hover:text-agri-primary transition-colors duration-200">
              {crop.name_en}
            </h3>
            <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
              {cat.label}
            </span>
          </div>
          <p className="text-xs text-agri-subtext mt-0.5">{crop.name_si}</p>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-agri-bg rounded-xl px-3 py-2">
            <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">Cycle</p>
            <p className="text-sm font-bold text-agri-text mt-0.5">{crop.growing_cycle_duration_days}d</p>
          </div>
          <div className="bg-agri-bg rounded-xl px-3 py-2">
            <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">Soil pH</p>
            <p className="text-sm font-bold text-agri-text mt-0.5">{crop.min_soil_ph}–{crop.max_soil_ph}</p>
          </div>
          <div className="bg-agri-bg rounded-xl px-3 py-2">
            <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">Temp</p>
            <p className="text-sm font-bold text-agri-text mt-0.5">{crop.min_temp_celsius}–{crop.max_temp_celsius}°C</p>
          </div>
          <div className="bg-agri-bg rounded-xl px-3 py-2">
            <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">Soil Type</p>
            <p className="text-xs font-semibold text-agri-text mt-0.5 truncate" title={crop.preferred_soil_type}>
              {crop.preferred_soil_type}
            </p>
          </div>
        </div>

        {crop.water_requirement_summary && (
          <div className="flex items-start gap-1.5 text-xs text-agri-subtext leading-relaxed line-clamp-2">
            <Droplets className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <span>{crop.water_requirement_summary}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const {
    selectedLocation: planLocation,
    setSelectedCrop,
    setSelectedLocation: setPlanLocation,
    setSelectedMethod,
    userInputs,
    setUserInputs,
    setCurrentPhase,
  } = usePlan();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(() => planLocation ? getEnrichedLocation(planLocation) : null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [cropsError, setCropsError] = useState<string | null>(null);

  const enrichedLocation = getEnrichedLocation(selectedLocation);

  // Fetch locations — try /locations API, fall back to deriving unique districts from suitability data
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get<Location[]>('/locations');
        if (res.data.length > 0) {
          const enriched = res.data.map((l) => getEnrichedLocation(l)!);
          setLocations(enriched);
          setSelectedLocation((prev) => {
            if (prev) return getEnrichedLocation(prev);
            if (planLocation) return getEnrichedLocation(planLocation);
            const defaultLoc = enriched.find((l) => l.district_name.toLowerCase() === 'badulla') ?? enriched[0];
            return defaultLoc ?? null;
          });
        } else {
          // Locations table empty — derive unique districts from suitability table via dedicated endpoint
          const distRes = await api.get<{ district: string; province?: string }[]>('/locations/districts');
          const derived: Location[] = distRes.data.map((d) => getEnrichedLocation({
            id: d.district,
            district_name: d.district,
            province: d.province ?? 'Sri Lanka',
            agro_ecological_zone: '',
            default_soil_type: null,
            avg_annual_rainfall_mm: null,
          })!);
          setLocations(derived);
          setSelectedLocation((prev) => {
            if (prev) return getEnrichedLocation(prev);
            if (planLocation) return getEnrichedLocation(planLocation);
            const defaultLoc = derived.find((l) => l.district_name.toLowerCase() === 'badulla') ?? derived[0];
            return defaultLoc ?? null;
          });
        }
      } catch {
        // Last resort: get districts from suitability
        try {
          const distRes = await api.get<{ district: string }[]>('/locations/districts');
          const derived: Location[] = distRes.data.map((d) => getEnrichedLocation({
            id: d.district,
            district_name: d.district,
            province: 'Sri Lanka',
            agro_ecological_zone: '',
            default_soil_type: null,
            avg_annual_rainfall_mm: null,
          })!);
          setLocations(derived);
          setSelectedLocation((prev) => {
            if (prev) return getEnrichedLocation(prev);
            if (planLocation) return getEnrichedLocation(planLocation);
            const defaultLoc = derived.find((l) => l.district_name.toLowerCase() === 'badulla') ?? derived[0];
            return defaultLoc ?? null;
          });
        } catch {
          setLocationsError('Could not load locations. Please try again.');
        }
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Fetch crops when location changes — use district name since locations table may be empty
  const fetchCrops = useCallback(async (location: Location) => {
    setLoadingCrops(true);
    setCropsError(null);
    try {
      // Try by location ID first; fall back to district name
      let res;
      if (location.id && location.id !== location.district_name) {
        try {
          res = await api.get<Crop[]>(`/crops/by-location/${location.id}`);
          if (res.data.length === 0) throw new Error('empty');
        } catch {
          res = await api.get<Crop[]>(`/crops/by-district/${encodeURIComponent(location.district_name)}`);
        }
      } else {
        res = await api.get<Crop[]>(`/crops/by-district/${encodeURIComponent(location.district_name)}`);
      }
      setCrops(res.data);
    } catch {
      setCropsError('Could not load crop recommendations. Please try again.');
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  useEffect(() => {
    if (enrichedLocation) {
      fetchCrops(enrichedLocation);
    }
  }, [enrichedLocation?.district_name, fetchCrops]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Adopt a recommended plan with safe land extent
  const handleAdoptPlan = async (rec: PlanRecommendation) => {
    try {
      // 1. Fetch full crop details
      const cropRes = await api.get<Crop>(`/crops/${rec.crop_id}`);
      setSelectedCrop(cropRes.data);

      // 2. Fetch and match cultivation method
      const methodsRes = await api.get(`/crops/${rec.crop_id}/methods`);
      const methodsData = methodsRes.data || [];
      const matched = methodsData.find((m: any) => m.method_type === rec.method_type) || methodsData[0];
      if (matched) {
        setSelectedMethod(matched);
      }

      // 3. Set safe land area
      const safeAcres = rec.can_afford
        ? (userInputs.area_unit === 'acres' && userInputs.area_value > 0 ? userInputs.area_value : rec.evaluated_land.acres)
        : rec.max_affordable_land.acres;

      setUserInputs({
        ...userInputs,
        capital_lkr: userInputs.capital_lkr || 250000,
        area_value: Number(safeAcres.toFixed(2)),
        area_unit: 'acres',
      });

      setCurrentPhase(3);
      navigate('/crop-detail');
    } catch (e) {
      console.error('Failed to adopt plan:', e);
      navigate('/crop-detail');
    }
  };

  // Sync location selection with PlanContext
  const handleSelectLocation = (loc: Location) => {
    const enriched = getEnrichedLocation(loc) ?? loc;
    setSelectedLocation(enriched);
    setPlanLocation(enriched);
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const handleClearLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLocation(null);
    setPlanLocation(null);
    setCrops([]);
    setLocationSearch('');
  };

  const handleCropClick = (crop: Crop) => {
    setSelectedCrop(crop);
    setCurrentPhase(2);
    navigate('/crop-detail');
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.district_name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      loc.province.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-agri-bg flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-agri-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/logo.png" alt="AgriPiyasa Logo" className="h-9 w-auto object-contain" />
            <span className="text-agri-dark text-xl font-bold tracking-tight">Agri පියස</span>
          </div>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {[
              { label: 'Location & Crops', path: '/dashboard' },
              { label: 'Crop Profile', path: '/crop-detail' },
              { label: 'Daily Schedule', path: '/farming-schedule' },
              { label: 'Analytics', path: '/analytics' },
              { label: 'Training Hub', path: '/training-hub' },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
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

          {/* User menu */}
          <div className="relative flex-shrink-0">
            <button
              id="user-menu-btn"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-agri-bg transition-colors border border-agri-border"
            >
              <div className="h-7 w-7 rounded-full bg-agri-dark flex items-center justify-center text-agri-lime text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-agri-text max-w-[120px] truncate">
                {profile?.full_name ?? user?.email}
              </span>
              <svg className={`h-4 w-4 text-agri-subtext transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-agri-border shadow-xl shadow-agri-text/8 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-agri-border">
                  <p className="text-sm font-semibold text-agri-text truncate">{profile?.full_name ?? 'User'}</p>
                  <p className="text-xs text-agri-subtext truncate">{user?.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-agri-primary/10 text-agri-primary border border-agri-primary/20">
                    {profile?.role ?? 'USER'}
                  </span>
                </div>
                <div className="p-1.5">
                  <button
                    id="profile-menu-item"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-agri-text hover:bg-agri-bg rounded-xl transition-colors"
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  >
                    <svg className="h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    My Profile
                  </button>
                  {profile?.role === 'ADMIN' && (
                    <button
                      id="admin-panel-menu-item"
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-agri-text hover:bg-agri-bg rounded-xl transition-colors"
                      onClick={() => { setUserMenuOpen(false); navigate('/admin'); }}
                    >
                      <svg className="h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Admin Panel
                    </button>
                  )}
                  <button
                    id="logout-menu-item"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-3xl bg-agri-dark p-8 lg:p-10">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-agri-primary/20 blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-40 w-60 h-60 rounded-full bg-agri-lime/10 blur-3xl translate-y-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                Hello, {profile?.full_name?.split(' ')[0] ?? 'Farmer'}
              </h1>
              <p className="text-white/60 mt-2 text-sm max-w-lg">
                Start by selecting your district below. We'll show you the best crops suited to your region's soil and climate.
              </p>
            </div>
            <div className="flex-shrink-0 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 text-center min-w-[140px]">
              <p className="text-white/60 text-xs mb-1">Currently viewing</p>
              <p className="text-white font-bold text-lg">{enrichedLocation?.district_name ?? '—'}</p>
              <p className="text-white/60 text-xs font-medium">
                {enrichedLocation?.province ? (enrichedLocation.province.endsWith('Province') ? enrichedLocation.province : `${enrichedLocation.province} Province`) : 'Select a location'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Location Selector ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-agri-primary/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-agri-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-agri-text">Select Your Location</h2>
              <p className="text-xs text-agri-subtext">Choose your district to discover compatible crops</p>
            </div>
          </div>

          {locationsError ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 max-w-lg">
              {locationsError}
            </div>
          ) : (
            <div className="relative max-w-lg" id="location-selector">
              {/* Input */}
              <div
                className="flex items-center gap-3 bg-white border border-agri-border rounded-2xl px-4 py-3 cursor-pointer
                  hover:border-agri-primary/40 transition-colors shadow-sm"
                onClick={() => setShowLocationDropdown((o) => !o)}
              >
                <svg className="h-4 w-4 text-agri-subtext flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                {loadingLocations ? (
                  <span className="text-sm text-agri-subtext">Loading locations…</span>
                ) : (
                  <input
                    id="location-search-input"
                    type="text"
                    placeholder={enrichedLocation ? enrichedLocation.district_name : 'Search districts…'}
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="flex-1 text-sm text-agri-text placeholder:text-agri-subtext/60 bg-transparent focus:outline-none"
                  />
                )}
                {selectedLocation && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearLocation(e);
                    }}
                    className="text-agri-subtext hover:text-agri-text transition-colors"
                    aria-label="Clear location"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showLocationDropdown && !loadingLocations && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLocationDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-agri-border rounded-2xl shadow-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto divide-y divide-agri-border/50">
                      {filteredLocations.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-agri-subtext">No districts found</div>
                      ) : (
                        filteredLocations.map((loc) => (
                          <button
                            key={loc.id}
                            className={`w-full text-left px-4 py-3 hover:bg-agri-bg transition-colors flex items-center justify-between gap-2 ${selectedLocation?.id === loc.id ? 'bg-agri-primary/5' : ''}`}
                            onClick={() => handleSelectLocation(loc)}
                          >
                            <div>
                              <p className="text-sm font-semibold text-agri-text">{loc.district_name}</p>
                              <p className="text-xs text-agri-subtext">{loc.province} Province · {loc.agro_ecological_zone}</p>
                            </div>
                            {selectedLocation?.id === loc.id && (
                              <svg className="h-4 w-4 text-agri-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selected location detail cards */}
          {enrichedLocation && (
            <div className="mt-4 max-w-lg grid grid-cols-3 gap-3">
              {[
                { 
                  label: 'Agro-Eco Zone', 
                  value: enrichedLocation.agro_ecological_zone || 'Intermediate Zone' 
                },
                { 
                  label: 'Soil Type', 
                  value: enrichedLocation.default_soil_type || 'Red-Yellow Podzolic' 
                },
                { 
                  label: 'Avg Rainfall', 
                  value: enrichedLocation.avg_annual_rainfall_mm 
                    ? `${enrichedLocation.avg_annual_rainfall_mm.toLocaleString()} mm` 
                    : '1,800 mm' 
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-agri-border rounded-xl p-3 shadow-sm hover:border-agri-primary/30 transition-colors">
                  <p className="text-[10px] text-agri-subtext uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-xs font-bold text-agri-text mt-1 leading-snug">{value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Smart Capital & Land Recommendation Section ── */}
        {enrichedLocation && (
          <SmartRecommendationSection
            districtName={enrichedLocation.district_name}
            userInputs={userInputs}
            setUserInputs={setUserInputs}
            onAdoptPlan={handleAdoptPlan}
          />
        )}

        {/* ── Crop Recommendations ─────────────────────────────────────── */}
        {(selectedLocation || loadingCrops) && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-agri-lime/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-agri-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-agri-text">Crop Recommendations</h2>
                  {!loadingCrops && crops.length > 0 && (
                    <p className="text-xs text-agri-subtext">{crops.length} crops suited for {selectedLocation?.district_name}</p>
                  )}
                </div>
              </div>

              {/* Filter chips placeholder */}
              {!loadingCrops && crops.length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  {['All', 'Optimal', 'Moderate'].map((f) => (
                    <button key={f} className="text-xs px-3 py-1.5 rounded-full border border-agri-border text-agri-subtext hover:border-agri-primary hover:text-agri-primary transition-colors">
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cropsError && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {cropsError}
                <Button variant="outline" size="sm" onClick={() => selectedLocation && fetchCrops(selectedLocation)}>
                  Retry
                </Button>
              </div>
            )}

            {loadingCrops ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : crops.length === 0 && !cropsError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-agri-bg border border-agri-border flex items-center justify-center mx-auto text-agri-subtext">
                  <Sprout className="h-8 w-8 text-agri-primary" />
                </div>
                <p className="text-agri-text font-semibold">No crops found for this location</p>
                <p className="text-agri-subtext text-sm max-w-sm">
                  No crop–location suitability data is available yet. Try another district or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {crops.map((crop) => (
                  <div key={crop.id} onClick={() => handleCropClick(crop)} className="cursor-pointer">
                    <CropCard crop={crop} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty / initial state */}
        {!selectedLocation && !loadingCrops && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-agri-primary/10 flex items-center justify-center text-agri-primary">
              <MapPin className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-agri-text">Pick your district to begin</h3>
              <p className="text-agri-subtext text-sm max-w-sm">
                AgriPiyasa will match crops to your agro-ecological zone and display tailored recommendations.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
};

export default DashboardPage;
