const axios = require('axios');

// Test registration
async function testRegistration() {
  try {
    console.log('Testing customer registration...');
    const customerResponse = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test Customer',
      email: 'test.customer@example.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('Customer registration response:', customerResponse.data);
    
    console.log('\nTesting farmer registration...');
    const farmerResponse = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test Farmer',
      email: 'test.farmer@example.com',
      password: 'password123',
      role: 'farmer'
    });
    console.log('Farmer registration response:', farmerResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testRegistration();