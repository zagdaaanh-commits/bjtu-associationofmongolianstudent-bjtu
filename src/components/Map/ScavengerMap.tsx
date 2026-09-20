'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import { Checkpoint } from '@/types/database';
import {
  Navigation,
  Compass,
  Skull,
  Layers,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { soundFX } from '@/lib/soundEffects';
import {
  wgs84ToGcj02,
  gcj02ToWgs84,
  calculateDistanceMeters,
  calculateBearing,
  getCompassDirection,
} from '@/lib/coordTransform';
import type { UserPosition } from './index';

interface ScavengerMapProps {
  checkpoint: Checkpoint | null;
  userPosition?: UserPosition | null;
  onLocateUser?: () => void;
}

// Beijing Haidian Park GCJ-02 center: 39.9885, 116.2940 (Native China coordinate reference)
const HAIDIAN_PARK_CENTER_GCJ: [number, number] = [39.9885, 116.294];

type TileLayerType = 'gaode' | 'gaode_sat' | 'osm';

/**
 * 1. Retro "X marks the spot" map marker (Checkpoint)
 */
function createXMarksTheSpotIcon(stepNumber: number) {
  return L.divIcon({
    className: 'custom-x-marker',
    html: `
      <div class="retro-x-marker-wrapper">
        <div class="retro-x-pulse"></div>
        <div class="retro-x-mark" title="Эрдэнэсийн цэг #${stepNumber}">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 6L25 24M25 7L7 25" stroke="#450A0A" stroke-width="7" stroke-linecap="round"/>
            <path d="M7 6L25 24M25 7L7 25" stroke="#FBBF24" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M7 6L25 24M25 7L7 25" stroke="#DC2626" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M8.5 7.5L23.5 22.5M23.5 8.5L8.5 23.5" stroke="#FCA5A5" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="retro-x-badge">ЦЭГ #${stepNumber}</div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 20],
    popupAnchor: [0, -26],
  });
}

/**
 * 2. Classic pirate skull indicator for the player with live heading orientation arrow
 */
function createPlayerPirateSkullIcon(
  heading?: number | null,
  bearingToCheckpoint?: number | null,
  isArrived?: boolean
) {
  // Use heading if available; otherwise fall back to bearing toward checkpoint
  const orientationAngle =
    heading !== undefined && heading !== null
      ? heading
      : bearingToCheckpoint !== undefined && bearingToCheckpoint !== null
      ? bearingToCheckpoint
      : null;

  const arrowHtml =
    orientationAngle !== null
      ? `
        <div class="retro-skull-heading-arrow" style="transform: rotate(${orientationAngle}deg);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="12,1 19,17 12,13 5,17" fill="#FBBF24" stroke="#78350F" stroke-width="1.5" stroke-linejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="12" stroke="#FEF08A" stroke-width="1.2"/>
          </svg>
        </div>
      `
      : '';

  const badgeText = isArrived ? 'ХҮРСЭН!' : 'АХМАД ТА';
  const badgeClass = isArrived
    ? 'text-emerald-300 border-emerald-500 font-black'
    : 'text-sky-400 border-sky-800';

  return L.divIcon({
    className: 'custom-skull-marker',
    html: `
      <div class="retro-skull-wrapper">
        <div class="retro-skull-pulse"></div>
        ${arrowHtml}
        <div class="retro-skull-icon" title="Таны байршил">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Crossed Bones -->
            <path d="M6 7L26 25M26 7L6 25" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="6" cy="6" r="1.7" fill="#CBD5E1"/>
            <circle cx="26" cy="6" r="1.7" fill="#CBD5E1"/>
            <circle cx="6" cy="26" r="1.7" fill="#CBD5E1"/>
            <circle cx="26" cy="26" r="1.7" fill="#CBD5E1"/>
            <!-- Pirate Red Bandana -->
            <path d="M7 11.5C7 8 11 5.5 16 5.5C21 5.5 25 8 25 11.5C25 13 23.5 14 22 14H10C8.5 14 7 13 7 11.5Z" fill="#DC2626"/>
            <circle cx="24" cy="14" r="2" fill="#991B1B"/>
            <path d="M24 15L28 19L23.5 18.5L24 15Z" fill="#7F1D1D"/>
            <circle cx="13" cy="8" r="0.9" fill="#FEE2E2"/>
            <circle cx="18" cy="9" r="0.8" fill="#FEE2E2"/>
            <!-- Skull Cranium -->
            <path d="M9 13.8C9 11.5 12 11 16 11C20 11 23 11.5 23 13.8C23 17.5 22 20.8 19.5 20.8H12.5C10 20.8 9 17.5 9 13.8Z" fill="#F8FAFC"/>
            <!-- Eye Sockets -->
            <ellipse cx="13" cy="15.2" rx="1.8" ry="2.2" fill="#0F172A"/>
            <ellipse cx="19" cy="15.2" rx="1.8" ry="2.2" fill="#0F172A"/>
            <!-- Nose Hole -->
            <polygon points="16,17 15,18.5 17,18.5" fill="#0F172A"/>
            <!-- Teeth / Jaw -->
            <path d="M12.5 20.8V23.2H19.5V20.8H12.5Z" fill="#E2E8F0"/>
            <line x1="14.8" y1="20.8" x2="14.8" y2="23.2" stroke="#0F172A" stroke-width="0.9"/>
            <line x1="17.2" y1="20.8" x2="17.2" y2="23.2" stroke="#0F172A" stroke-width="0.9"/>
            <!-- Pirate Gold Earring -->
            <circle cx="8" cy="14" r="1.8" stroke="#FBBF24" stroke-width="1.3" fill="none"/>
          </svg>
        </div>
        <div class="retro-skull-badge ${badgeClass}">${badgeText}</div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 20],
    popupAnchor: [0, -24],
  });
}

