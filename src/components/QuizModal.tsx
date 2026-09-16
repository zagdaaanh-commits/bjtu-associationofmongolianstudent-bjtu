'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Checkpoint, Team } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { HelpCircle, CheckCircle, XCircle, ArrowRight, Loader2, Award } from 'lucide-react';

interface QuizModalProps {
  checkpoint: Checkpoint;
  team: Team;
  totalCheckpoints: number;
  onSuccess: (isFinal: boolean) => void;
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

  const options: string[] = Array.isArray(checkpoint.options)
    ? checkpoint.options
    : typeof checkpoint.options === 'string'
    ? JSON.parse(checkpoint.options)
    : [];

  const handleAnswerSubmit = async () => {
    const givenAnswer = (options.length > 0 ? selectedOption : textAnswer).trim();

    if (!givenAnswer) {
      setFeedback({
        status: 'incorrect',
        message: 'Хариултаа сонгоно уу эсвэл бичнэ үү!',
      });
      return;
    }

    // Compare answer (case-insensitive and trimmed)
    const isCorrect =
      givenAnswer.toLowerCase().trim() ===
      checkpoint.correct_answer.toLowerCase().trim();

    if (!isCorrect) {
      setFeedback({
        status: 'incorrect',
        message: 'Хариулт буруу байна! Багаараа дахин ярилцаад хариулна уу.',
      });
      return;
    }

    // Correct! Show celebratory feedback
    setFeedback({
      status: 'correct',
      message: 'Зөв хариуллаа! Маш сайн байна!',
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setIsSubmitting(true);

    try {
      const nextStep = checkpoint.step_number;
      const isFinal = nextStep >= totalCheckpoints;

      // 1. Record submission in submissions table
      const { error: subError } = await supabase.from('submissions').insert({
        team_id: team.id,
        checkpoint_id: checkpoint.id,
      });

      if (subError && !subError.message.includes('unique')) {
        console.error('Submission insert error:', subError);
      }

      // 2. Update team status and step
      const updateData: Partial<Team> = {
        current_step: nextStep,
      };

      if (isFinal) {
        updateData.status = 'finished';
        updateData.finished_at = new Date().toISOString();
      }

      const { error: teamError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', team.id);

      if (teamError) {
        throw teamError;
      }

      setTimeout(() => {
        onSuccess(isFinal);
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Progress update error:', error);
      setFeedback({
        status: 'incorrect',
        message: 'Ахиц хадгалахад алдаа гарлаа: ' + error.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Top accent badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Шалгах цэг #{checkpoint.step_number} даалгавар</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {checkpoint.title}
          </span>
        </div>

        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 flex-shrink-0 mt-0.5">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {checkpoint.question}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                QR код амжилттай уншигдлаа! Дараагийн цэг рүү шилжихийн тулд зөв хариулна уу.
              </p>
            </div>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-2.5 mb-6">
          {options.length > 0 ? (
            options.map((option, idx) => {
              const isSelected = selectedOption === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedOption(option);
                    setFeedback({ status: null, message: '' });
                  }}
                  disabled={isSubmitting || feedback.status === 'correct'}
                  className={`w-full text-left p-3.5 rounded-2xl font-medium text-sm transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <span>{option}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold'
                        : 'border-slate-600'
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
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm"
              />
            </div>
          )}
        </div>

        {/* Feedback alert */}
        {feedback.status && (
          <div
            className={`p-3.5 rounded-2xl mb-4 text-xs font-medium flex items-center gap-2.5 ${
              feedback.status === 'correct'
                ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300 animate-in fade-in'
                : 'bg-rose-950/70 border border-rose-700 text-rose-300 animate-shake'
            }`}
          >
            {feedback.status === 'correct' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="flex gap-3">
          {feedback.status !== 'correct' && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Буцах
            </button>
          )}

          <button
            onClick={handleAnswerSubmit}
            disabled={isSubmitting || feedback.status === 'correct'}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-98 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Шалгаж байна...
              </>
            ) : feedback.status === 'correct' ? (
              <>
                <CheckCircle className="w-4 h-4" /> Амжилттай!
              </>
            ) : (
              <>
                Хариулах <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
