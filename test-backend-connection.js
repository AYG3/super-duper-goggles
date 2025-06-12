#!/usr/bin/env node

/**
 * Detailed Backend Connection Test
 * Tests specific scenarios that could cause net::ERR_FAILED
 */

const http = require('http');

async function testConnection() {
  console.log('🔍 Testing Backend Connection...\n');

  // Test 1: Basic port check
  console.log('1️⃣ Testing if port 5000 is open...');
  try {
    const response = await fetch('http://localhost:5000', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ Port 5000 is accessible: ${response.status} ${response.statusText}`);
    
    // Check response headers
    console.log('   Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`     ${key}: ${value}`);
    }
  } catch (error) {
    console.log(`❌ Port 5000 not accessible: ${error.message}`);
    console.log('   This explains the net::ERR_FAILED error!');
    return false;
  }

  // Test 2: API base path
  console.log('\n2️⃣ Testing API base path...');
  try {
    const response = await fetch('http://localhost:5000/api', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ API base path accessible: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ API base path not accessible: ${error.message}`);
  }

  // Test 3: Auth routes
  console.log('\n3️⃣ Testing auth routes...');
  try {
    const response = await fetch('http://localhost:5000/api/auth', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ Auth routes accessible: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Auth routes not accessible: ${error.message}`);
  }

  // Test 4: Registration endpoint with OPTIONS (CORS preflight)
  console.log('\n4️⃣ Testing registration endpoint CORS preflight...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      signal: AbortSignal.timeout(5000)
    });
    console.log(`✅ CORS preflight: ${response.status} ${response.statusText}`);
    
    // Check CORS headers
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };
    console.log('   CORS headers:', corsHeaders);
    
    if (!corsHeaders['access-control-allow-origin']) {
      console.log('   ⚠️  Missing CORS headers - this will cause CORS errors');
    }
  } catch (error) {
    console.log(`❌ CORS preflight failed: ${error.message}`);
  }

  // Test 5: Actual registration POST
  console.log('\n5️⃣ Testing registration POST request...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'Staff',
        department: 'IT'
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`✅ Registration POST: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('   Response body:', responseText);
    
    if (response.status === 400 || response.status === 409) {
      console.log('   ✅ This is expected (user exists or validation error)');
    }
  } catch (error) {
    console.log(`❌ Registration POST failed: ${error.message}`);
    if (error.message.includes('fetch')) {
      console.log('   🚨 This is the same error you\'re seeing in the frontend!');
    }
  }

  // Test 6: Check what's running on port 5000
  console.log('\n6️⃣ Checking what\'s running on port 5000...');
  try {
    const response = await fetch('http://localhost:5000', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    const text = await response.text();
    console.log('   Response body preview:', text.substring(0, 200) + '...');
    
    // Check if it looks like an Express server
    if (text.includes('Express') || text.includes('Cannot GET')) {
      console.log('   ✅ Looks like an Express server');
    } else {
      console.log('   ⚠️  Doesn\'t look like your expected backend server');
    }
  } catch (error) {
    console.log(`   Error reading response: ${error.message}`);
  }

  return true;
}

// Run the test
testConnection().then(() => {
  console.log('\n📋 Summary and Next Steps:');
  console.log('1. If port 5000 is not accessible, start your backend server');
  console.log('2. If CORS headers are missing, apply the CORS configuration fixes');
  console.log('3. If registration POST fails, check your backend routes and controller');
  console.log('4. Make sure your backend has the registerPublicUser function');
}).catch(console.error);
