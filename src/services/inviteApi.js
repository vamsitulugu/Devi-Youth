// Invite-code flow — see supabase/07_invites_and_role_protection.sql.
// No email service, no service-role key: an admin generates a short
// code tied to a phone number + role, shares it over WhatsApp, and the
// invitee signs themselves up with the code on the /admin/join page.

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function assertReady() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
}

function up(err) {
  if (!err) return;
  const msg = err.message || '';
  if (/jwt|token/i.test(msg) && /(expired|invalid)/i.test(msg)) {
    throw new Error('Your session expired — please log in again.');
  }
  throw new Error(msg || 'Something went wrong.');
}

function generateCode() {
  // Excludes ambiguous characters (0/O, 1/I/L) so it's easy to read
  // and type back in from a WhatsApp message.
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ---------- admin side ----------
export async function listInviteCodes() {
  assertReady();
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false });
  up(error);
  return data || [];
}

export async function createInviteCode(phone, role = 'committee') {
  assertReady();
  const { data: userData } = await supabase.auth.getUser();
  const code = generateCode();
  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, phone: phone.trim(), role, created_by: userData?.user?.id || null })
    .select()
    .single();
  up(error);
  return data;
}

export async function revokeInviteCode(id) {
  assertReady();
  up((await supabase.from('invite_codes').delete().eq('id', id)).error);
}

// Builds a wa.me click-to-chat link with the invite code + join page
// pre-filled in the message, ready to send with one tap — no WhatsApp
// Business API, no server involved.
export function buildWhatsAppInviteLink(phone, code) {
  const joinUrl = `${window.location.origin}${window.location.pathname}#/admin/join?code=${code}`;
  const text =
    `You're invited to join the Devi Youth (Bala Ganesh Puja) committee app.\n\n` +
    `1) Open this link: ${joinUrl}\n` +
    `2) Enter your name, email, a password you choose, and this code: ${code}`;
  const digits = (phone || '').replace(/[^\d+]/g, '');
  return `https://wa.me/${digits.replace(/^\+/, '')}?text=${encodeURIComponent(text)}`;
}

// ---------- invitee side (public — called from Join.jsx) ----------
export async function validateInviteCode(code) {
  assertReady();
  const { data, error } = await supabase.rpc('validate_invite_code', { p_code: code });
  up(error);
  return data?.[0] || { is_valid: false, reason: 'Something went wrong checking that code.' };
}

export async function redeemInviteCode(code) {
  assertReady();
  const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: code });
  up(error);
  return data?.[0]?.role;
}
