import fs from 'fs';
import path from 'path';
import { Team, Checkpoint, Submission } from '@/types/database';

export interface StoreData {
  teams: Team[];
  checkpoints: Checkpoint[];
  submissions: Submission[];
}

export interface SyncEvent {
  id: number;
  type: string;
  payload: unknown;
  timestamp: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const INITIAL_CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    step_number: 1,
    title: 'Сургуулийн уриа (North Gate Plaza)',
    hint_image_url:
      'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?auto=format&fit=crop&w=800&q=80',
    lat: 39.9922,
    lng: 116.2942,
    qr_token: process.env.CHECKPOINT_QR_TOKEN_1 || '',
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
    hint_image_url:
      'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    lat: 39.9885,
    lng: 116.294,
    qr_token: process.env.CHECKPOINT_QR_TOKEN_2 || '',
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
    hint_image_url:
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
    lat: 39.9868,
    lng: 116.2925,
    qr_token: process.env.CHECKPOINT_QR_TOKEN_3 || '',
    question: 'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?',
    options: ['A. 1896', 'B. 1909', 'C. 1921', 'D. 1949'],
    correct_answer: 'A. 1896',
  },
  {
    id: 4,
    step_number: 4,
    title: 'Эртний ханзны оньсого (AI Smart Pavilion)',
    hint_image_url:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    lat: 39.9898,
    lng: 116.2965,
    qr_token: process.env.CHECKPOINT_QR_TOKEN_4 || '',
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
    hint_image_url:
      'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    lat: 39.9855,
    lng: 116.2952,
    qr_token: process.env.CHECKPOINT_QR_TOKEN_5 || '',
    question:
      'Оюутны виз сунгах, сургуулийн албан ёсны бүртгэл хийлгэхэд олон улсын оюутнууд заавал очдог газар аль нь вэ?',
    options: [
      'A. 国际教育学院 (CIE)',
      'B. 体育馆',
      'C. 校医院',
      'D. 保卫处',
    ],
    correct_answer: 'A. 国际教育学院 (CIE)',
  },
];

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_black_pearl',
    name: 'Хар Сувд',
    pin_code: process.env.TEAM_PIN_BLACK_PEARL || '',
    current_step: 0,
    status: 'photo_pending',
    initial_photo_url: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team_queen_anne',
    name: 'Хатан хааны өшөө авалт',
    pin_code: process.env.TEAM_PIN_QUEEN_ANNE || '',
    current_step: 0,
    status: 'photo_pending',
    initial_photo_url: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team_flying_dutchman',
    name: 'Нисдэг Голланд',
    pin_code: process.env.TEAM_PIN_FLYING_DUTCHMAN || '',
    current_step: 0,
    status: 'photo_pending',
    initial_photo_url: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team_golden_hind',
    name: 'Алтан Хинд',
    pin_code: process.env.TEAM_PIN_GOLDEN_HIND || '',
    current_step: 0,
    status: 'photo_pending',
    initial_photo_url: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'team_adventure_galley',
    name: 'Адал явдалт Галеон',
    pin_code: process.env.TEAM_PIN_ADVENTURE_GALLEY || '',
    current_step: 0,
    status: 'photo_pending',
    initial_photo_url: null,
    started_at: null,
    finished_at: null,
    created_at: new Date().toISOString(),
  },
];

type SSEClient = {
  id: string;
  send: (data: string) => void;
};

class ServerStore {
  private memoryStore: StoreData | null = null;
  private sseClients: Set<SSEClient> = new Set();
  private eventHistory: SyncEvent[] = [];
  private nextEventId = 1;

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private readFromDisk(): StoreData {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as StoreData;
        if (parsed && Array.isArray(parsed.teams)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read db.json:', err);
    }

    const defaultStore: StoreData = {
      teams: [...INITIAL_TEAMS],
      checkpoints: [...INITIAL_CHECKPOINTS],
      submissions: [],
    };
    this.writeToDisk(defaultStore);
    return defaultStore;
  }

  private writeToDisk(data: StoreData) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  public getStore(): StoreData {
    if (!this.memoryStore) {
      this.memoryStore = this.readFromDisk();
    }
    return this.memoryStore;
  }

  public emitEvent(type: string, payload: unknown): SyncEvent {
    const event: SyncEvent = {
      id: this.nextEventId++,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }

    const sseMessage = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;
    this.sseClients.forEach((client) => {
      try {
        client.send(sseMessage);
      } catch {
        this.sseClients.delete(client);
      }
    });

    return event;
  }

  public registerSSEClient(id: string, send: (data: string) => void): () => void {
    const client: SSEClient = { id, send };
    this.sseClients.add(client);
    return () => {
      this.sseClients.delete(client);
    };
  }

