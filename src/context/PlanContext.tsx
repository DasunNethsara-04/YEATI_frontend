/**
 * PlanContext — Shared state for the AgriPiyasa 5-phase farmer wizard.
 * Stores selected location, crop, method, user inputs, and analytics results.
 */
import React, { createContext, useContext, useState } from 'react';
import { getEnrichedLocation } from '../utils/districtData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanLocation {
  id: string;
  district_name: string;
  province: string;
  agro_ecological_zone: string;
  default_soil_type: string | null;
  avg_annual_rainfall_mm: number | null;
}

export interface PlanCrop {
  id: string;
  name_en: string;
  name_si: string;
  category: string;
  growing_cycle_duration_days: number;
  min_soil_ph: number;
  max_soil_ph: number;
  preferred_soil_type: string;
  min_temp_celsius: number;
  max_temp_celsius: number;
  water_requirement_summary: string | null;
  pests_and_diseases: string | null;
  suitable_climate: string | null;
  image_url: string | null;
  suitability?: string;
  suitability_level?: string;
  is_mvp_recommended?: boolean;
}

export interface MethodBenchmark {
  id: string;
  crop_id: string;
  method_type: 'OPEN_FIELD' | 'HYDROPONICS' | 'ORGANIC';
  typical_locations: string;
  avg_yield_kg_per_acre: number;
  total_cost_rs_per_acre: number;
  seed_share_pct: number;
  labour_share_pct: number;
  fertilizer_share_pct: number;
  other_share_pct: number;
  planting_material_desc: string;
  fertilizer_regime_desc: string;
}

export interface UserInputs {
  capital_lkr: number;
  area_value: number;
  area_unit: 'acres' | 'perches' | 'roods' | 'sq_ft' | 'sq_m';
  target_date?: string;
}

export interface AnalyticsResult {
  opex: {
    total_rs: number;
    seed_rs: number;
    labour_rs: number;
    fertilizer_rs: number;
    other_rs: number;
    seed_pct: number;
    labour_pct: number;
    fertilizer_pct: number;
    other_pct: number;
  };
  yield: { estimated_kg: number; avg_yield_per_acre: number };
  revenue: {
    predicted_price_per_kg: number;
    gross_revenue_rs: number;
    net_profit_rs: number;
    roi_pct: number;
    capital_roi_pct?: number;
    profit_margin_pct?: number;
  };
  capital_lkr: number;
  can_afford: boolean;
  capital_surplus_lkr: number;
  climate_prediction: {
    predicted_rainfall_mm: number;
    predicted_avg_temp_c: number;
    predicted_min_temp_c: number;
    predicted_max_temp_c: number;
    harvest_date?: string;
  } | null;
  price_prediction: {
    predicted_price_rs_per_kg: number;
    harvest_date?: string;
    growing_cycle_days?: number;
  } | null;
  harvest?: {
    plant_date: string;
    harvest_date: string;
    growing_cycle_days: number;
  };
}

// Phase indices
export type Phase = 1 | 2 | 3 | 4 | 5;

interface PlanContextValue {
  currentPhase: Phase;
  setCurrentPhase: (p: Phase) => void;

  selectedLocation: PlanLocation | null;
  setSelectedLocation: (l: PlanLocation | null) => void;

  selectedCrop: PlanCrop | null;
  setSelectedCrop: (c: PlanCrop | null) => void;

  selectedMethod: MethodBenchmark | null;
  setSelectedMethod: (m: MethodBenchmark | null) => void;

  userInputs: UserInputs;
  setUserInputs: (u: UserInputs) => void;

  analyticsResult: AnalyticsResult | null;
  setAnalyticsResult: (r: AnalyticsResult | null) => void;

  resetPlan: () => void;
}

// ─── Default inputs & storage ──────────────────────────────────────────────────
const STORAGE_KEY = 'agripiyasa_farmer_plan_v1';

const DEFAULT_INPUTS: UserInputs = {
  capital_lkr: 250000,
  area_value: 1,
  area_unit: 'acres',
};

const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('yeati_farmer_plan_v1');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = getInitialState();

  const [currentPhase, setCurrentPhase] = useState<Phase>(initial?.currentPhase ?? 1);
  const [selectedLocation, setSelectedLocationState] = useState<PlanLocation | null>(() => getEnrichedLocation(initial?.selectedLocation));
  const [selectedCrop, setSelectedCrop] = useState<PlanCrop | null>(initial?.selectedCrop ?? null);
  const [selectedMethod, setSelectedMethod] = useState<MethodBenchmark | null>(initial?.selectedMethod ?? null);
  const [userInputs, setUserInputs] = useState<UserInputs>(initial?.userInputs ?? DEFAULT_INPUTS);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsResult | null>(initial?.analyticsResult ?? null);

  const setSelectedLocation = (loc: PlanLocation | null) => {
    setSelectedLocationState(getEnrichedLocation(loc));
  };

  // Sync with localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentPhase,
          selectedLocation,
          selectedCrop,
          selectedMethod,
          userInputs,
          analyticsResult,
        })
      );
    } catch {
      // Ignore write errors
    }
  }, [currentPhase, selectedLocation, selectedCrop, selectedMethod, userInputs, analyticsResult]);

  const resetPlan = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore removal error
    }
    setCurrentPhase(1);
    setSelectedLocationState(null);
    setSelectedCrop(null);
    setSelectedMethod(null);
    setUserInputs(DEFAULT_INPUTS);
    setAnalyticsResult(null);
  };

  return (
    <PlanContext.Provider value={{
      currentPhase, setCurrentPhase,
      selectedLocation, setSelectedLocation,
      selectedCrop, setSelectedCrop,
      selectedMethod, setSelectedMethod,
      userInputs, setUserInputs,
      analyticsResult, setAnalyticsResult,
      resetPlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextValue => {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within <PlanProvider>');
  return ctx;
};
