/**
 * Grant (or revoke) NYT-archive access for specific accounts.
 *
 * The NYT puzzle archive is gated by the `nyt_access` flag on users
 * (see migration 1781090000_nyt_access_gate.js). This flips that flag for a
 * list of emails so you + invited friends can see the archive while the public
 * never can.
 *
 * Run:
 *   npx ts-node scripts/grant_nyt_access.ts you@example.com friend@example.com
 *   npx ts-node scripts/grant_nyt_access.ts --revoke someone@example.com
 *
 * Env required:
 *   POCKETBASE_URL              (default: http://localhost:8092)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const args = process.argv.slice(2);
const revoke = args.includes('--revoke');
const emails = args.filter(a => a.includes('@')).map(e => e.trim().toLowerCase());

const pb = new PocketBase(PB_URL);

async function main() {
  if (emails.length === 0) {
    console.error('No emails provided. Usage: grant_nyt_access.ts [--revoke] email1 email2 ...');
    process.exit(1);
  }

  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  const value = !revoke;
  console.log(`${revoke ? 'Revoking' : 'Granting'} nyt_access for ${emails.length} account(s)...`);

  for (const email of emails) {
    try {
      const user = await pb.collection('users').getFirstListItem(`email = '${email}'`, { fields: 'id,email' });
      await pb.collection('users').update(user.id, { nyt_access: value });
      console.log(`  ✓ ${email} → nyt_access=${value}`);
    } catch {
      console.log(`  ✗ ${email} — no account found`);
    }
  }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
