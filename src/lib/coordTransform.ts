/**
 * High-Precision Coordinate Transformation & Navigation Utilities
 * 
 * Supports:
 * - WGS-84 (Global GPS standard) <-> GCJ-02 ("Mars coordinates" used by Chinese map providers like AutoNavi / Gaode)
 * - Haversine distance in meters
 * - Great-circle bearing in degrees (0-360)
 * - Compass direction labels & arrows (in Mongolian)
 */

// Krasovsky 1940 ellipsoid constants
const A_AXIS = 6378245.0; // semi-major axis
const EE = 0.00669342162296594323; // eccentricity squared

/**
 * Check whether coordinates fall outside China territory (where GCJ-02 offset does not apply)
 */
export function isOutOfChina(lat: number, lng: number): boolean {
  if (lng < 72.004 || lng > 137.8347) return true;
  if (lat < 0.8293 || lat > 55.8271) return true;
  // Refined northern boundary across Inner Mongolia / Mongolia border
  if (lng < 118.0 && lat > 43.0) return true;
  return false;
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

/**
 * Convert WGS-84 (Phone GPS) to GCJ-02 (AutoNavi / Gaode / Tencent Map tiles)
 */
export function wgs84ToGcj02(lat: number, lng: number): { lat: number; lng: number } {
  if (isOutOfChina(lat, lng)) {
    return { lat, lng };
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A_AXIS * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((A_AXIS / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}

/**
 * Convert GCJ-02 to WGS-84
 */
export function gcj02ToWgs84(lat: number, lng: number): { lat: number; lng: number } {
  if (isOutOfChina(lat, lng)) {
    return { lat, lng };
  }
  const g = wgs84ToGcj02(lat, lng);
  return { lat: lat * 2 - g.lat, lng: lng * 2 - g.lng };
}

/**
 * Calculate distance in meters between two lat/lng points using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculate Great-Circle bearing from point 1 to point 2 in degrees (0 - 360)
 * 0 = North, 90 = East, 180 = South, 270 = West
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

export interface CompassDirection {
  label: string;
  arrow: string;
  fullLabel: string;
}

/**
 * Translate bearing in degrees to 8-point compass directions in Mongolian
 */
export function getCompassDirection(bearing: number): CompassDirection {
  const normalized = ((bearing % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) {
    return { label: 'Хойшоо', arrow: '↑', fullLabel: 'Хойшоо (N)' };
  } else if (normalized >= 22.5 && normalized < 67.5) {
    return { label: 'Зүүн хойшоо', arrow: '↗', fullLabel: 'Зүүн хойшоо (NE)' };
  } else if (normalized >= 67.5 && normalized < 112.5) {
    return { label: 'Зүүн тийш', arrow: '→', fullLabel: 'Зүүн тийш (E)' };
  } else if (normalized >= 112.5 && normalized < 157.5) {
    return { label: 'Зүүн урагшаа', arrow: '↘', fullLabel: 'Зүүн урагшаа (SE)' };
  } else if (normalized >= 157.5 && normalized < 202.5) {
    return { label: 'Урагшаа', arrow: '↓', fullLabel: 'Урагшаа (S)' };
  } else if (normalized >= 202.5 && normalized < 247.5) {
    return { label: 'Баруун урагшаа', arrow: '↙', fullLabel: 'Баруун урагшаа (SW)' };
  } else if (normalized >= 247.5 && normalized < 292.5) {
    return { label: 'Баруун тийш', arrow: '←', fullLabel: 'Баруун тийш (W)' };
  } else {
    return { label: 'Баруун хойшоо', arrow: '↖', fullLabel: 'Баруун хойшоо (NW)' };
  }
}
