import { describe, it, expect, vi } from 'vitest';
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

describe('utils.formatDate', () => {
  it('returns - when input empty', () => {
    expect(formatDate('')).toBe('-');
  });

  it('replaces T with space and trims', () => {
    expect(formatDate('2024-01-02T03:04:05.000Z')).toBe('2024-01-02 03:04:05');
  });

  it('handles plain space format', () => {
    expect(formatDate('2024-01-02 03:04:05')).toBe('2024-01-02 03:04:05');
  });
});

describe('utils.getStatusText / getStatusClass', () => {
  it('maps known status to Chinese label', () => {
    expect(getStatusText('pending')).toBe('待整改');
    expect(getStatusText('rectifying')).toBe('整改中');
    expect(getStatusText('closed')).toBe('已关闭');
  });

  it('returns input for unknown status', () => {
    expect(getStatusText('weird')).toBe('weird');
  });

  it('produces a status class string', () => {
    expect(getStatusClass('pending')).toBe('status-tag status-pending');
  });
});

describe('utils.getWarningStatusText / getWarningStatusClass', () => {
  it('maps known warning statuses', () => {
    expect(getWarningStatusText('normal')).toBe('正常');
    expect(getWarningStatusText('expiring_soon')).toBe('即将到期');
    expect(getWarningStatusText('overdue')).toBe('已超期');
    expect(getWarningStatusText('closed')).toBe('已结束');
  });

  it('handles undefined warning statuses', () => {
    expect(getWarningStatusText(undefined)).toBe('-');
    expect(getWarningStatusClass(undefined)).toBe('warning-tag warning-normal');
  });
});

describe('utils.getWarningDisplayText', () => {
  it('shows "未设置截止时间" when deadline missing', () => {
    expect(getWarningDisplayText({ deadline_date: null })).toBe('未设置截止时间');
  });

  it('returns 已关闭 for closed status', () => {
    expect(getWarningDisplayText({ deadline_date: '2099-01-01', status: 'closed' })).toBe('已关闭');
  });

  it('shows overdue text', () => {
    expect(getWarningDisplayText({ deadline_date: '2020-01-01', status: 'pending', is_overdue: true, overdue_days: 5 })).toBe('已超期 5 天');
  });

  it('shows remaining days text', () => {
    expect(getWarningDisplayText({ deadline_date: '2099-01-01', status: 'pending', is_overdue: false, remaining_days: 7 })).toBe('剩余 7 天');
  });
});

describe('utils.showToast', () => {
  it('appends a toast div with message and removes after timeout', async () => {
    vi.useFakeTimers();
    showToast('hello', 'success');
    const toast = document.querySelector('.toast.toast-success');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toBe('hello');
    vi.advanceTimersByTime(3500);
    expect(document.querySelector('.toast.toast-success')).toBeNull();
    vi.useRealTimers();
  });

  it('defaults type to success', () => {
    showToast('ok');
    expect(document.querySelector('.toast-success')).not.toBeNull();
  });
});

describe('utils.downloadBlob', () => {
  it('triggers download via temporary anchor', () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadBlob(blob, 'a.txt');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe('utils.debounce', () => {
  it('delays calls and only invokes once for rapid calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    debounced('c');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(120);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
    vi.useRealTimers();
  });
});
