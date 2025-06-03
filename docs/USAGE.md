# Usage Guide

This guide provides detailed examples for using the AWS Storage Uploader library.

## Basic Usage

### Uploading Files

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

// Create an uploader instance with your AWS region
const uploader = new S3Uploader('us-east-1');

// Or with an AWS profile
const uploaderWithProfile = new S3Uploader('us-east-1', 'your-aws-profile');

// Upload a single file
const result = await uploader.uploadFile(
  'your-bucket-name',
  '/path/to/your/file.jpg',
  'uploads/file.jpg', // Optional: specify a custom S3 key
  {
    metadata: {
      'description': 'Example image upload',
      'owner': 'spacecomx'
    },
    verbose: true // Enable console logging for operations
  }
);

console.log('Upload result:', result);
```

### Uploading Directories

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

const uploader = new S3Uploader('us-east-1');

// Upload an entire directory
const results = await uploader.uploadDirectory(
  'your-bucket-name',
  '/path/to/your/directory',
  'uploads/my-directory', // Optional: specify a prefix (folder) in S3
  {
    overwrite: false, // Skip files that already exist
    verbose: true     // Enable console logging for operations
  }
);

console.log(`Uploaded ${results.filter(r => r.uploaded).length} files`);
console.log(`Skipped ${results.filter(r => !r.uploaded).length} files`);
```

### Listing Objects

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

const uploader = new S3Uploader('us-east-1');

// List objects with a specific prefix
const keys = await uploader.listObjects(
  'your-bucket-name',
  'uploads/' // Optional: specify a prefix to filter objects
);

console.log(`Found ${keys.length} objects:`);
keys.forEach(key => console.log(`- ${key}`));
```

### Deleting Objects

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

const uploader = new S3Uploader('us-east-1');

// Delete a single object
await uploader.deleteObject(
  'your-bucket-name',
  'uploads/file.jpg',
  true // Optional: enable verbose logging
);

// Delete multiple objects
const keysToDelete = [
  'uploads/file1.jpg',
  'uploads/file2.jpg',
  'uploads/file3.jpg'
];

const deletedKeys = await uploader.deleteObjects(
  'your-bucket-name',
  keysToDelete,
  true // Optional: enable verbose logging
);

console.log(`Deleted ${deletedKeys.length} objects`);
```

## AWS Credentials

This package uses the AWS SDK for JavaScript v3, which will automatically use credentials from your environment:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Shared credentials file (`~/.aws/credentials`)
3. AWS SSO credentials (when using the `--profile` option or constructor parameter)
4. If running on Amazon EC2, credentials from the EC2 instance metadata service

### Using AWS SSO

If you've authenticated with AWS SSO using the AWS CLI, you can use those credentials:

```bash
# First, login with AWS SSO
aws sso login --profile your-sso-profile

# Then use that profile in your code
const uploader = new S3Uploader('us-east-1', 'your-sso-profile');
```