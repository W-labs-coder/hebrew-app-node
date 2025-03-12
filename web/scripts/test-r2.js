import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') }); // Fixed path to .env

async function testR2Connection() {
  // Validate required env variables
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('Testing R2 connection with:', {
    accountId: process.env.R2_ACCOUNT_ID,
    bucket: process.env.R2_BUCKET_NAME,
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  });

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true
  });

  try {
    console.log('📝 Creating test file...');
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'test.txt',
      Body: 'test content',
      ContentType: 'text/plain'
    });

    await client.send(putCommand);
    console.log('✅ Upload successful');
    
    console.log('🧹 Cleaning up test file...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'test.txt'
    });
    await client.send(deleteCommand);
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.error('❌ R2 operation failed:', {
      message: error.message,
      code: error.Code,
      requestId: error.$metadata?.requestId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
}

// Run the test
console.log('🔄 Starting R2 connection test...');
testR2Connection()
  .then(() => console.log('✨ Test completed successfully'))
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });