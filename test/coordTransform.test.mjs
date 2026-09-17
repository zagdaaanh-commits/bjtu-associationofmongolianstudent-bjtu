import assert from 'node:assert/strict';

// Krasovsky 1940 ellipsoid constants
const A_AXIS = 6378245.0;
const EE = 0.00669342162296594323;

function isOutOfChina(lat, lng) {
  if (lng < 72.004 || lng > 137.8347) return true;
  if (lat < 0.8293 || lat > 55.8271) return true;
  if (lng < 118.0 && lat > 43.0) return true;
  return false;
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

function wgs84ToGcj02(lat, lng) {
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

function gcj02ToWgs84(lat, lng) {
  if (isOutOfChina(lat, lng)) {
    return { lat, lng };
  }
  const g = wgs84ToGcj02(lat, lng);
  return { lat: lat * 2 - g.lat, lng: lng * 2 - g.lng };
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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

function calculateBearing(lat1, lon1, lat2, lon2) {
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

function getCompassDirection(bearing) {
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

console.log('Running coordTransform tests...');

// 1. Test Haidian Park GCJ-02 vs WGS-84 offset
const haidianGcj = { lat: 39.9885, lng: 116.2940 };
const haidianWgs = gcj02ToWgs84(haidianGcj.lat, haidianGcj.lng);
const offsetMeters = calculateDistanceMeters(haidianWgs.lat, haidianWgs.lng, haidianGcj.lat, haidianGcj.lng);
console.log(`Haidian Park GCJ-02 offset: ${offsetMeters} meters`);
assert.ok(offsetMeters > 450 && offsetMeters < 600, 'Beijing GCJ-02 offset must be ~530m');

// 2. Round-trip conversion precision
const roundTripGcj = wgs84ToGcj02(haidianWgs.lat, haidianWgs.lng);
const roundTripDiff = calculateDistanceMeters(haidianGcj.lat, haidianGcj.lng, roundTripGcj.lat, roundTripGcj.lng);
console.log(`Round-trip difference: ${roundTripDiff} meters`);
assert.ok(roundTripDiff <= 1, 'Round-trip accuracy must be within 1 meter');

// 3. Physical GPS Checkpoint Alignment Test:
// When a phone is physically at Checkpoint 1 (North Gate Plaza: lat: 39.9922, lng: 116.2942 GCJ-02),
// the phone's GPS hardware outputs WGS-84 coordinates.
const cp1Gcj = { lat: 39.9922, lng: 116.2942 };
const phoneGpsWgs = gcj02ToWgs84(cp1Gcj.lat, cp1Gcj.lng);

// If un-converted, distance would be ~536 meters (failing arrival detection)
const unalignedDist = calculateDistanceMeters(phoneGpsWgs.lat, phoneGpsWgs.lng, cp1Gcj.lat, cp1Gcj.lng);
assert.ok(unalignedDist > 500, 'Unaligned distance between WGS-84 and GCJ-02 has ~530m error');

// When user's WGS-84 GPS is converted to GCJ-02, distance to checkpoint is <= 1 meter!
const phoneGpsGcj = wgs84ToGcj02(phoneGpsWgs.lat, phoneGpsWgs.lng);
const alignedDist = calculateDistanceMeters(phoneGpsGcj.lat, phoneGpsGcj.lng, cp1Gcj.lat, cp1Gcj.lng);
assert.ok(alignedDist <= 1, 'Aligned distance must be <= 1 meter');

// 4. Approach test: 30 meters south of Checkpoint 1
const userApproachingWgs = {
  lat: phoneGpsWgs.lat - 0.00027, // ~30m south
  lng: phoneGpsWgs.lng,
};
const userApproachingGcj = wgs84ToGcj02(userApproachingWgs.lat, userApproachingWgs.lng);
const approachDist = calculateDistanceMeters(userApproachingGcj.lat, userApproachingGcj.lng, cp1Gcj.lat, cp1Gcj.lng);
const approachBearing = calculateBearing(userApproachingGcj.lat, userApproachingGcj.lng, cp1Gcj.lat, cp1Gcj.lng);
const approachDir = getCompassDirection(approachBearing);

assert.ok(approachDist >= 25 && approachDist <= 35, `Approach distance should be ~30m, got ${approachDist}m`);
assert.ok(approachBearing >= 355 || approachBearing <= 5, `Heading due North towards CP1 should be ~0 deg, got ${approachBearing}`);
assert.equal(approachDir.label, 'Хойшоо');
assert.equal(approachDir.arrow, '↑');

// 5. Out-of-China bounds check (e.g. Ulaanbaatar, Mongolia)
const ubWgs = { lat: 47.9184, lng: 106.9177 };
const ubGcj = wgs84ToGcj02(ubWgs.lat, ubWgs.lng);
assert.equal(ubGcj.lat, ubWgs.lat, 'Mongolia coords must not be transformed');
assert.equal(ubGcj.lng, ubWgs.lng, 'Mongolia coords must not be transformed');

// 6. Bearing test
assert.equal(calculateBearing(0, 0, 1, 0), 0, 'Bearing due North should be 0 deg');
assert.equal(calculateBearing(0, 0, 0, 1), 90, 'Bearing due East should be 90 deg');
assert.equal(calculateBearing(0, 0, -1, 0), 180, 'Bearing due South should be 180 deg');
assert.equal(calculateBearing(0, 0, 0, -1), 270, 'Bearing due West should be 270 deg');

// 7. Compass direction labels in Mongolian
assert.equal(getCompassDirection(0).label, 'Хойшоо');
assert.equal(getCompassDirection(45).label, 'Зүүн хойшоо');
assert.equal(getCompassDirection(90).label, 'Зүүн тийш');
assert.equal(getCompassDirection(135).label, 'Зүүн урагшаа');
assert.equal(getCompassDirection(180).label, 'Урагшаа');
assert.equal(getCompassDirection(225).label, 'Баруун урагшаа');
assert.equal(getCompassDirection(270).label, 'Баруун тийш');
assert.equal(getCompassDirection(315).label, 'Баруун хойшоо');

console.log('✅ ALL coordTransform tests passed successfully!');
