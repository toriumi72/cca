'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Transaction, Category, Settings, FilterOptions, SortOptions } from '@/types';

export function useTransactions(filters?: FilterOptions, sort?: SortOptions) {
  return useLiveQuery(async () => {
    let query = db.transactions.where('deletedAt').equals(undefined);

    // Apply filters
    if (filters) {
      if (filters.dateFrom || filters.dateTo) {
        const from = filters.dateFrom || '0000-01-01';
        const to = filters.dateTo || '9999-12-31';
        query = query.and(transaction => transaction.date >= from && transaction.date <= to);
      }

      if (filters.categoryIds && filters.categoryIds.length > 0) {
        query = query.and(transaction => filters.categoryIds!.includes(transaction.categoryId));
      }

      if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
        const min = filters.amountMin || 0;
        const max = filters.amountMax || Number.MAX_SAFE_INTEGER;
        query = query.and(transaction => transaction.amount >= min && transaction.amount <= max);
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        query = query.and(transaction => 
          transaction.memo?.toLowerCase().includes(keyword) || false
        );
      }

      if (filters.type) {
        query = query.and(transaction => transaction.type === filters.type);
      }
    }

    let results = await query.toArray();

    // Apply sorting
    if (sort) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort.field) {
          case 'date':
            aValue = a.date;
            bValue = b.date;
            break;
          case 'amount':
            aValue = a.amount;
            bValue = b.amount;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'category':
            // This would need category data, simplified for now
            aValue = a.categoryId;
            bValue = b.categoryId;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date descending
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return results;
  }, [filters, sort]);
}

export function useCategories(type?: 'expense' | 'income') {
  return useLiveQuery(async () => {
    let query = db.categories.orderBy('order');
    
    if (type) {
      const results = await query.toArray();
      return results.filter(cat => cat.type === type || cat.type === 'both');
    }
    
    return query.toArray();
  }, [type]);
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get('main'));
}

export function useRecentCategories(limit: number = 3) {
  return useLiveQuery(async () => {
    const recentTransactions = await db.transactions
      .where('deletedAt')
      .equals(undefined)
      .orderBy('createdAt')
      .reverse()
      .limit(50)
      .toArray();

    const categoryIds = Array.from(new Set(recentTransactions.map(t => t.categoryId)));
    const limitedIds = categoryIds.slice(0, limit);
    
    const categories = await db.categories.bulkGet(limitedIds);
    return categories.filter(Boolean) as Category[];
  }, [limit]);
}

export function useMonthlyStats(month: string) {
  return useLiveQuery(async () => {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const transactions = await db.transactions
      .where('deletedAt')
      .equals(undefined)
      .and(t => t.date >= startDate && t.date <= endDate)
      .toArray();

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      transactionCount: transactions.length
    };
  }, [month]);
}

export function useCategoryStats(month: string) {
  return useLiveQuery(async () => {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const transactions = await db.transactions
      .where('deletedAt')
      .equals(undefined)
      .and(t => t.date >= startDate && t.date <= endDate)
      .toArray();

    const categories = await db.categories.toArray();
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const stats = new Map<string, {
      categoryId: string;
      categoryName: string;
      amount: number;
      count: number;
    }>();

    transactions.forEach(transaction => {
      const category = categoryMap.get(transaction.categoryId);
      if (!category) return;

      const existing = stats.get(transaction.categoryId) || {
        categoryId: transaction.categoryId,
        categoryName: category.name,
        amount: 0,
        count: 0
      };

      existing.amount += transaction.amount;
      existing.count += 1;
      stats.set(transaction.categoryId, existing);
    });

    return Array.from(stats.values()).sort((a, b) => b.amount - a.amount);
  }, [month]);
}

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await db.open();
        await db.initializeDefaultData();
        setIsInitialized(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'データベースの初期化に失敗しました');
      }
    };

    initializeDatabase();
  }, []);

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.transactions.add(newTransaction);
    return newTransaction;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteTransaction = async (id: string) => {
    await db.softDeleteTransaction(id);
  };

  const createCategory = async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.categories.add(newCategory);
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await db.categories.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteCategory = async (id: string, mergeToId?: string) => {
    if (mergeToId) {
      // Update all transactions to use the merge target category
      await db.transactions
        .where('categoryId')
        .equals(id)
        .modify({ categoryId: mergeToId });
    }
    
    await db.categories.delete(id);
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    await db.settings.update('main', {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  return {
    isInitialized,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    updateCategory,
    deleteCategory,
    updateSettings
  };
}