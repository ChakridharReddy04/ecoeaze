// Simple test script to verify auth endpoints
const http = require('http');

// Test data
const customerData = {
  name: 'Test Customer',
  email: 'test.customer@example.com',
  password: 'password123',
  role: 'customer'
};

const farmerData = {
  name: 'Test Farmer',
  email: 'test.farmer@example.com',
  password: 'password123',
  role: 'farmer'
};

// Function to make HTTP requests
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

// Test registration
async function testRegistration() {
  console.log('Testing customer registration...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, customerData);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testRegistration();