'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, Checkpoint } from '@/types/database';
import { formatElapsedTime } from '@/lib/utils';
import Map from '@/components/Map';
import PhotoUpload from '@/components/PhotoUpload';
import QRScanner from '@/components/QRScanner';
import QuizModal from '@/components/QuizModal';
import Celebration from '@/components/Celebration';
import {
  Users,
  Compass,
  MapPin,
  QrCode,
  Clock,
  LogOut,
  Sparkles,
  Maximize2,
  X,
  AlertTriangle,
  Lock,
  ChevronRight,
  ShieldCheck,
  Hourglass,
  Info,
} from 'lucide-react';

const FALLBACK_CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    step_number: 1,
    title: 'Хойд хаалганы талбай (North Gate Plaza)',
    hint_image_url: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    lat: 39.9922,
    lng: 116.2942,
    qr_token: 'hd_park_alpha_7x',
    question: 'Бээжингийн Хайдян паркийн нийт газар нутгийн хэмжээ ойролцоогоор хэдэн га вэ?',
    options: ['34 га', '12 га', '68 га', '100 га'],
    correct_answer: '34 га',
  },
  {
    id: 2,
    step_number: 2,
    title: 'Төв ногоон зүлэг ба нээлттэй тайз (Central Lawn)',
    hint_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    lat: 39.9885,
    lng: 116.2940,
    qr_token: 'hd_park_stage_c2',
    question: 'Монгол Оюутны Холбооны энэхүү орьентаци арга хэмжээний гол уриа ямар үгтэй вэ?',
    options: ['Хамтдаа урагшаа', 'Эв нэгдэл ба амжилт', 'Нэг баг, Нэг гэр бүл', 'Ирээдүйн эзэд'],
    correct_answer: 'Нэг баг, Нэг гэр бүл',
  },
  {
    id: 3,
    step_number: 3,
    title: 'Уламжлалт цагаан будааны тариалангийн бүс (Jingxi Rice Field)',
    hint_image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    lat: 39.9868,
    lng: 116.2925,
    qr_token: 'hd_park_rice_j3',
    question: 'Эрт үед Хайдянд зөвхөн хааны ордонд нийлүүлдэг байсан алдартай будааг юу гэдэг байсан бэ?',
    options: ['Юйцюань улаан тариа', 'Жинси хааны будаа (Jingxi Rice)', 'Хар сарнай', 'Манж цагаан'],
    correct_answer: 'Жинси хааны будаа (Jingxi Rice)',
  },
  {
    id: 4,
    step_number: 4,
    title: 'Baidu Apollo AI ухаалаг асар (AI Smart Pavilion)',
    hint_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    lat: 39.9898,
    lng: 116.2965,
    qr_token: 'hd_park_ai_p4',
    question: 'Хайдян паркт туршигдсан жолоочгүй ухаалаг микро автобусыг юу гэж нэрлэдэг вэ?',
    options: ['Apollo', 'Titan', 'Panda AI', 'CyberVoyage'],
    correct_answer: 'Apollo',
  },
  {
    id: 5,
    step_number: 5,
    title: 'Өмнөд бадамлянхуа цөөрөм ба модон гүүр (South Lotus Pond)',
    hint_image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    lat: 39.9855,
    lng: 116.2952,
    qr_token: 'hd_park_lotus_s5',
    question: 'Эрдэнэсийн эрэлд багийн бүх гишүүд эв санаагаа нэгтгэн даалгавраа бүрэн биелүүлж чадсан уу?',
    options: ['Тийм ээ, баг хамтдаа ялсан!', 'Мэдээж, бид шилдэг нь!', 'Баяр хүргэе!'],
    correct_answer: 'Тийм ээ, баг хамтдаа ялсан!',
  },
];

