// Open-Meteo current weather — no API key required.
// Docs: https://open-meteo.com/en/docs

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export async function fetchCurrentWeather({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '1',
  })
  const res = await fetch(`${ENDPOINT}?${params.toString()}`)
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
  const data = await res.json()
  const c = data.current || {}
  const d = data.daily || {}
  return {
    temperature: typeof c.temperature_2m === 'number' ? Math.round(c.temperature_2m) : null,
    windSpeed: typeof c.wind_speed_10m === 'number' ? Math.round(c.wind_speed_10m) : null,
    weatherCode: typeof c.weather_code === 'number' ? c.weather_code : null,
    high: Array.isArray(d.temperature_2m_max) && d.temperature_2m_max[0] != null
      ? Math.round(d.temperature_2m_max[0]) : null,
    low: Array.isArray(d.temperature_2m_min) && d.temperature_2m_min[0] != null
      ? Math.round(d.temperature_2m_min[0]) : null,
  }
}

// Pick a descriptive icon key from WMO weather_code + wind speed.
// Wind takes priority when sustained winds are strong.
export function iconKeyFor({ weatherCode, windSpeed }) {
  if (typeof windSpeed === 'number' && windSpeed >= 15) return 'wind'

  const code = weatherCode
  if (code == null) return 'cloud'
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'cloud-sun'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'cloud-fog'
  if (code >= 51 && code <= 57) return 'cloud-drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'cloud-rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cloud-snow'
  if (code >= 95 && code <= 99) return 'cloud-lightning'
  return 'cloud'
}

export function conditionLabel({ weatherCode, windSpeed }) {
  if (typeof windSpeed === 'number' && windSpeed >= 15) return 'Windy'

  const code = weatherCode
  if (code == null) return '—'
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mainly Clear'
  if (code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Foggy'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rainy'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code === 85 || code === 86) return 'Snow Showers'
  if (code >= 95 && code <= 99) return 'Thunderstorms'
  return '—'
}
