#!/usr/bin/env node
/**
 * Give an existing account a role (default SUPER_ADMIN).
 *   npm run make-admin -- you@example.com [ADMIN|SUPER_ADMIN|VOLUNTEER] [--local]
 * The person must have signed up on the site first.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const email = args.find(a => a.includes('@'));
const role = args.find(a => ['ADMIN', 'SUPER_ADMIN', 'VOLUNTEER', 'STUDENT'].includes(a)) || 'SUPER_ADMIN';
if (!email || !/^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(email)) {
    console.error('Usage: npm run make-admin -- you@example.com [ADMIN|SUPER_ADMIN]');
    process.exit(1);
}

const sql = `UPDATE docs SET data = json_set(data, '$.role', '${role}', '$.approvalStatus', 'ACTIVE'), rev = rev + 1 `
    + `WHERE path = (SELECT 'users/' || id FROM "user" WHERE email = '${email.toLowerCase()}'); `
    + `UPDATE coll_versions SET version = version + 1 WHERE parent = 'users'; `
    + `SELECT 'users/' || id AS profile, email FROM "user" WHERE email = '${email.toLowerCase()}';`;

// On Windows npx is a .cmd, so it must run through the shell; quote each
// argument ourselves (paths can contain spaces, e.g. C:\Users\First Last).
function runWrangler(args) {
    if (process.platform !== 'win32') return spawnSync('npx', ['wrangler', ...args], { stdio: 'inherit' });
    const quoted = args.map(a => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)).join(' ');
    return spawnSync(`npx wrangler ${quoted}`, { stdio: 'inherit', shell: true });
}

// A file avoids shell-quoting problems on Windows.
const dir = mkdtempSync(join(tmpdir(), 'make-admin-'));
const file = join(dir, 'make-admin.sql');
writeFileSync(file, sql);
const res = runWrangler(['d1', 'execute', 'DB', args.includes('--local') ? '--local' : '--remote', '--yes', `--file=${file}`]);
rmSync(dir, { recursive: true, force: true });
if (res.status === 0) console.log(`\nIf a profile row is listed above, ${email} is now ${role}. Sign out and back in to see it.`);
process.exit(res.status ?? 1);
