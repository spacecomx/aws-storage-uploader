import { vi } from 'vitest';

// Mock console methods to avoid cluttering test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});