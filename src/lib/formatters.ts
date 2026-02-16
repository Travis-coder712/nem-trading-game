export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMW(value: number): string {
  return `${Math.round(value)} MW`;
}

export function formatMWh(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)} GWh`;
  }
  return `${Math.round(value)} MWh`;
}

export function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}/MWh`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
