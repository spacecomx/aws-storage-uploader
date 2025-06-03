import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { S3Uploader, UploadOptions, UploadResult } from '../../src/utils/s3-uploader';
import { mockClient } from 'aws-sdk-client-mock';
import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand, 
  DeleteObjectsCommand 
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
  createReadStream: vi.fn(() => 'mock-file-stream')
}));

vi.mock('path', () => ({
  basename: vi.fn((filePath) => filePath.split('/').pop()),
  join: vi.fn((dir, file) => `${dir}/${file}`),
  relative: vi.fn((from, to) => to.replace(`${from}/`, ''))
}));

// Mock mime-types module
vi.mock('mime-types', () => ({
  lookup: vi.fn(() => 'text/plain')
}));

describe('S3Uploader', () => {
  const s3Mock = mockClient(S3Client);
  let uploader: S3Uploader;
  
  beforeEach(() => {
    // Reset mocks before each test
    s3Mock.reset();
    vi.clearAllMocks();
    
    // Create a new uploader instance
    uploader = new S3Uploader('us-east-1');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Mock file existence check
      (fs.existsSync as any).mockReturnValue(true);
      
      // Mock S3 client response
      s3Mock.on(PutObjectCommand).resolves({
        ETag: '"mock-etag"'
      });
      
      // Call the method
      const result = await uploader.uploadFile(
        'test-bucket',
        '/path/to/test-file.txt'
      );
      
      // Verify the result
      expect(result).toEqual({
        key: 'test-file.txt',
        eTag: '"mock-etag"',
        uploaded: true
      });
      
      // Verify S3 client was called with correct parameters
      const calls = s3Mock.commandCalls(PutObjectCommand);
      expect(calls.length).toBe(1);
      expect(calls[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Body: 'mock-file-stream',
        ContentType: 'text/plain',
        Metadata: undefined
      });
    });
    
    it('should throw an error if file does not exist', async () => {
      // Mock file existence check to return false
      (fs.existsSync as any).mockReturnValue(false);
      
      // Expect the method to throw an error
      await expect(uploader.uploadFile(
        'test-bucket',
        '/path/to/non-existent-file.txt'
      )).rejects.toThrow('File not found');
    });
    
    it('should skip upload if file exists and overwrite is false', async () => {
      // Mock file existence check
      (fs.existsSync as any).mockReturnValue(true);
      
      // Mock S3 list objects response to indicate file exists
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'test-file.txt' }]
      });
      
      // Mock path.basename to return the correct filename
      (path.basename as any).mockReturnValue('test-file.txt');
      
      // Call the method with overwrite=false
      const result = await uploader.uploadFile(
        'test-bucket',
        '/path/to/test-file.txt',
        'test-file.txt',
        { overwrite: false }
      );
      
      // Verify the result indicates file was skipped
      expect(result).toEqual({
        key: 'test-file.txt',
        uploaded: false
      });
      
      // Verify PutObjectCommand was not called
      const calls = s3Mock.commandCalls(PutObjectCommand);
      expect(calls.length).toBe(0);
    });
  });
  
  describe('uploadDirectory', () => {
    it('should upload all files in a directory', async () => {
      // Mock directory checks
      (fs.existsSync as any).mockReturnValue(true);
      (fs.statSync as any).mockReturnValue({ isDirectory: () => true });
      
      // Mock file listing
      const mockFiles = [
        '/path/to/dir/file1.txt',
        '/path/to/dir/file2.jpg',
        '/path/to/dir/subdir/file3.pdf'
      ];
      
      // Setup getAllFiles to return our mock files
      (uploader as any).getAllFiles = vi.fn().mockReturnValue(mockFiles);
      
      // Mock path.relative to return the correct relative paths
      (path.relative as any)
        .mockReturnValueOnce('file1.txt')
        .mockReturnValueOnce('file2.jpg')
        .mockReturnValueOnce('subdir/file3.pdf');
      
      // Mock uploadFile to return expected results
      const uploadFileSpy = vi.spyOn(uploader, 'uploadFile')
        .mockResolvedValueOnce({ key: 'uploads/file1.txt', uploaded: true })
        .mockResolvedValueOnce({ key: 'uploads/file2.jpg', uploaded: true })
        .mockResolvedValueOnce({ key: 'uploads/subdir/file3.pdf', uploaded: true });
      
      // Call the method
      const results = await uploader.uploadDirectory(
        'test-bucket',
        '/path/to/dir',
        'uploads'
      );
      
      // Verify results
      expect(results.length).toBe(3);
      expect(results).toEqual([
        { key: 'uploads/file1.txt', uploaded: true },
        { key: 'uploads/file2.jpg', uploaded: true },
        { key: 'uploads/subdir/file3.pdf', uploaded: true }
      ]);
      
      // Verify uploadFile was called for each file
      expect(uploadFileSpy).toHaveBeenCalledTimes(3);
    });
    
    it('should throw an error if directory does not exist', async () => {
      // Mock directory check to return false
      (fs.existsSync as any).mockReturnValue(false);
      
      // Expect the method to throw an error
      await expect(uploader.uploadDirectory(
        'test-bucket',
        '/path/to/non-existent-dir'
      )).rejects.toThrow('Directory not found');
    });
  });
  
  describe('deleteObject', () => {
    it('should delete an object successfully', async () => {
      // Mock S3 client response
      s3Mock.on(DeleteObjectCommand).resolves({});
      
      // Call the method
      const result = await uploader.deleteObject(
        'test-bucket',
        'path/to/file.txt'
      );
      
      // Verify the result
      expect(result).toBe(true);
      
      // Verify S3 client was called with correct parameters
      const calls = s3Mock.commandCalls(DeleteObjectCommand);
      expect(calls.length).toBe(1);
      expect(calls[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Key: 'path/to/file.txt'
      });
    });
  });
  
  describe('deleteObjects', () => {
    it('should delete multiple objects successfully', async () => {
      // Mock S3 client response
      s3Mock.on(DeleteObjectsCommand).resolves({
        Deleted: [
          { Key: 'path/to/file1.txt' },
          { Key: 'path/to/file2.jpg' }
        ]
      });
      
      // Call the method
      const result = await uploader.deleteObjects(
        'test-bucket',
        ['path/to/file1.txt', 'path/to/file2.jpg']
      );
      
      // Verify the result
      expect(result).toEqual(['path/to/file1.txt', 'path/to/file2.jpg']);
      
      // Verify S3 client was called with correct parameters
      const calls = s3Mock.commandCalls(DeleteObjectsCommand);
      expect(calls.length).toBe(1);
      expect(calls[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Delete: {
          Objects: [
            { Key: 'path/to/file1.txt' },
            { Key: 'path/to/file2.jpg' }
          ],
          Quiet: false
        }
      });
    });
    
    it('should return empty array when no keys are provided', async () => {
      const result = await uploader.deleteObjects('test-bucket', []);
      expect(result).toEqual([]);
      
      // Verify S3 client was not called
      const calls = s3Mock.commandCalls(DeleteObjectsCommand);
      expect(calls.length).toBe(0);
    });
  });
  
  describe('listObjects', () => {
    it('should list objects with the given prefix', async () => {
      // Mock S3 client response
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'uploads/file1.txt' },
          { Key: 'uploads/file2.jpg' }
        ],
        IsTruncated: false
      });
      
      // Call the method
      const result = await uploader.listObjects('test-bucket', 'uploads');
      
      // Verify the result
      expect(result).toEqual(['uploads/file1.txt', 'uploads/file2.jpg']);
      
      // Verify S3 client was called with correct parameters
      const calls = s3Mock.commandCalls(ListObjectsV2Command);
      expect(calls.length).toBe(1);
      expect(calls[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Prefix: 'uploads',
        ContinuationToken: undefined
      });
    });
    
    it('should handle pagination when listing objects', async () => {
      // Mock S3 client responses for pagination
      s3Mock.on(ListObjectsV2Command)
        .resolvesOnce({
          Contents: [{ Key: 'uploads/file1.txt' }],
          IsTruncated: true,
          NextContinuationToken: 'token123'
        })
        .resolvesOnce({
          Contents: [{ Key: 'uploads/file2.jpg' }],
          IsTruncated: false
        });
      
      // Call the method
      const result = await uploader.listObjects('test-bucket', 'uploads');
      
      // Verify the result
      expect(result).toEqual(['uploads/file1.txt', 'uploads/file2.jpg']);
      
      // Verify S3 client was called twice with correct parameters
      const calls = s3Mock.commandCalls(ListObjectsV2Command);
      expect(calls.length).toBe(2);
      expect(calls[1].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Prefix: 'uploads',
        ContinuationToken: 'token123'
      });
    });
  });
});