export interface GeoCoords {
  latitude: number
  longitude: number
}

/** Tolerance radius (meters) for matching a company location on check-in. */
export const LOCATION_RADIUS_METERS = 100

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation
}

/** Resolve the current device position, or reject on unsupported/denied/timeout. */
export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise<GeoCoords>((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  })
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radius = LOCATION_RADIUS_METERS,
): boolean {
  return haversineMeters(lat1, lng1, lat2, lng2) <= radius
}
