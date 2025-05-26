'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useCategories } from '@/hooks/useDatabase';
import { FilterOptions, SortOptions } from '@/types';
import { getCurrentMonth, getPreviousMonth } from '@/lib/utils';

interface TransactionFiltersProps {
  filters: FilterOptions;
  sort: SortOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
}

export function TransactionFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange
}: TransactionFiltersProps) {
  const categories = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setShowFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.categoryIds && filters.categoryIds.length > 0) count++;
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) count++;
    if (filters.keyword) count++;
    if (filters.type) count++;
    return count;
  };

  const getDatePreset = (preset: 'current-month' | 'previous-month' | 'current-year') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = getCurrentMonth();

    switch (preset) {
      case 'current-month':
        return {
          dateFrom: `${currentMonth}-01`,
          dateTo: `${currentMonth}-31`
        };
      case 'previous-month':
        const prevMonth = getPreviousMonth(currentMonth);
        return {
          dateFrom: `${prevMonth}-01`,
          dateTo: `${prevMonth}-31`
        };
      case 'current-year':
        return {
          dateFrom: `${currentYear}-01-01`,
          dateTo: `${currentYear}-12-31`
        };
    }
  };

  const handleDatePreset = (preset: 'current-month' | 'previous-month' | 'current-year') => {
    const dates = getDatePreset(preset);
    setLocalFilters(prev => ({ ...prev, ...dates }));
  };

  const sortOptions = [
    { value: 'date-desc', label: '日付（新しい順）' },
    { value: 'date-asc', label: '日付（古い順）' },
    { value: 'amount-desc', label: '金額（高い順）' },
    { value: 'amount-asc', label: '金額（安い順）' },
    { value: 'category-asc', label: 'カテゴリ（A-Z）' },
    { value: 'createdAt-desc', label: '登録日（新しい順）' }
  ];

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`
  })) || [];

  const typeOptions = [
    { value: '', label: 'すべて' },
    { value: 'expense', label: '支出のみ' },
    { value: 'income', label: '収入のみ' }
  ];

  const activeFilterCount = getActiveFilterCount();

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="メモを検索..."
            value={filters.keyword || ''}
            onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value || undefined })}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none"
          />
        </div>

        {/* Sort Select */}
        <Select
          value={`${sort.field}-${sort.direction}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split('-');
            onSortChange({
              field: field as SortOptions['field'],
              direction: direction as SortOptions['direction']
            });
          }}
          options={sortOptions}
          className="w-48"
        />

        {/* Filter Button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(true)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          フィルタ
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-800 font-medium">アクティブなフィルタ:</span>
            {filters.type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {filters.type === 'expense' ? '支出' : '収入'}
                <button
                  onClick={() => onFiltersChange({ ...filters, type: undefined })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                期間指定
                <button
                  onClick={() => onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.categoryIds && filters.categoryIds.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                カテゴリ ({filters.categoryIds.length}件)
                <button
                  onClick={() => onFiltersChange({ ...filters, categoryIds: undefined })}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="text-blue-600 hover:text-blue-800"
            >
              すべてクリア
            </Button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="フィルタ設定"
        size="md"
      >
        <div className="space-y-6">
          {/* Type Filter */}
          <Select
            label="取引タイプ"
            value={localFilters.type || ''}
            onChange={(e) => setLocalFilters(prev => ({ 
              ...prev, 
              type: e.target.value ? e.target.value as 'expense' | 'income' : undefined 
            }))}
            options={typeOptions}
          />

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">期間</label>
            
            {/* Date Presets */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset('current-month')}
              >
                今月
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset('previous-month')}
              >
                先月
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset('current-year')}
              >
                今年
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="開始日"
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => setLocalFilters(prev => ({ 
                  ...prev, 
                  dateFrom: e.target.value || undefined 
                }))}
              />
              <Input
                label="終了日"
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => setLocalFilters(prev => ({ 
                  ...prev, 
                  dateTo: e.target.value || undefined 
                }))}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {categoryOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.categoryIds?.includes(option.value) || false}
                    onChange={(e) => {
                      const categoryIds = localFilters.categoryIds || [];
                      if (e.target.checked) {
                        setLocalFilters(prev => ({
                          ...prev,
                          categoryIds: [...categoryIds, option.value]
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          categoryIds: categoryIds.filter(id => id !== option.value)
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">金額範囲</label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="最小金額"
                type="number"
                min="0"
                max="9999999"
                placeholder="0"
                value={localFilters.amountMin || ''}
                onChange={(e) => setLocalFilters(prev => ({ 
                  ...prev, 
                  amountMin: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
              <Input
                label="最大金額"
                type="number"
                min="0"
                max="9999999"
                placeholder="9,999,999"
                value={localFilters.amountMax || ''}
                onChange={(e) => setLocalFilters(prev => ({ 
                  ...prev, 
                  amountMax: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              クリア
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1"
            >
              適用
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}