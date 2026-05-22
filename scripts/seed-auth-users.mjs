/**
 * One-time: create password users in Supabase Auth (emp + azim).
 * Run from addx/:  npm run seed:users
 * Requires backend/.env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

/** Supabase requires passwords ≥ 6 characters. */
const USERS = [
  { username: 'emp', email: 'emp@addx.dev', password: 'emp123' },
  { username: 'azim', email: 'azim@addx.dev', password: 'azim123' },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureUser({ username, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`[ok] updated ${username} → ${email}`);
    return;
  }
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`[ok] created ${username} → ${email}`);
}

for (const u of USERS) {
  await ensureUser(u);
}

console.log('\nLogin: emp / emp123   or   azim / azim123');
console.log('Session is stored on device until Log out.');
