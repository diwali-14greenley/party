export type RsvpStatus = 'going' | 'maybe' | 'declined';

export interface PartyEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  cover_emoji: string | null;
  hosted_by?: string | null;
  rsvp_open: boolean;
  show_guest_list: boolean;
  created_at?: string;
}

export interface Rsvp {
  id: string;
  event_id: string;
  name: string;
  email: string;
  status: RsvpStatus;
  plus_ones: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicGuest {
  name: string;
  status: RsvpStatus;
  plus_ones: number;
}

export interface MyRsvp {
  name: string;
  email: string;
  status: RsvpStatus;
  plus_ones: number;
  note: string | null;
}
