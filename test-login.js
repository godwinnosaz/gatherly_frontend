import axios from 'axios';

async function testLogin(email, password) {
  try {
    const response = await axios.post('https://apiv.gatherly.com.ng/api/auth/login', {
      email,
      password
    });
    console.log(`Login successful for ${email}:`, response.data);
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
  }
}

async function run() {
  await testLogin('churchtest@gatherlydemo.com', 'Password123!');
  await testLogin('tccfubthuniben@gmail.com', 'Password123!');
}

run();
