async function runTests() {
  console.log('--- STARTING SECURITY SUITE VERIFICATION ---');

  // Test 1: Direct Raw API Access (No headers, like a bot or unauthorized curl)
  console.log('\n[Test 1] Testing direct raw API access to /api/bootstrap...');
  const res1 = await fetch('http://localhost:5000/api/bootstrap');
  const data1 = await res1.json();
  console.log('Status:', res1.status, '(Expected 403 Forbidden)');
  console.log('Response:', data1);
  if (res1.status === 403) {
    console.log('PASS: Direct unauthorized API access successfully blocked!');
  } else {
    console.error('FAIL: Direct API access was not blocked!');
  }

  // Test 2: Legitimate Server-Side Call (With x-api-secret)
  console.log('\n[Test 2] Testing authorized server call with x-api-secret...');
  const res2 = await fetch('http://localhost:5000/api/bootstrap', {
    headers: {
      'x-api-secret': 'sajib-api-shield-9f4a8b1c7e2d6305a4f78e1b52a1c0de',
    },
  });
  console.log('Status:', res2.status, '(Expected 200 OK)');
  if (res2.status === 200) {
    console.log('PASS: Authorized internal request succeeded!');
  } else {
    console.error('FAIL: Authorized internal request failed!');
  }

  // Test 3: Authorized Browser Call with Origin & App-Client Handshake
  console.log('\n[Test 3] Testing authorized web browser client call with Origin and Handshake...');
  const res3 = await fetch('http://localhost:5000/api/bootstrap', {
    headers: {
      Origin: 'http://localhost:3000',
      'x-app-client': 'sajib-client-handshake-2026',
      'x-requested-with': 'XMLHttpRequest',
    },
  });
  console.log('Status:', res3.status, '(Expected 200 OK)');
  if (res3.status === 200) {
    console.log('PASS: Authorized browser request succeeded!');
  } else {
    console.error('FAIL: Authorized browser request failed!');
  }

  // Test 4: Malicious Third-Party Domain Access
  console.log('\n[Test 4] Testing malicious third-party cross-origin call...');
  const res4 = await fetch('http://localhost:5000/api/bootstrap', {
    headers: {
      Origin: 'https://evil-hacker-site.com',
      'x-app-client': 'sajib-client-handshake-2026',
    },
  });
  console.log('Status:', res4.status, '(Expected 403 Forbidden)');
  if (res4.status === 403) {
    console.log('PASS: Unauthorized cross-origin request blocked by CORS!');
  } else {
    console.error('FAIL: Unauthorized origin was not blocked!');
  }

  // Test 5: Admin Route Protection Without Token
  console.log('\n[Test 5] Testing unauthorized access to admin stats /api/admin/stats...');
  const res5 = await fetch('http://localhost:5000/api/admin/stats');
  console.log('Status:', res5.status, '(Expected 401 or 403)');
  if (res5.status === 401 || res5.status === 403) {
    console.log('PASS: Admin route is protected!');
  } else {
    console.error('FAIL: Admin route is exposed!');
  }

  // Test 6: Valid Admin Login
  console.log('\n[Test 6] Testing valid Admin Login...');
  const res6 = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
      'x-app-client': 'sajib-client-handshake-2026',
    },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'UjmeMkFNsQ3Rk2f4rV6Q',
    }),
  });
  const data6 = await res6.json();
  console.log('Status:', res6.status, '(Expected 200 OK)');
  console.log('Has Token:', !!data6.token, 'Role:', data6.user?.role);
  if (res6.status === 200 && data6.token && data6.user?.role === 'admin') {
    console.log('PASS: Admin login authenticated successfully!');
  } else {
    console.error('FAIL: Admin login failed!', data6);
  }

  // Test 7: Accessing Admin Stats with the Token
  if (data6.token) {
    console.log('\n[Test 7] Testing access to /api/admin/stats with valid JWT...');
    const res7 = await fetch('http://localhost:5000/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${data6.token}`,
        Origin: 'http://localhost:3000',
        'x-app-client': 'sajib-client-handshake-2026',
      },
    });
    console.log('Status:', res7.status, '(Expected 200 OK)');
    const data7 = await res7.json();
    console.log('DB Mode:', data7.dbMode, 'Appointments:', data7.totalAppointments);
    if (res7.status === 200 && data7.dbMode) {
      console.log('PASS: Authenticated admin access works cleanly!');
    } else {
      console.error('FAIL: Authenticated admin access failed!');
    }
  }

  // Test 8: Frontend Pages Rendering with Secure Backend
  console.log('\n[Test 8] Testing frontend page rendering (http://localhost:3000/bn)...');
  const res8 = await fetch('http://localhost:3000/bn');
  console.log('Status:', res8.status, '(Expected 200 OK)');
  if (res8.status === 200) {
    console.log('PASS: Frontend communicates with secure backend seamlessly!');
  } else {
    console.error('FAIL: Frontend failed to communicate with secure backend!');
  }

  console.log('\n--- ALL SECURITY TESTS COMPLETED ---');
}

runTests().catch(console.error);

