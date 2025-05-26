import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'JPY'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric'
  };

  if (format === 'long') {
    options.weekday = 'long';
  }

  return new Intl.DateTimeFormat('ja-JP', options).format(dateObj);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateAmount(amount: string | number): { isValid: boolean; error?: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: '有効な数値を入力してください' };
  }
  
  if (numAmount < 1) {
    return { isValid: false, error: '金額は1円以上である必要があります' };
  }
  
  if (numAmount > 9999999) {
    return { isValid: false, error: '金額は9,999,999円以下である必要があります' };
  }
  
  if (!Number.isInteger(numAmount)) {
    return { isValid: false, error: '円単位で入力してください（小数点は使用できません）' };
  }
  
  return { isValid: true };
}

export function validateMemo(memo: string): { isValid: boolean; error?: string } {
  if (memo.length > 200) {
    return { isValid: false, error: 'メモは200文字以内で入力してください' };
  }
  
  return { isValid: true };
}

export function isFutureDate(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  return inputDate > today;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1, 1);
  date.setMonth(date.getMonth() - 1);
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1, 1);
  date.setMonth(date.getMonth() + 1);
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function downloadFile(data: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}