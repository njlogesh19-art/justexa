const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/admin/login', {
            email: 'n.j.logesh06@gmail.com',
            password: 'Leo@1905'
        });
        console.log('Login Success:', res.data);
    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.data : err.message);
    }
}

testLogin();
