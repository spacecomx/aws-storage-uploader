# Command Line Interface

This package includes a CLI tool for uploading files and directories to S3.

## Installation

The CLI is included when you install the package:

```bash
# Using npm
npm install -g @spacecomx/aws-storage-uploader

# Using yarn
yarn global add @spacecomx/aws-storage-uploader

# Using pnpm
pnpm add -g @spacecomx/aws-storage-uploader
```

## Usage

Once the package is installed, you can use it as follows:

```bash
# Using npx (npm)
npx aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg

# Using pnpm
pnpm exec aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg

# Using pnpm dlx for packages not installed locally
pnpm dlx @spacecomx/aws-storage-uploader --bucket my-bucket --dir ./path/to/directory --prefix uploads/my-dir

# List objects
pnpm exec aws-storage-uploader --bucket my-bucket --list uploads/

# Delete an object
pnpm exec aws-storage-uploader --bucket my-bucket --delete uploads/file.jpg

# Delete all objects with a prefix (with confirmation prompt)
pnpm exec aws-storage-uploader --bucket my-bucket --delete-all uploads/temp/

# Using with AWS SSO profile
pnpm exec aws-storage-uploader --bucket my-bucket --file ./path/to/file.jpg --profile your-sso-profile
```

## CLI Options

- `--bucket <name>`: S3 bucket name (required)
- `--region <region>`: AWS region (default: us-east-1)
- `--profile <name>`: AWS profile name to use for credentials
- `--file <path>`: Path to file to upload
- `--dir <path>`: Path to directory to upload
- `--prefix <prefix>`: S3 key prefix (folder path in bucket)
- `--no-overwrite`: Skip files that already exist in the bucket
- `--list <prefix>`: List objects with the given prefix
- `--delete <key>`: Delete a single object
- `--delete-all <prefix>`: Delete all objects with the given prefix (use with caution)
- `--help`: Show help message