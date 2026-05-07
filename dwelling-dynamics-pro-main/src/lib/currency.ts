export const CURRENCIES = {
  KES: { symbol: "KES", name: "Kenyan Shilling", locale: "en-KE" },
  UGX: { symbol: "UGX", name: "Ugandan Shilling", locale: "en-UG" },
  TZS: { symbol: "TZS", name: "Tanzanian Shilling", locale: "en-TZ" },
  RWF: { symbol: "RWF", name: "Rwandan Franc", locale: "en-RW" },
  USD: { symbol: "USD", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "EUR", name: "Euro", locale: "en-IE" },
  GBP: { symbol: "GBP", name: "British Pound", locale: "en-GB" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatCurrency(amount: number, currency: CurrencyCode = "KES"): string {
  const config = CURRENCIES[currency] ?? CURRENCIES.KES;
  return `${config.symbol} ${amount.toLocaleString(config.locale)}`;
}

export const CURRENCY_OPTIONS = Object.entries(CURRENCIES).map(([code, c]) => ({
  value: code,
  label: `${code} — ${c.name}`,
}));
