'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { useCategories, useRecentCategories, useDatabase } from '@/hooks/useDatabase';
import { Transaction } from '@/types';
import { validateAmount, validateMemo, isFutureDate, formatDate } from '@/lib/utils';
import { Camera, Calendar } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  type: 'expense' | 'income';
}

export function TransactionForm({ isOpen, onClose, transaction, type }: TransactionFormProps) {
  const { createTransaction, updateTransaction } = useDatabase();
  const categories = useCategories(type);
  const recentCategories = useRecentCategories(3);
  
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    categoryId: '',
    memo: '',
    receiptImage: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Edit mode
        setFormData({
          amount: transaction.amount.toString(),
          date: transaction.date,
          categoryId: transaction.categoryId,
          memo: transaction.memo || '',
          receiptImage: transaction.receiptImage || ''
        });
      } else {
        // Create mode - set default date
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          amount: '',
          date: today,
          categoryId: '',
          memo: '',
          receiptImage: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, transaction]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error!;
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = '日付を選択してください';
    }

    // Category validation
    if (!formData.categoryId) {
      newErrors.categoryId = 'カテゴリを選択してください';
    }

    // Memo validation
    if (formData.memo) {
      const memoValidation = validateMemo(formData.memo);
      if (!memoValidation.isValid) {
        newErrors.memo = memoValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check for future date
    if (isFutureDate(formData.date)) {
      const confirmed = window.confirm(
        `${formatDate(formData.date)}は未来の日付です。このまま登録しますか？`
      );
      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        amount: parseInt(formData.amount),
        date: formData.date,
        categoryId: formData.categoryId,
        memo: formData.memo || undefined,
        receiptImage: formData.receiptImage || undefined,
        type
      };

      if (transaction) {
        await updateTransaction(transaction.id, transactionData);
        showToast({
          type: 'success',
          title: '更新しました',
          message: `${type === 'expense' ? '支出' : '収入'}を更新しました`
        });
      } else {
        await createTransaction(transactionData);
        showToast({
          type: 'success',
          title: '登録しました',
          message: `${type === 'expense' ? '支出' : '収入'}を登録しました`
        });
      }

      onClose();
    } catch (error) {
      console.error('Transaction save failed:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '保存に失敗しました。もう一度お試しください。'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecentCategoryClick = (categoryId: string) => {
    setFormData(prev => ({ ...prev, categoryId }));
    setErrors(prev => ({ ...prev, categoryId: '' }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast({
          type: 'warning',
          title: 'ファイルサイズエラー',
          message: '画像ファイルは5MB以下である必要があります'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, receiptImage: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: `${cat.icon} ${cat.name}`
  })) || [];

  const recentCategoryIds = recentCategories?.map(cat => cat.id) || [];
  const filteredRecentCategories = recentCategories?.filter(cat => 
    cat.type === type || cat.type === 'both'
  ) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? `${type === 'expense' ? '支出' : '収入'}を編集` : `${type === 'expense' ? '支出' : '収入'}を追加`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <Input
          id="amount"
          label="金額"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="1,000"
          value={formData.amount}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d]/g, '');
            setFormData(prev => ({ ...prev, amount: value }));
            if (errors.amount) {
              setErrors(prev => ({ ...prev, amount: '' }));
            }
          }}
          error={errors.amount}
          required
        />

        {/* Date Input */}
        <Input
          id="date"
          label="日付"
          type="date"
          value={formData.date}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, date: e.target.value }));
            if (errors.date) {
              setErrors(prev => ({ ...prev, date: '' }));
            }
          }}
          error={errors.date}
          required
        />

        {/* Recent Categories Shortcuts */}
        {filteredRecentCategories.length > 0 && !transaction && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最近使用したカテゴリ
            </label>
            <div className="flex gap-2 flex-wrap">
              {filteredRecentCategories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={formData.categoryId === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleRecentCategoryClick(category.id)}
                >
                  {category.icon} {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Category Select */}
        <Select
          id="categoryId"
          label="カテゴリ"
          placeholder="カテゴリを選択"
          options={categoryOptions}
          value={formData.categoryId}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, categoryId: e.target.value }));
            if (errors.categoryId) {
              setErrors(prev => ({ ...prev, categoryId: '' }));
            }
          }}
          error={errors.categoryId}
          required
        />

        {/* Memo Input */}
        <Input
          id="memo"
          label="メモ"
          type="text"
          placeholder="支払い先や詳細を入力（任意）"
          value={formData.memo}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, memo: e.target.value }));
            if (errors.memo) {
              setErrors(prev => ({ ...prev, memo: '' }));
            }
          }}
          error={errors.memo}
          helper="最大200文字まで入力できます"
        />

        {/* Receipt Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            レシート画像
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Camera className="h-4 w-4" />
              画像を選択
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {formData.receiptImage && (
              <span className="text-sm text-green-600">画像が選択されています</span>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : transaction ? '更新' : '登録'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}