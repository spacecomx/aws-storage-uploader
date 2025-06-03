import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { lookup } from 'mime-types';

/**
 * Options for uploading files to S3
 */
export interface UploadOptions {
  /**
   * Whether to overwrite existing files
   * @default true
   */
  overwrite?: boolean;
  
  /**
   * Custom content type for the file
   * If not provided, it will be determined from the file extension
   */
  contentType?: string;
  
  /**
   * Additional metadata to include with the object
   */
  metadata?: Record<string, string>;
}

/**
 * Result of an upload operation
 */
export interface UploadResult {
  /**
   * The key of the uploaded object in S3
   */
  key: string;
  
  /**
   * The ETag of the uploaded object
   */
  eTag?: string;
  
  /**
   * Whether the file was uploaded or skipped
   */
  uploaded: boolean;
}

/**
 * Utility class for uploading files and folders to S3
 */
export class S3Uploader {
  private s3Client: S3Client;
  
  /**
   * Create a new S3Uploader
   * @param region AWS region
   * @param credentials Optional AWS credentials
   */
  constructor(region: string) {
    this.s3Client = new S3Client({ region });
  }
  
  /**
   * Upload a single file to S3
   * @param bucketName Name of the S3 bucket
   * @param filePath Local path to the file
   * @param key S3 object key (if not provided, the file name will be used)
   * @param options Upload options
   * @returns Upload result
   */
  async uploadFile(
    bucketName: string, 
    filePath: string, 
    key?: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const fileName = path.basename(filePath);
    const s3Key = key || fileName;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check if object already exists and skip if overwrite is false
    if (options.overwrite === false) {
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: s3Key,
          MaxKeys: 1
        });
        
        const response = await this.s3Client.send(listCommand);
        if (response.Contents && response.Contents.length > 0) {
          console.log(`Skipping ${s3Key} - already exists`);
          return {
            key: s3Key,
            uploaded: false
          };
        }
      } catch (error) {
        console.error('Error checking if object exists:', error);
      }
    }
    
    // Determine content type
    const contentType = options.contentType || lookup(filePath) || 'application/octet-stream';
    
    // Upload file
    const fileStream = createReadStream(filePath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
      Metadata: options.metadata
    });
    
    try {
      const response = await this.s3Client.send(command);
      console.log(`Successfully uploaded ${s3Key}`);
      return {
        key: s3Key,
        eTag: response.ETag,
        uploaded: true
      };
    } catch (error) {
      console.error(`Error uploading ${s3Key}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload a directory to S3
   * @param bucketName Name of the S3 bucket
   * @param dirPath Local path to the directory
   * @param prefix S3 key prefix (folder path in the bucket)
   * @param options Upload options
   * @returns Array of upload results
   */
  async uploadDirectory(
    bucketName: string, 
    dirPath: string, 
    prefix: string = '', 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    // Check if directory exists
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    
    const results: UploadResult[] = [];
    const files = this.getAllFiles(dirPath);
    
    for (const file of files) {
      // Calculate relative path from the directory
      const relativePath = path.relative(dirPath, file);
      // Create S3 key with prefix
      const s3Key = prefix ? `${prefix}/${relativePath}`.replace(/\\/g, '/') : relativePath.replace(/\\/g, '/');
      
      try {
        const result = await this.uploadFile(bucketName, file, s3Key, options);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading ${file}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Get all files in a directory recursively
   * @param dirPath Directory path
   * @returns Array of file paths
   */
  private getAllFiles(dirPath: string): string[] {
    const files: string[] = [];
    
    const traverseDir = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          traverseDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    
    traverseDir(dirPath);
    return files;
  }
}