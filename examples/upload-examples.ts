import { S3Uploader } from '../src/utils/s3-uploader';

/**
 * Example showing how to upload a single file to S3
 */
async function uploadSingleFile() {
  // Create an S3Uploader instance with your AWS region
  const uploader = new S3Uploader('us-east-1');
  
  try {
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
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

/**
 * Example showing how to upload a directory to S3
 */
async function uploadDirectory() {
  // Create an S3Uploader instance with your AWS region
  const uploader = new S3Uploader('us-east-1');
  
  try {
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
  } catch (error) {
    console.error('Error uploading directory:', error);
  }
}

/**
 * Example showing how to list objects in an S3 bucket
 */
async function listObjects() {
  const uploader = new S3Uploader('us-east-1');
  
  try {
    // List objects with a specific prefix
    const keys = await uploader.listObjects(
      'your-bucket-name',
      'uploads/' // Optional: specify a prefix to filter objects
    );
    
    console.log(`Found ${keys.length} objects:`);
    keys.forEach(key => console.log(`- ${key}`));
  } catch (error) {
    console.error('Error listing objects:', error);
  }
}

/**
 * Example showing how to delete objects from S3
 */
async function deleteObjects() {
  const uploader = new S3Uploader('us-east-1');
  
  try {
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
  } catch (error) {
    console.error('Error deleting objects:', error);
  }
}

// Run the examples
// uploadSingleFile();
// uploadDirectory();
// listObjects();
// deleteObjects();