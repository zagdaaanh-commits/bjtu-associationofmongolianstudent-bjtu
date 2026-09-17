'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Flag, Sparkles, Home, Skull, Gem } from 'lucide-react';
import { formatElapsedTime } from '@/lib/utils';
import { Team } from '@/types/database';
import { soundFX } from '@/lib/soundEffects';

interface CelebrationProps {
  team: Team;
  totalCheckpoints?: number;
  onResetSession: () => void;
}

export default function Celebration({
  team,
  totalCheckpoints = 5,
  onResetSession,
}: CelebrationProps) {
  useEffect(() => {
    // Play grand 90s console victory fanfare and golden coin clinks
    soundFX.playVictory();
    const timer = setTimeout(() => {
      soundFX.playCoin();
    }, 1200);

    let animId: number;
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#F59E0B', '#DC2626', '#10B981'],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#F59E0B', '#DC2626', '#10B981'],
      });

      if (Date.now() < animationEnd) {
        animId = requestAnimationFrame(frame);
      }
    };

    frame();

    return () => {
      clearTimeout(timer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const totalTime = formatElapsedTime(team.started_at, team.finished_at);
  const completedCount = team.current_step || totalCheckpoints;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in zoom-in-95 duration-500">
      {/* 90s Golden Trophy & Treasure Icon */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-yellow-200 flex items-center justify-center text-[#2b1708] shadow-2xl shadow-amber-500/50 animate-bounce">
          <Trophy className="w-16 h-16 drop-shadow-md" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-2xl btn-pirate-emerald text-white shadow-lg">
          <Sparkles className="w-5 h-5 animate-spin" />
        </div>
        <div className="absolute -bottom-2 -left-2 p-2 rounded-2xl btn-pirate-crimson text-white shadow-lg">
          <Skull className="w-4 h-4" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3d2413] text-amber-300 border-2 border-[#b45309] text-xs font-black uppercase tracking-wider mb-3 font-cinzel shadow-md">
        <Flag className="w-3.5 h-3.5 text-amber-400" />
        <span>Эрдэнэсийн эрэл амжилттай дууслаа!</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-amber-300 mb-2 font-medieval drop-shadow-md">
        Баяр хүргэе, {team.name}!
      </h1>

      <p className="text-[#deb887] text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed font-sans">
        Та бүхэн Хайдян паркийн бүх шалгах цэгийг газрын зураг, сэжүүрийн тусламжтай амжилттай олж, далайн дээрэмчний эрдэнэсийн даалгаврыг бүрэн дуусгалаа!
      </p>

      {/* 64-bit Beveled Parchment Time & Stats Scroll */}
      <div className="w-full max-w-sm pirate-panel-parchment rounded-3xl p-6 shadow-2xl mb-6 space-y-4 relative overflow-hidden">
        <div className="pirate-corner-rivet top-2 left-2" />
        <div className="pirate-corner-rivet top-2 right-2" />
        <div className="pirate-corner-rivet bottom-2 left-2" />
        <div className="pirate-corner-rivet bottom-2 right-2" />

        <div className="flex items-center justify-between border-b-2 border-[#b38b55]/40 pb-4">
          <span className="text-[#5c371c] text-xs font-bold flex items-center gap-2 font-sans">
            <Clock className="w-4 h-4 text-amber-800" />
            Нийт хугацаа
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#2b1708] font-mono tracking-tight">
            {totalTime}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 font-sans">
          <span className="text-[#5c371c] font-semibold">Шалгах цэгүүд</span>
          <span className="text-emerald-900 font-black flex items-center gap-1 font-cinzel">
            <Gem className="w-3.5 h-3.5 text-emerald-700" />
            {completedCount} / {totalCheckpoints} Бүрэн олсон
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-[#5c371c] font-semibold">Цол зэрэг</span>
          <span className="px-3 py-1 rounded-full btn-pirate-gold text-[10px] font-black uppercase tracking-wider font-cinzel">
            ☠ АЛТАН ХАЙГУУЛЧ
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={() => {
            soundFX.playButtonTap();
            onResetSession();
          }}
          className="flex-1 py-4 px-6 rounded-2xl btn-pirate-gold text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Home className="w-4 h-4" />
          <span>Нүүр хуудас руу буцах</span>
        </button>
      </div>
    </div>
  );
}
