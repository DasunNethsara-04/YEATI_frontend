/**
 * AnalyticsDashboard — Phase 4: Financial Analytics & Market Insights
 *
 * Shows OpEx breakdown (pie chart), revenue/ROI summary cards,
 * historical price trend (line chart), and ML-predicted price/climate data.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { usePlan, type AnalyticsResult } from '../context/PlanContext';
import { api } from '../api/axios';
import {
  BarChart3,
  AlertTriangle,
  Coins,
  Wheat,
  TrendingUp,
  TrendingDown,
  Rocket,
  PieChart as PieChartIcon,
  Bot,
  CloudSun,
  CloudRain,
  Thermometer,
  Snowflake,
  Flame,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtLKR = (n: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n);
const fmtKg = (n: number) =>
  new Intl.NumberFormat('en-LK', { maximumFractionDigits: 1 }).format(n) + ' kg';

// ─── Chart colors ─────────────────────────────────────────────────────────────
const PIE_COLORS = ['#16A34A', '#84CC16', '#3B82F6', '#F59E0B'];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string; sub?: string;
  positive?: boolean; negative?: boolean; accent?: boolean;
}> = ({ icon, label, value, sub, positive, negative, accent }) => (
  <div className={`rounded-2xl border p-5 space-y-2 ${
    accent ? 'bg-agri-dark border-agri-dark text-white'
    : positive ? 'bg-emerald-50 border-emerald-200'
    : negative ? 'bg-red-50 border-red-200'
    : 'bg-white border-agri-border'
  }`}>
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center">{icon}</span>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-white/60' : 'text-agri-subtext'}`}>{label}</p>
    </div>
    <p className={`text-2xl font-bold ${accent ? 'text-agri-lime' : positive ? 'text-emerald-700' : negative ? 'text-red-600' : 'text-agri-text'}`}>
      {value}
    </p>
    {sub && <p className={`text-xs ${accent ? 'text-white/40' : 'text-agri-subtext'}`}>{sub}</p>}
  </div>
);

interface PricePoint {
  week_start: string;
  predicted_price_rs_per_kg: number;
  rainfall_mm: number;
  week_num: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name?: string; value?: number }[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-agri-border rounded-xl shadow-lg p-3 text-xs">
      <p className="text-agri-subtext mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-agri-text">
          {p.name === 'price' ? `Rs. ${p.value?.toFixed(2)}/kg` : `${p.value?.toFixed(1)} mm`}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCrop, selectedMethod, userInputs, selectedLocation,
    analyticsResult, setAnalyticsResult, setCurrentPhase,
  } = usePlan();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFormulas, setShowFormulas] = useState(true);
  const [formulaTab, setFormulaTab] = useState<'formulas' | 'units'>('formulas');

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!selectedCrop || !selectedMethod) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AnalyticsResult>('/analytics/calculate', {
        crop_id: selectedCrop.id,
        method_type: selectedMethod.method_type,
        area_value: userInputs.area_value,
        area_unit: userInputs.area_unit,
        capital_lkr: userInputs.capital_lkr,
        target_date: userInputs.target_date,
      });
      setAnalyticsResult(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Failed to calculate analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, selectedMethod, userInputs, setAnalyticsResult]);

  // Fetch price history
  const fetchPriceHistory = useCallback(async () => {
    if (!selectedCrop) return;
    setHistoryLoading(true);
    try {
      const res = await api.get<{ data: PricePoint[] }>(`/analytics/price-history/${encodeURIComponent(selectedCrop.name_en)}?weeks=26`);
      setPriceHistory(res.data.data);
    } catch {
      // Silently fail — chart will show fallback message
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedCrop]);

  useEffect(() => {
    if (selectedCrop && selectedMethod) {
      fetchAnalytics();
      fetchPriceHistory();
    }
  }, [selectedCrop?.id, selectedMethod?.id]);

  const result = analyticsResult as AnalyticsResult & {
    crop?: { name_en: string };
    method_type?: string;
    area?: { value: number; unit: string; acres: number };
  } | null;

  if (!selectedCrop || !selectedMethod) {
    return (
      <div className="min-h-screen bg-agri-bg">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-agri-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 mr-1 flex-shrink-0">
                <img src="/logo.png" alt="AgriPiyasa Logo" className="h-8 w-auto object-contain" />
                <span className="text-agri-dark text-base font-bold tracking-tight hidden sm:inline">Agri පියස</span>
              </Link>
              <div className="h-4 w-px bg-agri-border hidden sm:block" />
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm font-medium text-agri-subtext hover:text-agri-text transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Dashboard
              </button>
            </div>
            <nav className="flex items-center gap-1.5 text-xs font-semibold">
              <Link to="/dashboard" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Location & Crops</Link>
              <Link to="/crop-detail" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Crop Profile</Link>
              <Link to="/analytics" className="px-3 py-1.5 rounded-xl bg-agri-primary text-white shadow-sm font-semibold">Analytics</Link>
              <Link to="/training-hub" className="px-3 py-1.5 rounded-xl text-agri-subtext hover:text-agri-text">Training Hub</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-agri-primary/10 flex items-center justify-center text-agri-primary">
            <BarChart3 className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-agri-text">No Active Crop Plan Found</h2>
          <p className="text-sm text-agri-subtext">
            To view financial analytics, ROI projections, and price forecasts, please select a crop and farming method first.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-agri-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-agri-dark transition-colors"
            >
              Pick District & Crop
            </button>
            <button
              onClick={() => navigate('/crop-detail')}
              className="border border-agri-border bg-white text-agri-text font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-agri-bg transition-colors"
            >
              Browse Crop Profiles
            </button>
          </div>
        </main>
      </div>
    );
  }

  // OpEx pie data
  const pieData = result
    ? [
        { name: 'Seeds', value: result.opex.seed_rs, pct: result.opex.seed_pct },
        { name: 'Labour', value: result.opex.labour_rs, pct: result.opex.labour_pct },
        { name: 'Fertilizer', value: result.opex.fertilizer_rs, pct: result.opex.fertilizer_pct },
        { name: 'Other', value: result.opex.other_rs, pct: result.opex.other_pct },
      ]
    : [];

  const roiPositive = (result?.revenue.roi_pct ?? 0) >= 0;
  const totalAcres = result?.area?.acres ?? (userInputs.area_unit === 'acres' ? userInputs.area_value : 1);

  // Price chart data — format week label
  const chartData = priceHistory.map((p) => ({
    label: new Date(p.week_start).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }),
    price: p.predicted_price_rs_per_kg,
    rainfall: p.rainfall_mm,
  }));

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
            id="back-to-crop-detail"
            onClick={() => { setCurrentPhase(2); navigate('/crop-detail'); }}
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
              const isActive = location.pathname === item.path || item.path === '/analytics';
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
          <div className="ml-auto">
            <button
              id="go-to-training-hub"
              onClick={() => { setCurrentPhase(5); navigate('/training-hub'); }}
              className="flex items-center gap-2 bg-agri-primary text-white text-xs font-semibold px-4 py-2 rounded-xl
                hover:bg-agri-dark transition-colors"
            >
              Next: Training Hub
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Plan summary banner ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-agri-dark p-7 lg:p-9">
          <div className="absolute inset-0 bg-gradient-to-br from-agri-primary/20 to-transparent" />
          <div className="relative z-10 flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-agri-lime/70 text-xs font-semibold uppercase tracking-widest mb-1">Phase 4 — Financial Analytics</p>
              <h1 className="text-2xl font-bold text-white">{selectedCrop.name_en} · {selectedMethod.method_type.replace('_', ' ')}</h1>
              <p className="text-white/50 text-sm mt-1">
                {userInputs.area_value} {userInputs.area_unit} · Rs. {userInputs.capital_lkr.toLocaleString()} capital
                {selectedLocation && ` · ${selectedLocation.district_name}`}
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl
                hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
              </svg>
              Recalculate
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600 flex items-center gap-3">
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading skeleton ───────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-agri-border/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && !loading && (
          <>
            {/* Affordability alert */}
            {!result.can_afford && (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-300 rounded-2xl px-5 py-4 text-sm text-orange-700">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Capital shortfall detected</p>
                  <p className="text-xs mt-0.5">
                    Your plan requires <strong>{fmtLKR(result.opex.total_rs)}</strong> but you have <strong>{fmtLKR(result.capital_lkr)}</strong>.
                    Consider reducing area or choosing a lower-cost method.
                  </p>
                </div>
              </div>
            )}

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Coins className="h-5 w-5 text-agri-lime" />} label="Total OpEx" value={fmtLKR(result.opex.total_rs)} sub={`${totalAcres.toFixed(3)} acres`} accent />
              <StatCard icon={<Wheat className="h-5 w-5 text-emerald-600" />} label="Est. Yield" value={fmtKg(result.yield.estimated_kg)} sub={`${fmtKg(result.yield.avg_yield_per_acre)} / acre`} />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                label="Gross Revenue"
                value={result.revenue.gross_revenue_rs > 0 ? fmtLKR(result.revenue.gross_revenue_rs) : 'N/A'}
                sub={result.revenue.predicted_price_per_kg > 0 ? `@ Rs.${result.revenue.predicted_price_per_kg}/kg` : 'Price unavailable'}
                positive={result.revenue.gross_revenue_rs > 0}
              />
              <StatCard
                icon={roiPositive ? <Rocket className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                label="Net Profit / ROI"
                value={result.revenue.net_profit_rs !== 0 ? fmtLKR(result.revenue.net_profit_rs) : 'N/A'}
                sub={
                  result.revenue.roi_pct !== 0
                    ? `${result.revenue.roi_pct > 0 ? '+' : ''}${result.revenue.roi_pct.toFixed(1)}% ROI${result.revenue.profit_margin_pct ? ` · ${result.revenue.profit_margin_pct.toFixed(0)}% Margin` : ''}`
                    : undefined
                }
                positive={roiPositive && result.revenue.net_profit_rs > 0}
                negative={!roiPositive}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OpEx Pie */}
              <div className="bg-white rounded-3xl border border-agri-border p-6">
                <h2 className="text-base font-bold text-agri-text mb-5 flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-emerald-600" /> OpEx Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [fmtLKR(Number(value) || 0), '']} />
                    <Legend
                      formatter={(value, entry: { payload?: { pct?: number } }) =>
                        `${value} (${entry?.payload?.pct?.toFixed(1)}%)`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Detail table */}
                <div className="mt-4 space-y-2">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-agri-subtext">{item.name}</span>
                      </div>
                      <span className="font-semibold text-agri-text">{fmtLKR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price forecast line chart */}
              <div className="bg-white rounded-3xl border border-agri-border p-6">
                <h2 className="text-base font-bold text-agri-text mb-1 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-agri-primary" /> Price Forecast (Next 26 Weeks)
                </h2>
                <p className="text-xs text-agri-subtext mb-5">
                  Forward-looking ML weekly market price prediction (Rs./kg) from this month onwards
                </p>
                {historyLoading ? (
                  <div className="h-64 bg-agri-bg rounded-xl animate-pulse" />
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-agri-subtext text-sm">
                    Price forecast not available for this crop
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        tickLine={false}
                        interval={Math.floor(chartData.length / 6)}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#16A34A"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#16A34A' }}
                        name="price"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {result.price_prediction && (
                  <div className="mt-4 flex items-center gap-3 bg-agri-primary/5 border border-agri-primary/20 rounded-xl px-4 py-3">
                    <Bot className="h-5 w-5 text-agri-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-agri-subtext">
                        Predicted Market Price after Harvest {result.price_prediction.harvest_date ? `(${new Date(result.price_prediction.harvest_date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}
                      </p>
                      <p className="text-base font-bold text-agri-primary">
                        Rs. {result.price_prediction.predicted_price_rs_per_kg.toFixed(2)} / kg
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Climate prediction */}
            {result.climate_prediction && (
              <div className="bg-white rounded-3xl border border-agri-border p-6">
                <h2 className="text-base font-bold text-agri-text mb-4 flex items-center gap-2">
                  <CloudSun className="h-5 w-5 text-amber-500" /> Climate Forecast (Harvest Window)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InfoChip icon={<CloudRain className="h-6 w-6 text-blue-500" />} label="Rainfall" value={`${result.climate_prediction.predicted_rainfall_mm} mm`} />
                  <InfoChip icon={<Thermometer className="h-6 w-6 text-orange-500" />} label="Avg Temp" value={`${result.climate_prediction.predicted_avg_temp_c}°C`} />
                  <InfoChip icon={<Snowflake className="h-6 w-6 text-sky-400" />} label="Min Temp" value={`${result.climate_prediction.predicted_min_temp_c}°C`} />
                  <InfoChip icon={<Flame className="h-6 w-6 text-red-500" />} label="Max Temp" value={`${result.climate_prediction.predicted_max_temp_c}°C`} />
                </div>
              </div>
            )}

            {/* Calculation Formulas & Land Measurement Guide (Reference Sheet) */}
            <div className="bg-white rounded-3xl border border-agri-border overflow-hidden shadow-sm">
              <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-agri-bg/50 transition-colors"
                onClick={() => setShowFormulas(!showFormulas)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-agri-primary/10 flex items-center justify-center text-agri-primary">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-agri-text flex flex-wrap items-center gap-2">
                      Crop Yield, Revenue & ROI Formulas
                      <span className="text-[10px] font-bold bg-agri-lime/20 text-agri-dark px-2.5 py-0.5 rounded-full border border-agri-lime/30">
                        Sri Lanka Agricultural Standards
                      </span>
                    </h2>
                    <p className="text-xs text-agri-subtext mt-0.5">
                      Yield estimation, revenue prediction, return on investment & Sri Lankan land unit relationships.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 text-agri-subtext hover:text-agri-text transition-colors"
                  aria-label="Toggle formulas"
                >
                  {showFormulas ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>

              {showFormulas && (
                <div className="border-t border-agri-border p-6 bg-agri-bg/30 space-y-6">
                  {/* Tab Selector */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormulaTab('formulas')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formulaTab === 'formulas'
                          ? 'bg-agri-primary text-white shadow-sm'
                          : 'bg-white border border-agri-border text-agri-subtext hover:text-agri-text'
                      }`}
                    >
                      1. Calculation Formulas
                    </button>
                    <button
                      onClick={() => setFormulaTab('units')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formulaTab === 'units'
                          ? 'bg-agri-primary text-white shadow-sm'
                          : 'bg-white border border-agri-border text-agri-subtext hover:text-agri-text'
                      }`}
                    >
                      2. Land Measurement Unit Relationships
                    </button>
                  </div>

                  {/* Section 1: Calculation Formulas */}
                  {formulaTab === 'formulas' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Formula 1: Estimated Yield */}
                      <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            Estimated Yield (kg)
                          </span>
                          <h3 className="text-sm font-bold text-agri-text">Yield Estimation</h3>
                          <div className="bg-agri-bg/80 rounded-xl p-3 text-xs font-mono text-agri-text border border-agri-border/60">
                            Estimated Yield (kg) = Crop Avg Yield (kg/ac) × Land Size (ac)
                          </div>
                          <p className="text-[11px] text-agri-subtext leading-relaxed">
                            Where <em>Crop Average Yield</em> is the typical yield per acre for <strong>{selectedCrop.name_en}</strong>, and <em>User Land Size</em> is the extent of your land in acres.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-agri-border/50 text-xs">
                          <p className="text-[10px] text-agri-subtext uppercase font-semibold">Your Calculation:</p>
                          <p className="font-semibold text-agri-text mt-0.5">
                            {result.yield.avg_yield_per_acre.toLocaleString()} kg/ac × {result.area?.acres.toFixed(3)} ac = <span className="text-emerald-600 font-bold">{fmtKg(result.yield.estimated_kg)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Formula 2: Estimated Revenue */}
                      <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                            Estimated Revenue (Rs)
                          </span>
                          <h3 className="text-sm font-bold text-agri-text">Revenue Prediction</h3>
                          <div className="bg-agri-bg/80 rounded-xl p-3 text-xs font-mono text-agri-text border border-agri-border/60">
                            Estimated Revenue = Estimated Yield (kg) × Market Price after Harvest (Rs/kg)
                          </div>
                          <p className="text-[11px] text-agri-subtext leading-relaxed">
                            The predicted market price reflects the expected price at the time the crop is harvested and sold, not the current spot price.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-agri-border/50 text-xs">
                          <p className="text-[10px] text-agri-subtext uppercase font-semibold">Your Calculation:</p>
                          <p className="font-semibold text-agri-text mt-0.5">
                            {result.yield.estimated_kg.toLocaleString()} kg × Rs. {result.revenue.predicted_price_per_kg.toFixed(2)}/kg = <span className="text-blue-600 font-bold">{fmtLKR(result.revenue.gross_revenue_rs)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Formula 3: ROI */}
                      <div className="bg-white rounded-2xl border border-agri-border p-5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase tracking-wider">
                            Return on Investment (%)
                          </span>
                          <h3 className="text-sm font-bold text-agri-text">ROI Calculation</h3>
                          <div className="bg-agri-bg/80 rounded-xl p-3 text-xs font-mono text-agri-text border border-agri-border/60">
                            ROI (%) = [(Estimated Revenue − User Investment) ÷ User Investment] × 100
                          </div>
                          <p className="text-[11px] text-agri-subtext leading-relaxed">
                            Calculated against <strong>Cultivation Cost (OpEx)</strong>. Prices are calibrated with Sri Lanka Department of Agriculture / HARTI farm-gate wholesale bounds.
                          </p>
                        </div>
                        <div className="pt-3 border-t border-agri-border/50 text-xs space-y-1">
                          <p className="text-[10px] text-agri-subtext uppercase font-semibold">Your Calculations:</p>
                          <p className="font-semibold text-agri-text">
                            OpEx ROI: <span className={`font-bold ${roiPositive ? 'text-emerald-600' : 'text-red-600'}`}>{result.revenue.roi_pct.toFixed(1)}%</span>
                          </p>
                          {result.revenue.profit_margin_pct !== undefined && (
                            <p className="text-agri-subtext">
                              Net Margin: <span className="font-semibold text-agri-text">{result.revenue.profit_margin_pct.toFixed(1)}%</span>
                            </p>
                          )}
                          {result.revenue.capital_roi_pct !== undefined && result.capital_lkr > 0 && (
                            <p className="text-agri-subtext text-[11px]">
                              Total Budget ROI: <span className="font-medium text-agri-text">{result.revenue.capital_roi_pct.toFixed(1)}%</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Land Measurement Units */}
                  {formulaTab === 'units' && (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-agri-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-agri-bg border-b border-agri-border text-agri-subtext uppercase text-[10px] font-bold">
                              <tr>
                                <th className="py-3 px-4">Unit</th>
                                <th className="py-3 px-4">Equivalent In Other Units</th>
                                <th className="py-3 px-4">Measurement Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-agri-border font-medium">
                              <tr>
                                <td className="py-3 px-4 font-bold text-agri-text">1 Perch</td>
                                <td className="py-3 px-4 text-agri-text">25.29 square metres · 1/40 Rood · 1/160 Acre</td>
                                <td className="py-3 px-4 text-agri-subtext">Imperial rod perch (5.0292 m × 5.0292 m = 25.2929 m²), standard in Sri Lanka</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-bold text-agri-text">1 Rood</td>
                                <td className="py-3 px-4 text-agri-text">40 Perches · 1,011.71 square metres · 1/4 Acre</td>
                                <td className="py-3 px-4 text-agri-subtext">Traditional quarter-acre division (4 Roods = 1 Acre)</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-bold text-agri-text">1 Acre</td>
                                <td className="py-3 px-4 text-agri-text">4 Roods · 160 Perches · 4,046.86 square metres</td>
                                <td className="py-3 px-4 text-agri-subtext">Primary standard unit for yield & cost benchmarks</td>
                              </tr>
                              <tr>
                                <td className="py-3 px-4 font-bold text-agri-text">1 Square Metre</td>
                                <td className="py-3 px-4 text-agri-text">0.0395 Perches · 0.000988 Roods · 0.000247 Acres</td>
                                <td className="py-3 px-4 text-agri-subtext">Metric system standard (1 m² ≈ 0.0002471 Acres)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Active conversion summary for user's land */}
                      <div className="bg-white rounded-2xl border border-agri-primary/20 p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-agri-primary">Your Cultivation Extent Conversions:</p>
                          <p className="text-sm font-semibold text-agri-text mt-0.5">
                            {userInputs.area_value} {userInputs.area_unit} = {totalAcres.toFixed(3)} Acres = {(totalAcres * 160).toFixed(1)} Perches = {(totalAcres * 4).toFixed(2)} Roods = {(totalAcres * 4046.86).toFixed(1)} m²
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg">
                          Standardized to {totalAcres.toFixed(3)} acres for calculation
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Training hub CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-agri-primary to-agri-dark p-7 flex items-center justify-between gap-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute right-10 top-0 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10">
            <p className="text-agri-lime font-semibold text-sm mb-1">Phase 5</p>
            <h3 className="text-xl font-bold text-white">Explore Agricultural Training</h3>
            <p className="text-white/60 text-sm mt-1">Find courses and certifications matched to your crop and farming method</p>
          </div>
          <button
            id="cta-training-hub"
            onClick={() => { setCurrentPhase(5); navigate('/training-hub'); }}
            className="relative z-10 flex-shrink-0 bg-white text-agri-dark font-bold text-sm px-6 py-3 rounded-xl
              hover:bg-agri-lime transition-colors whitespace-nowrap"
          >
            View Courses →
          </button>
        </div>
      </main>
    </div>
  );
};

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-agri-bg rounded-xl p-4 text-center">
    <span className="flex items-center justify-center mb-1">{icon}</span>
    <p className="text-[10px] text-agri-subtext uppercase tracking-wide font-medium">{label}</p>
    <p className="text-sm font-bold text-agri-text mt-0.5">{value}</p>
  </div>
);

export default AnalyticsDashboard;
