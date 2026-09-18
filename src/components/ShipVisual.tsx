'use client';

import React from 'react';
import { PreconfiguredTeam } from '@/lib/dataService';
import { Anchor, Sparkles } from 'lucide-react';

interface ShipVisualProps {
  ship: PreconfiguredTeam;
  selected?: boolean;
  onClick?: () => void;
  showPin?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export default function ShipVisual({
  ship,
  selected = false,
  onClick,
  showPin = true,
  size = 'md',
  compact = false,
}: ShipVisualProps) {
  const isClickable = !!onClick;

  let glowClass = 'ship-glow-pearl';
  if (ship.name.includes('Хатан')) glowClass = 'ship-glow-anne';
  else if (ship.name.includes('Голланд')) glowClass = 'ship-glow-dutchman';
  else if (ship.name.includes('Алтан')) glowClass = 'ship-glow-hind';
  else if (ship.name.includes('Галеон')) glowClass = 'ship-glow-galley';
  else if (ship.name.includes('Тэнгисийн')) glowClass = 'ship-glow-dutchman';
  else if (ship.name.includes('Чимээгүй')) glowClass = 'ship-glow-anne';
  else if (ship.name.includes('Мөнгөн')) glowClass = 'ship-glow-hind';
  else if (ship.name.includes('Шуурганы')) glowClass = 'ship-glow-galley';

  const sizeClass =
    size === 'sm' ? 'aspect-[4/3] h-32' : size === 'lg' ? 'aspect-[4/3] h-52' : 'aspect-[4/3] h-40';

  const containerBorder = selected
    ? 'border-amber-400 bg-gradient-to-b from-[#3a2010] to-[#1a0c05] ring-2 ring-amber-400/50 shadow-2xl'
    : 'border-[#5c371c] bg-gradient-to-b from-[#241309] to-[#120703] hover:border-amber-500/80 shadow-xl';

  return (
    <div
      onClick={onClick}
      className={`ship-card-3d-wrap ${isClickable ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`ship-card-3d relative rounded-3xl p-4 border-3 transition-all ${containerBorder} ${glowClass}`}
      >
        <div className="pirate-corner-rivet top-2 left-2" />
        <div className="pirate-corner-rivet top-2 right-2" />
        <div className="pirate-corner-rivet bottom-2 left-2" />
        <div className="pirate-corner-rivet bottom-2 right-2" />

        {/* Top ship title & PIN code badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Anchor className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <h4 className="text-sm font-extrabold text-amber-200 truncate font-medieval tracking-wide">
              {ship.name}
            </h4>
          </div>

          {showPin && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#120703] border-2 border-amber-500/80 shadow-inner flex-shrink-0">
              <span className="text-[10px] text-amber-400/80 font-cinzel font-bold">ПИН:</span>
              <span className="text-sm font-mono font-black text-amber-300 tracking-wider">
                {ship.pin_code}
              </span>
            </div>
          )}
        </div>

        {/* 3D Model Render Frame */}
        <div
          className={`relative rounded-2xl overflow-hidden border-2 border-[#7a4820] bg-black/60 shadow-inner group ${sizeClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ship.ship_image}
            alt={ship.ship_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Ambient Lighting Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

          {/* 3D Model Badge Overlay */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#241309]/90 border border-amber-500/50 text-[10px] text-amber-300 font-bold font-cinzel flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>3D ХӨЛӨГ МОДЕЛЬ</span>
          </div>

          {compact && (
            <div className="absolute bottom-2 left-2 right-2 text-[11px] text-amber-100 font-medium truncate drop-shadow-md">
              {ship.description}
            </div>
          )}
        </div>

        {!compact && (
          <div className="mt-3">
            <p className="text-xs text-[#deb887] line-clamp-2 leading-relaxed font-sans">
              {ship.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
