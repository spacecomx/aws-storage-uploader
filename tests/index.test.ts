import { describe, it, expect } from 'vitest';
import { S3Uploader, UploadOptions, UploadResult } from '../src/index';

describe('Package exports', () => {
  it('should export S3Uploader class', () => {
    expect(S3Uploader).toBeDefined();
    expect(typeof S3Uploader).toBe('function');
  });
  
  it('should have correct interface for UploadOptions', () => {
    const options: UploadOptions = {
      overwrite: true,
      contentType: 'text/plain',
      metadata: { owner: 'test' }
    };
    
    expect(options).toBeDefined();
    expect(options.overwrite).toBe(true);
    expect(options.contentType).toBe('text/plain');
    expect(options.metadata).toEqual({ owner: 'test' });
  });
  
  it('should have correct interface for UploadResult', () => {
    const result: UploadResult = {
      key: 'test-file.txt',
      eTag: '"abc123"',
      uploaded: true
    };
    
    expect(result).toBeDefined();
    expect(result.key).toBe('test-file.txt');
    expect(result.eTag).toBe('"abc123"');
    expect(result.uploaded).toBe(true);
  });
});