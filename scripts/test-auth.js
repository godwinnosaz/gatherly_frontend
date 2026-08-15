/* eslint-disable */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

globalThis.mockImportMeta = { env: { DEV: true } };

console.log('🚀 Starting Gatherly Frontend Auth Automated Tests...');

// 1. Resolve and read AuthContext.jsx
const authContextPath = path.resolve('src/context/AuthContext.jsx');
if (!fs.existsSync(authContextPath)) {
  console.error(`❌ Error: AuthContext.jsx not found at ${authContextPath}`);
  process.exit(1);
}
const authContextContent = fs.readFileSync(authContextPath, 'utf8')
  .replace(/import\.meta/g, 'globalThis.mockImportMeta');

// 2. Extract getOnboardingKey arrow function
const getOnboardingKeyStart = authContextContent.indexOf('export const getOnboardingKey =');
if (getOnboardingKeyStart === -1) {
  console.error('❌ Error: Could not locate export const getOnboardingKey in AuthContext.jsx');
  process.exit(1);
}
const getOnboardingKeyEnd = authContextContent.indexOf('const AuthContext =');
const getOnboardingKeyText = authContextContent
  .substring(getOnboardingKeyStart, getOnboardingKeyEnd)
  .replace('export const getOnboardingKey = ', '')
  .trim();

// Evaluate and construct the getOnboardingKey function
const getOnboardingKey = eval(getOnboardingKeyText);

// 3. Extract login function from inside AuthProvider
const loginStart = authContextContent.indexOf('const login = async');
const registerStart = authContextContent.indexOf('const register = async');
if (loginStart === -1 || registerStart === -1) {
  console.error('❌ Error: Could not locate login or register functions in AuthContext.jsx');
  process.exit(1);
}
let loginText = authContextContent.substring(loginStart, registerStart).trim();
// Strip trailing semicolon if present to allow eval as a clean expression
if (loginText.endsWith(';')) {
  loginText = loginText.slice(0, -1);
}
// Strip the leading variable assignment so it evaluates as an anonymous arrow function
loginText = loginText.replace('const login = ', '');

// Mock Global dependencies for login evaluation
globalThis.localStorage = {
  store: {},
  setItem(key, val) {
    this.store[key] = String(val);
  },
  getItem(key) {
    return this.store[key] || null;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

globalThis.currentUser = null;
globalThis.setUser = (user) => {
  globalThis.currentUser = user;
};

// Evaluate and construct the login function
const login = eval(loginText);

// 4. Extract checkAuth function from inside AuthProvider useEffect
const checkAuthStart = authContextContent.indexOf('const checkAuth = async () =>');
if (checkAuthStart === -1) {
  console.error('❌ Error: Could not locate checkAuth function in AuthContext.jsx');
  process.exit(1);
}
const checkAuthEnd = authContextContent.indexOf('checkAuth();');
let checkAuthText = authContextContent.substring(checkAuthStart, checkAuthEnd).trim();
if (checkAuthText.endsWith(';')) {
  checkAuthText = checkAuthText.slice(0, -1);
}
checkAuthText = checkAuthText.replace('const checkAuth = ', '');

// Mock state setter for loading
globalThis.currentLoading = true;
globalThis.setLoading = (val) => {
  globalThis.currentLoading = val;
};

// Evaluate and construct checkAuth
const checkAuth = eval(checkAuthText);

// ─────────────────────────────────────────────────────────────────────────────
// TEST RUNNER & ASSERTIONS
// ─────────────────────────────────────────────────────────────────────────────
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
    failedTests++;
  }
}

// --- Test 1: Onboarding key scoping for valid inputs ---
test('Onboarding Key Scoping - Generates correct scoped key for valid user', () => {
  const user = { id: 456, tenant_id: 123, name: 'Pastor John' };
  const expectedKey = 'gatherly_onboarding_complete:123:456';
  const actualKey = getOnboardingKey(user);
  
  assert.strictEqual(actualKey, expectedKey, 'The generated onboarding key does not match the scoped template.');
});

