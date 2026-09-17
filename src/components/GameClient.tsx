'use client';

import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { Team, Checkpoint } from '@/types/database';
import { formatElapsedTime } from '@/lib/utils';
import {
  dataService,
  SEED_CHECKPOINTS,
  PRECONFIGURED_TEAMS,
  getShipForTeam,
  PreconfiguredTeam,
} from '@/lib/dataService';
import Map from '@/components/Map';
import PhotoUpload from '@/components/PhotoUpload';
import QRScanner from '@/components/QRScanner';
import QuizModal from '@/components/QuizModal';
import Celebration from '@/components/Celebration';
import ShipVisual from '@/components/ShipVisual';
import { soundFX } from '@/lib/soundEffects';
import Link from 'next/link';
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
  Shield,
  ShieldCheck,
  Hourglass,
  Info,
  HelpCircle,
  Camera,
  CheckCircle2,
  Volume2,
  VolumeX,
  Skull,
  Scroll,
  Anchor,
  KeyRound,
  Check,
} from 'lucide-react';

export default function GameClient() {
  // Authentication & Session
  const [team, setTeam] = useState<Team | null>(null);
  const [authTab, setAuthTab] = useState<'pin' | 'custom'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPendingAuth, startAuthTransition] = useTransition();

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Checkpoints & Game state
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(SEED_CHECKPOINTS);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null);

  // Live timer state
  const [elapsedTimer, setElapsedTimer] = useState<string>('00:00');

  // User location GPS & Device compass heading
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number | null;
    speed?: number | null;
  } | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Initialize sound mute state
  useEffect(() => {
    setIsMuted(soundFX.getMuted());
  }, []);

  const handleToggleSound = () => {
    const nextMute = soundFX.toggleMute();
    setIsMuted(nextMute);
    if (!nextMute) {
      soundFX.playCoin();
    }
  };

  // 1. Fetch checkpoints
  const loadCheckpoints = useCallback(async () => {
    try {
      const data = await dataService.getCheckpoints();
      if (data && data.length > 0) {
        setCheckpoints(data);
      }
    } catch (err) {
      console.warn('Using seed checkpoints:', err);
    }
  }, []);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  // 2. Load stored session from localStorage on mount
  useEffect(() => {
    const savedTeamId = localStorage.getItem('scavenger_team_id');
    if (savedTeamId) {
      dataService.getTeam(savedTeamId).then((t) => {
        if (t) {
          setTeam(t);
        } else {
          localStorage.removeItem('scavenger_team_id');
        }
      });
    }
  }, []);

  // 3. Resilient Realtime subscription for team state updates
  // Automatically transitions team to Step 1 when status becomes in_progress
  useEffect(() => {
    if (!team?.id) return;

    const myTeamId = team.id;
    const teamId = myTeamId;
    const unsubscribe = dataService.subscribeToTeam(teamId, (payload) => {
      // Strict validation check: before calling setTeam or onUpdate, verify if (!payload || payload.id !== teamId) return;
      if (!payload || payload.id !== teamId) return;

      setTeam((prev) => {
        if (!prev || prev.id !== teamId) return prev;
        if (prev.status === 'photo_pending' && payload.status === 'in_progress') {
          soundFX.playChestOpen();
          soundFX.playDiscoveryJingle();
        }
        return payload;
      });
    });

    // Fallback polling when waiting for photo approval
    const pollInterval = setInterval(async () => {
      if (team.status === 'photo_pending') {
        try {
          const payload = await dataService.getTeam(teamId);
          if (!payload || payload.id !== teamId) return;
          if (payload.status === 'in_progress') {
            setTeam(payload);
            soundFX.playChestOpen();
            soundFX.playDiscoveryJingle();
          }
        } catch {
          // ignore
        }
      }
    }, 2500);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [team?.id, team?.status]);

  // 4. Update active checkpoint dynamically from Supabase database based on current_step
  useEffect(() => {
    if (!team || team.status !== 'in_progress') {
      setActiveCheckpoint(null);
      return;
    }

    const currentStepNum = team.current_step + 1;
    dataService.getCheckpointByStep(currentStepNum).then((cp) => {
      if (cp) {
        setActiveCheckpoint(cp);
        setIsQuestionAnswered(false);
      } else if (team.current_step >= checkpoints.length && checkpoints.length > 0) {
        setActiveCheckpoint(null);
        dataService.updateTeam(team.id, {
          status: 'finished',
          finished_at: team.finished_at || new Date().toISOString(),
        });
      }
    });
  }, [team?.current_step, team?.status, checkpoints.length]);

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

  // Geolocation & Device Orientation tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Device compass heading listener
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const iosHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof iosHeading === 'number' && !isNaN(iosHeading)) {
        setDeviceHeading(Math.round(iosHeading));
      } else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        setDeviceHeading(Math.round((360 - e.alpha) % 360));
      }
    };

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    if (!('geolocation' in navigator) || team?.status !== 'in_progress') {
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation((prev) => ({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading:
            pos.coords.heading !== null && !isNaN(pos.coords.heading)
              ? Math.round(pos.coords.heading)
              : prev?.heading,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        }));
      },
      (err) => {
        console.warn('Real-time geolocation watch warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [team?.status]);

  const handleLocateUser = () => {
    soundFX.playButtonTap();
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        ?.requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener(
              'deviceorientation',
              (e: DeviceOrientationEvent) => {
                const iosHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
                if (typeof iosHeading === 'number' && !isNaN(iosHeading)) {
                  setDeviceHeading(Math.round(iosHeading));
                }
              },
              true
            );
          }
        })
        .catch(() => {});
    }
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading:
              pos.coords.heading !== null && !isNaN(pos.coords.heading)
                ? Math.round(pos.coords.heading)
                : null,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
          });
          soundFX.playCoin();
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Direct 4-digit PIN Login (joins assigned ship team)
  const handlePinLogin = (pinToUse?: string) => {
    const pin = (pinToUse || pinInput).trim();
    soundFX.playButtonTap();

    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        ?.requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .catch(() => {});
    }

    if (pin.length !== 4) {
      soundFX.playWrong();
      setAuthError('4 оронтой ПИН кодоо оруулна уу!');
      return;
    }
    setAuthError(null);

    startAuthTransition(async () => {
      try {
        const found = await dataService.loginByPin(pin);
        if (found) {
          localStorage.setItem('scavenger_team_id', found.id);
          setTeam(found);
          soundFX.playChestOpen();
        } else {
          soundFX.playWrong();
          setAuthError('4 оронтой ПИН код олдсонгүй! Админаас өгсөн кодыг шалгана уу.');
        }
      } catch (err: unknown) {
        const error = err as Error;
        soundFX.playWrong();
        setAuthError(error.message || 'Нэвтрэхэд алдаа гарлаа.');
      }
    });
  };

  // Custom Team creation handler
  const handleCreateCustomTeam = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playButtonTap();

    if (!customName.trim() || customPin.length !== 4) {
      soundFX.playWrong();
      setAuthError('Багийн нэр болон 4 оронтой ПИН кодоо оруулна уу!');
      return;
    }
    setAuthError(null);

    startAuthTransition(async () => {
      try {
        const newTeam = await dataService.createTeam(customName, customPin);
        localStorage.setItem('scavenger_team_id', newTeam.id);
        setTeam(newTeam);
        soundFX.playChestOpen();
      } catch (err: unknown) {
        const error = err as Error;
        soundFX.playWrong();
        setAuthError(error.message || 'Баг бүртгэхэд алдаа гарлаа.');
      }
    });
  };

  const handleLogout = () => {
    soundFX.playButtonTap();
    if (confirm('Та системээс гарахдаа итгэлтэй байна уу?')) {
      localStorage.removeItem('scavenger_team_id');
      setTeam(null);
    }
  };

  // QR verification callback
  // Answering question was completed first; scanning QR validates physical arrival and completes step!
  const handleQRScanned = async (scannedText: string) => {
    if (!activeCheckpoint || !team) return;

    if (scannedText.trim() === activeCheckpoint.qr_token.trim()) {
      soundFX.playDiscoveryJingle();
      soundFX.playCoin();
      setShowQRScanner(false);
      setQrErrorMessage(null);

      const nextStep = activeCheckpoint.step_number;
      const isFinal = nextStep >= checkpoints.length;

      try {
        // 1. Record submission
        await dataService.recordSubmission(team.id, activeCheckpoint.id);

        // 2. Update team status and step
        const updateData: Partial<Team> = {
          current_step: nextStep,
        };

        if (isFinal) {
          updateData.status = 'finished';
          updateData.finished_at = new Date().toISOString();
        }

        const updated = await dataService.updateTeam(team.id, updateData);
        setTeam(updated);
        setIsQuestionAnswered(false);
      } catch (e: unknown) {
        console.error('QR submission error:', e);
      }
    } else {
      soundFX.playWrong();
      setQrErrorMessage(
        `Буруу QR код уншигдлаа (${scannedText}). Шалгах цэг #${activeCheckpoint.step_number}-ийн QR кодыг шалгана уу!`
      );
    }
  };

  const teamShip = getShipForTeam(team);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-[#180e07] text-[#f6ecda] shadow-2xl relative border-x-2 border-[#452712]">
      {/* 1. ONBOARDING SCREEN (PIN CODE & 5 PIRATE SHIPS) */}
      {!team && (
        <div className="flex-1 flex flex-col justify-center px-4 py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1 shadow-2xl shadow-amber-500/40 mb-3 border-2 border-amber-300 animate-pulse">
              <div className="w-full h-full bg-[#271409] rounded-[20px] flex items-center justify-center text-amber-300 relative overflow-hidden">
                <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '24s' }} />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#3d2413] text-amber-300 border-2 border-[#b45309] text-xs font-black mb-2 font-cinzel shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              BJTU МОНГОЛ ОЮУТНЫ ХОЛБОО
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-amber-300 font-medieval drop-shadow-md">
              Эрдэнэсийн эрэл
            </h1>
            <p className="text-xs text-[#deb887] mt-1 font-sans">
              Бээжин · Хайдян Парк (海淀公园) 2026
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#120703] p-1.5 rounded-2xl flex border-2 border-[#5c371c] mb-5 shadow-inner">
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setAuthTab('pin');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                authTab === 'pin' ? 'btn-pirate-gold' : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              ПИН кодоор орох
            </button>
            <button
              onClick={() => {
                soundFX.playButtonTap();
                setAuthTab('custom');
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                authTab === 'custom' ? 'btn-pirate-gold' : 'text-[#deb887] hover:text-white font-cinzel'
              }`}
            >
              Шинэ баг үүсгэх
            </button>
          </div>

          {/* TAB 1: PIN CODE DIRECT LOGIN & 5 PRE-CONFIGURED 3D SHIPS */}
          {authTab === 'pin' && (
            <div className="space-y-4">
              <div className="pirate-panel-wood rounded-3xl p-5 shadow-2xl relative">
                <div className="pirate-corner-rivet top-2 left-2" />
                <div className="pirate-corner-rivet top-2 right-2" />
                <div className="pirate-corner-rivet bottom-2 left-2" />
                <div className="pirate-corner-rivet bottom-2 right-2" />

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePinLogin();
                  }}
                  className="space-y-3"
                >
                  <label className="block text-xs font-black text-amber-200 text-center font-cinzel">
                    4 оронтой багийн ПИН код
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <KeyRound className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      pattern="\d{4}"
                      placeholder="4 оронтой ПИН код"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 pr-4 py-3.5 pirate-input rounded-2xl text-center placeholder-[#8c653d] text-xl font-mono tracking-widest font-black"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#deb887]/80 text-center font-sans">
                    Админаас олгосон 4 оронтой кодоо оруулаад шууд тоглоомоо эхлүүлээрэй.
                  </p>

                  {authError && (
                    <div className="p-3 bg-red-950/80 border-2 border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="font-sans">{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPendingAuth || pinInput.length !== 4}
                    className="w-full py-3.5 rounded-2xl btn-pirate-gold text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl"
                  >
                    <span>Тоглоомд нэвтрэх</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* 5 Preconfigured 3D Ships Selector */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 font-cinzel">
                    <Anchor className="w-3.5 h-3.5 text-amber-400" />
                    Уралдаанд оролцох 5 дээрэмчин хөлөг:
                  </span>
                  <span className="text-[10px] text-[#deb887]">Админаас кодоо авна уу</span>
                </div>

                <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
                  {PRECONFIGURED_TEAMS.map((ship) => (
                    <div key={ship.pin_code}>
                      <ShipVisual
                        ship={ship}
                        compact={true}
                        size="sm"
                        showPin={false}
                        selected={pinInput === ship.pin_code}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM TEAM REGISTRATION */}
          {authTab === 'custom' && (
            <div className="pirate-panel-wood rounded-3xl p-6 shadow-2xl relative">
              <div className="pirate-corner-rivet top-2 left-2" />
              <div className="pirate-corner-rivet top-2 right-2" />
              <div className="pirate-corner-rivet bottom-2 left-2" />
              <div className="pirate-corner-rivet bottom-2 right-2" />

              <form onSubmit={handleCreateCustomTeam} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1.5 font-cinzel">
                    Багийн нэр
                  </label>
                  <div className="relative">
                    <Users className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Жишээ нь: Далайн харцага"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 pirate-input rounded-2xl placeholder-[#8c653d] text-base font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-200 mb-1.5 font-cinzel">
                    Шинэ 4 оронтой ПИН код
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      pattern="\d{4}"
                      placeholder="Шинэ 4 оронтой код"
                      value={customPin}
                      onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 pr-4 py-3.5 pirate-input rounded-2xl placeholder-[#8c653d] text-base font-mono tracking-widest font-bold"
                      required
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-red-950/80 border-2 border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="font-sans">{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPendingAuth}
                  className="w-full py-4 rounded-2xl btn-pirate-gold text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50"
                >
                  <span>Баг бүртгүүлж эхлэх</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Organizer Admin Link */}
          <div className="mt-6 pt-4 border-t border-[#3d2413] text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#271409] hover:bg-[#3d2413] text-[#deb887] hover:text-amber-300 text-xs font-semibold border border-[#784421] transition-colors shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Зохион байгуулагчийн админ самбар ➔</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. LOGGED IN FLOW */}
      {team && (
        <div className="flex-1 flex flex-col">
          {/* Top Status Bar with 3D Ship details */}
          <header className="sticky top-0 z-30 bg-[#221309]/95 backdrop-blur-md border-b-3 border-[#5c371c] px-4 py-2.5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              {/* Ship Avatar / Step Badge */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                {teamShip ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={teamShip.ship_image}
                    alt={teamShip.ship_name}
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#271409] rounded-[10px] flex items-center justify-center text-amber-300 font-black text-xs font-cinzel">
                    {team.current_step + 1}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xs sm:text-sm font-black text-amber-200 flex items-center gap-1.5 font-medieval tracking-wide">
                  <span>{team.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#120703] text-amber-400 font-mono border border-[#7a4b27]">
                    #{team.pin_code}
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-[#deb887]">
                  <span className="flex items-center gap-1 text-amber-300 font-mono font-bold">
                    <Clock className="w-3 h-3 text-amber-400" /> {elapsedTimer}
                  </span>
                  <span>•</span>
                  <span className="font-cinzel">
                    {team.status === 'photo_pending'
                      ? 'Багийн баталгаажуулалт'
                      : `Алхам ${Math.min(team.current_step + 1, checkpoints.length)} / ${checkpoints.length}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1.5">
              <Link
                href="/admin"
                className="p-2 rounded-xl btn-pirate-wood text-amber-300 text-xs"
                title="Админ самбар"
              >
                <Shield className="w-4 h-4 text-amber-400" />
              </Link>
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-xl btn-pirate-wood text-amber-300 text-xs"
                title={isMuted ? 'Дуу нээх' : 'Дуу хаах'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl btn-pirate-wood text-amber-300 text-xs"
                title="Гарах"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* MAIN VIEW SWITCHER */}
          <main className="flex-1 flex flex-col">
            {/* STEP 0: PHOTO PENDING */}
            {team.status === 'photo_pending' && (
              <div className="p-4 flex-1 flex flex-col justify-center space-y-4">
                <div className="text-center space-y-2 mb-2">
                  <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 p-0.5 shadow-md">
                    <div className="p-2.5 bg-[#271409] rounded-[14px] text-amber-300">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-amber-300 font-medieval">
                    Алхам 0: Багийн баталгаажуулалт
                  </h2>
                  <p className="text-xs text-[#deb887] max-w-xs mx-auto leading-relaxed font-sans">
                    “Эхлэхийн өмнө багийн бүх гишүүд багтсан зургаа бүтэн оруулан илгээнэ үү”
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
                  <div className="pirate-panel-parchment rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
                    <div className="pirate-corner-rivet top-2 left-2" />
                    <div className="pirate-corner-rivet top-2 right-2" />
                    <div className="pirate-corner-rivet bottom-2 left-2" />
                    <div className="pirate-corner-rivet bottom-2 right-2" />

                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-3 border-amber-600 border-t-transparent animate-spin" />
                      <Hourglass className="w-7 h-7 text-amber-800 animate-pulse" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#2b1708] font-cinzel">
                        Админы зөвшөөрөл хүлээж байна...
                      </h3>
                      <p className="text-xs text-[#5c371c] mt-1 font-sans leading-relaxed">
                        Админ багийн зургийг шалгаж баталгаажуулмагц тоглоом шууд автоматаар эхэлнэ.
                      </p>
                    </div>

                    <div className="rounded-2xl overflow-hidden aspect-[4/3] border-3 border-[#734c26] bg-black shadow-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.initial_photo_url}
                        alt="Илгээсэн багийн зураг"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-[#2b1708] bg-[#fdf8ed] py-2.5 px-4 rounded-xl border border-[#b38b55] font-cinzel font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span>Бодит цагийн холболт идэвхтэй байна</span>
                    </div>

                    <button
                      onClick={async () => {
                        soundFX.playButtonTap();
                        await dataService.updateTeam(team.id, { initial_photo_url: null });
                        setTeam({ ...team, initial_photo_url: null });
                      }}
                      className="text-xs text-[#784c24] underline hover:text-[#2b1708] pt-2 font-sans font-semibold"
                    >
                      Зургийг солих / Дахин авах
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1..N: ACTIVE SCAVENGER HUNT */}
            {team.status === 'in_progress' && activeCheckpoint && (
              <div className="flex-1 flex flex-col h-[calc(100dvh-62px)] max-h-[calc(100dvh-62px)] min-h-0 overflow-hidden">
                {/* 1. Map Section with Stacking Context Isolation (hidden while scanning QR to prevent overlapping) */}
                <div
                  className={`h-[36vh] min-h-[210px] max-h-[320px] w-full p-2 relative flex-shrink-0 ${
                    showQRScanner ? 'hidden' : 'block'
                  }`}
                >
                  <Map
                    checkpoint={activeCheckpoint}
                    userPosition={
                      userLocation
                        ? {
                            lat: userLocation.lat,
                            lng: userLocation.lng,
                            heading: userLocation.heading ?? deviceHeading,
                            accuracy: userLocation.accuracy,
                            speed: userLocation.speed,
                          }
                        : null
                    }
                    onLocateUser={handleLocateUser}
                  />
                </div>

                {/* 2. Visual Hint & Clue Card */}
                <div className="flex-1 px-3 pb-3 overflow-y-auto space-y-2.5">
                  <div className="pirate-panel-parchment rounded-3xl p-4 shadow-xl relative overflow-hidden">
                    <div className="pirate-corner-rivet top-2 left-2" />
                    <div className="pirate-corner-rivet top-2 right-2" />
                    <div className="pirate-corner-rivet bottom-2 left-2" />
                    <div className="pirate-corner-rivet bottom-2 right-2" />

                    {/* Non-overlapping Stacked Header */}
                    <div className="flex flex-col gap-1.5 mb-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 bg-amber-200/90 px-3 py-1 rounded-full border border-amber-600 inline-flex items-center gap-1 font-cinzel shadow-sm">
                          <MapPin className="w-3 h-3 text-rose-700" />
                          Шалгах цэг #{activeCheckpoint.step_number}
                        </span>
                        <span className="text-[11px] text-[#784c24] font-bold font-mono">
                          {activeCheckpoint.step_number} / {checkpoints.length}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-[#2b1708] font-medieval leading-snug">
                        {activeCheckpoint.title}
                      </h3>
                    </div>

                    {/* Hint Image thumbnail */}
                    {activeCheckpoint.hint_image_url && (
                      <div
                        onClick={() => {
                          soundFX.playButtonTap();
                          setZoomedImage(activeCheckpoint.hint_image_url);
                        }}
                        className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-2.5 border-2 border-[#734c26] cursor-pointer group shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeCheckpoint.hint_image_url}
                          alt="Шалгах цэгийн сэжүүр зураг"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 p-1.5 rounded-lg text-amber-300 backdrop-blur-sm border border-amber-500/50">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div className="absolute top-2 left-2 bg-[#271409]/90 px-2 py-0.5 rounded-md text-[10px] text-amber-300 font-bold border border-[#b45309] font-cinzel">
                          Сэжүүр зураг (томруулах)
                        </div>
                      </div>
                    )}

                    {/* Step Riddle / Question Box */}
                    <div className="p-3 bg-white/80 rounded-2xl border-2 border-[#b38b55] mb-2 shadow-inner">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded-lg bg-amber-500 text-amber-950 mt-0.5 flex-shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 font-cinzel">
                              Шалгах цэгийн таавар асуулт:
                            </span>
                            {isQuestionAnswered && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-400 inline-flex items-center gap-1 font-cinzel">
                                <Check className="w-3 h-3 text-emerald-600" />
                                ЗӨВ ХАРИУЛСАН
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-[#2b1708] mt-1 leading-snug font-sans">
                            {activeCheckpoint.question}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {qrErrorMessage && (
                    <div className="p-3 bg-rose-950/80 border-2 border-rose-700 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
                      <span className="font-sans">{qrErrorMessage}</span>
                      <button
                        onClick={() => setQrErrorMessage(null)}
                        className="p-1 text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* GAME FLOW:
                      1. Answer the question to proceed to QR scan
                      2. Once question is answered, scan the physical QR code to complete the step! */}
                  {!isQuestionAnswered ? (
                    <button
                      onClick={() => {
                        soundFX.playChestOpen();
                        setShowQuizModal(true);
                      }}
                      className="w-full py-4 rounded-2xl btn-pirate-gold text-base font-black flex items-center justify-center gap-3 transition-all active:scale-98 animate-pulse shadow-xl"
                    >
                      <HelpCircle className="w-6 h-6" />
                      <span>АСУУЛТАД ХАРИУЛАХ (QR нээх)</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          soundFX.playButtonTap();
                          setShowQRScanner(true);
                        }}
                        className="w-full py-4 rounded-2xl btn-pirate-emerald text-base font-black flex items-center justify-center gap-3 transition-all active:scale-98 animate-pulse shadow-xl"
                      >
                        <QrCode className="w-6 h-6" />
                        <span>QR СКАННЕРДАХ (Баталгаажуулах)</span>
                      </button>
                      <div className="text-center">
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="text-[11px] text-[#deb887] underline hover:text-white font-sans"
                        >
                          Таавар асуултыг дахин харах
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP FINISHED: CELEBRATION */}
            {team.status === 'finished' && (
              <Celebration
                team={team}
                totalCheckpoints={checkpoints.length}
                onResetSession={() => {
                  soundFX.playButtonTap();
                  localStorage.removeItem('scavenger_team_id');
                  setTeam(null);
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* MODAL: QR Scanner (z-[9999], completely covers Leaflet map) */}
      {showQRScanner && activeCheckpoint && (
        <QRScanner
          expectedToken={activeCheckpoint.qr_token}
          onScanSuccess={handleQRScanned}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* MODAL: Checkpoint Quiz */}
      {showQuizModal && activeCheckpoint && (
        <QuizModal
          checkpoint={activeCheckpoint}
          onSuccess={() => {
            setShowQuizModal(false);
            setIsQuestionAnswered(true);
            soundFX.playDiscoveryJingle();
            setTimeout(() => {
              setShowQRScanner(true);
            }, 300);
          }}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {/* MODAL: Zoomed Hint Photo */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="fixed top-4 right-4 z-[10000] p-2.5 rounded-xl btn-pirate-wood text-amber-300 shadow-xl"
              title="Хаах"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Томруулсан сэжүүр зураг"
              className="w-full max-h-[80vh] object-contain rounded-2xl border-3 border-[#b45309] shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
