const fetch = globalThis.fetch;

async function runTests() {
  console.log('--- 1. Testing POST /api/admin/login ---');
  const loginRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-client': 'sajib-client-handshake-2026' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123456' }),
  });
  console.log('Login Status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login Token Present:', Boolean(loginData.token));
  console.log('User Role:', loginData.user?.role);

  if (!loginData.token) {
    console.error('Login failed, aborting remaining tests');
    return;
  }

  const token = loginData.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-app-client': 'sajib-client-handshake-2026',
    'Content-Type': 'application/json',
  };

  console.log('\n--- 2. Testing POST /api/auth/login (Auth alias) ---');
  const aliasRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-client': 'sajib-client-handshake-2026' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin123456' }),
  });
  console.log('Alias Login Status:', aliasRes.status);

  console.log('\n--- 3. Testing GET /api/admin/me ---');
  const meRes = await fetch('http://localhost:5000/api/admin/me', { headers: authHeaders });
  console.log('Me Status:', meRes.status);
  const meData = await meRes.json();
  console.log('Me Email:', meData.user?.email);

  console.log('\n--- 4. Testing GET /api/admin/stats ---');
  const statsRes = await fetch('http://localhost:5000/api/admin/stats', { headers: authHeaders });
  console.log('Stats Status:', statsRes.status);
  const statsData = await statsRes.json();
  console.log('Stats DB Mode:', statsData.dbMode);

  console.log('\n--- 5. Testing GET /api/admin/appointments ---');
  const apptRes = await fetch('http://localhost:5000/api/admin/appointments', { headers: authHeaders });
  console.log('Appointments Status:', apptRes.status);

  console.log('\n--- 6. Testing GET /api/admin/messages ---');
  const msgRes = await fetch('http://localhost:5000/api/admin/messages', { headers: authHeaders });
  console.log('Messages Status:', msgRes.status);

  console.log('\n--- 7. Testing GET /api/admin/special-services ---');
  const srvRes = await fetch('http://localhost:5000/api/admin/special-services', { headers: authHeaders });
  console.log('Services Status:', srvRes.status);
  const srvData = await srvRes.json();
  console.log('Services Count:', srvData.length);
}

runTests().catch(console.error);
