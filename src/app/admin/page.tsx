'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, Checkpoint, Submission } from '@/types/database';
import { formatElapsedTime, formatDateTime } from '@/lib/utils';
import {
  Shield,
  Users,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  FastForward,
  Trash2,
  QrCode,
  Printer,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Eye,
  X,
  Radio,
  Download,
} from 'lucide-react';

const DEFAULT_CHECKPOINTS: Checkpoint[] = [
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

export default function AdminDashboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(DEFAULT_CHECKPOINTS);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<{ teamName: string; url: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'qrcodes'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // 1. Fetch data from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch teams
      const { data: teamsData, error: teamsErr } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      if (teamsData && !teamsErr) setTeams(teamsData);

      // Fetch checkpoints
      const { data: cpData, error: cpErr } = await supabase
        .from('checkpoints')
        .select('*')
        .order('step_number', { ascending: true });
      if (cpData && cpData.length > 0 && !cpErr) setCheckpoints(cpData);

      // Fetch submissions
      const { data: subData } = await supabase
        .from('submissions')
        .select('*')
        .order('completed_at', { ascending: false });
      if (subData) setSubmissions(subData);
    } catch (err) {
      console.error('Fetch admin error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Realtime subscription for teams and submissions
  useEffect(() => {
    const teamsChannel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTeams((prev) => [payload.new as Team, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTeams((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Team) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTeams((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions' },
        (payload) => {
          setSubmissions((prev) => [payload.new as Submission, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  // 3. Interval for live timer on leaderboard
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ADMIN ACTION: Approve Team Photo
  const handleApprovePhoto = async (team: Team) => {
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('teams')
        .update({
          status: 'in_progress',
          started_at: nowIso,
          current_step: 0,
        })
        .eq('id', team.id);

      if (error) throw error;

      setFeedbackMsg({
        type: 'success',
        text: `"${team.name}" багийн зураг баталгаажиж, тоглоом эхэллээ!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN ACTION: Reject / Retake Team Photo
  const handleRejectPhoto = async (team: Team) => {
    if (!confirm(`"${team.name}" багийн зургийг буцааж, дахин авахуулах уу?`)) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          initial_photo_url: null,
          status: 'photo_pending',
        })
        .eq('id', team.id);

      if (error) throw error;

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
    const totalCp = checkpoints.length;
    const nextStep = team.current_step + 1;
    const isFinishing = nextStep >= totalCp;

    const confirmMsg = isFinishing
      ? `"${team.name}" баг сүүлийн шалгах цэгийг давж БАРИАНД орох гэж байна. Батлах уу?`
      : `"${team.name}" багийг Шалгах цэг #${nextStep} рүү хүчээр ахиулах уу?`;

    if (!confirm(confirmMsg)) return;

    try {
      // Find matching checkpoint
      const cp = checkpoints.find((c) => c.step_number === nextStep);
      if (cp) {
        await supabase.from('submissions').insert({
          team_id: team.id,
          checkpoint_id: cp.id,
        });
      }

      const updatePayload: Partial<Team> = {
        current_step: nextStep,
      };

      if (isFinishing) {
        updatePayload.status = 'finished';
        updatePayload.finished_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('teams')
        .update(updatePayload)
        .eq('id', team.id);

      if (error) throw error;

      setFeedbackMsg({
        type: 'success',
        text: `"${team.name}" багийн алхам амжилттай шинэчлэгдлээ!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN EMERGENCY ACTION: Reset Team
  const handleResetTeam = async (team: Team) => {
    if (!confirm(`"${team.name}" багийн явцыг эхлэл рүү буцаах уу?`)) return;

    try {
      await supabase.from('submissions').delete().eq('team_id', team.id);
      await supabase
        .from('teams')
        .update({
          current_step: 0,
          status: 'photo_pending',
          started_at: null,
          finished_at: null,
        })
        .eq('id', team.id);

      setFeedbackMsg({ type: 'success', text: `"${team.name}" баг дахин тохируулагдлаа.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // ADMIN ACTION: Delete Team
  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`"${team.name}" багийг бүр мөсөн устгах уу?`)) return;

    try {
      await supabase.from('teams').delete().eq('id', team.id);
      setFeedbackMsg({ type: 'success', text: `"${team.name}" баг устгагдлаа.` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackMsg({ type: 'error', text: 'Алдаа: ' + error.message });
    }
  };

  // Seed checkpoints into Supabase if missing
  const handleSeedCheckpoints = async () => {
    try {
      const { error } = await supabase.from('checkpoints').upsert(DEFAULT_CHECKPOINTS, {
        onConflict: 'step_number',
      });
      if (error) throw error;
      fetchData();
      alert('Шалгах цэгүүдийн анхны өгөгдөл амжилттай суулгагдлаа!');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Алдаа: ' + error.message);
    }
  };

  // Sorted teams for leaderboard:
  // 1. Finished teams sorted by lowest elapsed time
  // 2. In progress teams sorted by highest step, then started_at
  // 3. Photo pending teams
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Админ Хяналтын Самбар</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Эрдэнэсийн эрэл · Хайдян Парк 2026 · BJTU Монгол Оюутны Холбоо
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/80 p-1 rounded-xl flex border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Зураг батлах ({pendingApprovalTeams.length})
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Манлайлагчдын самбар ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'qrcodes'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Хэвлэх QR Кодууд ({checkpoints.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            title="Шинэчлэх"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Global Alert */}
      {feedbackMsg && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/80 border-rose-700 text-rose-300'
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
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Нийт бүртгэгдсэн баг</p>
                  <p className="text-2xl font-black text-white mt-1">{teams.length}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-400 font-medium">Зураг батлах хүлээгдэж буй</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    {pendingApprovalTeams.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Эрлийн явцад байгаа</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {teams.filter((t) => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Барианд орсон багууд</p>
                  <p className="text-2xl font-black text-yellow-400 mt-1">
                    {teams.filter((t) => t.status === 'finished').length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* LIVE REALTIME FEED: PHOTO APPROVAL CARDS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <h2 className="text-lg font-black text-white">
                    Шууд баталгаажуулалтын урсгал (Photo Approvals)
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {pendingApprovalTeams.length} баг хүлээгдэж байна
                </span>
              </div>

              {pendingApprovalTeams.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-200">
                    Одоогоор хүлээгдэж буй багийн зураг байхгүй байна
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Багууд орьентацийн орцны зургаа илгээх үед энд автоматаар бодит цаг хугацаанд гарч ирнэ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingApprovalTeams.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-950 border border-amber-500/30 rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all hover:border-amber-400"
                    >
                      <div className="relative aspect-[4/3] bg-black group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.initial_photo_url || ''}
                          alt={t.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() =>
                            setSelectedPhoto({ teamName: t.name, url: t.initial_photo_url || '' })
                          }
                        />
                        <button
                          onClick={() =>
                            setSelectedPhoto({ teamName: t.name, url: t.initial_photo_url || '' })
                          }
                          className="absolute top-2 right-2 p-2 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors"
                          title="Томруулах"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/80 text-[11px] text-amber-300 font-mono">
                          ПИН: #{t.pin_code}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-white">{t.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Бүртгэгдсэн: {formatDateTime(t.created_at)}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleRejectPhoto(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Буцаах</span>
                          </button>
                          <button
                            onClick={() => handleApprovePhoto(t)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-98"
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

            {/* SEED DATABASE IF CHECKPOINTS ARE EMPTY */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300">Шалгах цэгүүдийн анхны өгөгдөл</p>
                <p className="text-[11px] text-slate-500">
                  Хайдян паркийн 5 цэгийг Supabase өгөгдлийн санд шинэчлэн оруулах
                </p>
              </div>
              <button
                onClick={handleSeedCheckpoints}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700"
              >
                Өгөгдлийг баталгаажуулах
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE LEADERBOARD & EMERGENCY CONTROLS */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Шууд Манлайлагчдын Самбар (Live Leaderboard)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Багуудын алхам, зарцуулсан хугацаа болон яаралтай тусламжийн удирдлага
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
                  Нийт: {sortedTeams.length} баг
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-3">Байр</th>
                      <th className="pb-3">Баг</th>
                      <th className="pb-3">Төлөв</th>
                      <th className="pb-3">Явц</th>
                      <th className="pb-3">Хугацаа</th>
                      <th className="pb-3">Эхэлсэн</th>
                      <th className="pb-3 text-right pr-3">Яаралтай удирдлага</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sortedTeams.map((team, index) => {
                      const totalSteps = checkpoints.length;
                      const progressPct = Math.min(100, Math.round((team.current_step / totalSteps) * 100));
                      const isFinished = team.status === 'finished';
                      const isRunning = team.status === 'in_progress';
                      const elapsed = formatElapsedTime(team.started_at, team.finished_at);

                      return (
                        <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 pl-3">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                index === 0 && isFinished
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                  : index === 1 && isFinished
                                  ? 'bg-slate-300 text-slate-950'
                                  : index === 2 && isFinished
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>

                          <td className="py-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span>{team.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                #{team.pin_code}
                              </span>
                            </div>
                          </td>

                          <td className="py-4">
                            {isFinished ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> БАРИА
                              </span>
                            ) : isRunning ? (
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" /> Эрэлд
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                                Хүлээгдэж буй
                              </span>
                            )}
                          </td>

                          <td className="py-4 min-w-[160px]">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-slate-400">
                                <span>{team.current_step} / {totalSteps} цэг</span>
                                <span className="font-bold text-slate-300">{progressPct}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    isFinished
                                      ? 'bg-emerald-400'
                                      : 'bg-gradient-to-r from-amber-500 to-amber-400'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 font-mono font-bold text-amber-400 text-base">
                            {isRunning || isFinished ? elapsed : '-'}
                          </td>

                          <td className="py-4 text-xs text-slate-400">
                            {formatDateTime(team.started_at)}
                          </td>

                          {/* Emergency Controls for this team */}
                          <td className="py-4 pr-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Force Pass Checkpoint */}
                              {team.status !== 'finished' && (
                                <button
                                  onClick={() => handleForcePass(team)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
                                  title="Камер болон төхөөрөмжийн саатал гарсан үед цэгийг алгасуулах"
                                >
                                  <FastForward className="w-3.5 h-3.5" />
                                  <span>Давуулах</span>
                                </button>
                              )}

                              {/* Reset */}
                              <button
                                onClick={() => handleResetTeam(team)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Явцыг дахин эхлүүлэх"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteTeam(team)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
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
                        <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
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
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  Хайдян паркт байршуулах QR Кодууд
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Эдгээр QR кодыг хэвлэж аваад Хайдян паркийн тухайн шалгах цэгүүд дээр наана уу.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-colors print:hidden"
              >
                <Printer className="w-4 h-4" />
                <span>Бүгдийг хэвлэх (Print)</span>
              </button>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checkpoints.map((cp) => {
                // QR code image via reliable public QR API for crisp print quality
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  cp.qr_token
                )}`;

                return (
                  <div
                    key={cp.id}
                    className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border-4 border-slate-900 flex flex-col items-center text-center page-break-inside-avoid"
                  >
                    <div className="text-[11px] font-black uppercase tracking-widest text-blue-900 bg-blue-100 px-3 py-1 rounded-full mb-2">
                      BJTU Монгол Оюутны Холбоо
                    </div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                      Эрдэнэсийн эрэл · Хайдян Парк
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1 mb-3">
                      Шалгах цэг #{cp.step_number}
                    </h3>
                    <p className="text-xs text-slate-700 font-semibold mb-4 px-2">
                      {cp.title}
                    </p>

                    {/* QR Code Graphic */}
                    <div className="p-3 bg-white border-2 border-dashed border-slate-400 rounded-2xl shadow-inner mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt={`QR for ${cp.title}`}
                        className="w-44 h-44 object-contain"
                      />
                    </div>

                    <div className="bg-slate-100 border border-slate-300 rounded-xl px-4 py-2 text-center w-full">
                      <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Бичвэр код:
                      </p>
                      <p className="text-sm font-mono font-black text-slate-900 tracking-wider">
                        {cp.qr_token}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
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
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-base font-bold text-white">
                {selectedPhoto.teamName} - Багийн зураг
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.teamName}
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
