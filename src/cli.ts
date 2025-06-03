#!/usr/bin/env node
import { S3Uploader } from './utils/s3-uploader';
import * as path from 'path';
import * as fs from 'fs';

interface CliOptions {
  bucket?: string;
  region: string;
  file?: string;
  dir?: string;
  prefix?: string;
  overwrite: boolean;
  list?: string;
  delete?: string;
  deleteAll?: string;
}

// Help text
const usage = `
AWS Storage Uploader - Upload and manage files on S3

Usage: aws-storage-uploader [options]

Options:
  --bucket <name>       S3 bucket name (required)
  --region <region>     AWS region (default: us-east-1)
  --file <path>         Path to file to upload
  --dir <path>          Path to directory to upload
  --prefix <prefix>     S3 key prefix (folder path in bucket)
  --no-overwrite        Skip files that already exist in the bucket
  --list <prefix>       List objects with the given prefix
  --delete <key>        Delete a single object
  --delete-all <prefix> Delete all objects with the given prefix (use with caution)
  --help                Show this help message

Examples:
  aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg
  aws-storage-uploader --bucket my-bucket --dir ./path/to/directory --prefix uploads/my-dir
  aws-storage-uploader --bucket my-bucket --list uploads/
  aws-storage-uploader --bucket my-bucket --delete uploads/file.jpg
`;

// Parse command line arguments
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    region: 'us-east-1',
    overwrite: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--bucket':
        options.bucket = args[++i];
        break;
      case '--region':
        options.region = args[++i];
        break;
      case '--file':
        options.file = args[++i];
        break;
      case '--dir':
        options.dir = args[++i];
        break;
      case '--prefix':
        options.prefix = args[++i];
        break;
      case '--no-overwrite':
        options.overwrite = false;
        break;
      case '--list':
        options.list = args[++i] || '';
        break;
      case '--delete':
        options.delete = args[++i];
        break;
      case '--delete-all':
        options.deleteAll = args[++i];
        break;
      case '--help':
        console.log(usage);
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        console.error(usage);
        process.exit(1);
    }
  }

  return options;
}

// Validate CLI options
function validateOptions(options: CliOptions): void {
  if (!options.bucket) {
    console.error('Error: --bucket option is required');
    console.error(usage);
    process.exit(1);
  }

  if (!options.file && !options.dir && options.list === undefined && !options.delete && !options.deleteAll) {
    console.error('Error: You must specify an operation (--file, --dir, --list, --delete, or --delete-all)');
    console.error(usage);
    process.exit(1);
  }
}

// Helper function to prompt for yes/no confirmation
async function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// List objects in a bucket
async function listObjects(uploader: S3Uploader, bucket: string, prefix: string): Promise<void> {
  console.log(`Listing objects in bucket ${bucket} with prefix "${prefix}"...`);
  const keys = await uploader.listObjects(bucket, prefix);
  
  if (keys.length === 0) {
    console.log('No objects found.');
  } else {
    console.log(`Found ${keys.length} objects:`);
    keys.forEach(key => console.log(`- ${key}`));
  }
}

// Delete a single object
async function deleteObject(uploader: S3Uploader, bucket: string, key: string): Promise<void> {
  console.log(`Deleting object ${key} from bucket ${bucket}...`);
  await uploader.deleteObject(bucket, key);
  console.log('Object deleted successfully.');
}

// Delete multiple objects with a prefix
async function deleteAllObjects(uploader: S3Uploader, bucket: string, prefix: string): Promise<void> {
  console.log(`Listing objects to delete in bucket ${bucket} with prefix "${prefix}"...`);
  const keys = await uploader.listObjects(bucket, prefix);
  
  if (keys.length === 0) {
    console.log('No objects found to delete.');
    return;
  }
  
  console.log(`Found ${keys.length} objects to delete:`);
  keys.forEach(key => console.log(`- ${key}`));
  
  const confirmation = await promptYesNo(`Are you sure you want to delete these ${keys.length} objects? (y/n): `);
  if (!confirmation) {
    console.log('Operation cancelled.');
    return;
  }
  
  const deletedKeys = await uploader.deleteObjects(bucket, keys);
  console.log(`Successfully deleted ${deletedKeys.length} objects.`);
}

// Upload a single file
async function uploadFile(uploader: S3Uploader, bucket: string, filePath: string, prefix?: string, overwrite = true): Promise<void> {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  console.log(`Uploading file ${resolvedPath} to bucket ${bucket}...`);
  const key = prefix ? `${prefix}/${path.basename(resolvedPath)}` : undefined;
  const result = await uploader.uploadFile(bucket, resolvedPath, key, { overwrite });
  
  if (result.uploaded) {
    console.log(`Successfully uploaded: ${result.key}`);
  } else {
    console.log(`Skipped (already exists): ${result.key}`);
  }
}

// Upload a directory
async function uploadDirectory(uploader: S3Uploader, bucket: string, dirPath: string, prefix?: string, overwrite = true): Promise<void> {
  const resolvedPath = path.resolve(dirPath);
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    console.error(`Directory not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  console.log(`Uploading directory ${resolvedPath} to bucket ${bucket}...`);
  const results = await uploader.uploadDirectory(bucket, resolvedPath, prefix, { overwrite });
  
  const uploaded = results.filter(r => r.uploaded).length;
  const skipped = results.filter(r => !r.uploaded).length;
  
  console.log(`Upload complete: ${uploaded} files uploaded, ${skipped} files skipped`);
}

// Main function
async function main() {
  try {
    const options = parseArgs();
    validateOptions(options);
    
    const uploader = new S3Uploader(options.region);
    
    if (options.list !== undefined) {
      await listObjects(uploader, options.bucket!, options.list);
    } else if (options.delete) {
      await deleteObject(uploader, options.bucket!, options.delete);
    } else if (options.deleteAll) {
      await deleteAllObjects(uploader, options.bucket!, options.deleteAll);
    } else if (options.file) {
      await uploadFile(uploader, options.bucket!, options.file, options.prefix, options.overwrite);
    } else if (options.dir) {
      await uploadDirectory(uploader, options.bucket!, options.dir, options.prefix, options.overwrite);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();