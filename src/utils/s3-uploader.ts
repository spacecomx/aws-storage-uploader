import * as fs from 'fs';
import * as path from 'path';
import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand, 
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import { lookup } from 'mime-types';

export interface UploadOptions {
  overwrite?: boolean;
  contentType?: string;
  metadata?: Record<string, string>;
  verbose?: boolean;
}

export interface UploadResult {
  key: string;
  eTag?: string;
  uploaded: boolean;
}

export class S3Uploader {
  private s3Client: S3Client;
  
  constructor(region: string, profile?: string) {
    const clientConfig: { region: string; credentials?: Record<string, unknown> } = { region };
    
    // When using a profile, we need to use the AWS SDK's credential provider
    if (profile) {
      // Set the AWS_PROFILE environment variable which the SDK will use
      process.env.AWS_PROFILE = profile;
    }
    
    this.s3Client = new S3Client(clientConfig);
  }
  
  async uploadFile(
    bucketName: string, 
    filePath: string, 
    key?: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    this.validateFileExists(filePath);
    
    const s3Key = key || path.basename(filePath);
    
    if (options.overwrite === false && await this.objectExists(bucketName, s3Key)) {
      if (options.verbose) {
        console.log(`Skipping ${s3Key} - already exists`);
      }
      return { key: s3Key, uploaded: false };
    }
    
    return this.uploadFileToS3(bucketName, filePath, s3Key, options);
  }
  
  async uploadDirectory(
    bucketName: string, 
    dirPath: string, 
    prefix: string = '', 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    this.validateDirectoryExists(dirPath);
    
    const files = this.getAllFiles(dirPath);
    const results: UploadResult[] = [];
    
    for (const file of files) {
      try {
        const relativePath = path.relative(dirPath, file);
        const s3Key = this.buildS3Key(prefix, relativePath);
        
        const result = await this.uploadFile(bucketName, file, s3Key, options);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading ${file}:`, error);
      }
    }
    
    return results;
  }
  
  async deleteObject(bucketName: string, key: string, verbose = false): Promise<boolean> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
      
      if (verbose) {
        console.log(`Successfully deleted ${key}`);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
      throw error;
    }
  }
  
  async deleteObjects(bucketName: string, keys: string[], verbose = false): Promise<string[]> {
    if (keys.length === 0) return [];
    
    try {
      const response = await this.s3Client.send(new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: false
        }
      }));
      
      const deletedKeys = response.Deleted?.map(obj => obj.Key || '') || [];
      if (verbose) {
        console.log(`Successfully deleted ${deletedKeys.length} objects`);
      }
      return deletedKeys;
    } catch (error) {
      console.error('Error deleting objects:', error);
      throw error;
    }
  }
  
  async listObjects(bucketName: string, prefix: string = ''): Promise<string[]> {
    try {
      const keys: string[] = [];
      let isTruncated = true;
      let continuationToken: string | undefined;
      
      while (isTruncated) {
        const response = await this.s3Client.send(new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken
        }));
        
        response.Contents?.forEach(item => {
          if (item.Key) keys.push(item.Key);
        });
        
        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }
      
      return keys;
    } catch (error) {
      console.error('Error listing objects:', error);
      throw error;
    }
  }
  
  private async objectExists(bucketName: string, key: string): Promise<boolean> {
    try {
      const response = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: key,
        MaxKeys: 1
      }));
      
      return !!(response.Contents && response.Contents.length > 0);
    } catch (error) {
      console.error('Error checking if object exists:', error);
      return false;
    }
  }
  
  private async uploadFileToS3(
    bucketName: string,
    filePath: string,
    s3Key: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const contentType = options.contentType || lookup(filePath) || 'application/octet-stream';
    const fileStream = createReadStream(filePath);
    
    try {
      const response = await this.s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileStream,
        ContentType: contentType,
        Metadata: options.metadata
      }));
      
      if (options.verbose) {
        console.log(`Successfully uploaded ${s3Key}`);
      }
      
      return {
        key: s3Key,
        eTag: response?.ETag,
        uploaded: true
      };
    } catch (error) {
      console.error(`Error uploading ${s3Key}:`, error);
      throw error;
    }
  }
  
  private validateFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  }
  
  private validateDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
  }
  
  private buildS3Key(prefix: string, relativePath: string): string {
    return prefix 
      ? `${prefix}/${relativePath}`.replace(/\\\\/g, '/') 
      : relativePath.replace(/\\\\/g, '/');
  }
  
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