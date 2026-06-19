import { vi } from 'vitest';

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

Element.prototype.scrollIntoView = vi.fn();

global.fetch = vi.fn();

global.window.location.hash = '';
