// Simple test harness for MemberImport parsing + mapping
// Runs locally, does NOT call the backend.

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
    'active status': 'status',
    'status': 'status',
    'login access': 'grant_login_access',
    'login': 'grant_login_access',
    'grant_login_access': 'grant_login_access',
    'role name': 'role',
    'role': 'role',
    'unit': 'department',
    'department': 'department',
    'dept': 'department',
    'department id': 'department_id',
    'department_id': 'department_id'
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
    'general secretary': 'secretary',
    secretary: 'secretary',
    'financial secretary': 'finance_officer',
    'finance officer': 'finance_officer',
    'finance_officer': 'finance_officer',
    'fellowship admin': 'fellowship_admin',
    'unit head': 'unit_head',
    'department leader': 'department_leader',
    'department leader ': 'department_leader',
    'department_leader': 'department_leader',
    member: 'member'
  };
  return map[s] || s;
}

function normalizeStatus(v) {
  if (!v && v !== 0) return '';
  const s = String(v).trim().toLowerCase();
  if (['active', 'inactive', 'pending'].includes(s)) return s === 'pending' ? 'inactive' : s;
  if (['yes', 'true', '1'].includes(s)) return 'active';
  if (['no', 'false', '0'].includes(s)) return 'inactive';
  return '';
}

function parseLoginAccess(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return ['yes', 'true', '1', 'login'].includes(s);
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function buildPreviewRows(rawRows, mappingObj, depts) {
  return rawRows.map((raw, idx) => {
    const get = (key) => (mappingObj[key] ? (raw[mappingObj[key]] ?? '').trim() : '');
    const full = get('full_name');
    let first = get('first_name');
    let last = get('last_name');
    if (!first && full) {
      const parts = full.split(/\s+/).filter(Boolean);
      first = parts.shift() || '';
      last = parts.join(' ') || '';
    }
    const email = get('email');
    const phone = get('phone');
    const rawStatus = get('status');
    const status = normalizeStatus(rawStatus);
    const grant_login_access = parseLoginAccess(get('grant_login_access'));
    const role_raw = get('role');
    const role = normalizeRole(role_raw);
    const deptName = get('department');
    const deptIdRaw = get('department_id');

    let matchedDeptId = '';
    let deptMatchLabel = ''
    if (deptIdRaw) {
      const found = depts.find((d) => String(d.value) === String(deptIdRaw).trim());
      if (found) {
        matchedDeptId = found.value;
        deptMatchLabel = found.name;
      }
    } else if (deptName) {
      const found = depts.find((d) => d.name.trim().toLowerCase() === String(deptName).trim().toLowerCase());
      if (found) {
        matchedDeptId = found.value;
        deptMatchLabel = found.name;
      }
    }

    const validation = [];
    if (!first) validation.push('Missing first name');
    if (grant_login_access) {
      if (!email) validation.push('Missing email');
      else if (!isValidEmail(email)) validation.push('Invalid email');
      if (!role) validation.push('Missing or invalid role');
    }
    if (role && !['pastor','president','secretary','finance_officer','fellowship_admin','unit_head','department_leader','member'].includes(role)) {
      validation.push('Invalid role');
    }
    if (!status) validation.push('Invalid status');
    if ((role === 'unit_head' || role === 'department_leader') && !matchedDeptId) validation.push('Department required for Unit Head / Department Leader');
    if ((get('department') || get('department_id')) && !matchedDeptId) validation.push('Unknown department');

    return {
      index: idx,
      original: raw,
      first_name: first,
      last_name: last,
      email,
      phone,
      status,
      grant_login_access,
      role_raw,
      role,
      department_raw: deptName,
      department_id_raw: deptIdRaw,
      department_id: matchedDeptId,
      department_label: deptMatchLabel,
      validation: {
        valid: validation.length === 0,
        errors: validation
      }
    };
  });
}

function buildPayload(r) {
  const payload = {
    first_name: (r.first_name || '').trim(),
    last_name: (r.last_name || '').trim(),
    email: (r.email || '').trim(),
    phone: (r.phone || '').trim(),
    status: r.status || 'inactive'
  };
  if (r.role) {
    payload.role = r.role;
    if ((r.role === 'unit_head' || r.role === 'department_leader') && r.department_id) payload.department_id = r.department_id;
  }
  return payload;
}

// Sample CSV from the task
const sample = `first_name,last_name,email,phone,status,grant_login_access,role,department
John,Choir,john.choir@example.com,08011111111,active,yes,unit_head,Choir
Sarah,James,sarah.secretary@example.com,08022222222,active,yes,secretary,
Michael,Paul,michael.finance@example.com,08033333333,active,yes,finance_officer,
Mary,Member,mary.member@example.com,08044444444,active,no,,`;

const parsed = parseCsvText(sample);
console.log('A) CSV parser result:');
console.log(' headers ->', parsed.headers);
console.log(' rows ->', parsed.rows.length);

const mockDepts = [ { value: '3', name: 'Choir' }, { value: '4', name: 'Finance' } ];
const mapping = autoMapHeaders(parsed.headers);
console.log('\nB) Auto-detected mapping:');
console.log(mapping);

const preview = buildPreviewRows(parsed.rows, mapping, mockDepts);
console.log('\nC) CSV preview (first rows):');
preview.forEach((r, i) => {
  console.log(`Row ${i+1}: name=${r.first_name} ${r.last_name}, email=${r.email}, phone=${r.phone}, status=${r.status}, login=${r.grant_login_access}, role=${r.role}, dept_id=${r.department_id}, valid=${r.validation.valid}, errors=${r.validation.errors.join('; ')}`);
});

console.log('\nD) Payloads to be submitted for valid rows:');
preview.forEach((r) => {
  if (r.validation.valid) console.log(buildPayload(r));
});

console.log('\nE) Failed rows:');
preview.filter(r => !r.validation.valid).forEach(r => console.log(`Row ${r.index+1}: ${r.validation.errors.join('; ')}`));

console.log('\nTest complete. No backend calls were performed.');
