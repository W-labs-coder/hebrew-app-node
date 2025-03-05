import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate and format R2 credentials
const validateR2Config = () => {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);
  }

  // Validate account ID format
  if (!/^[a-f0-9]{32}$/.test(process.env.R2_ACCOUNT_ID)) {
    throw new Error('Invalid R2_ACCOUNT_ID format');
  }

  // Clean up whitespace in credentials
  process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID.trim();
  process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY.trim();
  process.env.R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID.trim();

  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME
  };
};

const config = validateR2Config();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
  // Add these options for better debugging
  logger: console,
  maxAttempts: 3
});

// Generate presigned URL with error handling
export const generatePresignedUrl = async (key, contentType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read'
    });

    const url = await getSignedUrl(r2Client, command, { 
      expiresIn: 3600
    });

    // Verify the URL is valid
    if (!url) {
      throw new Error('Failed to generate presigned URL');
    }

    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', {
      error: error.message,
      code: error.Code,
      metadata: error.$metadata
    });
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
};

// Helper function to upload file to R2
export const uploadToR2 = async (file, key) => {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  });

  try {
    await r2Client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 upload error:', {
      error: error.message,
      code: error.Code,
      requestId: error.$metadata?.requestId
    });
    throw error;
  }
};

// Test connection with detailed logging
const testConnection = async () => {
  try {
    console.log('Testing R2 connection to:', `https://${config.accountId}.r2.cloudflarestorage.com`);
    
    console.log(config)
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: '.test',
      Body: 'test',
      ContentType: 'text/plain'
    });

    await r2Client.send(command);
    console.log('✅ R2 connection successful');
    return true;
  } catch (error) {
    console.error('❌ R2 connection failed:', {
      error: error.message,
      code: error.Code,
      metadata: error.$metadata,
      name: error.name,
      // Add stack trace in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw new Error(`Failed to connect to R2: ${error.message}`);
  }
};

// Export a function to verify credentials
export const verifyR2Credentials = async () => {
  return testConnection();
};

// Don't auto-test on import, export the test function instead
export { r2Client };