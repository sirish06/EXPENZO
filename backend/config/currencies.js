/**
 * currencies.js — Static currency config
 *
 * Base currency: INR
 * Exchange rates represent how many INR 1 unit of each currency equals.
 * Last updated: April 2025 (approximate mid-market rates)
 */

const CURRENCIES = [
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

// Static exchange rates: 1 unit of currency → INR
const EXCHANGE_RATES_TO_INR = {
  INR: 1,
  USD: 83.50,
  EUR: 90.20,
  GBP: 105.80,
  JPY: 0.56,
  AED: 22.73,
  SGD: 62.40,
  CAD: 61.20,
  AUD: 54.30,
  CHF: 94.10,
  CNY: 11.50,
  MYR: 18.80,
  THB: 2.35,
  SAR: 22.27,
  HKD: 10.70,
};

const CURRENCY_CODES = CURRENCIES.map(c => c.code);

/**
 * Converts an amount from the given currency to INR.
 */
const convertToINR = (amount, currencyCode) => {
  const rate = EXCHANGE_RATES_TO_INR[currencyCode] ?? 1;
  return parseFloat((amount * rate).toFixed(2));
};

/**
 * Converts an INR amount to the target currency.
 */
const convertFromINR = (amountINR, targetCurrencyCode) => {
  const rate = EXCHANGE_RATES_TO_INR[targetCurrencyCode] ?? 1;
  return parseFloat((amountINR / rate).toFixed(2));
};

/**
 * Returns the symbol for a given currency code.
 */
const getCurrencySymbol = (code) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : code;
};

module.exports = { CURRENCIES, EXCHANGE_RATES_TO_INR, CURRENCY_CODES, convertToINR, convertFromINR, getCurrencySymbol };
