import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { S3Uploader } from '../../src/utils/s3-uploader';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  createReadStream: vi.fn(() => 'mock-file-stream')
}));

// Mock mime-types
vi.mock('mime-types', () => ({
  lookup: vi.fn(() => 'text/plain')
}));

describe('S3Uploader Error Handling', () => {
  const s3Mock = mockClient(S3Client);
  let uploader: S3Uploader;
  
  beforeEach(() => {
    // Reset mocks before each test
    s3Mock.reset();
    vi.clearAllMocks();
    
    // Create a new uploader instance
    uploader = new S3Uploader('us-east-1');
    
    // Mock console.error to prevent cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('uploadFile error handling', () => {
    it('should handle S3 client errors when checking if object exists', async () => {
      // Mock file existence check
      (fs.existsSync as any).mockReturnValue(true);
      
      // Import the commands directly in the test to avoid stream errors
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      // Mock S3 client to throw an error
      s3Mock.on(ListObjectsV2Command).rejects(new Error('S3 error'));
      
      // Call the method with overwrite=false to trigger the check
      await uploader.uploadFile(
        'test-bucket',
        '/path/to/test-file.txt',
        undefined,
        { overwrite: false }
      );
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error checking if object exists:',
        expect.any(Error)
      );
    });
    
    it('should handle S3 client errors when uploading', async () => {
      // Mock file existence check
      (fs.existsSync as any).mockReturnValue(true);
      
      // Import the commands directly in the test to avoid stream errors
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Mock S3 client to throw an error
      s3Mock.on(PutObjectCommand).rejects(new Error('Upload error'));
      
      // Call the method and expect it to throw
      await expect(uploader.uploadFile(
        'test-bucket',
        '/path/to/test-file.txt'
      )).rejects.toThrow('Upload error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error uploading test-file.txt:',
        expect.any(Error)
      );
    });
  });
  
  describe('uploadDirectory error handling', () => {
    it('should handle errors when uploading individual files', async () => {
      // Mock directory checks
      (fs.existsSync as any).mockReturnValue(true);
      (fs.statSync as any).mockReturnValue({ isDirectory: () => true });
      
      // Setup getAllFiles to return mock files
      (uploader as any).getAllFiles = vi.fn().mockReturnValue([
        '/path/to/file1.txt',
        '/path/to/file2.txt'
      ]);
      
      // Mock uploadFile to throw an error for the first file
      vi.spyOn(uploader, 'uploadFile')
        .mockRejectedValueOnce(new Error('Upload error'))
        .mockResolvedValueOnce({ key: 'file2.txt', uploaded: true });
      
      // Call the method
      const results = await uploader.uploadDirectory(
        'test-bucket',
        '/path/to/dir'
      );
      
      // Verify only one result was returned (the successful one)
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('file2.txt');
      
      // Verify console.error was called for the failed upload
      expect(console.error).toHaveBeenCalledWith(
        'Error uploading /path/to/file1.txt:',
        expect.any(Error)
      );
    });
  });
  
  describe('deleteObject error handling', () => {
    it('should handle S3 client errors when deleting', async () => {
      // Import the commands directly in the test to avoid stream errors
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Mock S3 client to throw an error
      s3Mock.on(DeleteObjectCommand).rejects(new Error('Delete error'));
      
      // Call the method and expect it to throw
      await expect(uploader.deleteObject(
        'test-bucket',
        'path/to/file.txt'
      )).rejects.toThrow('Delete error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting path/to/file.txt:',
        expect.any(Error)
      );
    });
  });
  
  describe('deleteObjects error handling', () => {
    it('should handle S3 client errors when deleting multiple objects', async () => {
      // Import the commands directly in the test to avoid stream errors
      const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
      
      // Mock S3 client to throw an error
      s3Mock.on(DeleteObjectsCommand).rejects(new Error('Delete error'));
      
      // Call the method and expect it to throw
      await expect(uploader.deleteObjects(
        'test-bucket',
        ['path/to/file1.txt', 'path/to/file2.txt']
      )).rejects.toThrow('Delete error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting objects:',
        expect.any(Error)
      );
    });
  });
  
  describe('listObjects error handling', () => {
    it('should handle S3 client errors when listing objects', async () => {
      // Import the commands directly in the test to avoid stream errors
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      // Mock S3 client to throw an error
      s3Mock.on(ListObjectsV2Command).rejects(new Error('List error'));
      
      // Call the method and expect it to throw
      await expect(uploader.listObjects(
        'test-bucket',
        'uploads/'
      )).rejects.toThrow('List error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error listing objects:',
        expect.any(Error)
      );
    });
  });
});