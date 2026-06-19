import { afterEach, vi } from 'vitest';

// Reset DOM after every test for isolation
afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// Mock window.URL APIs used by downloadBlob
if (!('createObjectURL' in URL)) {
  // @ts-ignore
  URL.createObjectURL = vi.fn(() => 'blob:mock');
}
if (!('revokeObjectURL' in URL)) {
  // @ts-ignore
  URL.revokeObjectURL = vi.fn();
}
