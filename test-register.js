import axios from 'axios';

async function testRegister() {
  try {
    const response = await axios.post('https://apiv.gatherly.com.ng/api/auth/register', {
      email: 'churchtest@gatherlydemo.com',
      password: 'Password123!',
      organization_name: 'Grace Life Campus Fellowship'
    });
    console.log('Register successful:', response.data);
  } catch (error) {
    console.error('Register failed:', error.response?.data || error.message);
  }
}

testRegister();
