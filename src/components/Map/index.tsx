'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Compass } from 'lucide-react';
import type { Checkpoint } from '@/types/database';

export interface UserPosition {
  lat: number;
  lng: number;
  heading?: number | null;
  accuracy?: number | null;
  speed?: number | null;
}

export interface MapProps {
  checkpoint: Checkpoint | null;
  userPosition?: UserPosition | null;
  onLocateUser?: () => void;
}

const DynamicScavengerMap = dynamic(() => import('./ScavengerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center pirate-map-frame rounded-2xl bg-[#c8b08b] text-[#2b1708] relative overflow-hidden">
      <div className="pirate-corner-rivet top-1.5 left-1.5" />
      <div className="pirate-corner-rivet top-1.5 right-1.5" />
      <div className="pirate-corner-rivet bottom-1.5 left-1.5" />
      <div className="pirate-corner-rivet bottom-1.5 right-1.5" />
      <div className="pirate-compass-rim" />
      <Compass className="w-10 h-10 animate-spin text-amber-900 mb-2" style={{ animationDuration: '6s' }} />
      <p className="text-xs font-black font-medieval text-amber-950">Эрдэнэсийн газрын зураг дэлгэж байна...</p>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return <DynamicScavengerMap {...props} />;
}
