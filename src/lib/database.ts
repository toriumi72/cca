import Dexie, { Table } from 'dexie';
import { Transaction, Category, Settings, Budget, ActionLog } from '@/types';

export class Database extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  settings!: Table<Settings>;
  budgets!: Table<Budget>;
  actionLogs!: Table<ActionLog>;

  constructor() {
    super('HouseholdBudgetApp');

    this.version(1).stores({
      transactions: '++id, amount, date, categoryId, type, createdAt, deletedAt',
      categories: '++id, name, type, order, createdAt',
      settings: '++id',
      budgets: '++id, categoryId, month',
      actionLogs: '++id, action, entityType, entityId, timestamp'
    });

    // Set up hooks for action logging
    this.transactions.hook('creating', (primKey, obj, trans) => {
      this.logAction('create', 'transaction', obj.id, obj);
    });

    this.transactions.hook('updating', (modifications, primKey, obj, trans) => {
      this.logAction('update', 'transaction', obj.id, { modifications, original: obj });
    });

    this.transactions.hook('deleting', (primKey, obj, trans) => {
      this.logAction('delete', 'transaction', obj.id, obj);
    });

    this.categories.hook('creating', (primKey, obj, trans) => {
      this.logAction('create', 'category', obj.id, obj);
    });

    this.categories.hook('updating', (modifications, primKey, obj, trans) => {
      this.logAction('update', 'category', obj.id, { modifications, original: obj });
    });

    this.categories.hook('deleting', (primKey, obj, trans) => {
      this.logAction('delete', 'category', obj.id, obj);
    });
  }

  private async logAction(
    action: ActionLog['action'],
    entityType: ActionLog['entityType'],
    entityId: string,
    data: any
  ) {
    const log: ActionLog = {
      id: crypto.randomUUID(),
      action,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString()
    };

    await this.actionLogs.add(log);

    // Keep only last 500 logs
    const count = await this.actionLogs.count();
    if (count > 500) {
      const oldestLogs = await this.actionLogs
        .orderBy('timestamp')
        .limit(count - 500)
        .toArray();
      
      const idsToDelete = oldestLogs.map(log => log.id);
      await this.actionLogs.bulkDelete(idsToDelete);
    }
  }

  async initializeDefaultData() {
    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      const defaultSettings: Settings = {
        id: 'main',
        currency: 'JPY',
        weekStartsOn: 1,
        theme: 'system',
        passcodeEnabled: false,
        language: 'ja',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.settings.add(defaultSettings);
    }
  }

  async createSampleData() {
    const sampleCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: '食費', icon: '🍽️', color: '#ef4444', type: 'expense', order: 1 },
      { name: '交通費', icon: '🚌', color: '#3b82f6', type: 'expense', order: 2 },
      { name: '住居費', icon: '🏠', color: '#8b5cf6', type: 'expense', order: 3 },
      { name: '光熱費', icon: '💡', color: '#f59e0b', type: 'expense', order: 4 },
      { name: '娯楽', icon: '🎮', color: '#10b981', type: 'expense', order: 5 },
      { name: '給与', icon: '💰', color: '#059669', type: 'income', order: 6 },
      { name: '副業', icon: '💼', color: '#0d9488', type: 'income', order: 7 }
    ];

    for (const category of sampleCategories) {
      const newCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.categories.add(newCategory);
    }
  }

  async softDeleteTransaction(id: string) {
    const transaction = await this.transactions.get(id);
    if (transaction) {
      await this.transactions.update(id, {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  async restoreTransaction(id: string) {
    await this.transactions.update(id, {
      deletedAt: undefined,
      updatedAt: new Date().toISOString()
    });
    this.logAction('restore', 'transaction', id, { restored: true });
  }

  async permanentlyDeleteOldTrash() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    await this.transactions
      .where('deletedAt')
      .below(cutoffDate)
      .delete();
  }

  async getActiveTransactions() {
    return this.transactions
      .where('deletedAt')
      .equals(undefined)
      .toArray();
  }

  async getDeletedTransactions() {
    return this.transactions
      .where('deletedAt')
      .above('')
      .toArray();
  }

  async exportData() {
    const [transactions, categories, settings, budgets] = await Promise.all([
      this.transactions.toArray(),
      this.categories.toArray(),
      this.settings.toArray(),
      this.budgets.toArray()
    ]);

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        transactions,
        categories,
        settings,
        budgets
      }
    };
  }

  async importData(data: any, mode: 'overwrite' | 'merge') {
    if (mode === 'overwrite') {
      await Promise.all([
        this.transactions.clear(),
        this.categories.clear(),
        this.budgets.clear()
      ]);
    }

    if (data.data.categories) {
      await this.categories.bulkAdd(data.data.categories);
    }
    if (data.data.transactions) {
      await this.transactions.bulkAdd(data.data.transactions);
    }
    if (data.data.budgets) {
      await this.budgets.bulkAdd(data.data.budgets);
    }
    if (data.data.settings && data.data.settings.length > 0) {
      const settings = data.data.settings[0];
      const existing = await this.settings.get('main');
      if (existing) {
        await this.settings.update('main', settings);
      } else {
        await this.settings.add(settings);
      }
    }
  }
}

export const db = new Database();