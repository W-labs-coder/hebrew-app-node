import { verifyR2Credentials } from '../config/r2.js';
import * as dotenv from 'dotenv';


dotenv.config()

console.log('Verifying R2 credentials...');

async function main() {
  try {
    await verifyR2Credentials();
    console.log('✅ R2 credentials verified successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ R2 credential verification failed:', error.message);
    console.log('\nPlease verify your R2 configuration:');
    console.log('1. Go to Cloudflare Dashboard > R2');
    console.log('2. Select "Manage R2 API tokens"');
    console.log('3. Create a new token with "Object Read & Write" permissions');
    console.log('4. Copy the Account ID, Access Key ID, and Secret Access Key');
    console.log('5. Update your .env file with these values\n');
    process.exit(1);
  }
}

main();