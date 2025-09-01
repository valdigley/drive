import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      galleries: {
        Row: {
          id: string;
          name: string;
          client_name: string;
          description: string | null;
          cover_photo_id: string | null;
          created_date: string;
          expiration_date: string | null;
          password: string | null;
          access_count: number;
          download_count: number;
          is_active: boolean;
          settings: any;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          client_name: string;
          description?: string | null;
          cover_photo_id?: string | null;
          created_date?: string;
          expiration_date?: string | null;
          password?: string | null;
          access_count?: number;
          download_count?: number;
          is_active?: boolean;
          settings?: any;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          client_name?: string;
          description?: string | null;
          cover_photo_id?: string | null;
          created_date?: string;
          expiration_date?: string | null;
          password?: string | null;
          access_count?: number;
          download_count?: number;
          is_active?: boolean;
          settings?: any;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          gallery_id: string;
          url: string;
          thumbnail: string;
          filename: string;
          size: number;
          upload_date: string;
          r2_key: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          gallery_id: string;
          url: string;
          thumbnail: string;
          filename: string;
          size: number;
          upload_date?: string;
          r2_key?: string | null;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          gallery_id?: string;
          url?: string;
          thumbnail?: string;
          filename?: string;
          size?: number;
          upload_date?: string;
          r2_key?: string | null;
          metadata?: any;
          created_at?: string;
        };
      };
      client_sessions: {
        Row: {
          id: string;
          gallery_id: string;
          session_id: string;
          accessed_at: string;
          favorites: string[];
          selected_photos: string[];
          downloads: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gallery_id: string;
          session_id: string;
          accessed_at?: string;
          favorites?: string[];
          selected_photos?: string[];
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gallery_id?: string;
          session_id?: string;
          accessed_at?: string;
          favorites?: string[];
          selected_photos?: string[];
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};