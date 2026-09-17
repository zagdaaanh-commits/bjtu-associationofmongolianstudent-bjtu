'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Checkpoint, Team } from '@/types/database';
import { dataService } from '@/lib/dataService';
import { HelpCircle, CheckCircle, XCircle, ArrowRight, Loader2, Sparkles, Scroll } from 'lucide-react';
import { soundFX } from '@/lib/soundEffects';

interface QuizModalProps {
  checkpoint: Checkpoint;
  team?: Team;
  totalCheckpoints?: number;
  onSuccess: (isFinal?: boolean) => void;
  onClose: () => void;
}

export default function QuizModal({
  checkpoint,
  team,
  totalCheckpoints,
  onSuccess,
  onClose,
}: QuizModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'incorrect' | null;
    message: string;
  }>({ status: null, message: '' });

  // Play wooden chest open sound when quiz opens
  useEffect(() => {
    soundFX.playChestOpen();
  }, []);

  // Safe options parsing
  let options: string[] = [];
  try {
    if (Array.isArray(checkpoint.options)) {
      options = checkpoint.options;
    } else if (typeof checkpoint.options === 'string') {
      options = JSON.parse(checkpoint.options);
    }
  } catch {
    options = [];
  }

  const handleAnswerSubmit = async () => {
    const givenAnswer = (options.length > 0 ? selectedOption : textAnswer).trim();

    if (!givenAnswer) {
      soundFX.playWrong();
      setFeedback({
        status: 'incorrect',
        message: 'Хариултаа сонгоно уу эсвэл бичнэ үү!',
      });
      return;
    }

    // Compare answer with normalization for prefixes (e.g. 'B. ' or 'B'), LaTeX math, and exact string
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\$/g, '')
        .replace(/\\cdot/g, '·')
        .replace(/\^2/g, '²')
        .replace(/\*/g, '·')
        .replace(/\s+/g, ' ');

    const cleanPrefix = (s: string) =>
      normalize(s).replace(/^[a-d][.\s:]*/i, '').trim();

    const letterOnly = (s: string) => {
      const m = s.trim().match(/^([a-d])([.\s:]|$)/i);
      return m ? m[1].toLowerCase() : '';
    };

    const isCorrect =
      givenAnswer.toLowerCase().trim() === checkpoint.correct_answer.toLowerCase().trim() ||
      normalize(givenAnswer) === normalize(checkpoint.correct_answer) ||
      (cleanPrefix(givenAnswer).length > 0 && cleanPrefix(givenAnswer) === cleanPrefix(checkpoint.correct_answer)) ||
      (letterOnly(givenAnswer) !== '' && letterOnly(givenAnswer) === letterOnly(checkpoint.correct_answer));

    if (!isCorrect) {
      soundFX.playWrong();
      setFeedback({
        status: 'incorrect',
        message: 'Хариулт буруу байна! Багийнхантайгаа дахин ярилцаад хариулна уу.',
      });
      return;
    }

    // Correct! Play golden coin clinks and discovery jingle
    soundFX.playDiscoveryJingle();
    soundFX.playCoin();

    setFeedback({
      status: 'correct',
      message: 'Зөв хариуллаа! Одоо шалгах цэгийн нуусан QR кодыг сканнердаарай!',
    });

    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#f59e0b', '#dc2626', '#10b981'],
      });
    } catch {
      // ignore
    }

    setIsSubmitting(true);

    setTimeout(() => {
      onSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* 64-bit Retro Pirate Riddle Scroll / Wooden Chest Frame */}
      <div className="w-full max-w-md pirate-panel-parchment rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Corner brass rivets */}
        <div className="pirate-corner-rivet top-2 left-2" />
        <div className="pirate-corner-rivet top-2 right-2" />
        <div className="pirate-corner-rivet bottom-2 left-2" />
        <div className="pirate-corner-rivet bottom-2 right-2" />

        {/* Top Header Banner */}
        <div className="flex items-center justify-between mb-4 border-b-2 border-[#b38b55]/40 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3d2413] text-amber-300 border-2 border-[#b45309] text-xs font-black font-cinzel shadow-sm">
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span>Шалгах цэг #{checkpoint.step_number} таавар</span>
          </div>
          <span className="text-xs text-[#5c371c] font-black font-medieval tracking-wide">
            {checkpoint.title.split('(')[0]}
          </span>
        </div>

        {/* Riddle Header with Adventure typography for title, crisp sans-serif for the question */}
        <div className="mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-md flex-shrink-0 mt-0.5">
              <div className="w-full h-full bg-[#271409] rounded-[10px] flex items-center justify-center text-amber-300">
                <HelpCircle className="w-5 h-5" />
              </div>
            </div>
            <div>
              {/* Crisp readable sans-serif font specifically for the question text */}
              <h3 className="text-base font-extrabold text-[#241306] leading-snug font-sans">
                {checkpoint.question}
              </h3>
              <p className="text-[11px] text-[#704620] mt-1 font-sans">
                Шалгах цэгийн QR кодыг нээхийн тулд тааварт зөв хариулна уу!
              </p>
            </div>
          </div>
        </div>

        {/* Answer Options (Chunky beveled buttons with crisp readable sans-serif) */}
        <div className="space-y-2.5 mb-5 font-sans">
          {options.length > 0 ? (
            options.map((option, idx) => {
              const isSelected = selectedOption === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundFX.playButtonTap();
                    setSelectedOption(option);
                    setFeedback({ status: null, message: '' });
                  }}
                  disabled={isSubmitting || feedback.status === 'correct'}
                  className={`w-full text-left p-3.5 rounded-2xl font-semibold text-sm transition-all border-2 flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-100/90 border-[#b45309] text-[#2b1708] shadow-md ring-2 ring-amber-500/40'
                      : 'bg-white/80 border-[#c4a67b] text-[#331c0a] hover:bg-white hover:border-[#854d0e]'
                  }`}
                >
                  <span className="leading-snug">{option}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ml-2 ${
                      isSelected
                        ? 'border-[#78350f] bg-amber-500 text-[#1f1105] font-black'
                        : 'border-[#a88252] bg-amber-50/50'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </button>
              );
            })
          ) : (
            <div>
              <input
                type="text"
                placeholder="Хариултаа энд бичнэ үү..."
                value={textAnswer}
                onChange={(e) => {
                  setTextAnswer(e.target.value);
                  setFeedback({ status: null, message: '' });
                }}
                disabled={isSubmitting || feedback.status === 'correct'}
                className="w-full px-4 py-3.5 bg-white/90 border-2 border-[#b38b55] rounded-2xl text-[#2b1708] placeholder-[#8c653d] focus:outline-none focus:border-[#78350f] text-base font-semibold shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Feedback alert with 90s console styling */}
        {feedback.status && (
          <div
            className={`p-3.5 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2.5 ${
              feedback.status === 'correct'
                ? 'bg-emerald-900/90 border-2 border-emerald-500 text-emerald-100 animate-in fade-in shadow-lg'
                : 'bg-rose-900/90 border-2 border-rose-500 text-rose-100 animate-shake shadow-lg'
            }`}
          >
            {feedback.status === 'correct' ? (
              <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-300 flex-shrink-0" />
            )}
            <span className="font-sans leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Action buttons (Chunky 90s console beveled buttons) */}
        <div className="flex gap-3">
          {feedback.status !== 'correct' && (
            <button
              onClick={() => {
                soundFX.playButtonTap();
                onClose();
              }}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl btn-pirate-wood text-xs font-bold"
            >
              Буцах
            </button>
          )}

          <button
            onClick={handleAnswerSubmit}
            disabled={isSubmitting || feedback.status === 'correct'}
            className="flex-1 py-3.5 px-4 btn-pirate-gold text-sm font-black flex items-center justify-center gap-2 rounded-2xl disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Шалгаж байна...</span>
              </>
            ) : feedback.status === 'correct' ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>Амжилттай!</span>
              </>
            ) : (
              <>
                <span>Хариулах</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
