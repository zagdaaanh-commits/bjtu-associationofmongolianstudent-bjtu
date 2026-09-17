'use client';

import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Team, Checkpoint, Submission } from '@/types/database';
import { formatElapsedTime, formatDateTime } from '@/lib/utils';
import { dataService, SEED_CHECKPOINTS, PRECONFIGURED_TEAMS, getShipForTeam } from '@/lib/dataService';
import { soundFX } from '@/lib/soundEffects';
import ShipVisual from '@/components/ShipVisual';
import Link from 'next/link';
import {
  Shield,
  Users,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FastForward,
  Trash2,
  QrCode,
  Printer,
  Sparkles,
  Eye,
  X,
  Radio,
  Compass,
  ExternalLink,
  Lock,
  KeyRound,
  Anchor,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';

export default function AdminDashboardPage() {
  // Admin Passcode Protection (1896)
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(SEED_CHECKPOINTS);
  const [, setSubmissions] = useState<Submission[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ teamName: string; url: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'ships' | 'leaderboard' | 'qrcodes'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [, setCurrentTime] = useState<number>(Date.now());
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // 1. Fetch data from dataService (handles Supabase + local cache)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tData, cpData, subData] = await Promise.all([
        dataService.getTeams(),
        dataService.getCheckpoints(),
        dataService.getSubmissions(),
      ]);

      if (tData) setTeams(tData);
      if (cpData && cpData.length > 0) setCheckpoints(cpData);
      if (subData) setSubmissions(subData);
    } catch (err) {
      console.error('Fetch admin error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check stored admin session
  useEffect(() => {
    try {
      const auth = sessionStorage.getItem('scavenger_admin_auth');
      if (auth === '1896') {
        setIsAdminAuth(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playButtonTap();

    if (adminPinInput.trim() === '1896') {
      try {
        sessionStorage.setItem('scavenger_admin_auth', '1896');
      } catch {
        // ignore
      }
      setIsAdminAuth(true);
      setAdminPinError(null);
      soundFX.playChestOpen();
    } else {
      soundFX.playWrong();
      setAdminPinError('Админ нууц код буруу байна!');
    }
  };

  const handleAdminLogout = () => {
    soundFX.playButtonTap();
    try {
      sessionStorage.removeItem('scavenger_admin_auth');
    } catch {
      // ignore
    }
    setIsAdminAuth(false);
    setAdminPinInput('');
  };

  useEffect(() => {
    if (isAdminAuth) {
      fetchData();
      dataService.seedPreconfiguredTeams().then((seeded) => {
        if (seeded && seeded.length > 0) {
          setTeams(seeded);
        }
      });
    }
  }, [isAdminAuth, fetchData]);

  // 2. Realtime subscription (Supabase Realtime on teams table and admin sync bus)
  useEffect(() => {
    if (!isAdminAuth) return;

    const unsubscribeTeams = dataService.subscribeToTeamsChanges(() => {
      fetchData();
    });

    const unsubscribeAdmin = dataService.subscribeToAdmin(() => {
      fetchData();
    });

    // Fallback sync interval in case remote WebSocket disconnects
    const fallbackSync = setInterval(() => {
      fetchData();
    }, 4000);

    return () => {
      unsubscribeTeams();
      unsubscribeAdmin();
      clearInterval(fallbackSync);
    };
  }, [isAdminAuth, fetchData]);

  // 3. Live timer trigger interval for leaderboard elapsed timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Generate high-resolution offline QR codes for printing
  useEffect(() => {
    checkpoints.forEach((cp) => {
      QRCode.toDataURL(cp.qr_token, {
        width: 350,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => {
          setQrImages((prev) => ({ ...prev, [cp.qr_token]: url }));
        })
        .catch((err) => {
          console.warn('QR generation error for', cp.qr_token, err);
        });
    });
  }, [checkpoints]);

  // ADMIN ACTION: Approve Team Photo
  const handleApprovePhoto = async (team: Team) => {
    soundFX.playButtonTap();
    try {
      const nowIso = new Date().toISOString();
      const updated = await dataService.updateTeam(team.id, {
        status: 'in_progress',
        started_at: nowIso,
        current_step: 0,
      });

      // Optimistic update
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
      soundFX.playCoin();

      setFeedbackMsg({
        type: 'success',
        text: `"${team.name}" багийн зураг баталгаажиж, тоглоом эхэллээ!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      soundFX.playWrong();
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN ACTION: Reject / Retake Team Photo
  const handleRejectPhoto = async (team: Team) => {
    soundFX.playButtonTap();
    if (!confirm(`"${team.name}" багийн зургийг буцааж, дахин авахуулах уу?`)) return;

    try {
      const updated = await dataService.updateTeam(team.id, {
        initial_photo_url: null,
        status: 'photo_pending',
      });

      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
      soundFX.playWrong();

      setFeedbackMsg({
        type: 'success',
        text: `"${team.name}" багийн зураг цуцлагдлаа. Баг дахин зураг оруулах боломжтой.`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN EMERGENCY ACTION: Force Pass Checkpoint
  const handleForcePass = async (team: Team) => {
    soundFX.playButtonTap();
    const totalCp = checkpoints.length;

    // If team is still in photo_pending, starting game directly
    if (team.status === 'photo_pending') {
      if (
        !confirm(
          `"${team.name}" баг одоогоор зураг баталгаажуулаагүй байна. Шалгах цэг #1-ийг алгасуулан Шалгах цэг #2 руу шууд ахиулах уу?`
        )
      )
        return;

      try {
        const cp1 = checkpoints.find((c) => c.step_number === 1);
        if (cp1) {
          await dataService.recordSubmission(team.id, cp1.id);
        }

        const nowIso = new Date().toISOString();
        const updated = await dataService.updateTeam(team.id, {
          status: 'in_progress',
          started_at: nowIso,
          current_step: 1,
        });

        setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
        soundFX.playDiscoveryJingle();
        setFeedbackMsg({
          type: 'success',
          text: `"${team.name}" багийн Шалгах цэг #1 амжилттай алгасаж, Шалгах цэг #2 руу шилжлээ!`,
        });
        setTimeout(() => setFeedbackMsg(null), 4000);
      } catch (err: unknown) {
        const error = err as Error;
        soundFX.playWrong();
        setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
      }
      return;
    }

    const currentStep = team.current_step;
    const nextStep = currentStep + 1;
    const isFinishing = nextStep >= totalCp;

    if (
      !confirm(
        `"${team.name}" багийг Шалгах цэг #${nextStep} рүү шууд ахиулах уу?${
          isFinishing ? ' (Энэ нь багийг БАРИАНД оруулна)' : ''
        }`
      )
    )
      return;

    try {
      const cp = checkpoints.find((c) => c.step_number === nextStep);
      if (cp) {
        await dataService.recordSubmission(team.id, cp.id);
      }

      const updatePayload: Partial<Team> = {
        current_step: nextStep,
      };

      if (isFinishing) {
        updatePayload.status = 'finished';
        updatePayload.finished_at = new Date().toISOString();
      }

      const updated = await dataService.updateTeam(team.id, updatePayload);
      setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
      soundFX.playDiscoveryJingle();

      setFeedbackMsg({
        type: 'success',
        text: `"${team.name}" багийн алхам амжилттай шинэчлэгдлээ!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      soundFX.playWrong();
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN EMERGENCY ACTION: Reset Team
  const handleResetTeam = async (team: Team) => {
    soundFX.playButtonTap();
    if (!confirm(`"${team.name}" багийн явцыг эхлэл рүү буцаах уу?`)) return;

    try {
      const updated = await dataService.resetTeam(team.id);
      if (updated) {
        setTeams((prev) => prev.map((t) => (t.id === team.id ? updated : t)));
      }
      setFeedbackMsg({ type: 'success', text: `"${team.name}" баг дахин тохируулагдлаа.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN ACTION: Delete Team
  const handleDeleteTeam = async (team: Team) => {
    soundFX.playButtonTap();
    if (!confirm(`"${team.name}" багийг бүр мөсөн устгах уу?`)) return;

    try {
      await dataService.deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      setFeedbackMsg({ type: 'success', text: `"${team.name}" баг устгагдлаа.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // Sorted teams for leaderboard
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.status === 'finished' && b.status === 'finished') {
      const timeA =
        new Date(a.finished_at || 0).getTime() - new Date(a.started_at || 0).getTime();
      const timeB =
        new Date(b.finished_at || 0).getTime() - new Date(b.started_at || 0).getTime();
      return timeA - timeB;
    }
    if (a.status === 'finished') return -1;
    if (b.status === 'finished') return 1;
    if (a.status === 'in_progress' && b.status === 'in_progress') {
      if (b.current_step !== a.current_step) {
        return b.current_step - a.current_step;
      }
      return new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime();
    }
    if (a.status === 'in_progress') return -1;
    if (b.status === 'in_progress') return 1;
    return 0;
  });

  const pendingApprovalTeams = teams.filter(
    (t) => t.status === 'photo_pending' && t.initial_photo_url
  );

  const handleCopyPin = (pin: string) => {
    soundFX.playButtonTap();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
    }
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  // VIEW: ADMIN PASSCODE LOCK SCREEN (CODE: 1896)
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#140b06] text-[#f6ecda] flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-black">
        <div className="w-full max-w-md pirate-panel-wood rounded-3xl p-8 shadow-2xl relative">
          <div className="pirate-corner-rivet top-2 left-2" />
          <div className="pirate-corner-rivet top-2 right-2" />
          <div className="pirate-corner-rivet bottom-2 left-2" />
          <div className="pirate-corner-rivet bottom-2 right-2" />

          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-xl mb-3">
              <div className="p-3 bg-[#271409] rounded-[14px] text-amber-300">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-amber-300 font-medieval tracking-wide">
              Админ эрхээр нэвтрэх
            </h1>
            <p className="text-xs text-[#deb887] mt-1.5 leading-relaxed font-sans">
              Зөвхөн зохион байгуулагчид зориулагдсан удирдлагын хэсэг. 4 оронтой нууц кодоо оруулна уу.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-200 mb-2 font-cinzel">
                Зохион байгуулагчийн нууц код
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Нууц код"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 pirate-input rounded-2xl placeholder-[#8c653d] text-center text-lg font-mono font-bold tracking-widest"
                  autoFocus
                  required
                />
              </div>
            </div>

            {adminPinError && (
              <div className="p-3 bg-red-950/80 border-2 border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{adminPinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl btn-pirate-gold text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl"
            >
              <span>Нэвтрэх (Unlock)</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#3d2413] text-center">
            <Link
              href="/"
              className="text-xs text-[#deb887] hover:text-amber-300 underline font-sans"
            >
              ← Тоглогчийн үндсэн дэлгэц рүү буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140b06] text-[#f6ecda] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#221309]/95 border-b-3 border-[#5c371c] px-6 py-4 sticky top-0 z-30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#271409] rounded-[10px] flex items-center justify-center text-amber-300">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-amber-300 font-cinzel">
                Админ Хяналтын Самбар
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[11px] font-bold font-mono">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE REALTIME
              </span>
            </div>
            <p className="text-xs text-[#deb887]">
              Эрдэнэсийн эрэл · Хайдян Парк 2026 · BJTU Монгол Оюутны Холбоо
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Actions (Chunky Retro Buttons) */}
        <div className="flex items-center gap-2">
          <div className="bg-[#120703] p-1 rounded-xl flex border border-[#5c371c] text-xs">
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setActiveTab('overview');
              }}
              className={`px-3.5 py-2 rounded-lg font-black transition-all ${
                activeTab === 'overview'
                  ? 'btn-pirate-gold'
                  : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              Зураг батлах ({pendingApprovalTeams.length})
            </button>
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setActiveTab('ships');
              }}
              className={`px-3.5 py-2 rounded-lg font-black transition-all ${
                activeTab === 'ships'
                  ? 'btn-pirate-gold'
                  : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              5 Хөлөг & Кодууд
            </button>
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setActiveTab('leaderboard');
              }}
              className={`px-3.5 py-2 rounded-lg font-black transition-all ${
                activeTab === 'leaderboard'
                  ? 'btn-pirate-gold'
                  : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              Манлайлагчид ({teams.length})
            </button>
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setActiveTab('qrcodes');
              }}
              className={`px-3.5 py-2 rounded-lg font-black transition-all ${
                activeTab === 'qrcodes'
                  ? 'btn-pirate-gold'
                  : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              Хэвлэх QR ({checkpoints.length})
            </button>
          </div>

          <button
            onClick={() => {
              soundFX.playButtonTap();
              fetchData();
            }}
            disabled={isLoading}
            className="p-2.5 rounded-xl btn-pirate-wood text-amber-300 shadow-md"
            title="Шинэчлэх"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/"
            target="_blank"
            className="p-2.5 rounded-xl btn-pirate-wood text-amber-300 shadow-md flex items-center gap-1.5 text-xs font-bold"
            title="Тоглоомын дэлгэц нээх"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Тоглоом</span>
          </Link>

          <button
            onClick={handleAdminLogout}
            className="p-2.5 rounded-xl btn-pirate-wood text-rose-400 shadow-md flex items-center gap-1 text-xs font-bold"
            title="Админ эрхээс гарах"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Гарах</span>
          </button>
        </div>
      </header>

      {/* Global Alert */}
      {feedbackMsg && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-2xl border-2 text-xs font-bold flex items-center justify-between shadow-lg ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content Body */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: OVERVIEW & REALTIME PHOTO APPROVAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="pirate-panel-wood rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#deb887] font-semibold">Нийт бүртгэгдсэн баг</p>
                  <p className="text-2xl font-black text-amber-300 mt-1 font-medieval">
                    {teams.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="pirate-panel-wood rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-400 font-semibold">Зураг батлах хүлээгдэж буй</p>
                  <p className="text-2xl font-black text-amber-400 mt-1 font-medieval">
                    {pendingApprovalTeams.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="pirate-panel-wood rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#deb887] font-semibold">Эрлийн явцад байгаа</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1 font-medieval">
                    {teams.filter((t) => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="pirate-panel-wood rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#deb887] font-semibold">Барианд орсон багууд</p>
                  <p className="text-2xl font-black text-yellow-300 mt-1 font-medieval">
                    {teams.filter((t) => t.status === 'finished').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center border border-yellow-500/30">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* LIVE REALTIME FEED: PHOTO APPROVAL CARDS */}
            <div className="pirate-panel-wood rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="pirate-corner-rivet top-2 left-2" />
              <div className="pirate-corner-rivet top-2 right-2" />
              <div className="pirate-corner-rivet bottom-2 left-2" />
              <div className="pirate-corner-rivet bottom-2 right-2" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <h2 className="text-lg font-black text-amber-200 font-cinzel">
                    Шууд баталгаажуулалтын урсгал (Photo Approvals)
                  </h2>
                </div>
                <span className="text-xs text-[#deb887] font-mono">
                  {pendingApprovalTeams.length} баг хүлээгдэж байна
                </span>
              </div>

              {pendingApprovalTeams.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-[#5c371c] rounded-2xl bg-[#140b06]/60">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400/70 mx-auto mb-3" />
                  <h3 className="text-base font-black text-amber-200 font-medieval">
                    Одоогоор хүлээгдэж буй багийн зураг байхгүй байна
                  </h3>
                  <p className="text-xs text-[#deb887] mt-1 font-sans">
                    Багууд эхлэхийн өмнөх багийн зургаа илгээх үед энд автоматаар бодит цаг хугацаанд гарч ирнэ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingApprovalTeams.map((t) => (
                    <div
                      key={t.id}
                      className="bg-[#190e07] border-2 border-[#734c26] rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all hover:border-amber-400"
                    >
                      <div className="relative aspect-[4/3] bg-black group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.initial_photo_url || ''}
                          alt={t.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => {
                            soundFX.playButtonTap();
                            setSelectedPhoto({ teamName: t.name, url: t.initial_photo_url || '' });
                          }}
                        />
                        <button
                          onClick={() => {
                            soundFX.playButtonTap();
                            setSelectedPhoto({ teamName: t.name, url: t.initial_photo_url || '' });
                          }}
                          className="absolute top-2 right-2 p-2 rounded-xl bg-black/80 text-amber-300 border border-amber-500/50 hover:bg-black transition-colors"
                          title="Томруулах"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/80 text-[11px] text-amber-300 font-mono border border-amber-500/30">
                          ПИН: #{t.pin_code}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-black text-amber-200 font-medieval">
                            {t.name}
                          </h3>
                          <p className="text-xs text-[#deb887] mt-0.5 font-sans">
                            Бүртгэгдсэн: {formatDateTime(t.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-[#5c371c]">
                          <button
                            onClick={() => handleRejectPhoto(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl btn-pirate-wood text-xs font-black flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Буцаах</span>
                          </button>
                          <button
                            onClick={() => handleApprovePhoto(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl btn-pirate-emerald text-xs font-black flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Зөвшөөрөх</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRE-CONFIGURED 5 PIRATE SHIPS & PIN CODES */}
        {activeTab === 'ships' && (
          <div className="space-y-6">
            <div className="pirate-panel-wood rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
              <div className="pirate-corner-rivet top-2 left-2" />
              <div className="pirate-corner-rivet top-2 right-2" />
              <div className="pirate-corner-rivet bottom-2 left-2" />
              <div className="pirate-corner-rivet bottom-2 right-2" />

              <div>
                <h2 className="text-lg font-black text-amber-300 flex items-center gap-2 font-cinzel">
                  <Anchor className="w-5 h-5 text-amber-400" />
                  Бэлтгэсэн 5 багийн хөлөг онгоц ба нэвтрэх кодууд
                </h2>
                <p className="text-xs text-[#deb887] mt-1 font-sans">
                  Зохион байгуулагчид эдгээр 4 оронтой ПИН кодыг багуудад тарааж өгнө үү. Багууд энэ кодоор шууд нэвтэрнэ!
                </p>
              </div>

              <button
                onClick={async () => {
                  soundFX.playButtonTap();
                  const seeded = await dataService.seedPreconfiguredTeams();
                  setTeams(seeded);
                  soundFX.playCoin();
                  setFeedbackMsg({
                    type: 'success',
                    text: '5 дээрэмчин хөлөг онгоцны багууд амжилттай баталгаажлаа!',
                  });
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className="py-2.5 px-4 rounded-xl btn-pirate-gold text-xs font-black flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Бүх 5 хөлгийг сэргээх / Pre-seed</span>
              </button>
            </div>

            {/* 5 Ships Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRECONFIGURED_TEAMS.map((shipTeam) => {
                const liveTeam = teams.find(
                  (t) => t.pin_code === shipTeam.pin_code || t.name.toLowerCase() === shipTeam.name.toLowerCase()
                );

                return (
                  <div
                    key={shipTeam.pin_code}
                    className="pirate-panel-wood rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="pirate-corner-rivet top-2 left-2" />
                    <div className="pirate-corner-rivet top-2 right-2" />
                    <div className="pirate-corner-rivet bottom-2 left-2" />
                    <div className="pirate-corner-rivet bottom-2 right-2" />

                    <div>
                      {/* Top Header with Ship Name and Big PIN */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-[10px] text-amber-400 uppercase font-mono tracking-wider font-bold block">
                            ДЭЭРЭМЧНИЙ ХӨЛӨГ
                          </span>
                          <h3 className="text-base font-black text-amber-200 font-medieval">
                            {shipTeam.name}
                          </h3>
                        </div>

                        {/* Big 4-digit PIN Box */}
                        <div className="text-right">
                          <button
                            onClick={() => handleCopyPin(shipTeam.pin_code)}
                            className="px-3 py-1.5 rounded-xl bg-[#120703] border-2 border-amber-400 hover:border-yellow-300 text-amber-300 font-mono text-base font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                            title="ПИН кодыг хуулах"
                          >
                            <span>#{shipTeam.pin_code}</span>
                            {copiedPin === shipTeam.pin_code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 3D Ship Render Graphic */}
                      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 border-2 border-[#7a4820] bg-black shadow-xl group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shipTeam.ship_image}
                          alt={shipTeam.ship_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#241309]/90 border border-amber-500/50 text-[10px] text-amber-300 font-bold font-cinzel flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>3D ХӨЛӨГ МОДЕЛЬ</span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 text-[11px] text-amber-100 font-medium truncate drop-shadow-md">
                          {shipTeam.description}
                        </div>
                      </div>

                      {/* Live Team Status Indicator */}
                      <div className="p-3 bg-[#190e07] rounded-xl border border-[#5c371c] mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#deb887]">Одоогийн төлөв:</span>
                          {liveTeam ? (
                            liveTeam.status === 'finished' ? (
                              <span className="font-bold text-emerald-400 flex items-center gap-1 font-cinzel">
                                <CheckCircle2 className="w-3.5 h-3.5" /> БАРИАНД ОРСОН
                              </span>
                            ) : liveTeam.status === 'in_progress' ? (
                              <span className="font-bold text-amber-400 flex items-center gap-1 font-cinzel">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                Алхам {liveTeam.current_step + 1} / 5
                              </span>
                            ) : liveTeam.initial_photo_url ? (
                              <span className="font-bold text-sky-400 font-cinzel">
                                Зураг хүлээгдэж буй
                              </span>
                            ) : (
                              <span className="font-bold text-[#deb887] font-cinzel">
                                Зураг аваагүй
                              </span>
                            )
                          ) : (
                            <span className="text-amber-500/80 font-cinzel font-bold">Бэлэн</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyPin(shipTeam.pin_code)}
                        className="flex-1 py-2.5 px-3 rounded-xl btn-pirate-gold text-xs font-black flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPin === shipTeam.pin_code ? 'Хуулагдлаа!' : 'Код хуулах'}</span>
                      </button>
                      {liveTeam && liveTeam.status !== 'photo_pending' && (
                        <button
                          onClick={() => handleResetTeam(liveTeam)}
                          className="py-2.5 px-3 rounded-xl btn-pirate-wood text-xs font-bold text-amber-300"
                          title="Багийг дахин эхлүүлэх"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE LEADERBOARD & EMERGENCY CONTROLS */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="pirate-panel-wood rounded-3xl p-6 shadow-xl overflow-hidden relative">
              <div className="pirate-corner-rivet top-2 left-2" />
              <div className="pirate-corner-rivet top-2 right-2" />
              <div className="pirate-corner-rivet bottom-2 left-2" />
              <div className="pirate-corner-rivet bottom-2 right-2" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-amber-300 flex items-center gap-2 font-cinzel">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Шууд Манлайлагчдын Самбар (Live Leaderboard)
                  </h2>
                  <p className="text-xs text-[#deb887] mt-1 font-sans">
                    Багуудын алхам, зарцуулсан хугацаа болон яаралтай тусламжийн удирдлага
                  </p>
                </div>
                <div className="text-xs text-amber-300 bg-[#120703] px-3.5 py-2 rounded-xl border border-[#7a4b27] font-mono">
                  Нийт: {sortedTeams.length} баг
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#5c371c] text-[11px] font-black text-amber-400 uppercase tracking-wider font-cinzel">
                      <th className="pb-3 pl-3">Байр</th>
                      <th className="pb-3">Баг</th>
                      <th className="pb-3">Төлөв</th>
                      <th className="pb-3">Явц</th>
                      <th className="pb-3">Хугацаа</th>
                      <th className="pb-3">Эхэлсэн</th>
                      <th className="pb-3 text-right pr-3">Яаралтай удирдлага</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#452712]/60">
                    {sortedTeams.map((team, index) => {
                      const totalSteps = checkpoints.length;
                      const progressPct = Math.min(100, Math.round((team.current_step / totalSteps) * 100));
                      const isFinished = team.status === 'finished';
                      const isRunning = team.status === 'in_progress';
                      const elapsed = formatElapsedTime(team.started_at, team.finished_at);

                      return (
                        <tr key={team.id} className="hover:bg-[#221309]/50 transition-colors">
                          <td className="py-4 pl-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                index === 0 && isFinished
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                  : index === 1 && isFinished
                                  ? 'bg-slate-300 text-slate-950'
                                  : index === 2 && isFinished
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-[#120703] text-[#deb887] border border-[#5c371c]'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>

                          <td className="py-4 font-bold text-amber-100 font-medieval text-base">
                            <div className="flex items-center gap-2">
                              <span>{team.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#120703] text-amber-400 font-mono border border-[#5c371c]">
                                #{team.pin_code}
                              </span>
                            </div>
                          </td>

                          <td className="py-4">
                            {isFinished ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold inline-flex items-center gap-1 font-cinzel">
                                <CheckCircle2 className="w-3.5 h-3.5" /> БАРИА
                              </span>
                            ) : isRunning ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-bold inline-flex items-center gap-1 font-cinzel">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Эрэлд
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-[#120703] text-amber-400/80 border border-[#5c371c] text-xs font-bold font-cinzel">
                                Хүлээгдэж буй
                              </span>
                            )}
                          </td>

                          <td className="py-4 min-w-[160px]">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-[#deb887]">
                                <span>{team.current_step} / {totalSteps} цэг</span>
                                <span className="font-bold text-amber-300 font-mono">{progressPct}%</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-[#120703] border border-[#5c371c] overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    isFinished
                                      ? 'bg-emerald-400'
                                      : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 font-mono font-bold text-amber-300 text-base">
                            {isRunning || isFinished ? elapsed : '-'}
                          </td>

                          <td className="py-4 text-xs text-[#deb887] font-sans">
                            {formatDateTime(team.started_at)}
                          </td>

                          {/* Emergency Controls for this team */}
                          <td className="py-4 pr-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Force Pass Checkpoint */}
                              {!isFinished && (
                                <button
                                  onClick={() => handleForcePass(team)}
                                  className="px-2.5 py-1.5 rounded-xl btn-pirate-gold text-xs font-black flex items-center gap-1"
                                  title="Шалгах цэгийг алгасуулах"
                                >
                                  <FastForward className="w-3.5 h-3.5" />
                                  <span>Давуулах</span>
                                </button>
                              )}

                              {/* Reset */}
                              <button
                                onClick={() => handleResetTeam(team)}
                                className="p-2 rounded-xl btn-pirate-wood text-amber-300"
                                title="Явцыг дахин эхлүүлэх"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteTeam(team)}
                                className="p-2 rounded-xl btn-pirate-wood text-rose-400"
                                title="Багийг устгах"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {sortedTeams.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#deb887] text-xs font-sans">
                          Одоогоор нэг ч баг бүртгэгдээгүй байна.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRINTABLE QR CODES STATION */}
        {activeTab === 'qrcodes' && (
          <div className="space-y-6">
            <div className="pirate-panel-wood rounded-3xl p-6 shadow-xl flex items-center justify-between relative overflow-hidden print:hidden">
              <div className="pirate-corner-rivet top-2 left-2" />
              <div className="pirate-corner-rivet top-2 right-2" />
              <div className="pirate-corner-rivet bottom-2 left-2" />
              <div className="pirate-corner-rivet bottom-2 right-2" />

              <div>
                <h2 className="text-lg font-black text-amber-300 flex items-center gap-2 font-cinzel">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  Хайдян паркт байршуулах QR Кодууд
                </h2>
                <p className="text-xs text-[#deb887] mt-1 font-sans">
                  Эдгээр QR кодыг хэвлэж аваад Хайдян паркийн тухайн шалгах цэгүүд дээр наана уу.
                </p>
              </div>
              <button
                onClick={() => {
                  soundFX.playButtonTap();
                  window.print();
                }}
                className="py-3 px-5 rounded-2xl btn-pirate-gold font-black text-xs flex items-center gap-2 shadow-lg transition-colors print:hidden"
              >
                <Printer className="w-4 h-4" />
                <span>Бүгдийг хэвлэх (Print)</span>
              </button>
            </div>

            {/* Printable Cards Grid (Parchment Paper Styling - Exactly 5 pages on print) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block qr-print-page-wrapper">
              {checkpoints.map((cp) => {
                const qrImageSrc =
                  qrImages[cp.qr_token] ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    cp.qr_token
                  )}`;

                return (
                  <div
                    key={cp.id}
                    className="qr-print-card bg-[#fbf5e6] text-[#2b1708] rounded-3xl p-6 shadow-xl border-4 border-[#734c26] flex flex-col items-center text-center relative"
                  >
                    <div className="text-[11px] font-black uppercase tracking-widest text-[#2b1708] bg-[#edd8b4] border border-[#b38b55] px-4 py-1.5 rounded-full mb-2 font-cinzel">
                      BJTU Монгол Оюутны Холбоо
                    </div>
                    <span className="text-xs font-black text-rose-700 uppercase tracking-wider font-medieval">
                      Эрдэнэсийн эрэл · Хайдян Парк (海淀公园)
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#1c0e05] mt-2 mb-2 font-medieval">
                      Шалгах цэг #{cp.step_number}
                    </h3>
                    <p className="text-sm text-[#5c371c] font-bold mb-4 px-2 font-sans">
                      {cp.title}
                    </p>

                    {/* QR Code Graphic */}
                    <div className="p-4 bg-white border-3 border-dashed border-[#b38b55] rounded-3xl shadow-inner mb-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrImageSrc}
                        alt={`QR for ${cp.title}`}
                        className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                      />
                    </div>

                    <div className="bg-[#edd8b4] border-2 border-[#b38b55] rounded-2xl px-5 py-2.5 text-center w-full max-w-sm shadow-sm">
                      <p className="text-[10px] text-[#784c24] uppercase font-mono tracking-wider font-bold">
                        Бичвэр нууц код (камергүй үед гараар бичих):
                      </p>
                      <p className="text-base font-mono font-black text-[#2b1708] tracking-wider mt-0.5">
                        {cp.qr_token}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#deb887] text-xs text-[#784c24] font-mono">
                      Координат: {cp.lat}, {cp.lng}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FULL PHOTO PREVIEW MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[9999] bg-black/92 flex flex-col items-center justify-center p-4 backdrop-blur-md print:hidden"
        >
          <div className="relative max-w-2xl w-full pirate-panel-wood rounded-3xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-base font-black text-amber-200 font-medieval">
                {selectedPhoto.teamName} - Багийн зураг
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 rounded-xl btn-pirate-wood text-amber-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.teamName}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black border-2 border-[#734c26]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