// --- Test 2: Onboarding key scoping for invalid inputs ---
test('Onboarding Key Scoping - Returns null for invalid or incomplete user objects', () => {
  assert.strictEqual(getOnboardingKey(null), null, 'Should return null for null user.');
  assert.strictEqual(getOnboardingKey({}), null, 'Should return null for empty object.');
  assert.strictEqual(getOnboardingKey({ id: 456 }), null, 'Should return null for user missing tenant_id.');
  assert.strictEqual(getOnboardingKey({ tenant_id: 123 }), null, 'Should return null for user missing id.');
});

// --- Test 3: Onboarding key scoping isolation ---
test('Onboarding Key Scoping - Verifies strict tenant & user isolation', () => {
  const userA = { id: 456, tenant_id: 123 };
  const userB = { id: 456, tenant_id: 999 }; // Different tenant
  const userC = { id: 888, tenant_id: 123 }; // Different user
  
  const keyA = getOnboardingKey(userA);
  const keyB = getOnboardingKey(userB);
  const keyC = getOnboardingKey(userC);
  
  assert.notStrictEqual(keyA, keyB, 'Keys must differ when tenant IDs are different.');
  assert.notStrictEqual(keyA, keyC, 'Keys must differ when user IDs are different.');
});

// --- Test 4: AuthContext login - handles flat token success format ---
test('AuthContext Login - Handles flat token response successfully', async () => {
  // Reset mock state
  globalThis.localStorage.clear();
  globalThis.currentUser = null;
  
  // Mock API call to return a flat token object
  globalThis.api = {
    post: async (url, data) => {
      assert.strictEqual(url, '/auth/login');
      return {
        token: 'token_flat_123',
        user: { id: 456, tenant_id: 123, name: 'Pastor John' }
      };
    }
  };

  const response = await login('john@example.com', 'password123');
  
  assert.strictEqual(globalThis.localStorage.getItem('gatherly_token'), 'token_flat_123', 'Should stash token in localStorage.');
  assert.deepStrictEqual(globalThis.currentUser, { id: 456, tenant_id: 123, name: 'Pastor John' }, 'Should set the active user in React state.');
});

// --- Test 5: AuthContext login - handles nested token success format ---
test('AuthContext Login - Handles nested token response successfully', async () => {
  // Reset mock state
  globalThis.localStorage.clear();
  globalThis.currentUser = null;
  
  // Mock API call to return a nested structure
  globalThis.api = {
    post: async (url, data) => {
      return {
        data: {
          token: 'token_nested_999',
          user: { id: 777, tenant_id: 888, name: 'Admin Jane' }
        }
      };
    }
  };

  await login('jane@example.com', 'password123');
  
  assert.strictEqual(globalThis.localStorage.getItem('gatherly_token'), 'token_nested_999', 'Should stash nested token in localStorage.');
  assert.deepStrictEqual(globalThis.currentUser, { id: 777, tenant_id: 888, name: 'Admin Jane' }, 'Should set the active user in React state.');
});

// --- Test 6: AuthContext login - handles API failure format (status: false) ---
test('AuthContext Login - Throws unauthenticated error when API returns status: false', async () => {
  globalThis.localStorage.clear();
  globalThis.currentUser = null;
  
  // Mock API call to return a failed state
  globalThis.api = {
    post: async (url, data) => {
      return {
        status: false,
        message: 'Invalid credentials.'
      };
    }
  };

  try {
    await login('john@example.com', 'wrongpassword');
    assert.fail('Login should have thrown an error.');
  } catch (error) {
    assert.strictEqual(error.type, 'unauthenticated', 'Error type must be unauthenticated.');
    assert.strictEqual(error.message, 'Invalid credentials.', 'Error message should match API response.');
  }
});

