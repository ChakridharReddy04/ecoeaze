// Script to create an admin user for testing
const http = require('http');

// Admin user data
const adminData = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin'
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

// Create admin user
async function createAdminUser() {
  console.log('Creating admin user...');
  
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
    const response = await makeRequest(options, adminData);
    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the script
createAdminUser();