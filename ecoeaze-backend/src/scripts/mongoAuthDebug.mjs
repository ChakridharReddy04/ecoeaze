import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not set in env');
  process.exit(1);
}

async function test(mech) {
  try {
    const opts = mech ? { authMechanism: mech } : {};
    console.log('\n=== Testing auth mechanism:', mech || 'default', '===');
    const client = new MongoClient(uri, opts);
    await client.connect();
    console.log('Connected OK with', mech || 'default');
    const res = await client.db('ecoeaze').command({ ping: 1 });
    console.log('Ping result:', res);
    await client.close();
  } catch (err) {
    console.error('Error for', mech || 'default');
    console.error(err && err.stack ? err.stack : err);
  }
}

(async () => {
  await test();
  await test('SCRAM-SHA-256');
  await test('SCRAM-SHA-1');
  // Try explicit auth option instead of URI credentials
  console.log('\n=== Testing explicit auth options ===');
  try {
    const { MongoClient } = await import('mongodb');
    const uriBase = process.env.MONGO_URI.split('?')[0];
    const client = new MongoClient(uriBase, {
      auth: { username: 'ecoeaze', password: 'ecoeaze123' },
      authSource: 'ecoeaze',
    });
    await client.connect();
    console.log('Connected with explicit auth options (ecoeaze)');
    await client.db('ecoeaze').command({ ping: 1 });
    await client.close();

    // Also try admin credentials explicitly
    const clientAdmin = new MongoClient(uriBase, {
      auth: { username: 'admin', password: 'password' },
      authSource: 'admin',
    });
    await clientAdmin.connect();
    console.log('Connected with explicit auth options (admin)');
    await clientAdmin.db('admin').command({ ping: 1 });
    await clientAdmin.close();
  } catch (err) {
    console.error('Explicit auth options error');
    console.error(err && err.stack ? err.stack : err);
  }
})();