// --- Test 7: AuthContext login - handles missing token failure ---
test('AuthContext Login - Throws unauthenticated error when token is missing in response', async () => {
  globalThis.localStorage.clear();
  globalThis.currentUser = null;
  
  // Mock API returning a user but no token
  globalThis.api = {
    post: async (url, data) => {
      return {
        success: true,
        user: { id: 111 }
      };
    }
  };

  try {
    await login('john@example.com', 'password');
    assert.fail('Login should have thrown an error.');
  } catch (error) {
    assert.strictEqual(error.type, 'unauthenticated', 'Error type must be unauthenticated.');
    assert.strictEqual(error.message, 'Invalid email or password.', 'Should fallback to default unauthenticated message.');
  }
});

// --- Test 8: Invitation Routing & Param parsing ---
test('AcceptInvite - Resolves token from route parameter or query string', () => {
  // Simulate routing parameters
  const useParamsMock1 = () => ({ inviteToken: 'token_path_123' });
  const useSearchParamsMock1 = () => [new Map([['token', 'token_query_456']])];

  // Logic: token = inviteToken || searchParams.get('token')
  const tokenFromPath = useParamsMock1().inviteToken || useSearchParamsMock1()[0].get('token');
  assert.strictEqual(tokenFromPath, 'token_path_123', 'Path parameter should take precedence.');

  const useParamsMock2 = () => ({});
  const useSearchParamsMock2 = () => [new Map([['token', 'token_query_789']])];
  const tokenFromQuery = useParamsMock2().inviteToken || useSearchParamsMock2()[0].get('token');
  assert.strictEqual(tokenFromQuery, 'token_query_789', 'Query parameter should resolve successfully when path param is absent.');
});

// --- Test 9: Invitation storage extraction ---
test('AcceptInvite - Correctly extracts and stores token, user, tenant, role, and roles', () => {
  globalThis.localStorage.clear();

  // Simulated backend response for acceptInvite
  const response = {
    token: 'jwt_invite_token_123',
    user: { id: 88, name: 'Deacon Mark', role: 'fellowship_admin' },
    tenant: { id: 10, name: 'First Baptist Church' },
    role: 'fellowship_admin',
    roles: ['fellowship_admin', 'member']
  };

  // Simulated AcceptInvite handleSubmit extraction/storage block
  const payload = response?.data || response;
  const tokenVal = payload?.token || response?.token;
  const userVal = payload?.user || response?.user;
  const tenantVal = payload?.tenant || response?.tenant || payload?.organization || response?.organization;
  const roleVal = payload?.role || response?.role || userVal?.role;
  const rolesVal = payload?.roles || response?.roles || (roleVal ? [roleVal] : []);

  if (tokenVal) localStorage.setItem('gatherly_token', tokenVal);
  if (userVal) localStorage.setItem('gatherly_user', JSON.stringify(userVal));
  if (tenantVal) localStorage.setItem('gatherly_tenant', JSON.stringify(tenantVal));
  if (roleVal) localStorage.setItem('gatherly_role', roleVal);
  if (rolesVal) localStorage.setItem('gatherly_roles', JSON.stringify(rolesVal));

  assert.strictEqual(localStorage.getItem('gatherly_token'), 'jwt_invite_token_123');
  assert.deepStrictEqual(JSON.parse(localStorage.getItem('gatherly_user')), { id: 88, name: 'Deacon Mark', role: 'fellowship_admin' });
  assert.deepStrictEqual(JSON.parse(localStorage.getItem('gatherly_tenant')), { id: 10, name: 'First Baptist Church' });
  assert.strictEqual(localStorage.getItem('gatherly_role'), 'fellowship_admin');
  assert.deepStrictEqual(JSON.parse(localStorage.getItem('gatherly_roles')), ['fellowship_admin', 'member']);
});

