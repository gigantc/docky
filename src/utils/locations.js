export const DEFAULT_LOCATIONS = [
  { id: 'chandler', name: 'Chandler, AZ', lat: 33.3062, lon: -111.8413 },
  { id: 'sheboygan', name: 'Sheboygan, WI', lat: 43.7508, lon: -87.7145 },
]

export const DEFAULT_LOCATION_ID = 'chandler'
const STORAGE_KEY = 'dock.locations'

export function loadLocations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LOCATIONS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_LOCATIONS
    const valid = parsed.filter((loc) => (
      loc && loc.id && loc.name && typeof loc.lat === 'number' && typeof loc.lon === 'number'
    ))
    return valid.length > 0 ? valid : DEFAULT_LOCATIONS
  } catch {
    return DEFAULT_LOCATIONS
  }
}

export function saveLocations(locations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
}

export function getLocationById(locations, id) {
  return locations.find((loc) => loc.id === id) || locations[0] || DEFAULT_LOCATIONS[0]
}

export function createLocationId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${slug}-${Date.now().toString(36)}`
}
