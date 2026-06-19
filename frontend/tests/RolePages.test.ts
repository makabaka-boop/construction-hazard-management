import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import { mockUsers, mockProjects, mockGroups, mockHazardTypes, mockHazards, createMockPageResult, mockDeadlineRules } from './mocks/data';
import { createContainer, cleanupContainer } from './setup';

const mockShowToast = vi.fn();

const { mockAdminApi, mockExecutorApi, mockSupervisorApi, mockCommonApi } = vi.hoisted(() => {
  return {
    mockAdminApi: {
      getProjects: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      getFloors: vi.fn(),
      createFloor: vi.fn(),
      updateFloor: vi.fn(),
      deleteFloor: vi.fn(),
      getAreas: vi.fn(),
      createArea: vi.fn(),
      updateArea: vi.fn(),
      deleteArea: vi.fn(),
      getHazardTypes: vi.fn(),
      createHazardType: vi.fn(),
      updateHazardType: vi.fn(),
      deleteHazardType: vi.fn(),
      getGroups: vi.fn(),
      createGroup: vi.fn(),
      updateGroup: vi.fn(),
      deleteGroup: vi.fn(),
      getDeadlineRules: vi.fn(),
      createDeadlineRule: vi.fn(),
      updateDeadlineRule: vi.fn(),
      deleteDeadlineRule: vi.fn(),
    },
    mockExecutorApi: {
      getHazards: vi.fn(),
      createHazard: vi.fn(),
      rectifyHazard: vi.fn(),
      exportHazards: vi.fn(),
    },
    mockSupervisorApi: {
      getHazards: vi.fn(),
      reviewHazard: vi.fn(),
    },
    mockCommonApi: {
      getAllProjects: vi.fn(),
      getAllFloors: vi.fn(),
      getAllAreas: vi.fn(),
      getAllHazardTypes: vi.fn(),
      getAllGroups: vi.fn(),
      getAllDeadlineRules: vi.fn(),
      getVirtualHazards: vi.fn(),
      exportHazards: vi.fn(),
    },
  };
});

vi.mock('../src/utils', () => ({
  showToast: (...args: any[]) => mockShowToast(...args),
  formatDate: (d: string) => d || '-',
  getStatusText: (s: string) => s,
  getStatusClass: (s: string) => `status-${s}`,
  getWarningStatusText: (s?: string) => s || '-',
  getWarningStatusClass: (s?: string) => `warning-${s || 'normal'}`,
  getWarningDisplayText: () => 'test',
  downloadBlob: vi.fn(),
  debounce: (fn: any) => fn,
}));

vi.mock('../src/services/api', () => ({
  adminApi: mockAdminApi,
  executorApi: mockExecutorApi,
  supervisorApi: mockSupervisorApi,
  commonApi: mockCommonApi,
}));

import { AdminPage } from '../src/pages/AdminPage';
import { ExecutorPage } from '../src/pages/ExecutorPage';
import { SupervisorPage } from '../src/pages/SupervisorPage';