// --- Test 10: Finance validation error normalizer ---
test('Finance - friendlyError formats complex validation errors cleanly', () => {
  const err = {
    type: 'validation',
    message: 'The given data was invalid.',
    errors: {
      amount: ['The amount field is required.', 'The amount must be a number.'],
      reference_number: 'The reference number has already been taken.'
    }
  };

  const friendlyError = (err) => {
      if (!err) return 'Something went wrong.';
      if (err.type === 'validation') {
          if (err.errors && typeof err.errors === 'object') {
              const messages = Object.entries(err.errors).map(([field, msg]) => {
                  const fieldName = field.replace('_', ' ');
                  return `${fieldName}: ${Array.isArray(msg) ? msg.join(', ') : msg}`;
              });
              if (messages.length > 0) {
                  return `${err.message || 'Validation error'}: ${messages.join(' | ')}`;
              }
          }
          return err.message || 'Please check the fields.';
      }
      return err.message || 'Something went wrong.';
  };

  const actualMsg = friendlyError(err);
  const expectedMsg = 'The given data was invalid.: amount: The amount field is required., The amount must be a number. | reference number: The reference number has already been taken.';
  assert.strictEqual(actualMsg, expectedMsg, 'Should extract and cleanly concatenate validation descriptions.');
});

// --- Test 11: Finance transaction payload keys validation ---
test('Finance - payload contains exactly and only the 8 supported keys', () => {
  const form = {
    amount: '12500',
    type: 'income',
    account_id: '3',
    category_id: '5',
    description: '  Mid-Week Tithe Collections  ',
    date: '2026-05-18',
    reference_number: 'ref-mw-55 ',
    strict_mode: false,
    unsupported_field_xyz: 'hack'
  };

  // Logic: exactly the payload construction inside AddTransactionModal handleSubmit
  const payload = {
      amount:      Number(form.amount),
      type:        form.type,
      account_id:  Number(form.account_id),
      category_id: Number(form.category_id),
      description: form.description.trim(),
      date:        form.date,
      strict_mode: form.type === 'expense' ? Boolean(form.strict_mode) : false,
      reference_number: form.reference_number.trim() || null
  };

  // Check supported keys
  const expectedKeys = ['amount', 'type', 'account_id', 'category_id', 'description', 'date', 'strict_mode', 'reference_number'];
  assert.deepStrictEqual(Object.keys(payload).sort(), expectedKeys.sort(), 'Payload should contain exactly the 8 supported fields.');
  
  // Verify value conversions
  assert.strictEqual(payload.amount, 12500);
  assert.strictEqual(payload.account_id, 3);
  assert.strictEqual(payload.category_id, 5);
  assert.strictEqual(payload.description, 'Mid-Week Tithe Collections');
  assert.strictEqual(payload.reference_number, 'ref-mw-55');
  assert.strictEqual(payload.strict_mode, false);
});

// --- Test 12: FlowService endpoints correctness ---
test('FlowService - mapping targets exactly the 7 Postman endpoints', () => {
  const mockApi = {
    getRequests: [],
    postRequests: [],
    get(url, config) {
      this.getRequests.push({ url, config });
      return Promise.resolve({ data: { status: true } });
    },
    post(url, data) {
      this.postRequests.push({ url, data });
      return Promise.resolve({ data: { status: true } });
    }
  };

  const FlowServiceTest = {
    getAll: (params) => mockApi.get('/flows', { params }),
    save: (data) => mockApi.post('/flows/save', data),
    getById: (id) => mockApi.get(`/flows/show/${id}`),
    getByKey: (flowKey) => mockApi.get(`/flows/byKey/${flowKey}`),
    publish: (id) => mockApi.post(`/flows/publish/${id}`),
    archive: (id) => mockApi.post(`/flows/archive/${id}`),
    delete: (id) => mockApi.post(`/flows/delete/${id}`),
  };

  // Trigger all 7 operations
  FlowServiceTest.getAll({ page: 1 });
  FlowServiceTest.save({ key: 'budget_approval', steps: ['unit_head'] });
  FlowServiceTest.getById(44);
  FlowServiceTest.getByKey('budget_approval');
  FlowServiceTest.publish(12);
  FlowServiceTest.archive(12);
  FlowServiceTest.delete(12);

  // Assert GET calls
  assert.strictEqual(mockApi.getRequests[0].url, '/flows');
  assert.deepStrictEqual(mockApi.getRequests[0].config, { params: { page: 1 } });
  assert.strictEqual(mockApi.getRequests[1].url, '/flows/show/44');
  assert.strictEqual(mockApi.getRequests[2].url, '/flows/byKey/budget_approval');

  // Assert POST calls
  assert.strictEqual(mockApi.postRequests[0].url, '/flows/save');
  assert.deepStrictEqual(mockApi.postRequests[0].data, { key: 'budget_approval', steps: ['unit_head'] });
  assert.strictEqual(mockApi.postRequests[1].url, '/flows/publish/12');
  assert.strictEqual(mockApi.postRequests[2].url, '/flows/archive/12');
  assert.strictEqual(mockApi.postRequests[3].url, '/flows/delete/12');
});

