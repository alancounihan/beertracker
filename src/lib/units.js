/**
 * Calculate UK alcohol units
 * Formula: (volume_ml × abv_percent) / 1000
 */
export function calculateUnits(ml, abv) {
  return (ml * abv) / 1000
}

/**
 * Format units to 1 decimal place
 */
export function formatUnits(units) {
  return units.toFixed(1)
}

/**
 * HSE (Ireland) weekly guidelines
 */
export const HSE_GUIDELINES = {
  male: 17,
  female: 11,
}

/**
 * Assess units against guidelines
 */
export function assessUnits(weeklyUnits, gender = 'male') {
  const limit = HSE_GUIDELINES[gender] || HSE_GUIDELINES.male
  const pct = (weeklyUnits / limit) * 100
  if (pct <= 50) return { status: 'good', label: 'Well within guidelines' }
  if (pct <= 80) return { status: 'moderate', label: 'Moderate — keep an eye on it' }
  if (pct <= 100) return { status: 'warning', label: 'Approaching guideline limit' }
  return { status: 'over', label: 'Over HSE weekly guidelines' }
}

/**
 * Common volume presets in ml
 */
export const VOLUME_PRESETS = [
  { label: '330ml', value: 330 },
  { label: '440ml', value: 440 },
  { label: '500ml', value: 500 },
  { label: 'Pint (568ml)', value: 568 },
]
