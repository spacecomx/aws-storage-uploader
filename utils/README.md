# AWS Storage Bucket

This project provides AWS CDK constructs for creating S3 storage buckets with different configurations for media, documents, and logs.

## S3 File Upload Utilities

This project includes utilities for uploading files and folders to S3 buckets.

### Installation

First, install the required dependencies:

```bash
# Using npm
npm install

# Using pnpm
pnpm install
```

### Using the S3Uploader Class

The `S3Uploader` class provides methods for uploading files and folders to S3 buckets.

#### Upload a Single File

```typescript
import { S3Uploader } from './lib/utils/s3-uploader';

async function uploadFile() {
  const uploader = new S3Uploader('us-east-1');
  
  try {
    const result = await uploader.uploadFile(
      'your-bucket-name',
      '/path/to/your/file.jpg',
      'uploads/file.jpg', // Optional: specify a custom S3 key
      {
        metadata: {
          'description': 'Example image upload'
        }
      }
    );
    
    console.log('Upload result:', result);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

uploadFile();
```

#### Upload a Directory

```typescript
import { S3Uploader } from './lib/utils/s3-uploader';

async function uploadDirectory() {
  const uploader = new S3Uploader('us-east-1');
  
  try {
    const results = await uploader.uploadDirectory(
      'your-bucket-name',
      '/path/to/your/directory',
      'uploads/my-directory', // Optional: specify a prefix (folder) in S3
      {
        overwrite: false // Skip files that already exist
      }
    );
    
    console.log(`Uploaded ${results.filter(r => r.uploaded).length} files`);
    console.log(`Skipped ${results.filter(r => !r.uploaded).length} files`);
  } catch (error) {
    console.error('Error uploading directory:', error);
  }
}

uploadDirectory();
```

### Using the Command-Line Interface

The project includes a command-line interface for uploading files and folders to S3 buckets.

```bash
# Upload a single file
ts-node examples/cli-uploader.ts --bucket your-bucket-name --file ./path/to/file.jpg

# Upload a directory
ts-node examples/cli-uploader.ts --bucket your-bucket-name --dir ./path/to/directory --prefix uploads/my-dir

# Upload a directory without overwriting existing files
ts-node examples/cli-uploader.ts --bucket your-bucket-name --dir ./path/to/directory --no-overwrite

# Specify a different AWS region
ts-node examples/cli-uploader.ts --bucket your-bucket-name --file ./path/to/file.jpg --region eu-west-1
```

### AWS Credentials

The S3Uploader uses the AWS SDK's default credential provider chain. Make sure you have configured your AWS credentials using one of the following methods:

1. Environment variables (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`)
2. AWS credentials file (`~/.aws/credentials`)
3. IAM roles for Amazon EC2 or ECS tasks
4. AWS SSO

## License

See the LICENSE file for details.