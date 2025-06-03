import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Uploader } from '../../src/utils/s3-uploader';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn()
}));

vi.mock('path', () => ({
  join: vi.fn((dir, file) => `${dir}/${file}`)
}));

describe('S3Uploader.getAllFiles', () => {
  let uploader: S3Uploader;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create a new uploader instance
    uploader = new S3Uploader('us-east-1');
  });
  
  it('should recursively get all files in a directory', () => {
    // Mock directory structure:
    // /root
    // ├── file1.txt
    // ├── file2.jpg
    // └── subdir
    //     ├── file3.pdf
    //     └── deepdir
    //         └── file4.json
    
    // Mock first level
    (fs.readdirSync as any).mockReturnValueOnce([
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.jpg', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true }
    ]);
    
    // Mock subdir level
    (fs.readdirSync as any).mockReturnValueOnce([
      { name: 'file3.pdf', isDirectory: () => false },
      { name: 'deepdir', isDirectory: () => true }
    ]);
    
    // Mock deepdir level
    (fs.readdirSync as any).mockReturnValueOnce([
      { name: 'file4.json', isDirectory: () => false }
    ]);
    
    // Mock path.join to return expected paths
    (path.join as any)
      .mockReturnValueOnce('/root/file1.txt')
      .mockReturnValueOnce('/root/file2.jpg')
      .mockReturnValueOnce('/root/subdir')
      .mockReturnValueOnce('/root/subdir/file3.pdf')
      .mockReturnValueOnce('/root/subdir/deepdir')
      .mockReturnValueOnce('/root/subdir/deepdir/file4.json');
    
    // Call the private method using any type assertion
    const files = (uploader as any).getAllFiles('/root');
    
    // Verify the result contains all files
    expect(files).toEqual([
      '/root/file1.txt',
      '/root/file2.jpg',
      '/root/subdir/file3.pdf',
      '/root/subdir/deepdir/file4.json'
    ]);
    
    // Verify readdirSync was called for each directory
    expect(fs.readdirSync).toHaveBeenCalledTimes(3);
    expect(fs.readdirSync).toHaveBeenCalledWith('/root', { withFileTypes: true });
    expect(fs.readdirSync).toHaveBeenCalledWith('/root/subdir', { withFileTypes: true });
    expect(fs.readdirSync).toHaveBeenCalledWith('/root/subdir/deepdir', { withFileTypes: true });
  });
});