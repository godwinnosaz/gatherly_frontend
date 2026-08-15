import axios from 'axios';

const BASE_URL = 'https://apiv.gatherly.com.ng/api';
const EMAIL = 'tccfubthuniben@gmail.com';
const PASSWORD = '11111111';

(async () => {
  try {
    console.log('Logging in...');
    const login = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD }, { headers: { 'Content-Type': 'application/json' } });
    const token = login.data?.token || login.data?.access_token || (login.data && login.data.data && (login.data.data.token || login.data.data.access_token));
    if (!token) {
      console.error('No token found in login response', login.data);
      process.exit(1);
    }
    console.log('Token obtained; fetching members...');

    const membersRes = await axios.get(`${BASE_URL}/members`, { headers: { Authorization: `Bearer ${token}` } });
    const members = membersRes.data?.members || membersRes.data?.data || membersRes.data || [];
    console.log('Members count:', Array.isArray(members) ? members.length : 'unknown');

    // Try to find recently imported sample emails
    const targets = ['promiseosadiaye9@gmail.com', 'Simonsonia2021@gmail.com', 'simonsonia2021@gmail.com'];
    const found = Array.isArray(members) ? members.find(m => targets.includes((m.email||'').toLowerCase())) : null;

    if (!found) {
      console.log('No test member found among first-level members list. Printing first 5 members for inspection:');
      console.log((Array.isArray(members) ? members.slice(0,5) : members));
      process.exit(0);
    }

    console.log('Found member:', found.email, 'id:', found.member_id || found.id || found.user_id);
    const id = found.member_id || found.id || found.user_id;

    console.log('Fetching detail by id...');
    const detail = await axios.get(`${BASE_URL}/members/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Detail:', detail.data || detail.data?.data || detail.data?.members || detail.data?.member || detail.data?.items || detail.data);

    // Update phone (append .test)
    const newPhone = (found.phone || '') + '.test';
    console.log('Updating phone to:', newPhone);
    const update = await axios.put(`${BASE_URL}/members/${id}`, { phone: newPhone }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Update response:', update.data || update.data?.data || update.data?.message || update.status);

    // Try role assign via /roles/assign
    console.log('Assigning role member -> member (no-op) to test roles assign endpoint');
    try {
      const assign = await axios.post(`${BASE_URL}/roles/assign`, { member_id: id, role: 'member' }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Roles assign response:', assign.data || assign.status);
    } catch (err) {
      console.error('Roles assign failed (ok to be missing):', err.response ? err.response.data : err.message);
    }

    // Try set login access via update
    console.log('Attempting to set login access via member update (role=member)');
    try {
      const setLogin = await axios.put(`${BASE_URL}/members/${id}`, { role: 'member', email: found.email }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Set login response:', setLogin.data || setLogin.status);
    } catch (err) {
      console.error('Set login failed:', err.response ? err.response.data : err.message);
    }

    console.log('Test actions complete. NOTE: delete action not executed for safety.');
  } catch (e) {
    console.error('Script error', e.response ? e.response.data : e.message);
    process.exit(1);
  }
})();
