export interface Transaction {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD format
  categoryId: string;
  memo?: string;
  type: 'expense' | 'income';
  receiptImage?: string; // Base64 or blob URL
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // For soft delete (trash functionality)
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  budget?: number; // Monthly budget
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: 'main';
  currency: 'JPY' | 'USD' | 'EUR';
  weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
  theme: 'light' | 'dark' | 'system';
  passcodeEnabled: boolean;
  passcodeHash?: string;
  totalBudget?: number;
  language: 'ja' | 'en';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM format
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  entityType: 'transaction' | 'category' | 'settings' | 'budget';
  entityId: string;
  data: any;
  timestamp: string;
}

export interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  categoryIds?: string[];
  amountMin?: number;
  amountMax?: number;
  keyword?: string;
  type?: 'expense' | 'income';
}

export interface SortOptions {
  field: 'date' | 'amount' | 'category' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategorySummary[];
  budgetStatus: BudgetStatus[];
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface DatabaseSchema {
  version: number;
  transactions: Transaction[];
  categories: Category[];
  settings: Settings[];
  budgets: Budget[];
  actionLogs: ActionLog[];
}