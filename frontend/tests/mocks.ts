export const mockUsers = {
  admin: { id: 1, username: 'admin', role: 'admin' as const, name: '系统管理员' },
  executor: { id: 2, username: 'executor', role: 'executor' as const, name: '张三' },
  supervisor: { id: 4, username: 'supervisor', role: 'supervisor' as const, name: '王监督' },
};

export const mockProjects = [
  { id: 1, name: '测试项目A', code: 'TEST001', created_at: '2024-01-01' },
  { id: 2, name: '测试项目B', code: 'TEST002', created_at: '2024-01-02' },
];

export const mockFloors = [
  { id: 1, project_id: 1, name: '1层', code: 'F01', created_at: '2024-01-01' },
  { id: 2, project_id: 1, name: '2层', code: 'F02', created_at: '2024-01-01' },
];

export const mockAreas = [
  { id: 1, floor_id: 1, name: '东区', code: 'A01', created_at: '2024-01-01' },
  { id: 2, floor_id: 1, name: '西区', code: 'A02', created_at: '2024-01-01' },
];

export const mockHazardTypes = [
  { id: 1, parent_id: null, name: '安全防护', code: 'HT01', created_at: '2024-01-01' },
  { id: 2, parent_id: 1, name: '临边防护', code: 'HT01-01', created_at: '2024-01-01' },
  { id: 4, parent_id: null, name: '临时用电', code: 'HT02', created_at: '2024-01-01' },
];

export const mockGroups = [
  { id: 1, name: '测试班组1', leader: '李组长', phone: '13800138001', created_at: '2024-01-01' },
];

export const mockHazards = [
  {
    id: 1,
    project_id: 1,
    floor_id: 1,
    area_id: 1,
    hazard_type_id: 2,
    group_id: 1,
    description: '测试隐患1',
    photos: '',
    status: 'pending' as const,
    executor_id: 2,
    supervisor_id: null,
    rectification_desc: null,
    rectification_photos: null,
    review_comment: null,
    deadline_date: '2024-12-31',
    created_at: '2024-01-01 10:00:00',
    rectified_at: null,
    closed_at: null,
    project_name: '测试项目A',
    floor_name: '1层',
    area_name: '东区',
    hazard_type_name: '临边防护',
    hazard_type_parent_name: '安全防护',
    group_name: '测试班组1',
    executor_name: '张三',
    remaining_days: 10,
    is_overdue: false,
    overdue_days: 0,
    warning_status: 'normal' as const,
  },
  {
    id: 2,
    project_id: 1,
    floor_id: 1,
    area_id: 2,
    hazard_type_id: 2,
    group_id: 1,
    description: '测试隐患2-超期',
    photos: '',
    status: 'pending' as const,
    executor_id: 2,
    supervisor_id: null,
    rectification_desc: null,
    rectification_photos: null,
    review_comment: null,
    deadline_date: '2024-01-01',
    created_at: '2024-01-01 10:00:00',
    rectified_at: null,
    closed_at: null,
    project_name: '测试项目A',
    floor_name: '1层',
    area_name: '西区',
    hazard_type_name: '临边防护',
    hazard_type_parent_name: '安全防护',
    group_name: '测试班组1',
    executor_name: '张三',
    remaining_days: -5,
    is_overdue: true,
    overdue_days: 5,
    warning_status: 'overdue' as const,
  },
];

export function mockFetch(responseData: any, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseData),
    blob: () => Promise.resolve(new Blob()),
  } as any);
}

export function mockFetchError(errorMessage: string, status = 400) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMessage }),
  } as any);
}
