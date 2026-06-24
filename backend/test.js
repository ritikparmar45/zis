/**
 * Quick Test Script for ZIP Pricing API with Shopify App Proxy Signature Validation.
 * Run this while the server is active:
 *   $env:SHOPIFY_API_SECRET="test_secret"; node test.js
 */

const crypto = require('crypto');

const URL = 'http://localhost:5000/api/price';
const SECRET = process.env.SHOPIFY_API_SECRET || 'test_secret';

// Helper to generate Shopify HMAC signature
function generateSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => {
      const val = Array.isArray(params[key]) ? params[key].join(',') : params[key];
      return `${key}=${val}`;
    })
    .join('');

  return crypto
    .createHmac('sha256', secret)
    .update(sortedParams, 'utf-8')
    .digest('hex');
}

async function testPriceQuery({ zip, description, queryParams = {} }) {
  try {
    // Construct query string
    const query = new URLSearchParams(queryParams).toString();
    const targetUrl = query ? `${URL}?${query}` : URL;

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip, productId: '123' })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ [SUCCESS] ${description}`);
      console.log(`   ZIP: ${zip} ➔ Calculated Price: $${data.price}\n`);
    } else {
      console.log(`❌ [BLOCKED] ${description}`);
      console.log(`   Status: ${res.status} | Error: "${data.message}"\n`);
    }
  } catch (err) {
    console.log(`💥 Connection Error: ${err.message}\n`);
  }
}

async function run() {
  console.log('==================================================');
  console.log('      Shopify App Proxy Security Test Suite       ');
  console.log('==================================================');
  console.log(`Using Shared Secret: "${SECRET}"\n`);

  const now = Math.floor(Date.now() / 1000);

  // 1. Test case: Request with no signature at all
  console.log('--- TEST 1: Request with no App Proxy Signature ---');
  await testPriceQuery({
    zip: '75028',
    description: 'Direct call without signature parameters'
  });

  // 2. Test case: Request with valid signature & fresh timestamp
  console.log('--- TEST 2: Valid App Proxy Signature & Fresh Timestamp ---');
  const validParams = {
    shop: 'luxury-sofa-bed-demo.myshopify.com',
    path_prefix: '/apps/zip-pricing',
    timestamp: now.toString()
  };
  validParams.signature = generateSignature(validParams, SECRET);
  await testPriceQuery({
    zip: '75028',
    description: 'Signed proxy request for ZIP 75028 (Special price: $1499)',
    queryParams: validParams
  });

  // 3. Test case: Request with invalid (tampered) signature
  console.log('--- TEST 3: Invalid/Tampered App Proxy Signature ---');
  const tamperedParams = {
    shop: 'luxury-sofa-bed-demo.myshopify.com',
    path_prefix: '/apps/zip-pricing',
    timestamp: now.toString()
  };
  tamperedParams.signature = 'incorrect_signature_hash_1234567890abcdef';
  await testPriceQuery({
    zip: '10001',
    description: 'Signed proxy request with tampered HMAC signature',
    queryParams: tamperedParams
  });

  // 4. Test case: Request with expired timestamp
  console.log('--- TEST 4: Expired Timestamp (Replay Attack) ---');
  const expiredParams = {
    shop: 'luxury-sofa-bed-demo.myshopify.com',
    path_prefix: '/apps/zip-pricing',
    timestamp: (now - 900).toString() // 15 minutes ago (limit is 10 mins)
  };
  expiredParams.signature = generateSignature(expiredParams, SECRET);
  await testPriceQuery({
    zip: '90210',
    description: 'Signed proxy request with expired timestamp (15 mins ago)',
    queryParams: expiredParams
  });

  console.log('==================================================');
}

run();