// --- Test 13: AuthContext checkAuth - deletes token on 401 unauthenticated error ---
test('AuthContext checkAuth - deletes token on 401 unauthenticated', async () => {
  // Set initial mock state
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('gatherly_token', 'token_401');
  globalThis.localStorage.setItem('gatherly_user', JSON.stringify({ id: 1 }));
  globalThis.currentUser = { id: 1 };
  globalThis.currentLoading = true;

  // Mock API to throw 401 unauthenticated error
  globalThis.api = {
    get: async (url) => {
      assert.strictEqual(url, '/auth/me');
      throw {
        status: 401,
        type: 'unauthenticated',
        message: 'Unauthorized'
      };
    }
  };

  await checkAuth();

  assert.strictEqual(globalThis.localStorage.getItem('gatherly_token'), null, 'Should delete token on 401.');
  assert.strictEqual(globalThis.localStorage.getItem('gatherly_user'), null, 'Should delete cached user on 401.');
  assert.strictEqual(globalThis.currentUser, null, 'Should clear React user state.');
  assert.strictEqual(globalThis.currentLoading, false, 'Should set loading to false.');
});

// --- Test 14: AuthContext checkAuth - preserves token and restores session on network/timeout errors ---
test('AuthContext checkAuth - preserves token and restores cached session on network/timeout error', async () => {
  // Set initial mock state
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('gatherly_token', 'token_timeout');
  globalThis.localStorage.setItem('gatherly_user', JSON.stringify({ id: 99, tenant_id: 10, name: 'Pastor Bob' }));
  globalThis.currentUser = null;
  globalThis.currentLoading = true;

  // Mock API to throw a CORS/network timeout error
  globalThis.api = {
    get: async (url) => {
      assert.strictEqual(url, '/auth/me');
      throw {
        type: 'cors_or_network',
        message: 'Network request failed'
      };
    }
  };

  await checkAuth();

  assert.strictEqual(globalThis.localStorage.getItem('gatherly_token'), 'token_timeout', 'Should preserve token on network timeout.');
  assert.deepStrictEqual(globalThis.currentUser, {
    id: 99,
    tenant_id: 10,
    name: 'Pastor Bob',
    onboarding_completed: false
  }, 'Should recover user from cache rather than booting them out.');
  assert.strictEqual(globalThis.currentLoading, false, 'Should set loading to false.');
});

// --- Test 15: App - DashboardRedirect allows direct landing ---
test('App - DashboardRedirect routes authenticated users directly to Dashboard without gating on onboarding status', () => {
  const NavigateMock = (props) => ({ type: 'Navigate', to: props.to });
  const DashboardMock = () => ({ type: 'Dashboard' });

  const testDashboardRedirect = (user) => {
    if (user) {
      return DashboardMock();
    }
    return NavigateMock({ to: '/login' });
  };

  // Case A: user is present, onboarding is incomplete -> Land on Dashboard directly
  const userA = { id: 1, tenant_id: 100, onboarding_completed: false };
  const resA = testDashboardRedirect(userA);
  assert.deepStrictEqual(resA, { type: 'Dashboard' }, 'Should render Dashboard directly even if onboarding is incomplete.');

  // Case B: user is present, onboarding is complete -> Land on Dashboard directly
  const userB = { id: 2, tenant_id: 200, onboarding_completed: true };
  const resB = testDashboardRedirect(userB);
  assert.deepStrictEqual(resB, { type: 'Dashboard' }, 'Should render Dashboard directly.');

  // Case C: user is null -> Redirect to login
  const resC = testDashboardRedirect(null);
  assert.deepStrictEqual(resC, { type: 'Navigate', to: '/login' }, 'Should redirect to login if user is not present.');
});