  public getEventsSince(lastId: number): SyncEvent[] {
    return this.eventHistory.filter((e) => e.id > lastId);
  }

  // --- Teams CRUD ---
  public getTeams(): Team[] {
    const store = this.getStore();
    return store.teams;
  }

  public getTeam(id: string): Team | null {
    const teams = this.getTeams();
    return teams.find((t) => t.id === id) || null;
  }

  public getTeamByPin(pin: string): Team | null {
    const teams = this.getTeams();
    const clean = pin.trim();
    return teams.find((t) => t.pin_code === clean) || null;
  }

  public createTeam(name: string, pin_code: string): Team {
    const store = this.getStore();
    const cleanPin = pin_code.trim();
    const cleanName = name.trim();

    const existing = store.teams.find(
      (t) => t.pin_code === cleanPin || t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newTeam: Team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      pin_code: cleanPin,
      current_step: 0,
      status: 'photo_pending',
      initial_photo_url: null,
      started_at: null,
      finished_at: null,
      created_at: new Date().toISOString(),
    };

    store.teams.push(newTeam);
    this.writeToDisk(store);
    this.emitEvent('TEAM_CREATED', newTeam);
    return newTeam;
  }

  public updateTeam(id: string, updates: Partial<Team>): Team {
    // Defense-in-depth: Never persist raw base64 data URIs in db.json or team records
    if (
      updates.initial_photo_url &&
      typeof updates.initial_photo_url === 'string' &&
      (updates.initial_photo_url.startsWith('data:') ||
        (!updates.initial_photo_url.startsWith('/') &&
          !updates.initial_photo_url.startsWith('http') &&
          updates.initial_photo_url.length > 500))
    ) {
      try {
        let buffer: Buffer | null = null;
        let ext = '.jpg';

        if (updates.initial_photo_url.startsWith('data:')) {
          const commaIdx = updates.initial_photo_url.indexOf(',');
          if (commaIdx !== -1) {
            const meta = updates.initial_photo_url.slice(0, commaIdx);
            const base64Data = updates.initial_photo_url.slice(commaIdx + 1);
            if (meta.includes('png')) ext = '.png';
            else if (meta.includes('webp')) ext = '.webp';
            else if (meta.includes('gif')) ext = '.gif';
            buffer = Buffer.from(base64Data.trim(), 'base64');
          }
        } else {
          buffer = Buffer.from(updates.initial_photo_url.trim(), 'base64');
        }

        if (buffer && buffer.length > 0) {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const fileName = `team_${id}_${Date.now()}${ext}`;
          fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
          updates.initial_photo_url = `/uploads/${fileName}`;
        } else {
          updates.initial_photo_url = null;
        }
      } catch (err) {
        console.error('Failed to convert base64 initial_photo_url to disk file in serverStore:', err);
        updates.initial_photo_url = null;
      }
    }

    const store = this.getStore();
    let updatedTeam: Team | null = null;

    store.teams = store.teams.map((t) => {
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
      store.teams.unshift(updatedTeam);
    }

    this.writeToDisk(store);
    this.emitEvent('TEAM_UPDATED', updatedTeam);
    return updatedTeam;
  }

  public deleteTeam(id: string): void {
    const store = this.getStore();
    store.teams = store.teams.filter((t) => t.id !== id);
    store.submissions = store.submissions.filter((s) => s.team_id !== id);
    this.writeToDisk(store);
    this.emitEvent('TEAM_DELETED', { id });
  }

  public resetTeam(id: string): Team | null {
    return this.updateTeam(id, {
      current_step: 0,
      status: 'photo_pending',
      initial_photo_url: null,
      started_at: null,
      finished_at: null,
    });
  }

  // --- Submissions ---
  public getSubmissions(): Submission[] {
    return this.getStore().submissions;
  }

  public recordSubmission(team_id: string, checkpoint_id: number): Submission {
    const store = this.getStore();
    const newSub: Submission = {
      id: Date.now(),
      team_id,
      checkpoint_id,
      completed_at: new Date().toISOString(),
    };

    store.submissions = [
      newSub,
      ...store.submissions.filter(
        (s) => !(s.team_id === team_id && s.checkpoint_id === checkpoint_id)
      ),
    ];
    this.writeToDisk(store);
    this.emitEvent('SUBMISSION_CREATED', newSub);
    return newSub;
  }

  // --- Checkpoints ---
  public getCheckpoints(): Checkpoint[] {
    return this.getStore().checkpoints;
  }
}

const globalForServerStore = globalThis as unknown as { serverStoreInstance?: ServerStore };
export const serverStore = globalForServerStore.serverStoreInstance || new ServerStore();
if (process.env.NODE_ENV !== 'production') {
  globalForServerStore.serverStoreInstance = serverStore;
}
