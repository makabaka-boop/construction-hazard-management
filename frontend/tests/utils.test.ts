import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  showToast,
  formatDate,
  getStatusText,
  getStatusClass,
  getWarningStatusText,
  getWarningStatusClass,
  getWarningDisplayText,
  downloadBlob,
  debounce,
} from '../src/utils';

describe('工具函数测试', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('showToast', () => {
    it('应该创建toast元素并添加到页面', () => {
      showToast('测试消息', 'success');
      const toast = document.querySelector('.toast');
      expect(toast).toBeInTheDocument();
      expect(toast?.textContent).toBe('测试消息');
      expect(toast?.className).toContain('toast-success');
    });

    it('应该支持error类型', () => {
      showToast('错误消息', 'error');
      const toast = document.querySelector('.toast');
      expect(toast?.className).toContain('toast-error');
    });

    it('应该默认使用success类型', () => {
      showToast('默认消息');
      const toast = document.querySelector('.toast');
      expect(toast?.className).toContain('toast-success');
    });

    it('应该3秒后自动移除', () => {
      vi.useFakeTimers();
      showToast('定时消息');
      expect(document.querySelector('.toast')).toBeInTheDocument();
      vi.advanceTimersByTime(3000);
      expect(document.querySelector('.toast')).not.toBeInTheDocument();
    });
  });

  describe('formatDate', () => {
    it('应该正确格式化日期字符串', () => {
      expect(formatDate('2024-06-01T10:30:00')).toBe('2024-06-01 10:30:00');
    });

    it('空字符串应该返回-', () => {
      expect(formatDate('')).toBe('-');
    });

    it('应该处理不带T的日期', () => {
      expect(formatDate('2024-06-01')).toBe('2024-06-01');
    });
  });

  describe('getStatusText', () => {
    it('应该正确映射状态文本', () => {
      expect(getStatusText('pending')).toBe('待整改');
      expect(getStatusText('rectifying')).toBe('整改中');
      expect(getStatusText('closed')).toBe('已关闭');
    });

    it('未知状态应该返回原状态值', () => {
      expect(getStatusText('unknown')).toBe('unknown');
    });
  });

  describe('getStatusClass', () => {
    it('应该返回正确的CSS类名', () => {
      expect(getStatusClass('pending')).toBe('status-tag status-pending');
      expect(getStatusClass('rectifying')).toBe('status-tag status-rectifying');
      expect(getStatusClass('closed')).toBe('status-tag status-closed');
    });
  });

  describe('getWarningStatusText', () => {
    it('应该正确映射预警状态文本', () => {
      expect(getWarningStatusText('normal')).toBe('正常');
      expect(getWarningStatusText('expiring_soon')).toBe('即将到期');
      expect(getWarningStatusText('overdue')).toBe('已超期');
      expect(getWarningStatusText('closed')).toBe('已结束');
    });

    it('空值或未知状态应该返回-', () => {
      expect(getWarningStatusText('')).toBe('-');
      expect(getWarningStatusText('unknown' as any)).toBe('-');
    });
  });

  describe('getWarningStatusClass', () => {
    it('应该返回正确的预警CSS类名', () => {
      expect(getWarningStatusClass('normal')).toBe('warning-tag warning-normal');
      expect(getWarningStatusClass('overdue')).toBe('warning-tag warning-overdue');
    });

    it('空值应该使用normal作为默认', () => {
      expect(getWarningStatusClass()).toBe('warning-tag warning-normal');
    });
  });

  describe('getWarningDisplayText', () => {
    it('没有截止日期应该显示未设置', () => {
      expect(getWarningDisplayText({ deadline_date: null, status: 'pending' })).toBe('未设置截止时间');
    });

    it('已关闭状态应该显示已关闭', () => {
      expect(getWarningDisplayText({ deadline_date: '2024-12-31', status: 'closed' })).toBe('已关闭');
    });

    it('超期应该显示超期天数', () => {
      expect(getWarningDisplayText({ deadline_date: '2024-01-01', status: 'pending', is_overdue: true, overdue_days: 5 })).toBe('已超期 5 天');
    });

    it('应该显示剩余天数', () => {
      expect(getWarningDisplayText({ deadline_date: '2024-12-31', status: 'pending', remaining_days: 3, is_overdue: false })).toBe('剩余 3 天');
    });
  });

  describe('downloadBlob', () => {
    it('应该创建下载链接并触发下载', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      
      const blob = new Blob(['test']);
      downloadBlob(blob, 'test.xlsx');
      
      const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(anchor.tagName).toBe('A');
      expect(anchor.download).toBe('test.xlsx');
      expect(anchor.href).toBe('blob:test');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
      
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
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
    });

    it('应该传递参数和正确的this上下文', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn('a', 'b');
      vi.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledWith('a', 'b');
    });
  });
});
