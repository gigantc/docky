export const LOCATIONS = [
  { id: 'chandler', name: 'Chandler, AZ', lat: 33.3062, lon: -111.8413 },
  { id: 'sheboygan', name: 'Sheboygan, WI', lat: 43.7508, lon: -87.7145 },
]

export const DEFAULT_LOCATION_ID = 'chandler'

export function getLocationById(id) {
  return LOCATIONS.find((loc) => loc.id === id) || LOCATIONS.find((loc) => loc.id === DEFAULT_LOCATION_ID)
}
