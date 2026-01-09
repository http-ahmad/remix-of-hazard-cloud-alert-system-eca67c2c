
/**
 * Chemical database with properties relevant for hazard modeling
 * Based on ALOHA chemical properties database
 */

export interface ChemicalProperties {
  name: string;
  cas: string; // Chemical Abstracts Service registry number
  molecularWeight: number; // g/mol
  boilingPoint: number; // Celsius
  vaporPressure: number; // mmHg at 20°C
  specificGravity: number; // relative to water
  waterSolubility: string; // qualitative description
  idlh: number; // Immediately Dangerous to Life or Health (ppm)
  lel: number; // Lower Explosive Limit (% by volume)
  uel: number; // Upper Explosive Limit (% by volume)
  aegl1: number; // Acute Exposure Guideline Level 1 (ppm, 60 min)
  aegl2: number; // Acute Exposure Guideline Level 2 (ppm, 60 min)
  aegl3: number; // Acute Exposure Guideline Level 3 (ppm, 60 min)
  erpg1?: number; // Emergency Response Planning Guideline 1 (ppm)
  erpg2?: number; // Emergency Response Planning Guideline 2 (ppm)
  erpg3?: number; // Emergency Response Planning Guideline 3 (ppm)
  description: string;
  hazards: string[];
  color: string; // Color for UI representation
}

export const chemicalDatabase: Record<string, ChemicalProperties> = {
  "chlorine": {
    name: "Chlorine",
    cas: "7782-50-5",
    molecularWeight: 70.91,
    boilingPoint: -34.04,
    vaporPressure: 5168,
    specificGravity: 1.41,
    waterSolubility: "Slightly soluble",
    idlh: 10,
    lel: 0,
    uel: 0,
    aegl1: 0.5,
    aegl2: 2.0,
    aegl3: 20.0,
    erpg1: 1,
    erpg2: 3,
    erpg3: 20,
    description: "Greenish-yellow gas with a pungent, irritating odor. Common industrial chemical used in water treatment and manufacturing.",
    hazards: ["Respiratory irritant", "Oxidizer", "Environmental hazard"],
    color: "#c5e17a"
  },
  "ammonia": {
    name: "Ammonia",
    cas: "7664-41-7",
    molecularWeight: 17.03,
    boilingPoint: -33.34,
    vaporPressure: 6870,
    specificGravity: 0.682,
    waterSolubility: "Very soluble",
    idlh: 300,
    lel: 15,
    uel: 28,
    aegl1: 30,
    aegl2: 160,
    aegl3: 1100,
    erpg1: 25,
    erpg2: 150,
    erpg3: 750,
    description: "Colorless gas with a strong, pungent odor. Used in fertilizers, refrigeration, and manufacturing.",
    hazards: ["Respiratory irritant", "Corrosive", "Flammable at high concentrations"],
    color: "#e0f7fa"
  },
  "hydrogen sulfide": {
    name: "Hydrogen Sulfide",
    cas: "7783-06-4",
    molecularWeight: 34.08,
    boilingPoint: -60.33,
    vaporPressure: 15600,
    specificGravity: 0.92,
    waterSolubility: "Moderately soluble",
    idlh: 100,
    lel: 4,
    uel: 44,
    aegl1: 0.51,
    aegl2: 27,
    aegl3: 50,
    description: "Colorless gas with a strong rotten egg odor. Occurs naturally and in industrial processes.",
    hazards: ["Respiratory irritant", "Neurotoxic", "Flammable", "Odor fatigue risk"],
    color: "#bca389"
  },
  "sulfur dioxide": {
    name: "Sulfur Dioxide",
    cas: "7446-09-5",
    molecularWeight: 64.07,
    boilingPoint: -10.0,
    vaporPressure: 2538,
    specificGravity: 1.434,
    waterSolubility: "Very soluble",
    idlh: 100,
    lel: 0,
    uel: 0,
    aegl1: 0.2,
    aegl2: 0.75,
    aegl3: 30,
    description: "Colorless gas with a strong, suffocating odor. Used in food preservation and industrial processes.",
    hazards: ["Respiratory irritant", "Corrosive to tissue", "Environmental hazard"],
    color: "#efe1d1"
  },
  "methane": {
    name: "Methane",
    cas: "74-82-8",
    molecularWeight: 16.04,
    boilingPoint: -161.5,
    vaporPressure: 760000, // Very high vapor pressure
    specificGravity: 0.42,
    waterSolubility: "Slightly soluble",
    idlh: 0, // Asphyxiant
    lel: 5,
    uel: 15,
    aegl1: 0, // Not established
    aegl2: 0, // Not established
    aegl3: 0, // Not established
    description: "Colorless, odorless gas. Main component of natural gas. Primarily an asphyxiation and fire hazard.",
    hazards: ["Asphyxiant", "Highly flammable", "Explosion hazard"],
    color: "#cbe3f8"
  },
  "carbon monoxide": {
    name: "Carbon Monoxide",
    cas: "630-08-0",
    molecularWeight: 28.01,
    boilingPoint: -191.5,
    vaporPressure: 760000, // Very high vapor pressure
    specificGravity: 0.97,
    waterSolubility: "Slightly soluble",
    idlh: 1200,
    lel: 12.5,
    uel: 74,
    aegl1: 0, // Not appropriate
    aegl2: 83,
    aegl3: 330,
    description: "Colorless, odorless gas. Produced by incomplete combustion. Binds to hemoglobin.",
    hazards: ["Asphyxiant", "Hemoglobin binding", "Flammable", "Difficult to detect"],
    color: "#e57373"
  },
  "benzene": {
    name: "Benzene",
    cas: "71-43-2",
    molecularWeight: 78.11,
    boilingPoint: 80.1,
    vaporPressure: 75,
    specificGravity: 0.88,
    waterSolubility: "Slightly soluble",
    idlh: 500,
    lel: 1.2,
    uel: 7.8,
    aegl1: 52,
    aegl2: 800,
    aegl3: 4000,
    description: "Colorless liquid with a sweet odor. Used in manufacturing and as a solvent.",
    hazards: ["Carcinogen", "Central nervous system depressant", "Flammable", "Environmental hazard"],
    color: "#ffecb3"
  },
  "ethylene oxide": {
    name: "Ethylene Oxide",
    cas: "75-21-8",
    molecularWeight: 44.05,
    boilingPoint: 10.4,
    vaporPressure: 1095,
    specificGravity: 0.882,
    waterSolubility: "Very soluble",
    idlh: 800,
    lel: 3,
    uel: 100,
    aegl1: 5,
    aegl2: 45,
    aegl3: 85,
    description: "Colorless gas with a sweet ether-like odor. Used in sterilization and manufacturing.",
    hazards: ["Carcinogen", "Mutagen", "Highly flammable", "Explosive", "Reactive"],
    color: "#b39ddb"
  },
  "hydrogen cyanide": {
    name: "Hydrogen Cyanide",
    cas: "74-90-8",
    molecularWeight: 27.03,
    boilingPoint: 25.6,
    vaporPressure: 630,
    specificGravity: 0.687,
    waterSolubility: "Very soluble",
    idlh: 50,
    lel: 5.6,
    uel: 40,
    aegl1: 1.0,
    aegl2: 7.1,
    aegl3: 15,
    description: "Colorless liquid or gas with bitter almond odor. Used in manufacturing and chemical synthesis.",
    hazards: ["Highly toxic", "Metabolic poison", "Flammable", "Rapid acting"],
    color: "#81d4fa"
  },
  "phosgene": {
    name: "Phosgene",
    cas: "75-44-5",
    molecularWeight: 98.92,
    boilingPoint: 8.3,
    vaporPressure: 1173,
    specificGravity: 1.432,
    waterSolubility: "Reacts with water",
    idlh: 2,
    lel: 0,
    uel: 0,
    aegl1: 0, // Not appropriate
    aegl2: 0.2,
    aegl3: 0.59,
    description: "Colorless gas with a suffocating odor like musty hay. Used in chemical manufacturing.",
    hazards: ["Pulmonary edema", "Delayed effects", "Corrosive", "Chemical weapon history"],
    color: "#d1c4e9"
  }
};

