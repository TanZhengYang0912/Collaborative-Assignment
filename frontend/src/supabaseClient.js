import { createClient } from "@supabase/supabase-js";

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;

console.log("Supabase config:", {
  url: VITE_SUPABASE_URL,
  keyPrefix: VITE_SUPABASE_ANON_KEY?.slice(0, 20),
  keyLength: VITE_SUPABASE_ANON_KEY?.length
});

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