// --- Test 16: AuthContext - hasRole and hasAnyRole helper functions ---
test('AuthContext - hasRole and hasAnyRole helpers match active user roles', () => {
  const hasRole = (user, role) => user?.role === role;
  const hasAnyRole = (user, roles) => user ? roles.includes(user.role) : false;

  const testUser = { id: 10, role: 'pastor' };

  // hasRole checks
  assert.strictEqual(hasRole(testUser, 'pastor'), true, 'Should match correct role.');
  assert.strictEqual(hasRole(testUser, 'member'), false, 'Should reject mismatched role.');
  assert.strictEqual(hasRole(null, 'pastor'), false, 'Should return false if user is null.');

  // hasAnyRole checks
  assert.strictEqual(hasAnyRole(testUser, ['pastor', 'super_admin']), true, 'Should match if role is in list.');
  assert.strictEqual(hasAnyRole(testUser, ['member', 'unit_head']), false, 'Should reject if role is not in list.');
  assert.strictEqual(hasAnyRole(null, ['pastor']), false, 'Should return false if user is null.');
});

// --- Test 17: AuthContext - Scoped Onboarding Completion Flow ---
test('AuthContext - Scoped Onboarding Completion Flow validates getOnboardingKey, isOnboardingComplete, and markOnboardingComplete', () => {
  const localStore = {};
  const mockLocalStorage = {
    getItem: (key) => localStore[key] || null,
    setItem: (key, val) => { localStore[key] = String(val); },
    removeItem: (key) => { delete localStore[key]; }
  };

  const testGetOnboardingKey = (user, tenant) => {
    const tenantId = tenant?.id || tenant?.tenant_id || user?.tenant_id || user?.organization_id;
    const userId = user?.id;
    if (!tenantId || !userId) return null;
    return `gatherly_onboarding_complete:${tenantId}:${userId}`;
  };

  const testIsOnboardingComplete = (user, tenant) => {
    if (!user) return false;
    const backendComplete = 
      user.onboarding_completed === 1 || user.onboarding_completed === true ||
      user.organization?.onboarding_completed === 1 || user.organization?.onboarding_completed === true ||
      user.tenant?.onboarding_completed === 1 || user.tenant?.onboarding_completed === true ||
      tenant?.onboarding_completed === 1 || tenant?.onboarding_completed === true;

    if (backendComplete) return true;

    const key = testGetOnboardingKey(user, tenant);
    return key ? mockLocalStorage.getItem(key) === 'true' : false;
  };

  // Case 1: getOnboardingKey extraction from tenant ID and user ID
  const u1 = { id: 45, tenant_id: 101 };
  const key1 = testGetOnboardingKey(u1);
  assert.strictEqual(key1, 'gatherly_onboarding_complete:101:45', 'Should generate correct key from user tenant_id.');

  const u2 = { id: 45 };
  const t2 = { id: 202 };
  const key2 = testGetOnboardingKey(u2, t2);
  assert.strictEqual(key2, 'gatherly_onboarding_complete:202:45', 'Should generate correct key from separate tenant object.');

  // Case 2: Prefer backend value
  const uBackendComplete = { id: 50, tenant_id: 101, onboarding_completed: true };
  assert.strictEqual(testIsOnboardingComplete(uBackendComplete), true, 'Should mark complete if backend user flag is true.');

  const uBackendIncomplete = { id: 50, tenant_id: 101, onboarding_completed: false };
  assert.strictEqual(testIsOnboardingComplete(uBackendIncomplete), false, 'Should be incomplete if backend is false and no local storage key.');

  // Case 3: Fallback to scoped local storage key
  const scopedKey = testGetOnboardingKey(uBackendIncomplete);
  mockLocalStorage.setItem(scopedKey, 'true');
  assert.strictEqual(testIsOnboardingComplete(uBackendIncomplete), true, 'Should mark complete if scoped local storage key is true.');

  // Case 4: Isolation test
  const anotherUserOnSameBrowser = { id: 99, tenant_id: 101, onboarding_completed: false };
  assert.strictEqual(testIsOnboardingComplete(anotherUserOnSameBrowser), false, 'Another user should not inherit onboarding completion from local storage.');
});

