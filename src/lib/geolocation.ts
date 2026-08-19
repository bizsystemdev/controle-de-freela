import { logError, logInfo, logWarn } from './logger'

export interface GeoCoords {
  latitude: number
  longitude: number
}

/** Tolerance radius (meters) for matching a company location on check-in. */
export const LOCATION_RADIUS_METERS = 500

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation
}

/** Resolve the current device position, or reject on unsupported/denied/timeout. */
export const SIMULATE_COMPANY_LOCATION_KEY = 'debug:simulateCompanyLocation'

export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise<GeoCoords>((resolve, reject) => {
    // Check if simulation flag is set in sessionStorage or localStorage
    let simulateCoordsStr: string | null = null
    try {
      simulateCoordsStr =
        sessionStorage.getItem(SIMULATE_COMPANY_LOCATION_KEY) ||
        localStorage.getItem(SIMULATE_COMPANY_LOCATION_KEY)
    } catch {
      simulateCoordsStr = null
    }

    if (simulateCoordsStr) {
      try {
        const parsed = JSON.parse(simulateCoordsStr) as {
          latitude?: number
          longitude?: number
          lat?: number
          lng?: number
        }
        const latitude = parsed.latitude ?? parsed.lat
        const longitude = parsed.longitude ?? parsed.lng
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          const accuracy = 5 // simulated high accuracy
          logInfo(
            'geo',
            `GPS (Simulado): ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m) [Precisão: ${accuracy.toFixed(1)}m - Simulação Ativa]`,
            { latitude, longitude, accuracy, simulated: true },
          )
          resolve({ latitude, longitude })
          return
        }
      } catch {
        // Fall back to standard position if JSON parse failed
      }
    }

    if (!isGeolocationAvailable()) {
      logError('geo', 'Geolocalização não suportada pelo navegador', {
        hasGeolocation: false,
      })
      reject(new Error('unsupported'))
      return
    }

    logInfo('geo', 'Iniciando captura de localização do dispositivo', {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const accuracy = position.coords.accuracy
        logInfo(
          'geo',
          `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m) [Precisão: ${accuracy.toFixed(1)}m]`,
          {
            latitude,
            longitude,
            accuracy,
          },
        )
        resolve({ latitude, longitude })
      },
      (error) => {
        logError('geo', `Falha ao capturar localização: ${error.message} (Código ${error.code})`, {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.code === error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.code === error.POSITION_UNAVAILABLE,
          TIMEOUT: error.code === error.TIMEOUT,
        })
        reject(error)
      },
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
  const distance = haversineMeters(lat1, lng1, lat2, lng2)
  const within = distance <= radius

  // Detect malformed coordinates so a silent NaN never silently "fails inside"
  // or "passes outside" the radius.
  const coordsValid =
    Number.isFinite(lat1) && Number.isFinite(lng1) && Number.isFinite(lat2) && Number.isFinite(lng2)

  if (!coordsValid) {
    logError('geo', 'Coordenadas inválidas recebidas em isWithinRadius', {
      lat1,
      lng1,
      lat2,
      lng2,
      distance,
      radius,
      within,
    })
  } else {
    const distStr =
      distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`
    const radiusStr = radius >= 1000 ? `${(radius / 1000).toFixed(1)}km` : `${Math.round(radius)}m`

    if (within) {
      logInfo('geo', `DENTRO do raio: ${distStr} de distância (limite ${radiusStr})`, {
        device: { lat: lat1, lng: lng1 },
        company: { lat: lat2, lng: lng2 },
        distanceMeters: Math.round(distance),
        radiusMeters: radius,
        within,
      })
    } else {
      logWarn('geo', `FORA do raio: ${distStr} de distância (limite ${radiusStr})`, {
        device: { lat: lat1, lng: lng1 },
        company: { lat: lat2, lng: lng2 },
        distanceMeters: Math.round(distance),
        radiusMeters: radius,
        within,
      })
    }
  }

  return within
}
