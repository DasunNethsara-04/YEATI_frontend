/**
 * CropDetailPage — Phase 2 (Crop Profile + Method Selection) & Phase 3 (Resource Inputs)
 *
 * Shown when a user clicks a crop card from the dashboard.
 * Allows selecting a cultivation method and entering their capital + area,
 * then navigates to the Analytics Dashboard (Phase 4).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { usePlan, type MethodBenchmark, type PlanCrop } from '../context/PlanContext';
import { api } from '../api/axios';
import { Wheat, Droplets, Leaf, Sprout, Calendar, FlaskConical, Thermometer, Bug, Lightbulb } from 'lucide-react';
import { getCropImageUrl } from '../utils/cropImages';

// ─── Method config ────────────────────────────────────────────────────────────
const METHOD_CONFIG: Record<string, {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
  description: string; intensity: string;
}> = {
  OPEN_FIELD: {
    label: 'Open Field',
    icon: <Wheat className="h-7 w-7 text-emerald-600" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'Traditional outdoor cultivation using natural rainfall and sunlight.',
    intensity: 'Low resource intensity · Best for large-scale production',
  },
  HYDROPONICS: {
    label: 'Hydroponics',
    icon: <Droplets className="h-7 w-7 text-blue-600" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Soil-less cultivation in a controlled environment using nutrient-rich water.',
    intensity: 'High resource intensity · Best for premium yield & quality',
  },
  ORGANIC: {
    label: 'Organic Farming',
    icon: <Leaf className="h-7 w-7 text-lime-600" />,
    color: 'text-lime-700',
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    description: 'Chemical-free farming using natural fertilizers and biological pest control.',
    intensity: 'Medium resource intensity · Best for premium market segments',
  },
};

const AREA_UNITS = [
  { value: 'perches', label: 'Perches' },
  { value: 'roods', label: 'Roods' },
  { value: 'acres', label: 'Acres' },
  { value: 'sq_m', label: 'Sq. Meters' },
  { value: 'sq_ft', label: 'Sq. Feet' },
] as const;

type AreaUnit = typeof AREA_UNITS[number]['value'];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtLKR = (n: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number, dec = 0) =>
  new Intl.NumberFormat('en-LK', { maximumFractionDigits: dec }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoBadge: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-agri-bg rounded-xl px-4 py-3">
    <div className="flex-shrink-0 text-agri-primary">{icon}</div>
    <div>
      <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm font-bold text-agri-text">{value}</p>
    </div>
  </div>
);

const MethodCard: React.FC<{
  benchmark: MethodBenchmark;
  selected: boolean;
  onClick: () => void;
}> = ({ benchmark, selected, onClick }) => {
  const cfg = METHOD_CONFIG[benchmark.method_type] ?? METHOD_CONFIG.OPEN_FIELD;

  return (
    <button
      id={`method-card-${benchmark.method_type.toLowerCase()}`}
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200
        ${selected
          ? `${cfg.border} ${cfg.bg} shadow-md ring-2 ring-offset-1 ring-current`
          : 'border-agri-border bg-white hover:border-agri-primary/40 hover:shadow-md'
        }`}
    >
      {selected && (
        <div className={`absolute top-3 right-3 h-5 w-5 rounded-full ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
          <svg className={`h-3 w-3 ${cfg.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base ${selected ? cfg.color : 'text-agri-text'}`}>{cfg.label}</h3>
          <p className="text-xs text-agri-subtext mt-0.5 leading-relaxed">{cfg.description}</p>
          <p className={`text-[10px] font-semibold mt-2 ${cfg.color} opacity-80`}>{cfg.intensity}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="bg-white/60 rounded-xl p-2.5">
          <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">Avg Yield</p>
          <p className="text-sm font-bold text-agri-text mt-0.5">{fmtNum(benchmark.avg_yield_kg_per_acre)} kg/ac</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2.5">
          <p className="text-[9px] text-agri-subtext uppercase tracking-wide font-medium">Cost/Acre</p>
          <p className="text-sm font-bold text-agri-text mt-0.5">{fmtLKR(benchmark.total_cost_rs_per_acre)}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 flex-wrap">
        {[
          { label: 'Seeds', pct: benchmark.seed_share_pct },
          { label: 'Labour', pct: benchmark.labour_share_pct },
          { label: 'Fertilizer', pct: benchmark.fertilizer_share_pct },
          { label: 'Other', pct: benchmark.other_share_pct },
        ].map(({ label, pct }) => (
          <span key={label} className="text-[10px] font-medium px-2 py-0.5 bg-white/70 rounded-full border border-agri-border text-agri-subtext">
            {label} {pct}%
          </span>
        ))}
      </div>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CropDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedCrop, setSelectedCrop, selectedLocation,
    selectedMethod, setSelectedMethod,
    userInputs, setUserInputs,
    setCurrentPhase,
  } = usePlan();

  const [availableCrops, setAvailableCrops] = useState<PlanCrop[]>([]);
  const [loadingCropsList, setLoadingCropsList] = useState(false);
  const [methods, setMethods] = useState<MethodBenchmark[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  // Check URL query param ?crop_id=...
  useEffect(() => {
    if (selectedCrop) return;
    const params = new URLSearchParams(location.search);
    const cropId = params.get('crop_id');
    if (cropId) {
      api.get<PlanCrop>(`/crops/${cropId}`).then((res) => {
        if (res.data) setSelectedCrop(res.data);
      }).catch(() => {});
    }
  }, [selectedCrop, location.search, setSelectedCrop]);

  // If no crop selected, fetch available crops so user can pick
  useEffect(() => {
    if (selectedCrop) return;
    setLoadingCropsList(true);
    api.get<PlanCrop[]>('/crops').then((res) => {
      setAvailableCrops(res.data || []);
    }).catch(() => {}).finally(() => {
      setLoadingCropsList(false);
    });
  }, [selectedCrop]);

  // Enrich crop details if agronomic parameters are missing
  useEffect(() => {
    if (!selectedCrop?.id) return;
    if (!selectedCrop.pests_and_diseases || !selectedCrop.suitable_climate) {
      api.get<PlanCrop>(`/crops/${selectedCrop.id}`).then((res) => {
        if (res.data) {
          setSelectedCrop({ ...selectedCrop, ...res.data });
        }
      }).catch(() => {});
    }
  }, [selectedCrop?.id]);

  // Fetch method benchmarks
  useEffect(() => {
    if (!selectedCrop) {
      setMethods([]);
      setLoadingMethods(false);
      return;
    }
    setLoadingMethods(true);
    setMethodsError(null);
    const fetchMethods = async () => {
      try {
        const res = await api.get<MethodBenchmark[]>(`/crops/${selectedCrop.id}/methods`);
        setMethods(res.data);
        if (res.data.length > 0 && (!selectedMethod || selectedMethod.crop_id !== selectedCrop.id)) {
          setSelectedMethod(res.data[0]);
        }
      } catch {
        setMethodsError('Could not load farming methods. Please try again.');
      } finally {
        setLoadingMethods(false);
      }
    };
    fetchMethods();
  }, [selectedCrop?.id]);

  const handleProceed = () => {
    if (!selectedMethod) return;
    setCurrentPhase(4);
    navigate('/analytics');
  };

  if (!selectedCrop) {
    return (
      <div className="min-h-screen bg-agri-bg">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-agri-border shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => { setCurrentPhase(1); navigate('/dashboard'); }}
              className="flex items-center gap-2 text-sm font-medium text-agri-subtext hover:text-agri-text transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Dashboard
            </button>
            <nav className="flex items-center gap-1.5 text-xs font-semibold">
              <Link to="/dashboard" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Location & Crops</Link>
              <Link to="/crop-detail" className="px-3 py-1.5 rounded-xl bg-agri-primary text-white shadow-sm font-semibold">Crop Profile</Link>
              <Link to="/analytics" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Analytics</Link>
              <Link to="/training-hub" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Training Hub</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-agri-text">Select a Crop Profile</h1>
            <p className="text-sm text-agri-subtext max-w-md mx-auto">
              Choose a crop below to view agronomic requirements, select cultivation methods, and plan your resources.
            </p>
          </div>
          {loadingCropsList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-white border border-agri-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCrops.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCrop(c); setCurrentPhase(2); }}
                  className="bg-white border border-agri-border rounded-2xl p-5 hover:border-agri-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-4"
                >
                  <span className="flex items-center justify-center">
                    {getCropImageUrl(c.name_en, c.image_url) ? (
                      <img src={getCropImageUrl(c.name_en, c.image_url)} alt={c.name_en} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <Sprout className="h-10 w-10 text-agri-primary" />
                    )}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-agri-text text-base">{c.name_en}</h3>
                    <p className="text-xs text-agri-subtext">{c.name_si}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-agri-bg border border-agri-border text-agri-subtext">
                      {c.category}
                    </span>
                  </div>
                  <span className="text-agri-primary font-bold text-sm">Select →</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const crop = selectedCrop;

  return (
    <div className="min-h-screen bg-agri-bg">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-agri-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 mr-1 flex-shrink-0">
            <img src="/logo.png" alt="AgriPiyasa Logo" className="h-8 w-auto object-contain" />
            <span className="text-agri-dark text-base font-bold tracking-tight hidden sm:inline">Agri පියස</span>
          </Link>
          <div className="h-4 w-px bg-agri-border hidden sm:block" />
          <button
            id="back-to-dashboard"
            onClick={() => { setCurrentPhase(1); navigate('/dashboard'); }}
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
              { label: 'Resources', path: '/crop-detail#resources' },
              { label: 'Analytics', path: '/analytics' },
              { label: 'Training Hub', path: '/training-hub' },
            ].map((item) => {
              const isActive = (item.label === 'Crop Profile' || item.label === 'Resources') && location.pathname === '/crop-detail';
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-agri-dark p-8 lg:p-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-agri-primary/20 via-transparent to-agri-lime/10" />
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center">
                {getCropImageUrl(crop.name_en, crop.image_url)
                  ? <img src={getCropImageUrl(crop.name_en, crop.image_url)} alt={crop.name_en} className="h-14 w-14 rounded-xl object-cover" />
                  : <Sprout className="h-12 w-12 text-agri-lime" />}
              </span>
              <div>
                <p className="text-agri-lime/70 text-xs font-semibold uppercase tracking-widest">Phase 2 — Crop Profile</p>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{crop.name_en}</h1>
                <p className="text-white/50 text-sm">{crop.name_si}</p>
              </div>
            </div>
            {crop.suitable_climate && (
              <p className="text-white/60 text-sm max-w-xl leading-relaxed">{crop.suitable_climate}</p>
            )}
          </div>
          {selectedLocation && (
            <div className="relative z-10 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-center flex-shrink-0">
              <p className="text-white/50 text-xs mb-1">Your Location</p>
              <p className="text-white font-bold text-lg">{selectedLocation.district_name}</p>
              <p className="text-white/40 text-xs">{selectedLocation.province}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left column: agronomic parameters ─────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-agri-primary/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-agri-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                  </svg>
                </div>
                Crop Parameters
              </h2>
              <div className="space-y-2">
                <InfoBadge icon={<Calendar className="h-4 w-4" />} label="Growing Cycle" value={`${crop.growing_cycle_duration_days} days`} />
                <InfoBadge icon={<FlaskConical className="h-4 w-4" />} label="Soil pH Range" value={`${crop.min_soil_ph} – ${crop.max_soil_ph}`} />
                <InfoBadge icon={<Sprout className="h-4 w-4" />} label="Preferred Soil" value={crop.preferred_soil_type} />
                <InfoBadge icon={<Thermometer className="h-4 w-4" />} label="Temperature" value={`${crop.min_temp_celsius}°C – ${crop.max_temp_celsius}°C`} />
                {crop.water_requirement_summary && (
                  <InfoBadge icon={<Droplets className="h-4 w-4" />} label="Water Needs" value={crop.water_requirement_summary} />
                )}
              </div>
            </div>

            {crop.pests_and_diseases && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-5 w-5 text-orange-700" />
                  <h3 className="text-sm font-bold text-orange-800">Pests & Diseases</h3>
                </div>
                <p className="text-xs text-orange-700 leading-relaxed">{crop.pests_and_diseases}</p>
              </div>
            )}
          </div>

          {/* ── Right column: method selection + resource inputs ───────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Method selection */}
            <section>
              <h2 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-agri-lime/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-agri-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                Select Farming Method
              </h2>

              {loadingMethods ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-agri-border/40 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : methodsError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600">{methodsError}</div>
              ) : methods.length === 0 ? (
                <div className="bg-agri-bg rounded-2xl p-8 text-center text-agri-subtext text-sm">
                  No method benchmarks available for this crop yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {methods.map((m) => (
                    <MethodCard
                      key={m.id}
                      benchmark={m}
                      selected={selectedMethod?.id === m.id}
                      onClick={() => setSelectedMethod(m)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Phase 3: Resource inputs */}
            <section className="bg-white rounded-3xl border border-agri-border p-6 space-y-6">
              <h2 className="text-base font-bold text-agri-text flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-agri-primary/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-agri-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                Phase 3 — Your Resources
              </h2>

              {/* Capital input */}
              <div>
                <label htmlFor="capital-input" className="block text-sm font-semibold text-agri-text mb-2">
                  Available Capital (LKR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-agri-subtext">Rs.</span>
                  <input
                    id="capital-input"
                    type="number"
                    min={0}
                    step={1000}
                    value={userInputs.capital_lkr || ''}
                    onChange={e => setUserInputs({ ...userInputs, capital_lkr: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 500000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-agri-border bg-agri-bg text-agri-text
                      placeholder:text-agri-subtext/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-agri-primary/30
                      focus:border-agri-primary transition-colors"
                  />
                </div>
              </div>

              {/* Area input */}
              <div>
                <label htmlFor="area-input" className="block text-sm font-semibold text-agri-text mb-2">
                  Cultivation Area
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="area-input"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={userInputs.area_value || ''}
                      onChange={e => setUserInputs({ ...userInputs, area_value: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 2"
                      className="w-full px-4 py-3 rounded-xl border border-agri-border bg-agri-bg text-agri-text
                        placeholder:text-agri-subtext/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-agri-primary/30
                        focus:border-agri-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-1 bg-agri-bg border border-agri-border rounded-xl p-1">
                    {AREA_UNITS.map(unit => (
                      <button
                        key={unit.value}
                        id={`unit-${unit.value}`}
                        type="button"
                        onClick={() => setUserInputs({ ...userInputs, area_unit: unit.value as AreaUnit })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                          userInputs.area_unit === unit.value
                            ? 'bg-agri-primary text-white shadow-sm'
                            : 'text-agri-subtext hover:text-agri-text'
                        }`}
                      >
                        {unit.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proceed button */}
              {(!userInputs.capital_lkr || userInputs.capital_lkr <= 0) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0" /> Please enter your available capital (LKR) above to generate financial projections.
                </p>
              )}
              <button
                id="proceed-to-analytics"
                disabled={!selectedMethod || !userInputs.capital_lkr || !userInputs.area_value}
                onClick={handleProceed}
                className="w-full bg-agri-primary text-white font-bold py-4 rounded-2xl
                  hover:bg-agri-dark transition-colors duration-200 shadow-lg shadow-agri-primary/30
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                  flex items-center justify-center gap-2 text-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
                View Financial Analytics
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CropDetailPage;
