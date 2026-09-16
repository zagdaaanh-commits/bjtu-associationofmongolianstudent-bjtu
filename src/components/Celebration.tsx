'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Flag, Sparkles, Home } from 'lucide-react';
import { formatElapsedTime } from '@/lib/utils';
import { Team } from '@/types/database';

interface CelebrationProps {
  team: Team;
  onResetSession: () => void;
}

export default function Celebration({ team, onResetSession }: CelebrationProps) {
  useEffect(() => {
    // Fire festive fireworks
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD100', '#0055A5', '#DA291C', '#10B981'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD100', '#0055A5', '#DA291C', '#10B981'],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalTime = formatElapsedTime(team.started_at, team.finished_at);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/40 animate-bounce">
          <Trophy className="w-14 h-14" />
        </div>
        <div className="absolute -top-2 -right-2 p-2 rounded-full bg-emerald-500 text-white shadow-lg">
          <Sparkles className="w-5 h-5 animate-spin" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
        <Flag className="w-3.5 h-3.5" />
        Амжилттай барианд орлоо!
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2">
        Баяр хүргэе, {team.name}!
      </h1>

      <p className="text-slate-300 text-sm max-w-md mx-auto mb-8">
        Та бүхэн Хайдян паркийн бүх шалгах цэгийг амжилттай олж, даалгавруудыг даван туулж “Эрдэнэсийн эрэл”-ийг дуусгалаа!
      </p>

      {/* Time & Stats Card */}
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <span className="text-slate-400 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Нийт зарцуулсан хугацаа
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {totalTime}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Шалгах цэгүүд</span>
          <span className="text-emerald-400 font-bold">5 / 5 Бүрэн гүйцэтгэсэн</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Төлөв</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
            FINISHER
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onResetSession}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-98"
        >
          <Home className="w-4 h-4" /> Нүүр хуудас
        </button>
      </div>
    </div>
  );
}
