/**
 * currencies.js — Frontend mirror of backend/config/currencies.js
 * Keep in sync with the backend config.
 */

export const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee',        symbol: '₹',   flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar',            symbol: '$',   flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',                 symbol: '€',   flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',        symbol: '£',   flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',         symbol: '¥',   flag: '🇯🇵' },
  { code: 'AED', name: 'UAE Dirham',           symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar',     symbol: 'S$',  flag: '🇸🇬' },
  { code: 'CAD', name: 'Canadian Dollar',      symbol: 'C$',  flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',    symbol: 'A$',  flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc',          symbol: '₣',   flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan',         symbol: '¥',   flag: '🇨🇳' },
  { code: 'MYR', name: 'Malaysian Ringgit',    symbol: 'RM',  flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht',            symbol: '฿',   flag: '🇹🇭' },
  { code: 'SAR', name: 'Saudi Riyal',          symbol: '﷼',   flag: '🇸🇦' },
  { code: 'HKD', name: 'Hong Kong Dollar',     symbol: 'HK$', flag: '🇭🇰' },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c]));

export const EXCHANGE_RATES_TO_INR = {
  INR: 1, USD: 83.50, EUR: 90.20, GBP: 105.80, JPY: 0.56,
  AED: 22.73, SGD: 62.40, CAD: 61.20, AUD: 54.30, CHF: 94.10,
  CNY: 11.50, MYR: 18.80, THB: 2.35, SAR: 22.27, HKD: 10.70,
};

export const getCurrencySymbol = (code) => CURRENCY_MAP[code]?.symbol ?? code;

export const getCurrency = (code) => CURRENCY_MAP[code];

export const formatAmount = (amount, currencyCode = 'INR') => {
  const symbol = getCurrencySymbol(currencyCode);
  const decimals = currencyCode === 'JPY' ? 0 : 2;
  return `${symbol}${Number(amount).toFixed(decimals)}`;
};

export const convertToINR = (amount, currencyCode) => {
  const rate = EXCHANGE_RATES_TO_INR[currencyCode] ?? 1;
  return parseFloat((amount * rate).toFixed(2));
};

export const formatINR = (amount) => `₹${Number(amount).toFixed(2)}`;
