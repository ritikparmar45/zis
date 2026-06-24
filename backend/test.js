/**
 * Quick Test Script for ZIP Pricing API
 * Run this while the server is active: node test.js
 */

const URL = 'http://localhost:5000/api/price';

async function testZip(zip) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip, productId: '123' })
    });
    
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ ZIP: ${zip.padEnd(8)} ➔ Calculated Price: $${data.price}`);
    } else {
      console.log(`❌ ZIP: ${zip.padEnd(8)} ➔ Error: "${data.message}" (Status: ${res.status})`);
    }
  } catch (err) {
    console.log(`💥 Connection Error for ZIP ${zip}: ${err.message}`);
  }
}

async function run() {
  console.log('==================================================');
  console.log('           Running Live API Integration Tests      ');
  console.log('==================================================\n');

  // Test correct matches
  await testZip('75028');
  await testZip('10001');
  await testZip('90210');

  // Test fallback (other zip)
  await testZip('94103');

  // Test missing zip validation error
  await testZip('');

  console.log('\n==================================================');
}

run();
