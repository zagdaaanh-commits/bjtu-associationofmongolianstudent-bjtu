'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Checkpoint } from '@/types/database';
import { Navigation, Compass, MapPin } from 'lucide-react';

interface ScavengerMapProps {
  checkpoint: Checkpoint | null;
  userPosition?: { lat: number; lng: number } | null;
  onLocateUser?: () => void;
}

// Haidian Park center: 39.9885, 116.2940
const HAIDIAN_PARK_CENTER: [number, number] = [39.9885, 116.2940];

// Custom DivIcon for Checkpoint
function createCheckpointIcon(stepNumber: number) {
  return L.divIcon({
    className: 'custom-checkpoint-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.35);
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        "></div>
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 14px;
          position: relative;
          z-index: 2;
        ">
          ${stepNumber}
        </div>
        <div style="
          position: absolute;
          bottom: -7px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #b91c1c;
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  });
}

// Custom DivIcon for User location
const userLocationIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.4);
        animation: pulse-ring 2s infinite;
      "></div>
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #2563eb;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        position: relative;
        z-index: 2;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapController({
  target,
}: {
  target: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

export default function ScavengerMap({
  checkpoint,
  userPosition,
  onLocateUser,
}: ScavengerMapProps) {
  const [mapTarget, setMapTarget] = useState<[number, number]>(
    checkpoint ? [checkpoint.lat, checkpoint.lng] : HAIDIAN_PARK_CENTER
  );

  useEffect(() => {
    if (checkpoint) {
      setMapTarget([checkpoint.lat, checkpoint.lng]);
    }
  }, [checkpoint]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
      <MapContainer
        center={HAIDIAN_PARK_CENTER}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Highlight Haidian Park perimeter */}
        <Circle
          center={HAIDIAN_PARK_CENTER}
          radius={550}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.08,
            dashArray: '6, 8',
            weight: 2,
          }}
        />

        {/* ONLY active checkpoint pin */}
        {checkpoint && (
          <Marker
            position={[checkpoint.lat, checkpoint.lng]}
            icon={createCheckpointIcon(checkpoint.step_number)}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Шалгах цэг #{checkpoint.step_number}
                </span>
                <p className="font-bold text-sm text-slate-800 mt-0.5">{checkpoint.title}</p>
                <p className="text-xs text-slate-600 mt-1">Ойртон очоод QR кодыг сканнердаарай!</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User location pin */}
        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans text-xs font-semibold">
                📍 Таны одоогийн байршил
              </div>
            </Popup>
          </Marker>
        )}

        <MapController target={mapTarget} />
      </MapContainer>

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {checkpoint && (
          <button
            onClick={() => setMapTarget([checkpoint.lat, checkpoint.lng])}
            title="Шалгах цэг рүү чиглүүлэх"
            className="p-2.5 rounded-xl bg-slate-900/90 text-amber-400 hover:text-amber-300 border border-slate-700 shadow-lg backdrop-blur-md transition-all active:scale-95"
          >
            <MapPin className="w-5 h-5" />
          </button>
        )}
        {onLocateUser && (
          <button
            onClick={onLocateUser}
            title="Миний байршил"
            className="p-2.5 rounded-xl bg-slate-900/90 text-blue-400 hover:text-blue-300 border border-slate-700 shadow-lg backdrop-blur-md transition-all active:scale-95"
          >
            <Navigation className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setMapTarget(HAIDIAN_PARK_CENTER)}
          title="Паркийн төв"
          className="p-2.5 rounded-xl bg-slate-900/90 text-emerald-400 hover:text-emerald-300 border border-slate-700 shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Floating park label */}
      <div className="absolute top-3 left-3 z-[400] px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="text-xs font-semibold text-slate-200">
          Хайдян Парк (海淀公园)
        </span>
      </div>
    </div>
  );
}
