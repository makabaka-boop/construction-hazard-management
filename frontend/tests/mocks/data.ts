import { User, Project, Floor, Area, HazardType, ResponsibilityGroup, HazardRecord, RectificationDeadlineRule, PageResult } from '../../src/types';

export const mockUsers: Record<string, User> = {
  admin: { id: 1, username: 'admin', role: 'admin', name: '系统管理员' },
  executor: { id: 2, username: 'executor', role: 'executor', name: '张三' },
  supervisor: { id: 4, username: 'supervisor', role: 'supervisor', name: '王监督' },
};

export const mockProjects: Project[] = [
  { id: 1, name: '城市综合体A区', code: 'P001', created_at: '2024-01-01 10:00:00' },
  { id: 2, name: '科技园区B栋', code: 'P002', created_at: '2024-01-02 10:00:00' },
  { id: 3, name: '住宅小区C期', code: 'P003', created_at: '2024-01-03 10:00:00' },
];

export const mockFloors: Floor[] = [
  { id: 1, project_id: 1, name: '1层', code: 'F01', created_at: '2024-01-01 10:00:00' },
  { id: 2, project_id: 1, name: '2层', code: 'F02', created_at: '2024-01-01 10:00:00' },
  { id: 11, project_id: 2, name: '1层', code: 'F01', created_at: '2024-01-02 10:00:00' },
];

export const mockAreas: Area[] = [
  { id: 1, floor_id: 1, name: '东区', code: 'A01', created_at: '2024-01-01 10:00:00' },
  { id: 2, floor_id: 1, name: '西区', code: 'A02', created_at: '2024-01-01 10:00:00' },
];

export const mockHazardTypes: HazardType[] = [
  { id: 1, parent_id: null, name: '安全防护', code: 'HT01', created_at: '2024-01-01' },
  { id: 2, parent_id: null, name: '临时用电', code: 'HT02', created_at: '2024-01-01' },
  { id: 6, parent_id: 1, name: '临边防护', code: 'HT01-01', created_at: '2024-01-01' },
  { id: 7, parent_id: 1, name: '洞口防护', code: 'HT01-02', created_at: '2024-01-01' },
  { id: 12, parent_id: 2, name: '配电箱', code: 'HT02-01', created_at: '2024-01-01' },
];

export const mockGroups: ResponsibilityGroup[] = [
  { id: 1, name: '土建一组', leader: '李组长', phone: '138******01', created_at: '2024-01-01' },
  { id: 2, name: '土建二组', leader: '王组长', phone: '138******02', created_at: '2024-01-01' },
];

export const mockDeadlineRules: RectificationDeadlineRule[] = [
  { id: 1, hazard_type_parent_id: 1, default_days: 7, created_at: '2024-01-01', updated_at: '2024-01-01', hazard_type_name: '安全防护' },
  { id: 2, hazard_type_parent_id: 2, default_days: 5, created_at: '2024-01-01', updated_at: '2024-01-01', hazard_type_name: '临时用电' },
];

function createMockHazard(id: number, overrides: Partial<HazardRecord> = {}): HazardRecord {
  return {
    id,
    project_id: 1,
    floor_id: 1,
    area_id: 1,
    hazard_type_id: 6,
    group_id: 1,
    description: `隐患记录 ${id}：现场发现安全隐患`,
    photos: '',
    status: 'pending',
    executor_id: 2,
    supervisor_id: null,
    rectification_desc: null,
    rectification_photos: null,
    review_comment: null,
    deadline_date: '2026-12-31',
    created_at: '2024-06-01 10:00:00',
    rectified_at: null,
    closed_at: null,
    project_name: '城市综合体A区',
    floor_name: '1层',
    area_name: '东区',
    hazard_type_name: '临边防护',
    hazard_type_parent_name: '安全防护',
    group_name: '土建一组',
    executor_name: '张三',
    warning_status: 'normal',
    remaining_days: 100,
    is_overdue: false,
    overdue_days: 0,
    ...overrides,
  };
}

export const mockHazards: HazardRecord[] = Array.from({ length: 50 }, (_, i) => 
  createMockHazard(i + 1, {
    status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'rectifying' : 'closed',
  })
);

export function createMockPageResult<T>(list: T[], page = 1, pageSize = 20): PageResult<T> {
  return {
    list: list.slice(0, pageSize),
    total: list.length,
    page,
    pageSize,
  };
}