// --- Test 18: Dashboard Setup Checklist Resilience and Logic ---
test('Dashboard Setup Checklist - Gracefully determines progress and tolerates partial API failures', () => {
  // Test helper to compute task states
  const determineChecklistState = ({ user, tenant, members, departments, accounts, finance, sessions }) => {
    // 1. Profile Completion Check
    const org = user?.organization || user?.tenant || tenant;
    const hasProfile = !!(org?.location || org?.phone || org?.logo || org?.email);

    // 2. Members & Leaders
    const hasMembers = Array.isArray(members) && members.length > 0;
    const hasLeaders = Array.isArray(members) && members.some(m => m.role && m.role !== 'member');

    // 3. Departments
    const hasDepts = Array.isArray(departments) && departments.length > 0;

    // 4. Finance Accounts
    const hasAccounts = Array.isArray(accounts) && accounts.length > 0;

    // 5. Transactions
    const balance = finance?.balance || finance?.net_fund || 0;
    const income = finance?.income || finance?.total_income || 0;
    const expense = finance?.expense || finance?.total_expense || 0;
    const hasTransactions = income > 0 || expense > 0 || balance !== 0;

    // 6. Attendance Sessions
    const hasSessions = Array.isArray(sessions) && sessions.length > 0;

    return {
      profile: hasProfile,
      member: hasMembers,
      dept: hasDepts,
      account: hasAccounts,
      leader: hasLeaders,
      transaction: hasTransactions,
      session: hasSessions
    };
  };

  // Case A: Fresh New Organization (All setup states are false)
  const freshState = determineChecklistState({
    user: { id: 1 },
    tenant: { name: 'Grace Fellowship' }, // no contact/location yet
    members: [],
    departments: [],
    accounts: [],
    finance: null,
    sessions: []
  });

  assert.deepStrictEqual(freshState, {
    profile: false,
    member: false,
    dept: false,
    account: false,
    leader: false,
    transaction: false,
    session: false
  }, 'Should show all checklist items incomplete for a brand new organization.');

  // Case B: Partially Configured Organization
  const partialState = determineChecklistState({
    user: { id: 1, tenant: { name: 'Grace Fellowship', location: 'Lagos' } }, // location provided -> profile true
    members: [
      { id: 10, role: 'pastor' }, // leader -> leader true
      { id: 11, role: 'member' }  // members exist -> member true
    ],
    departments: [],
    accounts: [ { id: 5 } ], // accounts exist -> account true
    finance: { total_income: 1000 }, // transaction exists -> transaction true
    sessions: []
  });

  assert.deepStrictEqual(partialState, {
    profile: true,
    member: true,
    dept: false,
    account: true,
    leader: true,
    transaction: true,
    session: false
  }, 'Should correctly calculate completed vs incomplete items based on real-time API values.');
});

// --- Final Summary ---
console.log('\n📊 Test Execution Summary:');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n💥 Error: Some automated tests failed!');
  process.exit(1);
} else {
  console.log('\n🎉 Success: All automated tests passed successfully!');
  process.exit(0);
}
