'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Checkpoint } from '@/types/database';

interface MapProps {
  checkpoint: Checkpoint | null;
  userPosition?: { lat: number; lng: number } | null;
  onLocateUser?: () => void;
}

const DynamicScavengerMap = dynamic(() => import('./ScavengerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
      <p className="text-sm font-medium">Газрын зураг ачаалж байна...</p>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return <DynamicScavengerMap {...props} />;
}
