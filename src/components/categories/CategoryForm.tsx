'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { useCategories, useDatabase } from '@/hooks/useDatabase';
import { Category } from '@/types';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
}

const EMOJI_OPTIONS = [
  '🍽️', '🍔', '🍕', '🍜', '☕', // Food
  '🚌', '🚗', '🚅', '✈️', '⛽', // Transport
  '🏠', '🏢', '🏪', '🏫', '💡', // Housing & Utilities
  '👕', '👗', '👟', '👜', '💄', // Clothing & Beauty
  '🎮', '🎬', '🎵', '📚', '⚽', // Entertainment
  '🏥', '💊', '🦷', '👓', '💉', // Health
  '🎓', '📝', '💻', '📱', '📺', // Education & Tech
  '💰', '💳', '💸', '📊', '🏪', // Finance
  '🎁', '❤️', '🌸', '🌟', '🔧', // Others
  '💼', '📈', '🏆', '💡', '⭐'  // Work & Achievement
];

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
];

export function CategoryForm({ isOpen, onClose, category }: CategoryFormProps) {
  const { createCategory, updateCategory } = useDatabase();
  const categories = useCategories();
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '💰',
    color: '#3b82f6',
    type: 'expense' as 'expense' | 'income' | 'both',
    budget: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode
        setFormData({
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
          budget: category.budget?.toString() || ''
        });
      } else {
        // Create mode
        setFormData({
          name: '',
          icon: '💰',
          color: '#3b82f6',
          type: 'expense',
          budget: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'カテゴリ名を入力してください';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = 'カテゴリ名は20文字以内で入力してください';
    } else {
      // Check for duplicate names (case-insensitive)
      const existingCategory = categories?.find(cat => 
        cat.id !== category?.id && 
        cat.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (existingCategory) {
        newErrors.name = '同じ名前のカテゴリが既に存在します';
      }
    }

    // Budget validation
    if (formData.budget) {
      const budget = parseInt(formData.budget);
      if (isNaN(budget)) {
        newErrors.budget = '有効な数値を入力してください';
      } else if (budget < 0) {
        newErrors.budget = '予算は0以上で入力してください';
      } else if (budget > 9999999) {
        newErrors.budget = '予算は9,999,999円以下で入力してください';
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

    setIsSubmitting(true);

    try {
      const categoryData = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        type: formData.type,
        budget: formData.budget ? parseInt(formData.budget) : undefined,
        order: category?.order || (categories?.length || 0) + 1
      };

      if (category) {
        await updateCategory(category.id, categoryData);
        showToast({
          type: 'success',
          title: '更新しました',
          message: 'カテゴリを更新しました'
        });
      } else {
        await createCategory(categoryData);
        showToast({
          type: 'success',
          title: '作成しました',
          message: 'カテゴリを作成しました'
        });
      }

      onClose();
    } catch (error) {
      console.error('Category save failed:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '保存に失敗しました。もう一度お試しください。'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'expense', label: '支出のみ' },
    { value: 'income', label: '収入のみ' },
    { value: 'both', label: '支出・収入両方' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'カテゴリを編集' : 'カテゴリを作成'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <Input
          id="name"
          label="カテゴリ名"
          type="text"
          placeholder="例: 食費、交通費"
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: '' }));
            }
          }}
          error={errors.name}
          helper="20文字以内で入力してください"
          required
        />

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            アイコン
          </label>
          <div className="grid grid-cols-10 gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                className={`
                  w-10 h-10 text-xl rounded-lg border-2 transition-colors
                  ${formData.icon === emoji 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            色
          </label>
          <div className="grid grid-cols-10 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`
                  w-8 h-8 rounded-lg border-2 transition-all
                  ${formData.color === color 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color }}
                aria-label={`色を${color}に設定`}
              />
            ))}
          </div>
        </div>

        {/* Type Selection */}
        <Select
          id="type"
          label="タイプ"
          options={typeOptions}
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            type: e.target.value as 'expense' | 'income' | 'both' 
          }))}
          required
        />

        {/* Budget Input */}
        <Input
          id="budget"
          label="月次予算"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="例: 30000"
          value={formData.budget}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d]/g, '');
            setFormData(prev => ({ ...prev, budget: value }));
            if (errors.budget) {
              setErrors(prev => ({ ...prev, budget: '' }));
            }
          }}
          error={errors.budget}
          helper="設定しない場合は空欄のままにしてください"
        />

        {/* Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">プレビュー</div>
          <div className="flex items-center gap-3">
            <span 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
              style={{ backgroundColor: formData.color }}
            >
              {formData.icon}
            </span>
            <div>
              <div className="font-medium text-gray-900">
                {formData.name || 'カテゴリ名'}
              </div>
              <div className="text-sm text-gray-600">
                {typeOptions.find(opt => opt.value === formData.type)?.label}
                {formData.budget && ` • 予算: ¥${parseInt(formData.budget).toLocaleString()}`}
              </div>
            </div>
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
            {isSubmitting ? '保存中...' : category ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}