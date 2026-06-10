import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Trim all whitespace (including mid-string spaces caused by copy-paste errors)
const supabaseUrl = rawUrl?.replace(/\s+/g, "");
const supabaseAnonKey = rawKey?.trim();

// Startup diagnostic (safe — only logs partial values)
console.info(
  "[RecruitIQ] Supabase init:",
  supabaseUrl
    ? `URL="${supabaseUrl.slice(0, 35)}..." (${supabaseUrl.length} chars)`
    : "VITE_SUPABASE_URL is UNDEFINED",
  supabaseAnonKey
    ? `KEY starts with "${supabaseAnonKey.slice(0, 10)}..." (${supabaseAnonKey.length} chars)`
    : "VITE_SUPABASE_ANON_KEY is UNDEFINED"
);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase env vars missing. " +
      (!supabaseUrl ? "VITE_SUPABASE_URL is not set. " : "") +
      (!supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY is not set." : "")
  );
}

if (!supabaseUrl.startsWith("https://")) {
  throw new Error(
    `VITE_SUPABASE_URL must start with https:// — got: "${supabaseUrl}"`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
