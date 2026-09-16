export type TeamStatus = 'photo_pending' | 'in_progress' | 'finished';

export interface Team {
  id: string;
  name: string;
  pin_code: string;
  current_step: number;
  status: TeamStatus;
  initial_photo_url: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Checkpoint {
  id: number;
  step_number: number;
  title: string;
  hint_image_url: string | null;
  lat: number;
  lng: number;
  qr_token: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  created_at?: string;
}

export interface Submission {
  id: number;
  team_id: string;
  checkpoint_id: number;
  completed_at: string;
}
