'use client';

import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useMonthlyStats, useCategoryStats, useDatabase } from '@/hooks/useDatabase';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryList } from '@/components/categories/CategoryList';
import { formatCurrency, getCurrentMonth } from '@/lib/utils';
import { FilterOptions, SortOptions, Transaction } from '@/types';

export function Dashboard() {
  const { isInitialized, createSampleData } = useDatabase();
  const currentMonth = getCurrentMonth();
  const monthlyStats = useMonthlyStats(currentMonth);
  const categoryStats = useCategoryStats(currentMonth);

  const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'reports'>('transactions');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'date', direction: 'desc' });

  const handleCreateSampleData = async () => {
    try {
      await createSampleData();
      setShowInitialSetup(false);
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">データベースを初期化中...</div>
          <div className="text-gray-600">しばらくお待ちください</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">家計簿アプリ</h1>
            <Button
              variant="ghost"
              onClick={() => setShowInitialSetup(true)}
              aria-label="設定"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {monthlyStats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今月の収入</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(monthlyStats.income)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今月の支出</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(monthlyStats.expense)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">収支</p>
                  <p className={`text-2xl font-bold ${
                    monthlyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(monthlyStats.balance)}
                  </p>
                </div>
                <BarChart3 className={`h-8 w-8 ${
                  monthlyStats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                取引履歴
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                カテゴリ管理
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                レポート
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={() => setShowExpenseForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    支出を追加
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowIncomeForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    収入を追加
                  </Button>
                </div>

                {/* Filters */}
                <TransactionFilters
                  filters={filters}
                  sort={sort}
                  onFiltersChange={setFilters}
                  onSortChange={setSort}
                />

                {/* Transaction List */}
                <TransactionList
                  filters={filters}
                  sort={sort}
                />
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-6">
                {/* Action Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">カテゴリ管理</h2>
                  <Button onClick={() => setShowCategoryForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    カテゴリを追加
                  </Button>
                </div>

                {/* Category List */}
                <CategoryList />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">レポート</h2>
                
                {/* Category Breakdown */}
                {categoryStats && categoryStats.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">今月のカテゴリ別支出</h3>
                    <div className="space-y-3">
                      {categoryStats.slice(0, 5).map((stat) => (
                        <div key={stat.categoryId} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{stat.categoryName}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(stat.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center py-12 text-gray-500">
                  詳細なレポート機能は今後追加予定です
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TransactionForm
        isOpen={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        type="expense"
      />

      <TransactionForm
        isOpen={showIncomeForm}
        onClose={() => setShowIncomeForm(false)}
        type="income"
      />

      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
      />

      {/* Initial Setup Modal */}
      <Modal
        isOpen={showInitialSetup}
        onClose={() => setShowInitialSetup(false)}
        title="アプリの設定"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            家計簿アプリにようこそ！最初にサンプルデータを生成することができます。
          </p>
          
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">サンプルデータを生成</h4>
              <p className="text-sm text-blue-800">
                基本的なカテゴリ（食費、交通費、住居費など）を自動で作成します。
                後から編集・削除できます。
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">自分で作成</h4>
              <p className="text-sm text-gray-700">
                カテゴリを手動で作成します。完全にカスタマイズできます。
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInitialSetup(false)}
              className="flex-1"
            >
              自分で作成
            </Button>
            <Button
              onClick={handleCreateSampleData}
              className="flex-1"
            >
              サンプルを生成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}