/* ==========================================================================
   Supabase 클라이언트 초기화
   ========================================================================== */

const SUPABASE_URL = "https://qorrgowvzdnvknpwpdcw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bMGNHnoz3CrXx_jc-dgiiw_aYAKRNAJ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
