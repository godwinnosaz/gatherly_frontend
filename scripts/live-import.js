import axios from 'axios';
import fs from 'fs/promises';

const BASE_URL = 'https://apiv.gatherly.com.ng/api';
const CSV_PATH = 'c:/Users/user/Documents/whatsapp/excos_contact_list.csv';
const AUTH_EMAIL = 'tccfubthuniben@gmail.com';
const AUTH_PASSWORD = '11111111';

const KNOWN_ROLES = new Set(['pastor','president','secretary','finance_officer','fellowship_admin','unit_head','department_leader','member']);

function parseCsvText(text) {
    if (!text) return { headers: [], rows: [] };
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').filter((l) => l !== undefined);
    let headerLineIndex = 0;
    while (headerLineIndex < lines.length && lines[headerLineIndex].trim() === '') headerLineIndex++;
    if (headerLineIndex >= lines.length) return { headers: [], rows: [] };

    const parseLine = (line) => {
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                cols.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        cols.push(cur.trim());
        return cols;
    };

    const headers = parseLine(lines[headerLineIndex]).map((h) => h.trim());
    const rawRows = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;
        const cols = parseLine(line);
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx] !== undefined ? cols[idx] : '';
        });
        if (Object.values(row).some((v) => v && String(v).trim() !== '')) {
            rawRows.push(row);
        }
    }
    return { headers, rows: rawRows };
}

function headerToKey(header) {
    if (!header) return '';
    const h = String(header).trim().toLowerCase();
    const map = {
        'first name': 'first_name',
        'firstname': 'first_name',
        'first_name': 'first_name',
        'surname': 'last_name',
        'last name': 'last_name',
        'lastname': 'last_name',
        'last_name': 'last_name',
        'full name': 'full_name',
        'fullname': 'full_name',
        'name': 'full_name',
        'email address': 'email',
        'emailaddress': 'email',
        'email_address': 'email',
        'email': 'email',
        'phone number': 'phone',
        'phonenumber': 'phone',
        'phone': 'phone',
        'position': 'role',
        'role': 'role'
    };
    return map[h] || '';
}

function autoMapHeaders(headers) {
    const m = {};
    headers.forEach((h) => {
        const key = headerToKey(h);
        if (key && !m[key]) m[key] = h;
    });
    return m;
}

function normalizeRole(v) {
    if (!v && v !== 0) return '';
    const s = String(v).trim().toLowerCase();
    const map = {
        pastor: 'pastor',
        president: 'president',
        'vice president': 'president',
        'general secretary': 'secretary',
        secretary: 'secretary',
        'financial secretary': 'finance_officer',
        'finance officer': 'finance_officer',
        'finance_officer': 'finance_officer',
        'fellowship admin': 'fellowship_admin',
        'unit head': 'unit_head',
        'department leader': 'department_leader',
        member: 'member'
    };
    return map[s] || s;
}

function extractToken(payload) {
    if (!payload) return null;
    if (typeof payload === 'string') {
        try {
            const parsed = JSON.parse(payload);
            return extractToken(parsed);
        } catch (e) {
            return null;
        }
    }
    if (payload.token) return payload.token;
    if (payload.access_token) return payload.access_token;
    if (payload.data) return extractToken(payload.data);
    return null;
}

function extractInviteData(payload) {
    if (!payload) return null;
    if (payload.invite_created) return payload;
    if (payload.data && payload.data.invite_created) return payload.data;
    return null;
}

(async function main() {
    console.log('Live import starting — reading CSV and logging in...');
    try {
        const content = await fs.readFile(CSV_PATH, 'utf8');
        const parsed = parseCsvText(content);
        console.log('Parsed headers ->', parsed.headers);
        console.log('Parsed rows ->', parsed.rows.length);

        // Auto-map headers
        const mapping = autoMapHeaders(parsed.headers);
        console.log('Auto-mapping:', mapping);

        // Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: AUTH_EMAIL, password: AUTH_PASSWORD }, { headers: { 'Content-Type': 'application/json' } });
        const token = extractToken(loginRes.data || loginRes);
        if (!token) {
            console.error('Failed to obtain token from login response:', loginRes.data || loginRes);
            process.exit(1);
        }
        console.log('Login successful, token length:', token.length);

        const results = [];

        for (let i = 0; i < parsed.rows.length; i++) {
            const raw = parsed.rows[i];
            const get = (key) => (mapping[key] ? (raw[mapping[key]] ?? '').trim() : '');
            const first = get('first_name');
            const last = get('last_name');
            const email = get('email');
            const phone = get('phone');
            const roleRaw = get('role');
            const normRole = normalizeRole(roleRaw);

            const payload = {
                first_name: first || '',
                last_name: last || '',
                email: email || '',
                phone: phone || '',
                status: 'active'
            };

            // include role only when it maps to a known backend role
            if (normRole && KNOWN_ROLES.has(normRole)) {
                payload.role = normRole;
            }

            console.log(`Submitting row ${i + 1}/${parsed.rows.length}:`, payload.first_name, payload.last_name, payload.email || '(no email)');

            try {
                const res = await axios.post(`${BASE_URL}/members/create`, payload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
                const respPayload = res.data || res;
                const invite = extractInviteData(respPayload);
                results.push({ index: i, raw, payload, success: true, response: respPayload, invite: invite });
                console.log(`Row ${i + 1} created successfully.`);
            } catch (err) {
                const info = {
                    index: i,
                    raw,
                    payload,
                    success: false,
                    error: (err.response && err.response.data) ? err.response.data : (err.message || String(err))
                };
                results.push(info);
                console.error(`Row ${i + 1} failed:`, info.error);
            }
        }

        // Summarize
        const summary = { total: results.length, created: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length };
        console.log('Import summary:', summary);

        // Write failed rows CSV
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            const headers = parsed.headers.concat(['errors']);
            const lines = [headers.join(',')];
            for (const f of failed) {
                const row = parsed.headers.map(h => '"' + String(f.raw[h] ?? '').replace(/"/g, '""') + '"').join(',');
                const errText = '"' + String(JSON.stringify(f.error)).replace(/"/g, '""') + '"';
                lines.push(`${row},${errText}`);
            }
            const outPath = './members-import-failed.csv';
            await fs.writeFile(outPath, lines.join('\n'), 'utf8');
            console.log('Wrote failed rows to', outPath);
        }

        // Write invite links CSV
        const invites = results.filter(r => r.success && r.invite);
        if (invites.length > 0) {
            const lines = [['name','email','role','invite_link','expires_at','email_sent'].join(',')];
            for (const it of invites) {
                const name = '"' + [it.payload.first_name, it.payload.last_name].filter(Boolean).join(' ').replace(/"/g, '""') + '"';
                const email = '"' + String(it.payload.email || '').replace(/"/g, '""') + '"';
                const role = '"' + String(it.payload.role || '').replace(/"/g, '""') + '"';
                const link = '"' + String(it.invite.invite_link || '').replace(/"/g, '""') + '"';
                const expires = '"' + String(it.invite.expires_at || '').replace(/"/g, '""') + '"';
                const sent = '"' + String(it.invite.email_sent ? 'true' : 'false').replace(/"/g, '""') + '"';
                lines.push([name,email,role,link,expires,sent].join(','));
            }
            const outPath = './members-invite-links.csv';
            await fs.writeFile(outPath, lines.join('\n'), 'utf8');
            console.log('Wrote invite links to', outPath);
        }

        console.log('Live import finished.');
        process.exit(0);
    } catch (e) {
        console.error('Live import failed:', e);
        process.exit(1);
    }
})();
