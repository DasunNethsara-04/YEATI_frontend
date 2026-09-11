import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/axios';
import { type PlanRecommendation, type RecommendationResponse, type UserInputs } from '../context/PlanContext';
import { getCropImageUrl } from '../utils/cropImages';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Scale,
  ArrowRight,
  ShieldCheck,
  Info,
  Loader2,
  Maximize2
} from 'lucide-react';

interface SmartRecommendationSectionProps {
  districtName: string;
  userInputs: UserInputs;
  setUserInputs: (inputs: UserInputs) => void;
  onAdoptPlan: (rec: PlanRecommendation) => void;
}

export const SmartRecommendationSection: React.FC<SmartRecommendationSectionProps> = ({
  districtName,
  userInputs,
  setUserInputs,
  onAdoptPlan,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'AFFORDABLE' | 'HIGH_ROI' | 'OPEN_FIELD' | 'HYDROPONICS' | 'ORGANIC'>('ALL');

  // Input states
  const [capital, setCapital] = useState<number>(userInputs.capital_lkr || 250000);
  const [areaValue, setAreaValue] = useState<string>(userInputs.area_value ? String(userInputs.area_value) : '1');
  const [areaUnit, setAreaUnit] = useState<string>(userInputs.area_unit || 'acres');

  const fetchRecommendations = useCallback(async (cap: number, area: string, unit: string) => {
    if (!districtName) return;
    setLoading(true);
    setError(null);
    try {
      const parsedArea = parseFloat(area);
      const res = await api.post<RecommendationResponse>('/analytics/recommend-plan', {
        district: districtName,
        capital_lkr: cap,
        area_value: !isNaN(parsedArea) && parsedArea > 0 ? parsedArea : null,
        area_unit: unit,
      });
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError('Could not generate plan recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [districtName]);

  // Initial fetch and on district change
  useEffect(() => {
    if (districtName) {
      fetchRecommendations(capital, areaValue, areaUnit);
    }
  }, [districtName]);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedArea = parseFloat(areaValue);
    setUserInputs({
      ...userInputs,
      capital_lkr: capital,
      area_value: !isNaN(parsedArea) && parsedArea > 0 ? parsedArea : userInputs.area_value,
      area_unit: areaUnit as any,
    });
    fetchRecommendations(capital, areaValue, areaUnit);
  };

  // Filter recommendations based on active tab
  const allRecs = data?.recommendations || [];
  const filteredRecs = allRecs.filter(rec => {
    if (filterTab === 'AFFORDABLE') return rec.can_afford;
    if (filterTab === 'HIGH_ROI') return rec.projected_metrics.roi_pct >= 200;
    if (filterTab === 'OPEN_FIELD') return rec.method_type === 'OPEN_FIELD';
    if (filterTab === 'HYDROPONICS') return rec.method_type === 'HYDROPONICS';
    if (filterTab === 'ORGANIC') return rec.method_type === 'ORGANIC';
    return true;
  });

  const affordableCount = allRecs.filter(r => r.can_afford).length;

  return (
    <section className="bg-gradient-to-b from-white to-agri-bg/50 border border-agri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-primary/10 border border-agri-primary/20 text-agri-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            AI Plan Advisor
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-agri-text">
            Capital & Land Area Recommendation
          </h2>
          <p className="text-sm text-agri-subtext mt-1 max-w-2xl">
            Enter your available budget and/or land size. The system calculates safe, affordable plot extents to prevent over-investment and recommends the most viable crops for {districtName}.
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-2xl flex-shrink-0">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{affordableCount} of {allRecs.length} plans 100% affordable</span>
          </div>
        )}
      </div>

      {/* Input Controls Form */}
      <form onSubmit={handleAnalyze} className="bg-white rounded-2xl border border-agri-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Capital Input */}
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="rec-capital" className="block text-xs font-bold uppercase tracking-wider text-agri-subtext">
              Available Capital (LKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-agri-subtext">Rs.</span>
              <input
                id="rec-capital"
                type="number"
                min={1000}
                step={5000}
                value={capital || ''}
                onChange={e => setCapital(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 250000"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-agri-border bg-agri-bg text-agri-text
                  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary transition-colors"
                required
              />
            </div>
            <span className="text-[11px] text-agri-subtext">Your total investment budget</span>
          </div>

          {/* Land Area Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label htmlFor="rec-area" className="block text-xs font-bold uppercase tracking-wider text-agri-subtext">
              Available Land Area (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="rec-area"
                type="number"
                min={0}
                step={0.05}
                value={areaValue}
                onChange={e => setAreaValue(e.target.value)}
                placeholder="e.g. 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-agri-border bg-agri-bg text-agri-text
                  text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-agri-primary/30 focus:border-agri-primary transition-colors"
              />
              <select
                aria-label="Land measurement unit"
                value={areaUnit}
                onChange={e => setAreaUnit(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-agri-border bg-white text-agri-text text-xs font-semibold focus:outline-none focus:border-agri-primary"
              >
                <option value="acres">Acres</option>
                <option value="perches">Perches</option>
                <option value="roods">Roods</option>
                <option value="sq_m">m²</option>
              </select>
            </div>
            <span className="text-[11px] text-agri-subtext">Leave blank to find max affordable land</span>
          </div>

          {/* Action Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading || capital <= 0}
              className="w-full flex items-center justify-center gap-2 bg-agri-primary hover:bg-agri-dark text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors shadow-md shadow-agri-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  Analyze & Match
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Filter Tabs */}
      {data && allRecs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `All Viable (${allRecs.length})` },
            { id: 'AFFORDABLE', label: `100% Affordable (${affordableCount})`, icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> },
            { id: 'HIGH_ROI', label: 'High ROI (>200%)', icon: <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> },
            { id: 'OPEN_FIELD', label: 'Open Field' },
            { id: 'HYDROPONICS', label: 'Hydroponics' },
            { id: 'ORGANIC', label: 'Organic' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                filterTab === tab.id
                  ? 'bg-agri-dark text-white shadow-sm'
                  : 'bg-white border border-agri-border text-agri-subtext hover:text-agri-text hover:bg-agri-bg'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Recommendations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white border border-agri-border rounded-2xl p-5 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-agri-border/60" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-agri-border/60 rounded" />
                  <div className="h-3 w-16 bg-agri-border/40 rounded" />
                </div>
              </div>
              <div className="h-16 bg-agri-border/30 rounded-xl" />
              <div className="h-10 bg-agri-border/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredRecs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecs.map((rec) => {
            const cropImg = getCropImageUrl(rec.crop_name) || '/vegetables/Tomato.jpg';
            const isAffordable = rec.can_afford;
            const isModerate = rec.affordability_status === 'MODERATE_SHORTFALL';

            return (
              <div
                key={`${rec.crop_id}-${rec.method_type}`}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isAffordable
                    ? 'border-emerald-200 hover:border-emerald-400'
                    : isModerate
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-red-200 hover:border-red-400 opacity-90'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Top crop info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={cropImg}
                        alt={rec.crop_name}
                        className="h-14 w-14 rounded-xl object-cover border border-agri-border shadow-inner"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-agri-text">{rec.crop_name}</h3>
                          {rec.is_mvp_recommended && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-agri-lime text-agri-dark">
                              Top Pick
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-agri-subtext">
                          {rec.crop_name_si} · {rec.growing_cycle_days} days
                        </p>
                      </div>
                    </div>

                    {/* Method badge */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        rec.method_type === 'OPEN_FIELD'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.method_type === 'HYDROPONICS'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rec.method_type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Affordability Status Banner */}
                  <div
                    className={`rounded-xl p-3 text-xs space-y-1.5 ${
                      isAffordable
                        ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-800'
                        : isModerate
                        ? 'bg-amber-50/70 border border-amber-200 text-amber-800'
                        : 'bg-red-50/70 border border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {isAffordable ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                        {isAffordable
                          ? '100% Within Budget'
                          : isModerate
                          ? 'Scale-Down Recommended'
                          : 'Over-Investment Risk'}
                      </span>
                      <span>
                        {rec.required_opex > 0 ? `Cost: Rs. ${rec.required_opex.toLocaleString()}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {rec.advice}
                    </p>
                  </div>

                  {/* Land Size Recommendation Callout */}
                  <div className="bg-agri-bg/60 rounded-xl p-3 border border-agri-border/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-agri-subtext font-medium flex items-center gap-1">
                        <Maximize2 className="h-3 w-3 text-agri-primary" />
                        Max Affordable Land:
                      </span>
                      <span className="font-bold text-agri-text">
                        {rec.max_affordable_land.acres} Acres ({rec.max_affordable_land.perches} Perches)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-agri-subtext">
                      <span>Standard Cost / Acre:</span>
                      <span className="font-semibold text-agri-text">Rs. {rec.cost_per_acre.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Projected Financial Return */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-white rounded-lg p-2 border border-agri-border">
                      <p className="text-[10px] text-agri-subtext uppercase font-semibold">Est. Net Profit</p>
                      <p className="font-bold text-emerald-700 mt-0.5">
                        Rs. {Math.max(0, rec.projected_metrics.net_profit_rs).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-agri-border">
                      <p className="text-[10px] text-agri-subtext uppercase font-semibold">Expected ROI</p>
                      <p className="font-bold text-blue-700 mt-0.5">
                        +{rec.projected_metrics.roi_pct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => onAdoptPlan(rec)}
                    className="w-full flex items-center justify-center gap-2 bg-agri-dark hover:bg-agri-primary text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    Adopt This Plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-agri-border space-y-2">
          <Info className="h-8 w-8 text-agri-subtext mx-auto" />
          <p className="text-sm font-semibold text-agri-text">No recommendations match the active filter</p>
          <p className="text-xs text-agri-subtext">Try selecting "All Viable" or adjusting your capital input.</p>
        </div>
      )}
    </section>
  );
};
