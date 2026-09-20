import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Team, Checkpoint, Submission } from '@/types/database';

export const SEED_CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    step_number: 1,
    title: '未来空间',
    hint_image_url: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    lat: 39.98678416,
    lng: 116.29554885,
    qr_token: '',
    question: '学校的校训是什么？',
    options: [
      'A. 自强不息，厚德载物',
      'B. 知行',
      'C. 实事求是',
      'D. 博学而笃志',
    ],
    correct_answer: 'B. 知行',
  },
  {
    id: 2,
    step_number: 2,
    title: '海淀公园百姓周末大舞台',
    hint_image_url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    lat: 39.98602264,
    lng: 116.29622575,
    qr_token: '',
    question: 'Ньютоны 2-р хуулийн үндсэн томьёо аль нь вэ?',
    options: [
      'A. F = m · a',
      'B. E = m · c²',
      'C. p = m · v',
      'D. F = -k · x',
    ],
    correct_answer: 'A. F = m · a',
  },
  {
    id: 3,
    step_number: 3,
    title: '海淀公园-儿童乐园',
    hint_image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    lat: 39.98645493,
    lng: 116.29768152,
    qr_token: '',
    question: 'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?',
    options: ['A. 1896', 'B. 1909', 'C. 1921', 'D. 1949'],
    correct_answer: 'A. 1896',
  },
  {
    id: 4,
    step_number: 4,
    title: '淀园花谷',
    hint_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    lat: 39.98767611,
    lng: 116.29792671,
    qr_token: '',
    question: 'Дараах эртний ганц ханз ямар утгатай вэ?【 囚 】',
    options: [
      'A. Шоронд хорих / Хоригдол',
      'B. Гэртээ амрах',
      'C. Мод тарих',
      'D. Хайрцаг онгойлгох',
    ],
    correct_answer: 'A. Шоронд хорих / Хоригдол',
  },
  {
    id: 5,
    step_number: 5,
    title: '海淀公园-中心草坪',
    hint_image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    lat: 39.98738521,
    lng: 116.29586933,
    qr_token: '',
    question: 'Оюутны виз сунгах, сургуулийн албан ёсны бүртгэл хийлгэхэд олон улсын оюутнууд заавал очдог газар аль нь вэ?',
    options: [
      'A. 国际教育学院 (CIE)',
      'B. 体育馆',
      'C. 校医院',
      'D. 保卫处',
    ],
    correct_answer: 'A. 国际教育学院 (CIE)',
  },
];

export interface PreconfiguredTeam {
  name: string;
  pin_code: string;
  ship_name: string;
  ship_image: string;
  theme_color: string;
  description: string;
}

export const PRECONFIGURED_TEAMS: PreconfiguredTeam[] = [
  {
    name: 'Далайн харцага',
    pin_code: '',
    ship_name: 'Далайн харцага (Sea Falcon)',
    ship_image: '/ships/ship_adventure_galley.jpg',
    theme_color: '#fb923c',
    description: 'Давалгааг сүлжин нисэх мэт хурдтай эрэлчдийн хөлөг',
  },
  {
    name: 'Хар Сувд',
    pin_code: '',
    ship_name: 'Хар Сувд (Black Pearl)',
    ship_image: '/ships/ship_black_pearl.jpg',
    theme_color: '#f59e0b',
    description: 'Хамгийн хурдан, домогт хар далбаат хөлөг онгоц',
  },
  {
    name: 'Хатан хааны өшөө авалт',
    pin_code: '',
    ship_name: "Хатан хааны өшөө авалт (Queen Anne's Revenge)",
    ship_image: '/ships/ship_queen_anne.jpg',
    theme_color: '#ef4444',
    description: 'Цуст улаан далбаа, агуу их буут хөлөг онгоц',
  },
  {
    name: 'Нисдэг Голланд',
    pin_code: '',
    ship_name: 'Нисдэг Голланд (Flying Dutchman)',
    ship_image: '/ships/ship_flying_dutchman.jpg',
    theme_color: '#10b981',
    description: 'Манан дундаас тодрох сүнст ногоон гэрэлт хөлөг',
  },
  {
    name: 'Алтан Хинд',
    pin_code: '',
    ship_name: 'Алтан Хинд (Golden Hind)',
    ship_image: '/ships/ship_golden_hind.jpg',
    theme_color: '#eab308',
    description: 'Дэлхийг тойрсон алтан чимэглэлт галеон',
  },
  {
    name: 'Адал явдалт Галеон',
    pin_code: '',
    ship_name: 'Адал явдалт Галеон (Adventure Galley)',
    ship_image: '/ships/ship_adventure_galley.jpg',
    theme_color: '#38bdf8',
    description: 'Далай тэнгисийн зоригт эрэлчдийн дархан хөлөг',
  },
  {
    name: 'Тэнгисийн Луу',
    pin_code: '',
    ship_name: 'Тэнгисийн Луу (Sea Dragon)',
    ship_image: '/ships/ship_flying_dutchman.jpg',
    theme_color: '#06b6d4',
    description: 'Хөх дөл, луугийн хүчийг тээсэн сүрлэг дайчин хөлөг',
  },
  {
    name: 'Чимээгүй Салхи',
    pin_code: '',
    ship_name: 'Чимээгүй Салхи (Silent Wind)',
    ship_image: '/ships/ship_queen_anne.jpg',
    theme_color: '#a855f7',
    description: 'Шөнийн мананд чимээгүйхэн урагшлах нууцлаг хөлөг',
  },
  {
    name: 'Мөнгөн Давалгаа',
    pin_code: '',
    ship_name: 'Мөнгөн Давалгаа (Silver Wave)',
    ship_image: '/ships/ship_golden_hind.jpg',
    theme_color: '#94a3b8',
    description: 'Сарны гэрэлд мөнгөрөн гялалзах хурдан галеон',
  },
  {
    name: 'Шуурганы Элч',
    pin_code: '',
    ship_name: 'Шуурганы Элч (Storm Herald)',
    ship_image: '/ships/ship_black_pearl.jpg',
    theme_color: '#6366f1',
    description: 'Аянга цахилгаан, догшин шуургыг захирах хар хөлөг',
  },
];