function MapController({
  target,
  bounds,
}: {
  target: [number, number] | null;
  bounds: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 18,
        animate: true,
        duration: 1.0,
      });
    } else if (target) {
      map.flyTo(target, 16.5, { duration: 1.0 });
    }
  }, [target, bounds, map]);

  return null;
}

export default function ScavengerMap({
  checkpoint,
  userPosition,
  onLocateUser,
}: ScavengerMapProps) {
  // Tile layer: 'gaode' (China AutoNavi vector), 'gaode_sat' (satellite), 'osm' (OpenStreetMap)
  const [tileLayerType, setTileLayerType] = useState<TileLayerType>('gaode');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [followUser, setFollowUser] = useState(false);

  const isGcj = tileLayerType.startsWith('gaode');

  // Convert Haidian Park center based on active coordinate projection
  const parkCenter = isGcj
    ? { lat: HAIDIAN_PARK_CENTER_GCJ[0], lng: HAIDIAN_PARK_CENTER_GCJ[1] }
    : gcj02ToWgs84(HAIDIAN_PARK_CENTER_GCJ[0], HAIDIAN_PARK_CENTER_GCJ[1]);

  // Checkpoints: already stored in GCJ-02 (native Chinese map system); convert to WGS-84 when on OSM
  const renderCheckpoint = checkpoint
    ? isGcj
      ? { lat: checkpoint.lat, lng: checkpoint.lng }
      : gcj02ToWgs84(checkpoint.lat, checkpoint.lng)
    : null;

  // Phone GPS position is ALWAYS WGS-84 from navigator.geolocation.
  // Convert to GCJ-02 for Gaode/AutoNavi tiles; keep WGS-84 for OSM
  const renderUserPos = userPosition
    ? isGcj
      ? wgs84ToGcj02(userPosition.lat, userPosition.lng)
      : { lat: userPosition.lat, lng: userPosition.lng }
    : null;

  // Calculate high-precision distance and Great-Circle bearing in unified GCJ-02 coordinates
  const userGcj = userPosition
    ? wgs84ToGcj02(userPosition.lat, userPosition.lng)
    : null;

  const distanceMeters =
    userGcj && checkpoint
      ? calculateDistanceMeters(
          userGcj.lat,
          userGcj.lng,
          checkpoint.lat,
          checkpoint.lng
        )
      : null;

  const bearing =
    userGcj && checkpoint
      ? calculateBearing(
          userGcj.lat,
          userGcj.lng,
          checkpoint.lat,
          checkpoint.lng
        )
      : null;

  const directionInfo = bearing !== null ? getCompassDirection(bearing) : null;
  const isArrived = distanceMeters !== null && distanceMeters <= 20;

  // Track breadcrumbs trail in raw GPS (WGS-84) so projection switches cleanly across tile layers
  const [rawTrailPositions, setRawTrailPositions] = useState<{ lat: number; lng: number }[]>([]);
  const lastRecordedWgs = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!userPosition) return;

    if (!lastRecordedWgs.current) {
      lastRecordedWgs.current = { lat: userPosition.lat, lng: userPosition.lng };
      setRawTrailPositions([{ lat: userPosition.lat, lng: userPosition.lng }]);
      return;
    }

    const moved = calculateDistanceMeters(
      lastRecordedWgs.current.lat,
      lastRecordedWgs.current.lng,
      userPosition.lat,
      userPosition.lng
    );

    // Record trail if moved more than 2 meters
    if (moved >= 2) {
      lastRecordedWgs.current = { lat: userPosition.lat, lng: userPosition.lng };
      setRawTrailPositions((prev) => [
        ...prev.slice(-25),
        { lat: userPosition.lat, lng: userPosition.lng },
      ]);
    }
  }, [userPosition?.lat, userPosition?.lng]);

  const renderTrail: [number, number][] = rawTrailPositions.map((pt) => {
    const p = isGcj ? wgs84ToGcj02(pt.lat, pt.lng) : pt;
    return [p.lat, p.lng];
  });

  // Map control targets
  const [mapTarget, setMapTarget] = useState<[number, number]>([
    renderCheckpoint?.lat ?? parkCenter.lat,
    renderCheckpoint?.lng ?? parkCenter.lng,
  ]);
  const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const hasAutoCentered = useRef(false);

  // Automatically zoom to show both Player and Checkpoint when GPS locks
  useEffect(() => {
    if (renderUserPos && renderCheckpoint && !hasAutoCentered.current) {
      hasAutoCentered.current = true;
      setMapBounds([
        [renderUserPos.lat, renderUserPos.lng],
        [renderCheckpoint.lat, renderCheckpoint.lng],
      ]);
    }
  }, [renderUserPos?.lat, renderUserPos?.lng, renderCheckpoint?.lat, renderCheckpoint?.lng]);

  // Center on checkpoint when step changes
  useEffect(() => {
    if (renderCheckpoint) {
      setMapBounds(null);
      setMapTarget([renderCheckpoint.lat, renderCheckpoint.lng]);
    }
  }, [checkpoint?.id, renderCheckpoint?.lat, renderCheckpoint?.lng]);

  // Fit bounds showing both user and target checkpoint
  const handleFitBounds = () => {
    setFollowUser(false);
    soundFX.playButtonTap();
    if (renderUserPos && renderCheckpoint) {
      setMapBounds([
        [renderUserPos.lat, renderUserPos.lng],
        [renderCheckpoint.lat, renderCheckpoint.lng],
      ]);
    } else if (renderCheckpoint) {
      setMapBounds(null);
      setMapTarget([renderCheckpoint.lat, renderCheckpoint.lng]);
    }
  };

  useEffect(() => {
    if (followUser && renderUserPos) {
      setMapBounds(null);
      setMapTarget([renderUserPos.lat, renderUserPos.lng]);
    }
  }, [followUser, renderUserPos?.lat, renderUserPos?.lng]);

  const handleCenterUser = () => {
    setFollowUser(true);
    soundFX.playButtonTap();
    if (onLocateUser) onLocateUser();
    if (renderUserPos) {
      setMapBounds(null);
      setMapTarget([renderUserPos.lat, renderUserPos.lng]);
    }
  };

  const handleCenterCheckpoint = () => {
    setFollowUser(false);
    soundFX.playButtonTap();
    if (renderCheckpoint) {
      setMapBounds(null);
      setMapTarget([renderCheckpoint.lat, renderCheckpoint.lng]);
    }
  };

  const handleCenterPark = () => {
    setFollowUser(false);
    soundFX.playButtonTap();
    setMapBounds(null);
    setMapTarget([parkCenter.lat, parkCenter.lng]);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden pirate-map-frame bg-[#c8b08b] isolate">
      {/* 4 Brass Corner Rivets */}
      <div className="pirate-corner-rivet top-1.5 left-1.5 z-[420]" />
      <div className="pirate-corner-rivet top-1.5 right-1.5 z-[420]" />
      <div className="pirate-corner-rivet bottom-1.5 left-1.5 z-[420]" />
      <div className="pirate-corner-rivet bottom-1.5 right-1.5 z-[420]" />

      {/* Vintage Compass Border Graduations Rim */}
      <div className="pirate-compass-rim pointer-events-none" />

      {/* Cardinal Direction Compass Indicators */}
      <div className="pirate-cardinal-n pointer-events-none">▲ N</div>
      <div className="pirate-cardinal-s pointer-events-none">S ▼</div>
      <div className="pirate-cardinal-e pointer-events-none">E ▶</div>
      <div className="pirate-cardinal-w pointer-events-none">◀ W</div>

      {/* Subtle Map Vignette Overlay */}
      <div className="pirate-map-grain rounded-2xl pointer-events-none" />

      <MapContainer
        center={[parkCenter.lat, parkCenter.lng]}
        zoom={16.5}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        {/* Layer 1: AutoNavi / Gaode High-Resolution Vector Park Map (Default for China) */}
        {tileLayerType === 'gaode' && (
          <TileLayer
            key="gaode-vector"
            url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
            subdomains={['1', '2', '3', '4']}
            maxZoom={19}
          />
        )}

        {/* Layer 2: AutoNavi Satellite Hybrid Imagery */}
        {tileLayerType === 'gaode_sat' && (
          <>
            <TileLayer
              key="gaode-satellite-base"
              url="https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
              subdomains={['1', '2', '3', '4']}
              maxZoom={19}
            />
            <TileLayer
              key="gaode-satellite-roads"
              url="https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8"
              subdomains={['1', '2', '3', '4']}
              maxZoom={19}
            />
          </>
        )}

        {/* Layer 3: OpenStreetMap Classic Parchment */}
        {tileLayerType === 'osm' && (
          <TileLayer
            key="osm-classic"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="retro-map-tiles"
            maxZoom={19}
          />
        )}

        {/* Highlight Haidian Park perimeter zone border */}
        <Circle
          center={[parkCenter.lat, parkCenter.lng]}
          radius={550}
          pathOptions={{
            color: '#b45309',
            fillColor: '#f59e0b',
            fillOpacity: 0.08,
            dashArray: '8, 10',
            weight: 2.5,
          }}
        />

        {/* Player GPS Accuracy Radius Circle */}
        {renderUserPos && userPosition?.accuracy && userPosition.accuracy > 0 && (
          <Circle
            center={[renderUserPos.lat, renderUserPos.lng]}
            radius={userPosition.accuracy}
            pathOptions={{
              color: '#0284c7',
              fillColor: '#38bdf8',
              fillOpacity: 0.14,
              weight: 1.5,
              dashArray: '3, 6',
            }}
          />
        )}

        {/* Movement Breadcrumbs Trail */}
        {renderTrail.length > 1 && (
          <Polyline
            positions={renderTrail}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              dashArray: '4, 8',
              opacity: 0.75,
            }}
          />
        )}

        {/* Navigational Bearing Line connecting Player Skull to Checkpoint "X" */}
        {renderUserPos && renderCheckpoint && (
          <>
            {/* Glowing amber underline */}
            <Polyline
              positions={[
                [renderUserPos.lat, renderUserPos.lng],
                [renderCheckpoint.lat, renderCheckpoint.lng],
              ]}
              pathOptions={{
                color: '#f59e0b',
                weight: 6,
                opacity: 0.35,
              }}
            />
            {/* Animated crimson dashed bearing line */}
            <Polyline
              className="retro-nav-line"
              positions={[
                [renderUserPos.lat, renderUserPos.lng],
                [renderCheckpoint.lat, renderCheckpoint.lng],
              ]}
              pathOptions={{
                color: isArrived ? '#10b981' : '#dc2626',
                weight: 3.5,
                dashArray: '8, 10',
                opacity: 0.95,
              }}
            />
          </>
        )}

        {/* 1. Retro "X marks the spot" marker for active Checkpoint */}
        {renderCheckpoint && checkpoint && (
          <Marker
            position={[renderCheckpoint.lat, renderCheckpoint.lng]}
            icon={createXMarksTheSpotIcon(checkpoint.step_number)}
          >
            <Popup className="custom-popup">
              <div className="p-1.5 text-[#2b1708] font-sans">
                <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-700 font-cinzel">
                  <span>✖ ЭРДЭНЭСИЙН ЦЭГ #{checkpoint.step_number}</span>
                </div>
                <p className="font-extrabold text-sm text-[#1a0d05] mt-1 font-medieval">
                  {checkpoint.title}
                </p>
                {distanceMeters !== null && (
                  <p className="text-xs font-bold text-amber-900 mt-1">
                    Цэг хүртэл: {distanceMeters < 1000 ? `${distanceMeters}м` : `${(distanceMeters / 1000).toFixed(1)}км`}
                  </p>
                )}
                <p className="text-xs text-[#5c371c] mt-1 leading-snug">
                  Газар дээр нь очоод нуусан QR кодыг сканнердаж эрдэнэсээ нээнэ үү!
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Classic pirate skull indicator for Player location with heading */}
        {renderUserPos && (
          <Marker
            position={[renderUserPos.lat, renderUserPos.lng]}
            icon={createPlayerPirateSkullIcon(
              userPosition?.heading,
              bearing,
              isArrived
            )}
          >
            <Popup>
              <div className="p-1.5 text-[#0f172a] font-sans text-xs font-bold">
                <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                  <Skull className="w-4 h-4" />
                  <span>Ахмад таны одоогийн байршил</span>
                </div>
                {distanceMeters !== null && (
                  <p className="text-[#334155] font-mono text-[11px]">
                    Цэг хүртэл: {distanceMeters < 1000 ? `${distanceMeters}м` : `${(distanceMeters / 1000).toFixed(1)}км`}
                    {directionInfo && ` (${directionInfo.label})`}
                  </p>
                )}
                {userPosition?.accuracy && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    GPS нарийвчлал: ±{Math.round(userPosition.accuracy)}м
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        <MapController target={mapTarget} bounds={mapBounds} />
      </MapContainer>

      {/* Floating HUD: Top Left - Header & Live Distance Navigation Banner */}
      <div className="absolute top-2.5 left-2.5 z-[410] flex flex-col gap-1.5 pointer-events-none max-w-[65%]">
        {/* Park Title Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#271407]/90 backdrop-blur-sm border-2 border-[#b45309] shadow-lg pointer-events-auto">
          <Compass
            className="w-3.5 h-3.5 text-amber-400 animate-spin"
            style={{ animationDuration: '14s' }}
          />
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-cinzel truncate">
            Хайдян Парк (海淀公园)
          </span>
        </div>

        {/* Live Distance & Direction Indicator */}
        {distanceMeters !== null && checkpoint && (
          <div
            className={`px-3 py-1.5 rounded-xl border-2 shadow-xl flex items-center gap-2 pointer-events-auto transition-all ${
              isArrived
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 animate-pulse'
                : 'bg-[#180c05]/95 border-amber-500/90 text-amber-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                isArrived
                  ? 'bg-emerald-400 text-black'
                  : 'bg-amber-400 text-black font-mono'
              }`}
            >
              {isArrived ? '★' : directionInfo?.arrow || '➔'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 leading-tight">
                <span className="text-xs font-black text-amber-200 font-mono tracking-tight truncate">
                  {isArrived ? (
                    <span className="text-emerald-300 font-black flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      ЦЭГ ДЭЭР ИРЛЭЭ ({distanceMeters}м)!
                    </span>
                  ) : (
                    <span>
                      Цэг хүртэл:{' '}
                      <strong className="text-yellow-300">
                        {distanceMeters < 1000
                          ? `${distanceMeters}м`
                          : `${(distanceMeters / 1000).toFixed(1)}км`}
                      </strong>
                    </span>
                  )}
                </span>
              </div>
              {!isArrived && directionInfo && (
                <div className="text-[10px] text-[#deb887] font-semibold truncate leading-tight mt-0.5">
                  Чиглэл: <span className="text-amber-300">{directionInfo.label}</span>
                  {userPosition?.accuracy ? ` · ±${Math.round(userPosition.accuracy)}м` : ''}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Retro Mini-Map Action Controls (Chunky Wooden & Brass Buttons) */}
      <div className="absolute top-2.5 right-2.5 z-[410] flex flex-col gap-2">
        {/* Layer Selector Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              soundFX.playButtonTap();
              setShowLayerMenu(!showLayerMenu);
            }}
            title="Газрын зургийн давхарга сонгох"
            className="w-9 h-9 rounded-xl btn-pirate-wood flex items-center justify-center text-amber-300 shadow-md border-amber-500/80"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-11 top-0 bg-[#241309] border-2 border-amber-500/90 rounded-2xl p-1.5 shadow-2xl z-[430] w-56 text-xs font-cinzel space-y-1">
              <button
                onClick={() => {
                  soundFX.playButtonTap();
                  setTileLayerType('gaode');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors ${
                  tileLayerType === 'gaode'
                    ? 'bg-amber-500 text-black font-black'
                    : 'text-amber-200 hover:bg-[#3d2413]'
                }`}
              >
                <span>🇨🇳 Гаодэ (Хятад парк зураг)</span>
              </button>
              <button
                onClick={() => {
                  soundFX.playButtonTap();
                  setTileLayerType('gaode_sat');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors ${
                  tileLayerType === 'gaode_sat'
                    ? 'bg-amber-500 text-black font-black'
                    : 'text-amber-200 hover:bg-[#3d2413]'
                }`}
              >
                <span>🛰️ Сансрын зураг (Satellite)</span>
              </button>
              <button
                onClick={() => {
                  soundFX.playButtonTap();
                  setTileLayerType('osm');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors ${
                  tileLayerType === 'osm'
                    ? 'bg-amber-500 text-black font-black'
                    : 'text-amber-200 hover:bg-[#3d2413]'
                }`}
              >
                <span>📜 Дэлхийн стандарт (OSM)</span>
              </button>
            </div>
          )}
        </div>

        {/* Fit Bounds Button (Shows both Player and Checkpoint) */}
        {renderUserPos && renderCheckpoint && (
          <button
            onClick={handleFitBounds}
            title="Баг ба Цэгийг хамтад нь харах"
            className="w-9 h-9 rounded-xl btn-pirate-gold flex items-center justify-center text-amber-950 shadow-md"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Focus on Checkpoint "X" */}
        {checkpoint && (
          <button
            onClick={handleCenterCheckpoint}
            title="Эрдэнэсийн X цэг рүү чиглүүлэх"
            className="w-9 h-9 rounded-xl btn-pirate-crimson flex items-center justify-center text-white shadow-md"
          >
            <span className="font-black text-sm">✖</span>
          </button>
        )}

        {/* Focus on Player Skull */}
        {onLocateUser && (
          <button
            onClick={handleCenterUser}
            title="Миний байршил"
            aria-label="Миний байршил"
            className="w-9 h-9 rounded-xl btn-pirate-wood flex items-center justify-center text-sky-400 shadow-md"
          >
            <Navigation className="w-4 h-4" />
          </button>
        )}

        {/* Reset to Haidian Park Center */}
        <button
          onClick={handleCenterPark}
          title="Паркийн төвд шилжих"
          className="w-9 h-9 rounded-xl btn-pirate-gold flex items-center justify-center text-amber-950 shadow-md"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Mini-Map Status Legend & Active Tile Mode */}
      <div className="absolute bottom-2 left-2.5 z-[410] px-2.5 py-1 rounded-md bg-[#1a0e06]/85 border border-[#854d0e] text-[10px] text-amber-200/90 font-mono shadow-md flex items-center gap-2 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="text-rose-500 font-black">✖</span> Эрдэнэс
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="text-sky-400 font-black">☠</span> Ахмад
        </span>
        <span>•</span>
        <span className="text-amber-400/80">
          {tileLayerType === 'gaode'
            ? '🇨🇳 Гаодэ Парк'
            : tileLayerType === 'gaode_sat'
            ? '🛰️ Сансар'
            : '📜 OSM'}
        </span>
      </div>
    </div>
  );
}
