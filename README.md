# AWS Storage Uploader

A utility for uploading files and directories to AWS S3 buckets and managing S3 objects.

## Features

- Upload single files to S3
- Upload entire directories to S3 (recursively)
- List objects in S3 buckets
- Delete objects from S3 buckets
- Command-line interface for easy usage
- TypeScript support with full type definitions
- AWS SSO support

## Installation

```bash
# Using npm
npm install @spacecomx/aws-storage-uploader

# Using yarn
yarn add @spacecomx/aws-storage-uploader

# Using pnpm
pnpm add @spacecomx/aws-storage-uploader
```

## Quick Start

```typescript
import { S3Uploader } from '@spacecomx/aws-storage-uploader';

// Create an uploader instance with your AWS region
const uploader = new S3Uploader('us-east-1');

// Upload a single file
await uploader.uploadFile('your-bucket-name', '/path/to/your/file.jpg');
```

## Documentation

For detailed usage instructions and examples:

- [Usage Guide](https://github.com/spacecomx/aws-storage-uploader/blob/main/docs/USAGE.md) - Complete API documentation with examples
- [CLI Reference](https://github.com/spacecomx/aws-storage-uploader/blob/main/docs/CLI.md) - Command-line interface documentation
- [Contributing](https://github.com/spacecomx/aws-storage-uploader/blob/main/docs/CONTRIBUTING.md) - Guidelines for contributors
- [Development](https://github.com/spacecomx/aws-storage-uploader/blob/main/docs/DEVELOPMENT.md) - Setup and development workflow

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/spacecomx/aws-storage-uploader/blob/main/LICENSE) file for details.

## Contributors

- [Wayne Gibson](https://github.com/waynegibson)