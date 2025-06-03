# Development Guide

This guide provides instructions for setting up your development environment and contributing to the AWS Storage Uploader project.

## Prerequisites

- Node.js (version 16 or higher)
- pnpm (preferred) or npm
- AWS account for testing

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/spacecomx/aws-storage-uploader.git
   cd aws-storage-uploader
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### Linting

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Building

```bash
# Build the project
pnpm build

# Build in watch mode
pnpm build:watch
```

### Testing the CLI Locally

```bash
# Using Node.js directly
node src/cli.js --bucket my-bucket --file ./path/to/file.jpg

# Using ts-node (if you have it installed)
ts-node src/cli.ts --bucket my-bucket --file ./path/to/file.jpg

# Using the npm script (if you added it to package.json)
npm run cli -- --bucket my-bucket --file ./path/to/file.jpg

# Using AWS SSO profile
ts-node src/cli.ts --bucket my-bucket --file ./path/to/file.jpg --profile your-sso-profile

# Create a link to test as if installed globally
pnpm link --global
aws-storage-uploader --help
```

## Project Structure

- `src/` - Source code
  - `utils/` - Utility functions and classes
  - `cli.ts` - Command-line interface
  - `index.ts` - Main entry point
- `tests/` - Test files
- `docs/` - Documentation

## Release Process

This project uses semantic-release for automated versioning and publishing. When changes are merged to the main branch:

1. The CI/CD pipeline runs all tests
2. If tests pass, semantic-release determines the next version based on commit messages
3. A new release is created and published to npm

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add new feature` - Minor version bump
- `fix: resolve bug` - Patch version bump
- `docs: update documentation` - No version bump
- `chore: update dependencies` - No version bump
- `BREAKING CHANGE: description` - Major version bump

## Documentation

When making changes, please update the relevant documentation:

- Update API documentation in code comments
- Update the relevant markdown files in the `docs/` directory
- Update examples if necessary

## Getting Help

If you need help with development, please create an issue on GitHub or reach out to the maintainers.