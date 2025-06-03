# AWS Storage Uploader

A utility for uploading files and directories to AWS S3 buckets and managing S3 objects.

## Features

- Upload single files to S3
- Upload entire directories to S3 (recursively)
- List objects in S3 buckets
- Delete objects from S3 buckets
- Command-line interface for easy usage
- TypeScript support with full type definitions

## Installation

```bash
# Using npm
npm install @spacecomx/aws-storage-uploader

# Using yarn
yarn add @spacecomx/aws-storage-uploader

# Using pnpm
pnpm add @spacecomx/aws-storage-uploader
```

## Usage

### Uploading Files

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

// Create an uploader instance with your AWS region
const uploader = new S3Uploader('us-east-1');

// Upload a single file
const result = await uploader.uploadFile(
  'your-bucket-name',
  '/path/to/your/file.jpg',
  'uploads/file.jpg', // Optional: specify a custom S3 key
  {
    metadata: {
      'description': 'Example image upload',
      'owner': 'spacecomx'
    }
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
    overwrite: false // Skip files that already exist
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
  'uploads/file.jpg'
);

// Delete multiple objects
const keysToDelete = [
  'uploads/file1.jpg',
  'uploads/file2.jpg',
  'uploads/file3.jpg'
];

const deletedKeys = await uploader.deleteObjects(
  'your-bucket-name',
  keysToDelete
);

console.log(`Deleted ${deletedKeys.length} objects`);
```

## Command Line Interface

This package includes a CLI tool for uploading files and directories to S3.

### Running the CLI locally during development

If you're developing this package locally and want to test the CLI without installing it globally, you can run it directly:

```bash
# Using Node.js directly
node src/cli.js --bucket my-bucket --file ./path/to/file.jpg

# Using ts-node (if you have it installed)
ts-node src/cli.ts --bucket my-bucket --file ./path/to/file.jpg

# Using the pnpm script
pnpm run cli -- --bucket my-bucket --file ./path/to/file.jpg
```

### Running the CLI from the installed package

Once the package is installed, you can use it as follows:

```bash
# Using npx (npm)
npx aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg

# Using pnpm
pnpm exec aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg

# Using pnpm dlx for packages not installed locally
pnpm dlx @spacecomx/aws-storage-uploader --bucket my-bucket --dir ./path/to/directory --prefix uploads/my-dir

# List objects
pnpm exec aws-storage-uploader --bucket my-bucket --list uploads/

# Delete an object
pnpm exec aws-storage-uploader --bucket my-bucket --delete uploads/file.jpg

# Delete all objects with a prefix (with confirmation prompt)
pnpm exec aws-storage-uploader --bucket my-bucket --delete-all uploads/temp/
```

### CLI Options

- `--bucket <name>`: S3 bucket name (required)
- `--region <region>`: AWS region (default: us-east-1)
- `--file <path>`: Path to file to upload
- `--dir <path>`: Path to directory to upload
- `--prefix <prefix>`: S3 key prefix (folder path in bucket)
- `--no-overwrite`: Skip files that already exist in the bucket
- `--list <prefix>`: List objects with the given prefix
- `--delete <key>`: Delete a single object
- `--delete-all <prefix>`: Delete all objects with the given prefix (use with caution)

## AWS Credentials

This package uses the AWS SDK for JavaScript v3, which will automatically use credentials from your environment:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. Shared credentials file (`~/.aws/credentials`)
3. If running on Amazon EC2, credentials from the EC2 instance metadata service

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributors

- [Wayne Gibson](https://github.com/waynegibson)