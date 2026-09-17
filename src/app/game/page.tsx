'use client';

import React, { useEffect } from 'react';
import GameClient from '@/components/GameClient';
import { dataService } from '@/lib/dataService';
import { soundFX } from '@/lib/soundEffects';

export default function GamePage() {
  // Supabase Realtime subscription listener for team status change to 'in_progress'
  // When admin approves team photo, this immediately shifts the team to Step 1
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const teamId = localStorage.getItem('scavenger_team_id');
    if (!teamId) return;

    const unsubscribe = dataService.subscribeToTeam(teamId, (payload) => {
      // Strict validation check: verify if (!payload || payload.id !== teamId) return;
      if (!payload || payload.id !== teamId) return;
      if (payload.status === 'in_progress') {
        soundFX.playChestOpen();
        soundFX.playDiscoveryJingle();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return <GameClient />;
}

