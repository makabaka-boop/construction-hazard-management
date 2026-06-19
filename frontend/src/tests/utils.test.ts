import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getStatusText,
  getStatusClass,
  getWarningStatusText,
  getWarningStatusClass,
  getWarningDisplayText,
} from '../utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format ISO date string', () => {
      expect(formatDate('2024-01-15T10:30:00')).toBe('2024-01-15 10:30:00');
    });

    it('should return dash for empty string', () => {
      expect(formatDate('')).toBe('-');
    });

    it('should return dash for null/undefined', () => {
      expect(formatDate(null as any)).toBe('-');
      expect(formatDate(undefined as any)).toBe('-');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for pending', () => {
      expect(getStatusText('pending')).toBe('待整改');
    });

    it('should return correct text for rectifying', () => {
      expect(getStatusText('rectifying')).toBe('整改中');
    });

    it('should return correct text for closed', () => {
      expect(getStatusText('closed')).toBe('已关闭');
    });

    it('should return original value for unknown status', () => {
      expect(getStatusText('unknown')).toBe('unknown');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for status', () => {
      expect(getStatusClass('pending')).toBe('status-tag status-pending');
      expect(getStatusClass('rectifying')).toBe('status-tag status-rectifying');
      expect(getStatusClass('closed')).toBe('status-tag status-closed');
    });
  });

  describe('getWarningStatusText', () => {
    it('should return correct warning status text', () => {
      expect(getWarningStatusText('normal')).toBe('正常');
      expect(getWarningStatusText('expiring_soon')).toBe('即将到期');
      expect(getWarningStatusText('overdue')).toBe('已超期');
      expect(getWarningStatusText('closed')).toBe('已结束');
    });

    it('should return dash for undefined/empty status', () => {
      expect(getWarningStatusText(undefined)).toBe('-');
      expect(getWarningStatusText('')).toBe('-');
    });

    it('should return dash for unknown status', () => {
      expect(getWarningStatusText('unknown')).toBe('-');
    });
  });

  describe('getWarningStatusClass', () => {
    it('should return correct class for warning status', () => {
      expect(getWarningStatusClass('normal')).toBe('warning-tag warning-normal');
      expect(getWarningStatusClass('overdue')).toBe('warning-tag warning-overdue');
    });

    it('should default to normal class', () => {
      expect(getWarningStatusClass()).toBe('warning-tag warning-normal');
    });
  });

  describe('getWarningDisplayText', () => {
    it('should show deadline not set when no deadline_date', () => {
      expect(getWarningDisplayText({ deadline_date: null })).toBe('未设置截止时间');
    });

    it('should show closed when status is closed', () => {
      expect(getWarningDisplayText({ deadline_date: '2024-01-01', status: 'closed' })).toBe('已关闭');
    });

    it('should show overdue days when is_overdue', () => {
      expect(getWarningDisplayText({ 
        deadline_date: '2024-01-01', 
        status: 'pending',
        is_overdue: true,
        overdue_days: 5,
      })).toBe('已超期 5 天');
    });

    it('should show remaining days when not overdue', () => {
      expect(getWarningDisplayText({ 
        deadline_date: '2099-01-01', 
        status: 'pending',
        is_overdue: false,
        remaining_days: 10,
      })).toBe('剩余 10 天');
    });

    it('should show deadline not set as fallback for empty object', () => {
      expect(getWarningDisplayText({})).toBe('未设置截止时间');
    });
  });
});