export function getShipForTeam(team?: { name?: string; pin_code?: string } | null): PreconfiguredTeam {
  if (!team) return PRECONFIGURED_TEAMS[0];
  const found = PRECONFIGURED_TEAMS.find(
    (t) =>
      (team.pin_code && t.pin_code === team.pin_code.trim()) ||
      (team.name &&
        (t.name.toLowerCase() === team.name.trim().toLowerCase() ||
          team.name.toLowerCase().includes(t.name.toLowerCase()) ||
          (t.name.includes('Голланд') && team.name.includes('Голланд'))))
  );
  return (
    found || {
      name: team.name || 'Дээрэмчин хөлөг',
      pin_code: team.pin_code || '',
      ship_name: team.name || 'Дээрэмчин хөлөг',
      ship_image: '/ships/ship_black_pearl.jpg',
      theme_color: '#f59e0b',
      description: 'Хайдян паркийн эрэлчдийн хөлөг онгоц',
    }
  );
}

const STORAGE_KEYS = {
  TEAMS: 'scavenger_teams_data',
  CHECKPOINTS: 'scavenger_checkpoints_data',
  SUBMISSIONS: 'scavenger_submissions_data',
};

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Helper to call Next.js Server API
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel('scavenger_hunt_sync_bus');
    } catch {
      return null;
    }
  }
  return null;
}

const syncChannel = getBroadcastChannel();

export function broadcastEvent(event: { type: string; payload: unknown }) {
  try {
    syncChannel?.postMessage(event);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('scavenger_hunt_local_event', { detail: event }));
    } catch {
      // ignore
    }
  }
}

