/**
 * Official Agricultural & Geographic Data for Sri Lanka's 25 Administrative Districts.
 * Source: Department of Agriculture (DOA) & Natural Resources Management Centre (NRMC), Sri Lanka.
 */

export interface DistrictMetadata {
  district: string;
  province: string;
  agro_ecological_zone: string;
  default_soil_type: string;
  avg_annual_rainfall_mm: number;
}

export const SRI_LANKA_DISTRICTS: Record<string, DistrictMetadata> = {
  'badulla': {
    district: 'Badulla',
    province: 'Uva',
    agro_ecological_zone: 'UCIZ (Up Country Intermediate)',
    default_soil_type: 'Red-Yellow Podzolic',
    avg_annual_rainfall_mm: 1800,
  },
  'nuwara eliya': {
    district: 'Nuwara Eliya',
    province: 'Central',
    agro_ecological_zone: 'UCWZ (Up Country Wet)',
    default_soil_type: 'Red-Yellow Podzolic & Latosolic',
    avg_annual_rainfall_mm: 2200,
  },
  'kandy': {
    district: 'Kandy',
    province: 'Central',
    agro_ecological_zone: 'MCWZ (Mid Country Wet)',
    default_soil_type: 'Red-Yellow Podzolic & RBL',
    avg_annual_rainfall_mm: 2000,
  },
  'matale': {
    district: 'Matale',
    province: 'Central',
    agro_ecological_zone: 'MCIZ (Mid Country Intermediate)',
    default_soil_type: 'Reddish Brown Latosolic',
    avg_annual_rainfall_mm: 1650,
  },
  'anuradhapura': {
    district: 'Anuradhapura',
    province: 'North Central',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL1)',
    default_soil_type: 'Reddish Brown Earths (RBE)',
    avg_annual_rainfall_mm: 1280,
  },
  'polonnaruwa': {
    district: 'Polonnaruwa',
    province: 'North Central',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL1)',
    default_soil_type: 'Reddish Brown Earths & LHG',
    avg_annual_rainfall_mm: 1500,
  },
  'kurunegala': {
    district: 'Kurunegala',
    province: 'North Western',
    agro_ecological_zone: 'LCIZ (Low Country Intermediate)',
    default_soil_type: 'Red-Yellow Podzolic & RBE',
    avg_annual_rainfall_mm: 1600,
  },
  'puttalam': {
    district: 'Puttalam',
    province: 'North Western',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL3)',
    default_soil_type: 'Sandy Regosols & Latosols',
    avg_annual_rainfall_mm: 1100,
  },
  'jaffna': {
    district: 'Jaffna',
    province: 'Northern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL3)',
    default_soil_type: 'Calcic Red-Yellow Latosols',
    avg_annual_rainfall_mm: 1200,
  },
  'kilinochchi': {
    district: 'Kilinochchi',
    province: 'Northern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL3)',
    default_soil_type: 'Red-Yellow Latosols & Alluvial',
    avg_annual_rainfall_mm: 1250,
  },
  'mannar': {
    district: 'Mannar',
    province: 'Northern',
    agro_ecological_zone: 'LCAD (Low Country Arid - DL4)',
    default_soil_type: 'Grumusols & Sandy Regosols',
    avg_annual_rainfall_mm: 980,
  },
  'vavuniya': {
    district: 'Vavuniya',
    province: 'Northern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL1)',
    default_soil_type: 'Reddish Brown Earths',
    avg_annual_rainfall_mm: 1400,
  },
  'mullaitivu': {
    district: 'Mullaitivu',
    province: 'Northern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL1/DL3)',
    default_soil_type: 'Reddish Brown Earths & Regosols',
    avg_annual_rainfall_mm: 1350,
  },
  'batticaloa': {
    district: 'Batticaloa',
    province: 'Eastern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL2)',
    default_soil_type: 'Sandy Regosols & Alluvial',
    avg_annual_rainfall_mm: 1600,
  },
  'ampara': {
    district: 'Ampara',
    province: 'Eastern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL2)',
    default_soil_type: 'Noncalcic Brown & Low Humic Gley',
    avg_annual_rainfall_mm: 1550,
  },
  'trincomalee': {
    district: 'Trincomalee',
    province: 'Eastern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL1)',
    default_soil_type: 'Reddish Brown Earths & NCB',
    avg_annual_rainfall_mm: 1500,
  },
  'colombo': {
    district: 'Colombo',
    province: 'Western',
    agro_ecological_zone: 'LCWZ (Low Country Wet - WL1)',
    default_soil_type: 'Red-Yellow Podzolic & Laterite',
    avg_annual_rainfall_mm: 2400,
  },
  'gampaha': {
    district: 'Gampaha',
    province: 'Western',
    agro_ecological_zone: 'LCWZ (Low Country Wet - WL1)',
    default_soil_type: 'Red-Yellow Podzolic',
    avg_annual_rainfall_mm: 2200,
  },
  'kalutara': {
    district: 'Kalutara',
    province: 'Western',
    agro_ecological_zone: 'LCWZ (Low Country Wet - WL1/WL2)',
    default_soil_type: 'Red-Yellow Podzolic & Bog Soils',
    avg_annual_rainfall_mm: 2900,
  },
  'galle': {
    district: 'Galle',
    province: 'Southern',
    agro_ecological_zone: 'LCWZ (Low Country Wet - WL1/WL2)',
    default_soil_type: 'Red-Yellow Podzolic',
    avg_annual_rainfall_mm: 2500,
  },
  'matara': {
    district: 'Matara',
    province: 'Southern',
    agro_ecological_zone: 'LCWZ (Low Country Wet - WL1/IL1)',
    default_soil_type: 'Red-Yellow Podzolic & Alluvial',
    avg_annual_rainfall_mm: 2100,
  },
  'hambantota': {
    district: 'Hambantota',
    province: 'Southern',
    agro_ecological_zone: 'LCDZ (Low Country Dry - DL5)',
    default_soil_type: 'Reddish Brown Earths & Grumusols',
    avg_annual_rainfall_mm: 1050,
  },
  'monaragala': {
    district: 'Monaragala',
    province: 'Uva',
    agro_ecological_zone: 'LCIZ (Low Country Intermediate - IL2)',
    default_soil_type: 'Reddish Brown Earths & Immature Loams',
    avg_annual_rainfall_mm: 1550,
  },
  'ratnapura': {
    district: 'Ratnapura',
    province: 'Sabaragamuwa',
    agro_ecological_zone: 'MCWZ (Mid Country Wet - WM1)',
    default_soil_type: 'Red-Yellow Podzolic',
    avg_annual_rainfall_mm: 3500,
  },
  'kegalle': {
    district: 'Kegalle',
    province: 'Sabaragamuwa',
    agro_ecological_zone: 'MCWZ (Mid Country Wet - WM1)',
    default_soil_type: 'Red-Yellow Podzolic & Latosolic',
    avg_annual_rainfall_mm: 2800,
  },
};

/**
 * Enriches a location object with default agricultural parameters if missing or empty.
 */
export function getEnrichedLocation<T extends { district_name?: string; province?: string; agro_ecological_zone?: string | null; default_soil_type?: string | null; avg_annual_rainfall_mm?: number | null }>(
  loc: T | null | undefined
): T | null {
  if (!loc || !loc.district_name) return loc ?? null;

  const key = loc.district_name.toLowerCase().trim();
  const meta = SRI_LANKA_DISTRICTS[key];
  if (!meta) return loc;

  return {
    ...loc,
    province: (!loc.province || loc.province === 'Sri Lanka') ? meta.province : loc.province,
    agro_ecological_zone: loc.agro_ecological_zone?.trim() ? loc.agro_ecological_zone : meta.agro_ecological_zone,
    default_soil_type: loc.default_soil_type?.trim() ? loc.default_soil_type : meta.default_soil_type,
    avg_annual_rainfall_mm: loc.avg_annual_rainfall_mm ? loc.avg_annual_rainfall_mm : meta.avg_annual_rainfall_mm,
  };
}
