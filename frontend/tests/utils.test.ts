import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatDate,
  getStatusText,
  getStatusClass,
  getWarningStatusText,
  getWarningStatusClass,
  getWarningDisplayText,
  showToast,
  debounce,
} from '../src/utils';

describe('工具函数测试', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('formatDate', () => {
    it('应该格式化日期字符串', () => {
      expect(formatDate('2024-01-15T10:30:00')).toBe('2024-01-15 10:30:00');
    });

    it('空字符串应该返回-', () => {
      expect(formatDate('')).toBe('-');
    });

    it('null/undefined应该返回-', () => {
      expect(formatDate(null as any)).toBe('-');
      expect(formatDate(undefined as any)).toBe('-');
    });
  });

  describe('getStatusText', () => {
    it('应该返回正确的状态文本', () => {
      expect(getStatusText('pending')).toBe('待整改');
      expect(getStatusText('rectifying')).toBe('整改中');
      expect(getStatusText('closed')).toBe('已关闭');
    });

    it('未知状态应该返回原状态值', () => {
      expect(getStatusText('unknown')).toBe('unknown');
    });
  });

  describe('getStatusClass', () => {
    it('应该返回正确的CSS类', () => {
      expect(getStatusClass('pending')).toBe('status-tag status-pending');
      expect(getStatusClass('rectifying')).toBe('status-tag status-rectifying');
      expect(getStatusClass('closed')).toBe('status-tag status-closed');
    });
  });

  describe('getWarningStatusText', () => {
    it('应该返回正确的预警状态文本', () => {
      expect(getWarningStatusText('normal')).toBe('正常');
      expect(getWarningStatusText('expiring_soon')).toBe('即将到期');
      expect(getWarningStatusText('overdue')).toBe('已超期');
      expect(getWarningStatusText('closed')).toBe('已结束');
    });

    it('空值或未知状态应该返回-', () => {
      expect(getWarningStatusText('')).toBe('-');
      expect(getWarningStatusText(undefined)).toBe('-');
      expect(getWarningStatusText('unknown')).toBe('-');
    });
  });

  describe('getWarningStatusClass', () => {
    it('应该返回正确的预警CSS类', () => {
      expect(getWarningStatusClass('normal')).toBe('warning-tag warning-normal');
      expect(getWarningStatusClass('overdue')).toBe('warning-tag warning-overdue');
    });

    it('空值应该返回warning-normal类', () => {
      expect(getWarningStatusClass()).toBe('warning-tag warning-normal');
    });
  });

  describe('getWarningDisplayText', () => {
    it('没有截止日期应该显示未设置', () => {
      const item = { deadline_date: null, status: 'pending' };
      expect(getWarningDisplayText(item)).toBe('未设置截止时间');
    });

    it('已关闭状态应该显示已关闭', () => {
      const item = { deadline_date: '2024-12-31', status: 'closed' };
      expect(getWarningDisplayText(item)).toBe('已关闭');
    });

    it('超期应该显示超期天数', () => {
      const item = { deadline_date: '2024-01-01', status: 'pending', is_overdue: true, overdue_days: 5 };
      expect(getWarningDisplayText(item)).toBe('已超期 5 天');
    });

    it('正常应该显示剩余天数', () => {
      const item = { deadline_date: '2024-12-31', status: 'pending', is_overdue: false, remaining_days: 10 };
      expect(getWarningDisplayText(item)).toBe('剩余 10 天');
    });
  });

  describe('showToast', () => {
    it('应该创建toast元素', () => {
      showToast('测试消息');
      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast?.textContent).toBe('测试消息');
      expect(toast?.classList.contains('toast-success')).toBe(true);
    });

    it('应该创建error类型的toast', () => {
      showToast('错误消息', 'error');
      const toast = document.querySelector('.toast');
      expect(toast?.classList.contains('toast-error')).toBe(true);
    });

    it('3秒后应该移除toast', () => {
      vi.useFakeTimers();
      showToast('定时消息');
      expect(document.querySelector('.toast')).not.toBeNull();
      vi.advanceTimersByTime(3000);
      expect(document.querySelector('.toast')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('debounce', () => {
    it('应该防抖函数调用', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('应该传递正确的参数', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('a', 1);
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('a', 1);
      vi.useRealTimers();
    });
  });
});
