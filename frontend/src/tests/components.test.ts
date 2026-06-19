import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  commonApi: {
    getAllProjects: vi.fn().mockResolvedValue([]),
    getAllFloors: vi.fn().mockResolvedValue([]),
    getAllAreas: vi.fn().mockResolvedValue([]),
    getAllHazardTypes: vi.fn().mockResolvedValue([]),
    getAllGroups: vi.fn().mockResolvedValue([]),
    getAllDeadlineRules: vi.fn().mockResolvedValue([]),
  },
}));

describe('Component Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('CascadeDropdown', () => {
    it('should render placeholder text', async () => {
      const { CascadeDropdown } = await import('../components/CascadeDropdown');
      const container = document.createElement('div');
      
      new CascadeDropdown(container, {
        levels: [],
        placeholder: '请选择测试项',
      });
      
      expect(container.textContent).toContain('请选择测试项');
    });

    it('should render default placeholder', async () => {
      const { CascadeDropdown } = await import('../components/CascadeDropdown');
      const container = document.createElement('div');
      
      new CascadeDropdown(container, {
        levels: [],
      });
      
      expect(container.textContent).toContain('请选择');
    });
  });

  describe('VirtualList', () => {
    it('should render container with correct height', async () => {
      const { VirtualList } = await import('../components/VirtualList');
      const container = document.createElement('div');
      
      new VirtualList(container, {
        itemHeight: 50,
        containerHeight: 500,
        loadData: vi.fn().mockResolvedValue({ list: [], total: 0 }),
      });
      
      const listContainer = container.querySelector('.virtual-list-container') as HTMLElement;
      expect(listContainer).not.toBeNull();
      expect(listContainer.style.height).toBe('500px');
    });
  });
});
