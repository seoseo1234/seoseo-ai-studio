import { createClient } from '@supabase/supabase-js';

// Vercel 빌드 시 환경변수가 주입되지 않았을 때(정적 생성 시) 빌드 에러를 방지하기 위해 fallback 값을 제공합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