describe('管理员页面测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(mockUsers.admin));
    container = createContainer();
    
    mockAdminApi.getProjects.mockResolvedValue(createMockPageResult(mockProjects));
    mockAdminApi.getFloors.mockResolvedValue(createMockPageResult([]));
    mockAdminApi.getAreas.mockResolvedValue(createMockPageResult([]));
    mockAdminApi.getHazardTypes.mockResolvedValue(createMockPageResult(mockHazardTypes.filter(t => t.parent_id === null)));
    mockAdminApi.getGroups.mockResolvedValue(createMockPageResult(mockGroups));
    mockAdminApi.getDeadlineRules.mockResolvedValue({ list: mockDeadlineRules });
    mockCommonApi.getAllProjects.mockResolvedValue(mockProjects);
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it('应该正确渲染页面头部和标签页', () => {
    const page = new AdminPage(container);
    
    expect(container.querySelector('h1')?.textContent).toContain('管理后台');
    expect(container.textContent).toContain('欢迎，系统管理员');
    expect(container.querySelector('[data-tab="projects"]')).toBeInTheDocument();
    expect(container.querySelector('[data-tab="floors"]')).toBeInTheDocument();
    expect(container.querySelector('[data-tab="groups"]')).toBeInTheDocument();
  });

  it('应该显示退出登录按钮并能清除localStorage', async () => {
    const page = new AdminPage(container);
    
    const logoutBtn = container.querySelector('#logoutBtn') as HTMLButtonElement;
    fireEvent.click(logoutBtn);
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.hash).toBe('#/login');
  });

  it('切换标签页应该加载对应数据', async () => {
    const page = new AdminPage(container);
    
    await waitFor(() => {
      expect(mockAdminApi.getProjects).toHaveBeenCalled();
    });
    
    const floorsTab = container.querySelector('[data-tab="floors"]') as HTMLElement;
    fireEvent.click(floorsTab);
    
    await waitFor(() => {
      expect(mockAdminApi.getFloors).toHaveBeenCalled();
    });
  });

  it('点击新增按钮应该打开模态框', async () => {
    const page = new AdminPage(container);
    
    await waitFor(() => {
      expect(mockAdminApi.getProjects).toHaveBeenCalled();
    });
    
    const addBtn = container.querySelector('#addBtn') as HTMLButtonElement;
    fireEvent.click(addBtn);
    
    expect(container.querySelector('.modal-mask')).toBeInTheDocument();
  });

  it('搜索按钮应该触发带关键词的查询', async () => {
    const page = new AdminPage(container);
    
    await waitFor(() => {
      expect(mockAdminApi.getProjects).toHaveBeenCalled();
    });
    
    const searchInput = container.querySelector('#searchInput') as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: '测试项目' } });
    
    const searchBtn = container.querySelector('#searchBtn') as HTMLButtonElement;
    fireEvent.click(searchBtn);
    
    expect(mockAdminApi.getProjects).toHaveBeenCalledWith(1, 20, '测试项目');
  });

  it('重置按钮应该清空搜索条件并重新加载', async () => {
    const page = new AdminPage(container);
    
    await waitFor(() => {
      expect(mockAdminApi.getProjects).toHaveBeenCalled();
    });
    
    const searchInput = container.querySelector('#searchInput') as HTMLInputElement;
    fireEvent.input(searchInput, { target: { value: '测试' } });
    
    const resetBtn = container.querySelector('#resetBtn') as HTMLButtonElement;
    fireEvent.click(resetBtn);
    
    expect(searchInput.value).toBe('');
  });

  it('接口失败应该显示错误提示', async () => {
    mockAdminApi.getProjects.mockRejectedValue(new Error('加载失败'));
    const page = new AdminPage(container);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('加载失败', 'error');
    });
  });
});