export default function MobilePlayerPage() {
  // Authentication & Session
  const [team, setTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [teamNameInput, setTeamNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPendingAuth, startAuthTransition] = useTransition();

  // Checkpoints & Game state
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(FALLBACK_CHECKPOINTS);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [hidePinOnScan, setHidePinOnScan] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null);

  // Live timer state
  const [elapsedTimer, setElapsedTimer] = useState<string>('00:00');

  // User location GPS
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Fetch checkpoints from Supabase
  const loadCheckpoints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .order('step_number', { ascending: true });

      if (data && data.length > 0 && !error) {
        setCheckpoints(data);
      }
    } catch (err) {
      console.warn('Using fallback checkpoints:', err);
    }
  }, []);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  // 2. Load stored session from localStorage on mount
  useEffect(() => {
    const savedTeamId = localStorage.getItem('scavenger_team_id');
    if (savedTeamId) {
      supabase
        .from('teams')
        .select('*')
        .eq('id', savedTeamId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setTeam(data);
          } else {
            localStorage.removeItem('scavenger_team_id');
          }
        });
    }
  }, []);

  // 3. Supabase Realtime subscription for team state updates
  useEffect(() => {
    if (!team?.id) return;

    const channel = supabase
      .channel(`team-${team.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${team.id}`,
        },
        (payload) => {
          const updated = payload.new as Team;
          setTeam(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team?.id]);

  // 4. Update active checkpoint based on team.current_step
  useEffect(() => {
    if (!team || team.status !== 'in_progress') {
      setActiveCheckpoint(null);
      return;
    }

    const currentStepNum = team.current_step + 1; // current_step starts at 0, next step is 1
    const nextCp = checkpoints.find((cp) => cp.step_number === currentStepNum);
    setActiveCheckpoint(nextCp || null);
    setHidePinOnScan(false); // Reset pin visibility when moving to new step
  }, [team, checkpoints]);

  // 5. Live elapsed timer interval
  useEffect(() => {
    if (!team?.started_at || team.status !== 'in_progress') {
      if (team?.status === 'finished') {
        setElapsedTimer(formatElapsedTime(team.started_at, team.finished_at));
      }
      return;
    }

    const interval = setInterval(() => {
      setElapsedTimer(formatElapsedTime(team.started_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [team?.started_at, team?.finished_at, team?.status]);

  // Geolocation tracker
  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Team creation handler
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim() || pinInput.length !== 4) {
      setAuthError('Багийн нэр болон 4 оронтой ПИН кодоо оруулна уу!');
      return;
    }
    setAuthError(null);

    startAuthTransition(async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .insert({
            name: teamNameInput.trim(),
            pin_code: pinInput.trim(),
            current_step: 0,
            status: 'photo_pending',
          })
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem('scavenger_team_id', data.id);
        setTeam(data);
      } catch (err: unknown) {
        const error = err as Error;
        setAuthError(error.message || 'Баг бүртгэхэд алдаа гарлаа.');
      }
    });
  };

  // Team join handler
  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim() || pinInput.length !== 4) {
      setAuthError('Багийн нэр болон 4 оронтой ПИН кодоо оруулна уу!');
      return;
    }
    setAuthError(null);

    startAuthTransition(async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .ilike('name', teamNameInput.trim())
          .eq('pin_code', pinInput.trim())
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setAuthError('Багийн нэр эсвэл ПИН код буруу байна!');
          return;
        }

        localStorage.setItem('scavenger_team_id', data.id);
        setTeam(data);
      } catch (err: unknown) {
        const error = err as Error;
        setAuthError(error.message || 'Нэвтрэхэд алдаа гарлаа.');
      }
    });
  };

  const handleLogout = () => {
    if (confirm('Та системээс гарахдаа итгэлтэй байна уу?')) {
      localStorage.removeItem('scavenger_team_id');
      setTeam(null);
    }
  };

  // QR verification callback
  const handleQRScanned = (scannedText: string) => {
    if (!activeCheckpoint) return;

    if (scannedText.trim() === activeCheckpoint.qr_token.trim()) {
      // 1. Close scanner modal
      setShowQRScanner(false);
      setQrErrorMessage(null);

      // 2. Hide map pin immediately as requested by spec!
      setHidePinOnScan(true);

      // 3. Open quiz modal
      setShowQuizModal(true);
    } else {
      setQrErrorMessage(
        `Буруу QR код уншигдлаа (${scannedText}). Одоогийн шалгах цэгийн QR кодыг шалгана уу!`
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-slate-950 text-slate-100 shadow-2xl relative">
      {/* 1. ONBOARDING SCREEN (CREATE OR JOIN TEAM) */}
      {!team && (
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-2xl shadow-amber-500/30 mb-4">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400">
                <Compass className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              BJTU МОНГОЛ ОЮУТНЫ ХОЛБОО
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Эрдэнэсийн эрэл
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Бээжин · Хайдян Парк (海淀公园) 2026
            </p>
          </div>

          {/* Tab buttons */}
          <div className="bg-slate-900/80 p-1 rounded-2xl flex border border-slate-800 mb-6">
            <button
              onClick={() => {
                setActiveTab('create');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Баг бүртгэх
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'join'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ПИН кодоор орох
            </button>
          </div>

          <form
            onSubmit={activeTab === 'create' ? handleCreateTeam : handleJoinTeam}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Багийн нэр
              </label>
              <div className="relative">
                <Users className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Жишээ нь: Шонхрууд"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                4 оронтой ПИН код
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="4 тоо (жишээ: 1234)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-mono tracking-widest"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Багийн гишүүд энэ кодоор зэрэг нэвтэрч оролцоно.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPendingAuth}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <span>{activeTab === 'create' ? 'Баг бүртгүүлж эхлэх' : 'Тоглоомд нэвтрэх'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 2. LOGGED IN FLOW */}
      {team && (
        <div className="flex-1 flex flex-col">
          {/* Top Sticky Status Bar */}
          <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                {team.current_step + 1}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{team.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    #{team.pin_code}
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-amber-400 font-mono">
                    <Clock className="w-3 h-3" /> {elapsedTimer}
                  </span>
                  <span>•</span>
                  <span>
                    Алхам {Math.min(team.current_step, checkpoints.length)} / {checkpoints.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Гарах"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          {/* MAIN VIEW SWITCHER */}
          <main className="flex-1 flex flex-col">
            {/* STEP 0: PHOTO PENDING (BEFORE ADMIN APPROVAL) */}
            {team.status === 'photo_pending' && (
              <div className="p-4 flex-1 flex flex-col justify-center space-y-4">
                <div className="text-center space-y-2 mb-2">
                  <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-white">
                    Алхам 0: Багийн баталгаажуулалт
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                    “Орцны өмнө багийн зургаа бүтэн оруулан дарж илгээнэ үү”
                  </p>
                </div>

                {!team.initial_photo_url ? (
                  <PhotoUpload
                    teamId={team.id}
                    onPhotoUploaded={(url) => {
                      setTeam({
                        ...team,
                        initial_photo_url: url,
                        status: 'photo_pending',
                      });
                    }}
                  />
                ) : (
                  /* WAITING FOR ADMIN APPROVAL MODE */
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      <Hourglass className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-amber-400">
                        Зөвшөөрөл хүлээж байна...
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Админ багийн зургийг шалгаж баталгаажуулмагц тоглоом шууд автоматаар эхэлнэ. Хуудсыг дахин ачаалах шаардлагагүй.
                      </p>
                    </div>

                    <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-slate-800 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.initial_photo_url}
                        alt="Илгээсэн багийн зураг"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-amber-300/80 bg-amber-500/10 py-2.5 px-4 rounded-xl border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Бодит цагийн холболт идэвхтэй байна</span>
                    </div>

                    <button
                      onClick={() => {
                        // Allow re-taking photo if needed
                        setTeam({ ...team, initial_photo_url: null });
                      }}
                      className="text-xs text-slate-400 underline hover:text-slate-200 pt-2"
                    >
                      Зургийг солих / Дахин авах
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1..N: ACTIVE SCAVENGER HUNT */}
            {team.status === 'in_progress' && activeCheckpoint && (
              <div className="flex-1 flex flex-col h-[calc(100vh-65px)]">
                {/* 1. Map Section (Displays Haidian Park and ONLY active checkpoint pin) */}
                <div className="h-[42vh] min-h-[250px] w-full p-3 relative">
                  <Map
                    checkpoint={hidePinOnScan ? null : activeCheckpoint}
                    userPosition={userLocation}
                    onLocateUser={handleLocateUser}
                  />
                </div>

                {/* 2. Visual Hint & Clue Card */}
                <div className="flex-1 px-4 pb-4 overflow-y-auto space-y-3">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Шалгах цэг #{activeCheckpoint.step_number}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {activeCheckpoint.title.split('(')[0]}
                      </span>
                    </div>

                    {/* Hint Image thumbnail */}
                    {activeCheckpoint.hint_image_url && (
                      <div
                        onClick={() => setZoomedImage(activeCheckpoint.hint_image_url)}
                        className="relative rounded-xl overflow-hidden aspect-[16/9] mb-3 border border-slate-800 cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeCheckpoint.hint_image_url}
                          alt="Шалгах цэгийн сэжүүр зураг"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 right-2 bg-slate-950/80 p-1.5 rounded-lg text-white backdrop-blur-sm">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded-md text-[10px] text-amber-300 font-medium">
                          Сэжүүр зураг (томруулах)
                        </div>
                      </div>
                    )}

                    {/* Clue instructions */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Газрын зураг болон сэжүүр зургийн тусламжтай уг байршлыг олж очоод, ойр орчимд наасан <strong className="text-amber-400">QR код</strong>-ыг сканнердаарай!
                        </p>
                      </div>
                    </div>
                  </div>

                  {qrErrorMessage && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between">
                      <span>{qrErrorMessage}</span>
                      <button
                        onClick={() => setQrErrorMessage(null)}
                        className="p-1 text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Prominent QR Scanner Button */}
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all active:scale-98 animate-pulse"
                  >
                    <QrCode className="w-6 h-6" />
                    <span>QR СКАННЕРДАХ</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP FINISHED: CELEBRATION */}
            {team.status === 'finished' && (
              <Celebration
                team={team}
                onResetSession={() => {
                  localStorage.removeItem('scavenger_team_id');
                  setTeam(null);
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* MODAL: QR Scanner */}
      {showQRScanner && activeCheckpoint && (
        <QRScanner
          expectedToken={activeCheckpoint.qr_token}
          onScanSuccess={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* MODAL: Checkpoint Quiz */}
      {showQuizModal && activeCheckpoint && team && (
        <QuizModal
          checkpoint={activeCheckpoint}
          team={team}
          totalCheckpoints={checkpoints.length}
          onSuccess={(isFinal) => {
            setShowQuizModal(false);
            if (isFinal) {
              setTeam({
                ...team,
                current_step: activeCheckpoint.step_number,
                status: 'finished',
                finished_at: new Date().toISOString(),
              });
            } else {
              setTeam({
                ...team,
                current_step: activeCheckpoint.step_number,
              });
            }
          }}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {/* MODAL: Zoomed Hint Photo */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Томруулсан зураг"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
