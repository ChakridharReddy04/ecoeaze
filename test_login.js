// Simple test script to verify login endpoint
const http = require('http');

// Test data
const loginData = {
  email: 'test.customer@example.com',
  password: 'password123'
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

// Test login
async function testLogin() {
  console.log('Testing login...');
  
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, loginData);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testLogin();