describe('执行人页面测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(mockUsers.executor));
    container = createContainer();
    
    mockCommonApi.getAllProjects.mockResolvedValue(mockProjects);
    mockCommonApi.getAllFloors.mockResolvedValue([]);
    mockCommonApi.getAllAreas.mockResolvedValue([]);
    mockCommonApi.getAllHazardTypes.mockResolvedValue(mockHazardTypes.filter(t => t.parent_id === null));
    mockCommonApi.getAllGroups.mockResolvedValue(mockGroups);
    mockCommonApi.getAllDeadlineRules.mockResolvedValue(mockDeadlineRules);
    mockExecutorApi.getHazards.mockResolvedValue(createMockPageResult(mockHazards));
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it('应该正确渲染执行人页面', () => {
    const page = new ExecutorPage(container);
    
    expect(container.querySelector('h1')?.textContent).toContain('执行人');
    expect(container.textContent).toContain('隐患记录列表');
    expect(container.querySelector('#addBtn')).toBeInTheDocument();
    expect(container.querySelector('#exportBtn')).toBeInTheDocument();
  });

  it('填报隐患按钮应该打开新增表单', async () => {
    const page = new ExecutorPage(container);
    
    await waitFor(() => {
      expect(mockExecutorApi.getHazards).toHaveBeenCalled();
    });
    
    const addBtn = container.querySelector('#addBtn') as HTMLButtonElement;
    fireEvent.click(addBtn);
    
    await waitFor(() => {
      expect(container.querySelector('.modal-mask')).toBeInTheDocument();
    });
  });

  it('查询按钮应该更新筛选参数并刷新列表', async () => {
    const page = new ExecutorPage(container);
    
    await waitFor(() => {
      expect(mockExecutorApi.getHazards).toHaveBeenCalled();
    });
    
    const statusSelect = container.querySelector('#status') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    
    const keywordInput = container.querySelector('#keyword') as HTMLInputElement;
    fireEvent.input(keywordInput, { target: { value: '安全' } });
    
    const searchBtn = container.querySelector('#searchBtn') as HTMLButtonElement;
    fireEvent.click(searchBtn);
    
    expect(mockExecutorApi.getHazards).toHaveBeenCalled();
  });

  it('重置按钮应该清空所有筛选条件', async () => {
    const page = new ExecutorPage(container);
    
    await waitFor(() => {
      expect(mockExecutorApi.getHazards).toHaveBeenCalled();
    });
    
    const statusSelect = container.querySelector('#status') as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: 'pending' } });
    
    const resetBtn = container.querySelector('#resetBtn') as HTMLButtonElement;
    fireEvent.click(resetBtn);
    
    expect(statusSelect.value).toBe('');
  });

  it('导出按钮应该调用导出API', async () => {
    const mockBlob = new Blob();
    mockExecutorApi.exportHazards.mockResolvedValue(mockBlob);
    
    const page = new ExecutorPage(container);
    
    await waitFor(() => {
      expect(mockExecutorApi.getHazards).toHaveBeenCalled();
    });
    
    const exportBtn = container.querySelector('#exportBtn') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(mockExecutorApi.exportHazards).toHaveBeenCalled();
    });
  });
});

describe('监督员页面测试', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(mockUsers.supervisor));
    container = createContainer();
    
    mockCommonApi.getAllProjects.mockResolvedValue(mockProjects);
    mockCommonApi.getAllFloors.mockResolvedValue([]);
    mockCommonApi.getAllAreas.mockResolvedValue([]);
    mockCommonApi.getAllHazardTypes.mockResolvedValue(mockHazardTypes.filter(t => t.parent_id === null));
    mockCommonApi.getAllGroups.mockResolvedValue(mockGroups);
    mockSupervisorApi.getHazards.mockResolvedValue(createMockPageResult(mockHazards));
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  it('应该正确渲染监督员页面', () => {
    const page = new SupervisorPage(container);
    
    expect(container.querySelector('h1')?.textContent).toContain('监督人');
    expect(container.textContent).toContain('预警状态');
  });

  it('应该支持按预警状态筛选', async () => {
    const page = new SupervisorPage(container);
    
    await waitFor(() => {
      expect(mockSupervisorApi.getHazards).toHaveBeenCalled();
    });
    
    const warningSelect = container.querySelector('#warningStatus') as HTMLSelectElement;
    fireEvent.change(warningSelect, { target: { value: 'overdue' } });
    
    const searchBtn = container.querySelector('#searchBtn') as HTMLButtonElement;
    fireEvent.click(searchBtn);
    
    expect(mockSupervisorApi.getHazards).toHaveBeenCalled();
  });

  it('导出按钮应该调用公共导出API', async () => {
    const mockBlob = new Blob();
    mockCommonApi.exportHazards.mockResolvedValue(mockBlob);
    
    const page = new SupervisorPage(container);
    
    await waitFor(() => {
      expect(mockSupervisorApi.getHazards).toHaveBeenCalled();
    });
    
    const exportBtn = container.querySelector('#exportBtn') as HTMLButtonElement;
    fireEvent.click(exportBtn);
    
    await waitFor(() => {
      expect(mockCommonApi.exportHazards).toHaveBeenCalled();
    });
  });
});
