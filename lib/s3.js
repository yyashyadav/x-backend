import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  throw new Error('Missing AWS S3 configuration. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
}

let cached = globalThis.__s3Client;
if (!cached) {
  cached = globalThis.__s3Client = { client: null };
}

export function getS3Client() {
  if (cached.client) return cached.client;

  cached.client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY
    }
  });

  return cached.client;
}

export default getS3Client;


