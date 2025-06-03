#!/usr/bin/env ts-node
import { S3Uploader } from '../src/utils/s3-uploader';
import * as path from 'path';
import * as fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const usage = `
Usage: ts-node cli-uploader.ts [options]

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

Examples:
  ts-node cli-uploader.ts --bucket my-bucket --file ./path/to/file.jpg
  ts-node cli-uploader.ts --bucket my-bucket --dir ./path/to/directory --prefix uploads/my-dir
  ts-node cli-uploader.ts --bucket my-bucket --list uploads/
  ts-node cli-uploader.ts --bucket my-bucket --delete uploads/file.jpg
`;

// Parse arguments
const options: {
  bucket?: string;
  region?: string;
  file?: string;
  dir?: string;
  prefix?: string;
  overwrite?: boolean;
  list?: string;
  delete?: string;
  deleteAll?: string;
} = {
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
      console.log(usage);
      process.exit(1);
  }
}

// Validate required options
if (!options.bucket) {
  console.error('Error: --bucket option is required');
  console.log(usage);
  process.exit(1);
}

// Ensure at least one operation is specified
if (!options.file && !options.dir && options.list === undefined && !options.delete && !options.deleteAll) {
  console.error('Error: You must specify an operation (--file, --dir, --list, --delete, or --delete-all)');
  console.log(usage);
  process.exit(1);
}

// Main function
async function main() {
  try {
    const uploader = new S3Uploader(options.region!);
    
    // List objects
    if (options.list !== undefined) {
      console.log(`Listing objects in bucket ${options.bucket} with prefix "${options.list}"...`);
      const keys = await uploader.listObjects(options.bucket!, options.list);
      
      if (keys.length === 0) {
        console.log('No objects found.');
      } else {
        console.log(`Found ${keys.length} objects:`);
        keys.forEach(key => console.log(`- ${key}`));
      }
      return;
    }
    
    // Delete a single object
    if (options.delete) {
      console.log(`Deleting object ${options.delete} from bucket ${options.bucket}...`);
      await uploader.deleteObject(options.bucket!, options.delete);
      console.log('Object deleted successfully.');
      return;
    }
    
    // Delete all objects with prefix
    if (options.deleteAll) {
      console.log(`Listing objects to delete in bucket ${options.bucket} with prefix "${options.deleteAll}"...`);
      const keys = await uploader.listObjects(options.bucket!, options.deleteAll);
      
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
      
      const deletedKeys = await uploader.deleteObjects(options.bucket!, keys);
      console.log(`Successfully deleted ${deletedKeys.length} objects.`);
      return;
    }
    
    // Upload a single file
    if (options.file) {
      const filePath = path.resolve(options.file);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      
      console.log(`Uploading file ${filePath} to bucket ${options.bucket}...`);
      const result = await uploader.uploadFile(
        options.bucket!,
        filePath,
        options.prefix ? `${options.prefix}/${path.basename(filePath)}` : undefined,
        { overwrite: options.overwrite }
      );
      
      if (result.uploaded) {
        console.log(`Successfully uploaded: ${result.key}`);
      } else {
        console.log(`Skipped (already exists): ${result.key}`);
      }
    }
    
    // Upload a directory
    if (options.dir) {
      const dirPath = path.resolve(options.dir);
      if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        console.error(`Directory not found: ${dirPath}`);
        process.exit(1);
      }
      
      console.log(`Uploading directory ${dirPath} to bucket ${options.bucket}...`);
      const results = await uploader.uploadDirectory(
        options.bucket!,
        dirPath,
        options.prefix,
        { overwrite: options.overwrite }
      );
      
      const uploaded = results.filter(r => r.uploaded).length;
      const skipped = results.filter(r => !r.uploaded).length;
      
      console.log(`Upload complete: ${uploaded} files uploaded, ${skipped} files skipped`);
    }
  } catch (error) {
    console.error('Error:', error);
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

main();