async function testServerConnection() {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch (err) {
    console.error('Server connection test failed:', err);
    return false;
  }
}

async function testUsersCollectionAccess() {
  try {
    const res = await fetch('/api/users?_limit=1');
    if (!res.ok) throw new Error('Failed to fetch users');
    const json = await res.json();
    console.log('Users Collection Access:', { count: Array.isArray(json) ? json.length : 0, sample: json });
    return true;
  } catch (err) {
    console.error('Users collection access test failed:', err);
    return false;
  }
}

async function testReadUserDocument(userId: string) {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) {
      console.log('User Document not found');
      return false;
    }
    const json = await res.json();
    console.log('User Document Found:', json);
    return true;
  } catch (err) {
    console.error('Read user document failed:', err);
    return false;
  }
}

// Test 1: Check server connection
async function testFirebaseConnection() {
  return testServerConnection();
}

// Test 4: Check Firestore security rules
async function checkSecurityRules() {
  try {
    // Try to read from a protected collection
    const res = await fetch('/api/students?_limit=1');
    console.log('Security Rules Test: Can read students collection', {
      status: res.ok,
    });
    return res.ok;
  } catch (err: any) {
    console.warn('Security Rules Test: Access denied (expected if rules are strict)', err.message);
    return false;
  }
}

// Test 5: Full diagnostic
async function runFullDiagnostic() {
  console.log('='.repeat(50));
  console.log('FIREBASE DIAGNOSTIC REPORT');
  console.log('='.repeat(50));

  console.log('\n1. Testing Firebase Connection...');
  const connected = await testFirebaseConnection();
  console.log(`   Result: ${connected ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n2. Testing Users Collection Access...');
  const usersAccess = await testUsersCollectionAccess();
  console.log(`   Result: ${usersAccess ? '✓ PASS' : '✗ FAIL'}`);

  console.log(`\n3. Testing Server Connection...`);
  const serverConnection = await testServerConnection();
  console.log(`   Result: ${serverConnection ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n4. Testing Security Rules...');
  const securityRules = await checkSecurityRules();
  console.log(`   Result: ${securityRules ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(50));

  return {
    connected,
    usersAccess,
    securityRules,
  };
}

// Usage: 
// Copy and paste into browser console on the app:
// await runFullDiagnostic();

export { testServerConnection as testFirebaseConnection, testUsersCollectionAccess, testReadUserDocument, checkSecurityRules, runFullDiagnostic };
