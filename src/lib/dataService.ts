import { supabase } from './supabase';
import { Team, Checkpoint, Submission } from '@/types/database';

export const SEED_CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    step_number: 1,
    title: 'Сургуулийн уриа (North Gate Plaza)',
    hint_image_url: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    lat: 39.9922,
    lng: 116.2942,
    qr_token: 'hd_park_alpha_7x',
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
    title: 'Физикийн хууль (Central Lawn)',
    hint_image_url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    lat: 39.9885,
    lng: 116.2940,
    qr_token: 'hd_park_stage_c2',
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
    title: 'Сургуулийн түүх (Jingxi Rice Field)',
    hint_image_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    lat: 39.9868,
    lng: 116.2925,
    qr_token: 'hd_park_rice_j3',
    question: 'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?',
    options: ['A. 1896', 'B. 1909', 'C. 1921', 'D. 1949'],
    correct_answer: 'A. 1896',
  },
  {
    id: 4,
    step_number: 4,
    title: 'Эртний ханзны оньсого (AI Smart Pavilion)',
    hint_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    lat: 39.9898,
    lng: 116.2965,
    qr_token: 'hd_park_ai_p4',
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
    title: 'Олон улсын оюутны бүртгэл & Виз (South Lotus Pond)',
    hint_image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    lat: 39.9855,
    lng: 116.2952,
    qr_token: 'hd_park_lotus_s5',
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
    name: 'Хар Сувд',
    pin_code: '7701',
    ship_name: 'Хар Сувд (Black Pearl)',
    ship_image: '/ships/ship_black_pearl.jpg',
    theme_color: '#f59e0b',
    description: 'Хамгийн хурдан, домогт хар далбаат хөлөг онгоц',
  },
  {
    name: 'Хатан хааны өшөө авалт',
    pin_code: '8802',
    ship_name: "Хатан хааны өшөө авалт (Queen Anne's Revenge)",
    ship_image: '/ships/ship_queen_anne.jpg',
    theme_color: '#ef4444',
    description: 'Цуст улаан далбаа, агуу их буут хөлөг онгоц',
  },
  {
    name: 'Нисдэг Голланд',
    pin_code: '3303',
    ship_name: 'Нисдэг Голланд (Flying Dutchman)',
    ship_image: '/ships/ship_flying_dutchman.jpg',
    theme_color: '#10b981',
    description: 'Манан дундаас тодрох сүнст ногоон гэрэлт хөлөг',
  },
  {
    name: 'Алтан Хинд',
    pin_code: '9904',
    ship_name: 'Алтан Хинд (Golden Hind)',
    ship_image: '/ships/ship_golden_hind.jpg',
    theme_color: '#eab308',
    description: 'Дэлхийг тойрсон алтан чимэглэлт галеон',
  },
  {
    name: 'Адал явдалт Галеон',
    pin_code: '5505',
    ship_name: 'Адал явдалт Галеон (Adventure Galley)',
    ship_image: '/ships/ship_adventure_galley.jpg',
    theme_color: '#38bdf8',
    description: 'Далай тэнгисийн зоригт эрэлчдийн дархан хөлөг',
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
      pin_code: team.pin_code || '0000',
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

function withTimeout<T>(promiseLike: PromiseLike<T>, ms = 2500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    Promise.resolve(promiseLike)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper to call Next.js Server API
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const dataService = {
  // Checkpoints
  async getCheckpoints(): Promise<Checkpoint[]> {
    // 1. Try local cache
    const local = getLocal<Checkpoint[]>(STORAGE_KEYS.CHECKPOINTS, []);
    if (local.length === SEED_CHECKPOINTS.length && local[0]?.question === SEED_CHECKPOINTS[0].question) {
      return local;
    }

    // 2. Try Supabase
    try {
      const res = await withTimeout(
        supabase.from('checkpoints').select('*').order('step_number', { ascending: true })
      );
      if (res.data && res.data.length > 0 && !res.error) {
        setLocal(STORAGE_KEYS.CHECKPOINTS, res.data);
        return res.data;
      }
    } catch {
      // ignore
    }

    setLocal(STORAGE_KEYS.CHECKPOINTS, SEED_CHECKPOINTS);
    return SEED_CHECKPOINTS;
  },

  async getCheckpointByStep(stepNumber: number): Promise<Checkpoint | null> {
    try {
      const res = await withTimeout(
        supabase.from('checkpoints').select('*').eq('step_number', stepNumber).maybeSingle()
      );
      if (res.data && !res.error) {
        return res.data;
      }
    } catch (e) {
      // ignore
    }
    const all = await this.getCheckpoints();
    return all.find((cp) => cp.step_number === stepNumber) || null;
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    // 1. First priority: Fetch from Next.js server API (shared across LAN & mobile)
    const apiRes = await apiFetch<{ teams: Team[] }>('/api/teams');
    if (apiRes?.teams && apiRes.teams.length > 0) {
      setLocal(STORAGE_KEYS.TEAMS, apiRes.teams);
      return apiRes.teams;
    }

    // 2. Try Supabase cloud (if reachable)
    try {
      const res = await withTimeout(
        supabase.from('teams').select('*').order('created_at', { ascending: false })
      );
      if (res.data && !res.error) {
        setLocal(STORAGE_KEYS.TEAMS, res.data);
        return res.data;
      }
    } catch {
      // ignore
    }

    // 3. Fallback to localStorage
    return getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
  },

  async getTeam(id: string): Promise<Team | null> {
    // 1. Try local server API
    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?id=${id}`);
    if (apiRes?.team) {
      const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
      const idx = current.findIndex((t) => t.id === id);
      if (idx >= 0) current[idx] = apiRes.team;
      else current.push(apiRes.team);
      setLocal(STORAGE_KEYS.TEAMS, current);
      return apiRes.team;
    }

    // 2. Try Supabase
    try {
      const res = await withTimeout(supabase.from('teams').select('*').eq('id', id).single());
      if (res.data && !res.error) {
        const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
        const idx = current.findIndex((t) => t.id === id);
        if (idx >= 0) current[idx] = res.data;
        else current.push(res.data);
        setLocal(STORAGE_KEYS.TEAMS, current);
        return res.data;
      }
    } catch {
      // ignore
    }

    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    return current.find((t) => t.id === id) || null;
  },

  async createTeam(name: string, pinCode: string): Promise<Team> {
    const cleanName = name.trim();
    const cleanPin = pinCode.trim();

    // 1. Send to local server API (instantly updates serverStore & broadcasts SSE)
    const apiRes = await apiFetch<{ team: Team }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', name: cleanName, pin_code: cleanPin }),
    });

    let newTeam: Team;
    if (apiRes?.team) {
      newTeam = apiRes.team;
    } else {
      newTeam = {
        id: generateUUID(),
        name: cleanName,
        pin_code: cleanPin,
        current_step: 0,
        status: 'photo_pending',
        initial_photo_url: null,
        started_at: null,
        finished_at: null,
        created_at: new Date().toISOString(),
      };
    }

    // Save locally
    const teams = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    const updatedTeams = [newTeam, ...teams.filter((t) => t.id !== newTeam.id)];
    setLocal(STORAGE_KEYS.TEAMS, updatedTeams);
    broadcastEvent({ type: 'TEAM_CREATED', payload: newTeam });

    // Sync to Supabase in background
    withTimeout(supabase.from('teams').insert(newTeam).select().single()).catch(() => {});

    return newTeam;
  },

  async joinTeam(name: string, pinCode: string): Promise<Team | null> {
    const trimmedPin = pinCode.trim();

    // 1. Check local server API
    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?pin=${trimmedPin}`);
    if (apiRes?.team) {
      return apiRes.team;
    }

    // 2. Try Supabase
    try {
      const res = await withTimeout(
        supabase
          .from('teams')
          .select('*')
          .ilike('name', name.trim())
          .eq('pin_code', trimmedPin)
          .maybeSingle()
      );
      if (res.data && !res.error) {
        return res.data;
      }
    } catch {
      // ignore
    }

    // 3. Fallback to local cache
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

    // 1. Try local server API
    const apiRes = await apiFetch<{ team: Team }>(`/api/teams?pin=${trimmedPin}`);
    if (apiRes?.team) {
      const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
      if (!current.some((t) => t.id === apiRes.team.id)) {
        setLocal(STORAGE_KEYS.TEAMS, [apiRes.team, ...current]);
      }
      return apiRes.team;
    }

    // 2. Try Supabase
    try {
      const res = await withTimeout(
        supabase.from('teams').select('*').eq('pin_code', trimmedPin).maybeSingle()
      );
      if (res.data && !res.error) {
        const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
        if (!current.some((t) => t.id === res.data.id)) {
          setLocal(STORAGE_KEYS.TEAMS, [res.data, ...current]);
        }
        return res.data;
      }
    } catch {
      // ignore
    }

    // 3. Check preconfigured teams
    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    const local = current.find((t) => t.pin_code === trimmedPin);
    if (local) return local;

    const preTeam = PRECONFIGURED_TEAMS.find((p) => p.pin_code === trimmedPin);
    if (preTeam) {
      return await this.createTeam(preTeam.name, preTeam.pin_code);
    }

    return null;
  },

  async seedPreconfiguredTeams(): Promise<Team[]> {
    const existing = await this.getTeams();
    const result: Team[] = [...existing];

    for (const pre of PRECONFIGURED_TEAMS) {
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
    // 1. Optimistic update local cache & broadcast for zero-latency UI
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
        pin_code: updates.pin_code || '1234',
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

    setLocal(STORAGE_KEYS.TEAMS, newTeams);
    broadcastEvent({ type: 'TEAM_UPDATED', payload: updatedTeam });

    // 2. Push to local Next.js server API (broadcasts to all mobile phones & laptops via SSE!)
    apiFetch<{ team: Team }>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ id, updates }),
    }).catch(() => {});

    // 3. Sync to Supabase in background
    withTimeout(supabase.from('teams').update(updates).eq('id', id)).catch(() => {});

    return updatedTeam;
  },

  async deleteTeam(id: string): Promise<void> {
    const current = getLocal<Team[]>(STORAGE_KEYS.TEAMS, []);
    setLocal(STORAGE_KEYS.TEAMS, current.filter((t) => t.id !== id));

    const subs = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    setLocal(STORAGE_KEYS.SUBMISSIONS, subs.filter((s) => s.team_id !== id));

    broadcastEvent({ type: 'TEAM_DELETED', payload: { id } });

    apiFetch(`/api/teams?id=${id}`, { method: 'DELETE' }).catch(() => {});
    withTimeout(supabase.from('teams').delete().eq('id', id)).catch(() => {});
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
    withTimeout(supabase.from('submissions').delete().eq('team_id', id)).catch(() => {});
    return updated;
  },

  // Submissions
  async getSubmissions(): Promise<Submission[]> {
    const apiRes = await apiFetch<{ submissions: Submission[] }>('/api/submissions');
    if (apiRes?.submissions) {
      setLocal(STORAGE_KEYS.SUBMISSIONS, apiRes.submissions);
      return apiRes.submissions;
    }

    try {
      const res = await withTimeout(
        supabase.from('submissions').select('*').order('completed_at', { ascending: false })
      );
      if (res.data && !res.error) {
        setLocal(STORAGE_KEYS.SUBMISSIONS, res.data);
        return res.data;
      }
    } catch {
      // ignore
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

    // Send to local server API
    apiFetch('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, checkpoint_id: checkpointId }),
    }).catch(() => {});

    // Send to Supabase
    withTimeout(
      supabase.from('submissions').insert({
        team_id: teamId,
        checkpoint_id: checkpointId,
      })
    ).catch(() => {});

    return newSub;
  },

  // -------------------------------------------------------------------------
  // HYBRID REALTIME SUBSCRIPTIONS (Local SSE + Polling + Supabase Realtime)
  // -------------------------------------------------------------------------

  subscribeToTeam(teamId: string, onUpdate: (team: Team) => void): () => void {
    // A. Local BroadcastChannel & Window event
    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === 'TEAM_UPDATED' && data.payload?.id === teamId) {
        onUpdate(data.payload as Team);
      }
    };

    const handleCustom = (event: Event) => {
      const customEvt = event as CustomEvent;
      const data = customEvt.detail;
      if (data?.type === 'TEAM_UPDATED' && data.payload?.id === teamId) {
        onUpdate(data.payload as Team);
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
            const team = (parsed.payload || parsed) as Team;
            if (team && team.id === teamId) {
              onUpdate(team);
            }
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
        const res = await apiFetch<{ team: Team }>(`/api/teams?id=${teamId}`);
        if (res?.team) {
          if (res.team.status !== lastStatus || res.team.current_step !== lastStep) {
            lastStatus = res.team.status;
            lastStep = res.team.current_step;
            onUpdate(res.team);
          }
        }
      } catch {
        // ignore
      }
    }, 1500);

    // D. Supabase Realtime channel (if reachable)
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
        .channel(`team-${teamId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'teams',
            filter: `id=eq.${teamId}`,
          },
          (payload) => {
            if (payload.new) {
              onUpdate(payload.new as Team);
            }
          }
        )
        .subscribe();
    } catch {
      // ignore
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      clearInterval(pollInterval);
      if (supabaseChannel) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {
          // ignore
        }
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
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
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
    } catch {
      // ignore
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      if (supabaseChannel) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {
          // ignore
        }
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
    let supabaseChannel: any = null;
    try {
      supabaseChannel = supabase
        .channel('admin-teams-table-listener')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
          onChange();
        })
        .subscribe();
    } catch {
      // ignore
    }

    return () => {
      syncChannel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scavenger_hunt_local_event', handleCustom);
      }
      sse?.close();
      if (supabaseChannel) {
        try {
          supabase.removeChannel(supabaseChannel);
        } catch {
          // ignore
        }
      }
    };
  },
};
