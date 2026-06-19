import '@testing-library/jest-dom/vitest';
import 'whatwg-fetch';
import { vi } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

window.location.hash = '';

Element.prototype.scrollTo = vi.fn();
HTMLDivElement.prototype.scrollTo = vi.fn();

export function mockFetchResponse(data: any, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob()),
  });
}

export function createContainer(): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

export function cleanupContainer(container: HTMLElement) {
  container.remove();
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  window.location.hash = '';
  document.body.innerHTML = '';
});
