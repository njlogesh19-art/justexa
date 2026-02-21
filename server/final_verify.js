const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function verify() {
    try {
        console.log('--- Verifying Advocate Marketplace ---');
        // Login as admin to get a token (if needed, or just sign up a new user)
        // Actually, let's just use the seed endpoint result which is public
        const seedRes = await axios.post(`${BASE_URL}/marketplace/seed`);
        console.log('Seed response:', seedRes.data);

        // Get all advocates (need token)
        // Let's create a temporary user for testing
        const email = `test_${Date.now()}@example.com`;
        const signupRes = await axios.post(`${BASE_URL}/auth/register/user`, {
            name: 'Test User',
            email: email,
            location: 'Chennai',
            password: 'StrongPassword@123',
            role: 'user'
        });
        const token = signupRes.data.token;
        console.log('Created test user and got token.');

        const advocatesRes = await axios.get(`${BASE_URL}/marketplace`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const advocates = advocatesRes.data.advocates;
        const total = advocates.length;
        const juniors = advocates.filter(a => a.experience_years < 3).length;
        console.log(`Verified Advocates: Total=${total}, Juniors=${juniors} (${(juniors / total * 100).toFixed(1)}%)`);

        if (total === 100 && juniors >= 75) {
            console.log('✅ Advocate Marketplace verification PASSED');
        } else {
            console.log('❌ Advocate Marketplace verification FAILED');
        }

        console.log('\n--- Verifying Case Tracker Search Search Logic ---');
        // Search for a case
        const cnr = 'TNCH010012345';
        const caseRes = await axios.get(`${BASE_URL}/cases/${cnr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (caseRes.data.case && caseRes.data.case.cnr_no === cnr) {
            console.log(`✅ API correctly returned case data for CNR: ${cnr}`);
        } else {
            console.log(`❌ API failed to return case data for CNR: ${cnr}`);
        }

        console.log('\nVerification complete!');
        process.exit(0);
    } catch (err) {
        console.error('Verification failed:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

verify();