export const dataService = {
  // Checkpoints
  async getCheckpoints(): Promise<Checkpoint[]> {
    // Ask the server first so QR tokens never enter the player bundle/session.
    const apiRes = await apiFetch<{ checkpoints: Checkpoint[] }>('/api/checkpoints');
    if (apiRes?.checkpoints?.length) {
      if (apiRes.checkpoints.every((checkpoint) => !checkpoint.qr_token)) {
        setLocal(STORAGE_KEYS.CHECKPOINTS, apiRes.checkpoints);
      }
      return apiRes.checkpoints;
    }

    setLocal(STORAGE_KEYS.CHECKPOINTS, SEED_CHECKPOINTS);
    return SEED_CHECKPOINTS;
  },

  async getCheckpointByStep(stepNumber: number): Promise<Checkpoint | null> {
    const all = await this.getCheckpoints();
    return all.find((cp) => cp.step_number === stepNumber) || null;
  },

  async verifyCheckpoint(stepNumber: number, token: string): Promise<boolean> {
    const result = await apiFetch<{ valid: boolean }>('/api/checkpoints', {
      method: 'POST',
      body: JSON.stringify({ stepNumber, token }),
    });
    return Boolean(result?.valid);
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const apiRes = await apiFetch<{ teams: Team[] }>('/api/teams');
    if (apiRes?.teams && apiRes.teams.length > 0) {
      setLocal(STORAGE_KEYS.TEAMS, apiRes.teams);
      return apiRes.teams;
    }

    // Fallback to localStorage during a temporary network outage.
    return getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
  },

  async getTeam(id: string, preferCache = false): Promise<Team | null> {
    // Restore the player's last known team immediately. Realtime and polling
    // refresh it afterward, so a temporary network outage never logs them out.
    const cached = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []).find((t) => t.id === id);
    // Old deployments stored team_<timestamp> IDs. Never send those to a UUID
    // column or restore them as a working session. Reauthenticate by the PIN
    // already entered by this player; the server alone resolves the new ID.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const pin = cached?.pin_code?.trim();
      const migrated = pin ? await this.loginByPin(pin) : null;
      if (migrated) {
        localStorage.setItem('scavenger_team_id', migrated.id);
        const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
        setLocal(STORAGE_KEYS.TEAMS, current.filter((t) => t.id !== id));
        return migrated;
      }
      localStorage.removeItem('scavenger_team_id');
      return null;
    }
    if (preferCache && cached) return cached;

    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?id=${id}`);
    if (apiRes?.team) {
      const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
      setLocal(STORAGE_KEYS.TEAMS, [apiRes.team, ...current.filter((t) => t.id !== id)]);
      return apiRes.team;
    }

    return cached || null;
  },

  async createTeam(name: string, pinCode: string): Promise<Team> {
    const cleanName = name.trim();
    const cleanPin = pinCode.trim();
    const apiRes = await apiFetch<{ team: Team }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', name: cleanName, pin_code: cleanPin }),
    });
    if (!apiRes?.team) throw new Error('Team creation failed');
    const newTeam = apiRes.team;

    // Save locally
    const teams = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    const updatedTeams = [newTeam, ...teams.filter((t) => t.id !== newTeam.id)];
    setLocal(STORAGE_KEYS.TEAMS, updatedTeams);
    broadcastEvent({ type: 'TEAM_CREATED', payload: newTeam });

    return newTeam;
  },

  async joinTeam(name: string, pinCode: string): Promise<Team | null> {
    const trimmedPin = pinCode.trim();

    // 1. Check local server API
    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?pin=${trimmedPin}`);
    if (apiRes?.team) {
      return apiRes.team;
    }

    // Fallback to the existing authenticated local session only.
    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    return (
      current.find(
        (t) => t.name.toLowerCase() === name.trim().toLowerCase() && t.pin_code === trimmedPin
      ) || null
    );
  },

  async loginByPin(pinCode: string): Promise<Team | null> {
    const trimmedPin = pinCode.trim();
    if (!trimmedPin) return null;

    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?pin=${trimmedPin}`);
    if (apiRes?.team) {
      const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
      setLocal(STORAGE_KEYS.TEAMS, [apiRes.team, ...current.filter((t) => t.id !== apiRes.team.id)]);
      return apiRes.team;
    }

    // A cached PIN match cannot establish the server's HttpOnly session.
    // Never report a successful login when the server did not authenticate it.
    return null;
  },

  async seedPreconfiguredTeams(): Promise<Team[]> {
    const existing = await this.getTeams();
    const result: Team[] = [...existing];

    for (const pre of PRECONFIGURED_TEAMS.filter((team) => team.pin_code)) {
      const found = result.find(
        (t) => t.pin_code === pre.pin_code || t.name.toLowerCase() === pre.name.toLowerCase()
      );
      if (!found) {
        try {
          const newTeam = await this.createTeam(pre.name, pre.pin_code);
          result.push(newTeam);
        } catch (err) {
          console.warn('Seed team error for', pre.name, err);
        }
      }
    }

    return result;
  },

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    // Strictly prevent base64 data URIs from polluting localStorage or database
    if (
      updates.initial_photo_url &&
      typeof updates.initial_photo_url === 'string' &&
      updates.initial_photo_url.startsWith('data:')
    ) {
      try {
        const uploadRes = await apiFetch<{ url: string }>('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ dataUrl: updates.initial_photo_url, teamId: id }),
        });
        if (uploadRes?.url) {
          updates.initial_photo_url = uploadRes.url;
        } else {
          updates.initial_photo_url = null;
        }
      } catch {
        updates.initial_photo_url = null;
      }
    }

    // Persist first. Returning success before either backend accepted the update
    // made the player/admin screens disagree and lose changes after a reload.
    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    let updatedTeam: Team | null = null;

    const newTeams = current.map((t) => {
      if (t.id === id) {
        updatedTeam = { ...t, ...updates };
        return updatedTeam;
      }
      return t;
    });

    if (!updatedTeam) {
      updatedTeam = {
        id,
        name: updates.name || 'Баг',
        pin_code: updates.pin_code || '',
        current_step: updates.current_step ?? 0,
        status: updates.status || 'photo_pending',
        initial_photo_url: updates.initial_photo_url ?? null,
        started_at: updates.started_at ?? null,
        finished_at: updates.finished_at ?? null,
        created_at: new Date().toISOString(),
        ...updates,
      };
      newTeams.unshift(updatedTeam);
    }

    const apiRes = await apiFetch<{ team: Team }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ id, updates }),
    });
    if (apiRes?.team) updatedTeam = apiRes.team;
    else throw new Error('Team update was rejected or failed');

    if (!updatedTeam) throw new Error('Team update did not return a team');
    const persistedTeams = [updatedTeam, ...newTeams.filter((t) => t.id !== id)];
    setLocal(STORAGE_KEYS.TEAMS, persistedTeams);
    broadcastEvent({ type: 'TEAM_UPDATED', payload: updatedTeam });

    return updatedTeam;
  },

  async deleteTeam(id: string): Promise<void> {
    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    setLocal(STORAGE_KEYS.TEAMS, current.filter((t) => t.id !== id));

    const subs = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    setLocal(STORAGE_KEYS.SUBMISSIONS, subs.filter((s) => s.team_id !== id));

    broadcastEvent({ type: 'TEAM_DELETED', payload: { id } });

    const deleted = await apiFetch<{ success: boolean }>(`/api/teams?id=${id}`, { method: 'DELETE' });
    if (!deleted?.success) throw new Error('Team deletion was rejected or failed');
  },

  async resetTeam(id: string): Promise<Team | null> {
    const updates: Partial<Team> = {
      current_step: 0,
      status: 'photo_pending',
      initial_photo_url: null,
      started_at: null,
      finished_at: null,
    };

    const subs = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    setLocal(STORAGE_KEYS.SUBMISSIONS, subs.filter((s) => s.team_id !== id));

    const updated = await this.updateTeam(id, updates);
    return updated;
  },

  // Submissions
  async getSubmissions(): Promise<Submission[]> {
    const apiRes = await apiFetch<{ submissions: Submission[] }>('/api/submissions');
    if (apiRes?.submissions) {
      setLocal(STORAGE_KEYS.SUBMISSIONS, apiRes.submissions);
      return apiRes.submissions;
    }

    return getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  },

  async recordSubmission(teamId: string, checkpointId: number): Promise<Submission> {
    const newSub: Submission = {
      id: Date.now(),
      team_id: teamId,
      checkpoint_id: checkpointId,
      completed_at: new Date().toISOString(),
    };

    const subs = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    const updatedSubs = [
      newSub,
      ...subs.filter((s) => !(s.team_id === teamId && s.checkpoint_id === checkpointId)),
    ];
    setLocal(STORAGE_KEYS.SUBMISSIONS, updatedSubs);
    broadcastEvent({ type: 'SUBMISSION_CREATED', payload: newSub });

    const saved = await apiFetch<{ submission: Submission }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, checkpoint_id: checkpointId }),
    });
    if (!saved?.submission) throw new Error('Submission was rejected or failed');

    return saved.submission;
  },

  // -------------------------------------------------------------------------
  // HYBRID REALTIME SUBSCRIPTIONS (Local SSE + Polling + Supabase Realtime)
  // -------------------------------------------------------------------------

  subscribeToTeam(teamId: string, onUpdate: (team: Team) => void): () => void {
    const cleanTeamId = teamId.trim();

    // Strict validator function: verify if (!payload || payload.id !== teamId) return; before calling onUpdate
    const handlePayload = (payload: Team | null | undefined) => {
      if (!payload || payload.id !== teamId) return;
      onUpdate(payload);
    };

    // A. Local BroadcastChannel & Window event
    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'TEAM_UPDATED') {
        const payload = data.payload as Team;
        if (!payload || payload.id !== teamId) return;
        handlePayload(payload);
      }
    };

    const handleCustom = (event: Event) => {
      const customEvt = event as CustomEvent;
      const data = customEvt.detail;
      if (data?.type === 'TEAM_UPDATED') {
        const payload = data.payload as Team;
        if (!payload || payload.id !== teamId) return;
        handlePayload(payload);
      }
    };

    syncChannel?.addEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.addEventListener('scavenger_hunt_local_event', handleCustom);
    }

    // B. Server-Sent Events (SSE) from Next.js server
    let sse: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sse = new EventSource('/api/events');
        sse.addEventListener('TEAM_UPDATED', (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const payload = (parsed.payload || parsed) as Team;
            if (!payload || payload.id !== teamId) return;
            handlePayload(payload);
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
    }

    // C. Fallback polling every 1.5s to ensure zero missed updates
    let lastStatus = '';
    let lastStep = -1;
    const pollInterval = setInterval(async () => {
      try {
        const res = await apiFetch<{ team: Team }>(`/api/teams?id=${cleanTeamId}`);
        const payload = res?.team;
        if (!payload || payload.id !== teamId) return;
        if (payload.status !== lastStatus || payload.current_step !== lastStep) {
          lastStatus = payload.status;
          lastStep = payload.current_step;
          handlePayload(payload);
        }
      } catch {
        // ignore
      }
    }, 1500);

    // D. Supabase Realtime channel (strictly filtered to this team: id=eq.${teamId})
    let channel: RealtimeChannel | null = null;
    try {
      channel = supabase
        .channel(`team-${cleanTeamId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teams',
            filter: `id=eq.${teamId}`,
          },
          (payload) => {
            const updated = payload.new as Team;
            if (!payload || !updated || updated.id !== teamId) return;
            handlePayload(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Supabase team subscribe error:', err);
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      clearInterval(pollInterval);
      if (channel) {
        try {
          supabase.removeChannel(channel).catch((err) => {
            console.warn('Error removing Supabase team channel:', err);
          });
        } catch {
          // ignore
        }
        channel = null;
      }
    };
  },

  subscribeToAdmin(
    onEvent: (event: { type: string; payload: unknown }) => void
  ): () => void {
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type) onEvent(event.data);
    };

    const handleCustom = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail?.type) onEvent(customEvt.detail);
    };

    syncChannel?.addEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.addEventListener('scavenger_hunt_local_event', handleCustom);
    }

    // Server-Sent Events (SSE)
    let sse: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sse = new EventSource('/api/events');
        const handleSSEEvent = (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent({ type: parsed.type, payload: parsed.payload });
          } catch {
            // ignore
          }
        };

        sse.addEventListener('TEAM_CREATED', handleSSEEvent);
        sse.addEventListener('TEAM_UPDATED', handleSSEEvent);
        sse.addEventListener('TEAM_DELETED', handleSSEEvent);
        sse.addEventListener('SUBMISSION_CREATED', handleSSEEvent);
      } catch {
        // ignore
      }
    }

    // Supabase Realtime channel
    let channel: RealtimeChannel | null = null;
    try {
      channel = supabase
        .channel('admin-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, (payload) => {
          if (payload.eventType === 'INSERT') onEvent({ type: 'TEAM_CREATED', payload: payload.new });
          else if (payload.eventType === 'UPDATE') onEvent({ type: 'TEAM_UPDATED', payload: payload.new });
          else if (payload.eventType === 'DELETE') onEvent({ type: 'TEAM_DELETED', payload: payload.old });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
          onEvent({ type: 'SUBMISSION_CREATED', payload: payload.new });
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase admin subscribe error:', err);
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      if (channel) {
        try {
          supabase.removeChannel(channel).catch((err) => {
            console.warn('Error removing Supabase admin channel:', err);
          });
        } catch {
          // ignore
        }
        channel = null;
      }
    };
  },

  subscribeToTeamsChanges(onChange: () => void): () => void {
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type?.startsWith('TEAM_')) onChange();
    };

    const handleCustom = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail?.type?.startsWith('TEAM_')) onChange();
    };

    syncChannel?.addEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.addEventListener('scavenger_hunt_local_event', handleCustom);
    }

    // Server-Sent Events (SSE)
    let sse: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sse = new EventSource('/api/events');
        const trigger = () => onChange();
        sse.addEventListener('TEAM_CREATED', trigger);
        sse.addEventListener('TEAM_UPDATED', trigger);
        sse.addEventListener('TEAM_DELETED', trigger);
        sse.addEventListener('SUBMISSION_CREATED', trigger);
      } catch {
        // ignore
      }
    }

    // Supabase Realtime channel
    let channel: RealtimeChannel | null = null;
    try {
      channel = supabase
        .channel('admin-teams-table-listener')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
          onChange();
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase teams listener subscribe error:', err);
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      if (channel) {
        try {
          supabase.removeChannel(channel).catch((err) => {
            console.warn('Error removing Supabase teams listener channel:', err);
          });
        } catch {
          // ignore
        }
        channel = null;
      }
    };
  },
};