/**
 * Convert between concentration units
 * @param value The concentration value
 * @param chemical The chemical name
 * @param fromUnit Source unit
 * @param toUnit Target unit
 * @returns Converted concentration value
 */
export const convertConcentrationUnit = (
  value: number, 
  chemical: string,
  fromUnit: 'mg/m3' | 'ppm' | 'percent', 
  toUnit: 'mg/m3' | 'ppm' | 'percent'
): number => {
  if (fromUnit === toUnit) return value;
  
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) return value; // If chemical not found, return original value
  
  const molecularWeight = chemData.molecularWeight;
  
  // First convert to mg/m3 as intermediate
  let intermediateMgM3: number;
  
  switch (fromUnit) {
    case 'ppm':
      // Convert from ppm to mg/m3 using: mg/m3 = (ppm × MW) / 24.45
      intermediateMgM3 = (value * molecularWeight) / 24.45;
      break;
    case 'percent':
      // Convert from percent to mg/m3 (1% = 10,000 ppm)
      intermediateMgM3 = (value * 10000 * molecularWeight) / 24.45;
      break;
    case 'mg/m3':
      intermediateMgM3 = value;
      break;
    default:
      return value;
  }
  
  // Then convert from mg/m3 to target unit
  switch (toUnit) {
    case 'ppm':
      // Convert from mg/m3 to ppm using: ppm = (mg/m3 × 24.45) / MW
      return (intermediateMgM3 * 24.45) / molecularWeight;
    case 'percent':
      // Convert from mg/m3 to percent (1% = 10,000 ppm)
      return ((intermediateMgM3 * 24.45) / molecularWeight) / 10000;
    case 'mg/m3':
      return intermediateMgM3;
    default:
      return value;
  }
};

/**
 * Get applicable exposure guidelines for a chemical
 * @param chemical The chemical name
 * @returns Object with exposure guidelines
 */
export const getExposureGuidelines = (chemical: string) => {
  const chemData = chemicalDatabase[chemical.toLowerCase()];
  if (!chemData) return null;
  
  return {
    idlh: chemData.idlh,
    aegl1: chemData.aegl1,
    aegl2: chemData.aegl2,
    aegl3: chemData.aegl3,
    erpg1: chemData.erpg1,
    erpg2: chemData.erpg2,
    erpg3: chemData.erpg3
  };
};

/**
 * Get threshold descriptions for emergency planning
 */
export const getThresholdDescriptions = () => ({
  idlh: "Immediately Dangerous to Life or Health",
  aegl1: "Notable discomfort, irritation, or non-sensory effects. Effects are not disabling and are reversible upon cessation of exposure.",
  aegl2: "Irreversible or other serious, long-lasting adverse health effects or an impaired ability to escape.",
  aegl3: "Life-threatening health effects or death.",
  erpg1: "Maximum concentration with mild, transient health effects.",
  erpg2: "Maximum concentration below which most could be exposed up to 1 hour without serious health effects.",
  erpg3: "Maximum concentration below which most could be exposed up to 1 hour without life-threatening health effects."
});
