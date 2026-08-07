/**
 * VentureIQ Currency Configuration & Utility
 * Centralized source of truth for dynamic Indian Rupee (INR / ₹) formatting.
 */

export const CURRENCY_CONFIG = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  rateVsUSD: 83.5, // 1 USD = 83.5 INR conversion rate
};

/**
 * Parses numeric value from any string format:
 * Examples: "$8.5M", "$8.5M Post-money", "$71,000/mo", "50K", "₹70 Cr", "₹59 L"
 * Returns raw numeric value in base units.
 */
export function parseAmount(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;

  let raw = String(val).trim();
  // Strip common frequency suffixes
  raw = raw.replace(/\/mo(nth)?/gi, '').replace(/\/year|yr/gi, '');
  let uppercaseStr = raw.toUpperCase();

  // Determine multiplier based on units present anywhere in the string
  let multiplier = 1;
  let isINRUnit = false;

  if (/\bCR\b|\bCRORE\b|\bCRORES\b/i.test(raw)) {
    multiplier = 10000000; // 1 Crore = 10,000,000
    isINRUnit = true;
  } else if (/\bL\b|\bLAKH\b|\bLAKHS\b|\bLACH\b/i.test(raw)) {
    multiplier = 100000; // 1 Lakh = 100,000
    isINRUnit = true;
  } else if (/\bB\b|\bBN\b|\bBILLION\b/i.test(raw)) {
    multiplier = 1000000000; // 1 Billion = 1,000,000,000
  } else if (/\bM\b|\bMN\b|\bMILLION\b/i.test(raw)) {
    multiplier = 1000000; // 1 Million = 1,000,000
  } else if (/\bK\b|\bTHOUSAND\b/i.test(raw)) {
    multiplier = 1000; // 1 Thousand = 1,000
  }

  // Extract the first clean floating point number in the string
  const match = raw.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return 0;

  const cleanNum = parseFloat(match[0]);
  if (isNaN(cleanNum)) return 0;

  const baseVal = cleanNum * multiplier;

  // If the unit was already in Crores/Lakhs (INR base), adjust so it's not double converted from USD
  if (isINRUnit) {
    return baseVal / CURRENCY_CONFIG.rateVsUSD;
  }

  return baseVal;
}

/**
 * Formats any number or financial string into formatted Indian Rupees (₹) in Lakhs (L) or Crores (Cr).
 * 
 * Examples:
 * - "$8.5M" -> ₹70.98 Cr
 * - "$71,000" -> ₹59.29 L
 * - "$25,000" -> ₹20.88 L
 * - "71000" -> ₹59.29 L
 */
export function formatCurrency(val, options = {}) {
  if (val === null || val === undefined || val === '') return '';

  let {
    convertFromUSD = true,
    compact = true, // Default to true so all large amounts format in Lakhs / Crores
    suffix = '',
    showSymbol = true,
  } = options;

  if (suffix === '/mo') suffix = '/month';

  let rawStr = String(val).replace(/\/mo\b/gi, '/month');
  const isUSD = rawStr.includes('$') || convertFromUSD;

  // Extract base numeric value in USD
  let baseAmountUSD = parseAmount(val);
  if (baseAmountUSD === 0 && rawStr !== '0' && rawStr !== '$0') {
    return rawStr; // Fallback to raw string if unparseable
  }

  // Convert USD base to INR
  let inrAmount = isUSD ? baseAmountUSD * CURRENCY_CONFIG.rateVsUSD : baseAmountUSD;

  const symbol = showSymbol ? CURRENCY_CONFIG.symbol : '';

  if (compact) {
    if (inrAmount >= 10000000) { // >= 1 Crore (10 Million INR)
      const crVal = (inrAmount / 10000000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
      return `${symbol}${crVal} Cr${suffix}`;
    } else if (inrAmount >= 100000) { // >= 1 Lakh (100,000 INR)
      const lakhVal = (inrAmount / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
      return `${symbol}${lakhVal} L${suffix}`;
    } else if (inrAmount >= 1000) {
      const kVal = (inrAmount / 1000).toFixed(1).replace(/\.0$/, '');
      return `${symbol}${kVal}K${suffix}`;
    }
  }

  // Standard Indian number formatting
  const formattedNum = Math.round(inrAmount).toLocaleString('en-IN');
  return `${symbol}${formattedNum}${suffix}`;
}

export function getCurrencySymbol() {
  return CURRENCY_CONFIG.symbol;
}

export default {
  CURRENCY_CONFIG,
  formatCurrency,
  parseAmount,
  getCurrencySymbol,
};
