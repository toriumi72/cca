'use client';

import { useState } from 'react';
import { Edit2, Trash2, GripVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { showToast } from '@/components/ui/Toast';
import { useCategories, useDatabase } from '@/hooks/useDatabase';
import { Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { CategoryForm } from './CategoryForm';

interface CategoryListProps {
  onEditCategory?: (category: Category) => void;
}

export function CategoryList({ onEditCategory }: CategoryListProps) {
  const categories = useCategories();
  const { deleteCategory, updateCategory } = useDatabase();
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mergeToId, setMergeToId] = useState('');
  
  // Drag and drop state
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
    onEditCategory?.(category);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
    setMergeToId('');
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory(selectedCategory.id, mergeToId || undefined);
      showToast({
        type: 'success',
        title: '削除しました',
        message: mergeToId 
          ? 'カテゴリを削除し、関連する取引を他のカテゴリに移しました'
          : 'カテゴリを削除しました'
      });
      setShowDeleteModal(false);
      setSelectedCategory(null);
      setMergeToId('');
    } catch (error) {
      console.error('Delete failed:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '削除に失敗しました。'
      });
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedCategory || !categories) return;

    const sourceIndex = categories.findIndex(cat => cat.id === draggedCategory.id);
    if (sourceIndex === targetIndex) return;

    // Create new order
    const newCategories = [...categories];
    newCategories.splice(sourceIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Update order for all affected categories
    try {
      for (let i = 0; i < newCategories.length; i++) {
        if (newCategories[i].order !== i + 1) {
          await updateCategory(newCategories[i].id, { order: i + 1 });
        }
      }
      
      showToast({
        type: 'success',
        title: '並び順を変更しました',
        message: 'カテゴリの並び順を更新しました'
      });
    } catch (error) {
      console.error('Reorder failed:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '並び順の変更に失敗しました。'
      });
    }

    setDraggedCategory(null);
    setDragOverIndex(null);
  };

  if (!categories) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">カテゴリがありません</div>
        <div className="text-gray-400 text-sm">
          初回起動時にサンプルデータを生成するか、手動でカテゴリを作成してください
        </div>
      </div>
    );
  }

  const otherCategories = categories.filter(cat => cat.id !== selectedCategory?.id);
  const mergeOptions = [
    { value: '', label: '「未分類」に移す' },
    ...otherCategories.map(cat => ({
      value: cat.id,
      label: `${cat.icon} ${cat.name}に統合`
    }))
  ];

  return (
    <>
      <div className="space-y-2">
        {categories.map((category, index) => (
          <div
            key={category.id}
            draggable
            onDragStart={(e) => handleDragStart(e, category)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              bg-white rounded-lg border p-4 transition-all cursor-move
              hover:shadow-md
              ${dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              ${draggedCategory?.id === category.id ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
              
              {/* Category Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </div>
              
              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {category.name}
                  </h3>
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${category.type === 'expense' 
                      ? 'bg-red-100 text-red-800' 
                      : category.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                    }
                  `}>
                    {category.type === 'expense' 
                      ? '支出' 
                      : category.type === 'income'
                      ? '収入'
                      : '両方'
                    }
                  </span>
                </div>
                
                {category.budget && (
                  <div className="text-sm text-gray-600">
                    月予算: {formatCurrency(category.budget)}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  並び順: {category.order}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category)}
                  aria-label="編集"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedCategory && (
        <CategoryForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
          setMergeToId('');
        }}
        title="削除の確認"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            このカテゴリを削除しますか？
          </p>
          
          {selectedCategory && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                  style={{ backgroundColor: selectedCategory.color }}
                >
                  {selectedCategory.icon}
                </div>
                <div>
                  <div className="font-medium">{selectedCategory.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedCategory.type === 'expense' 
                      ? '支出' 
                      : selectedCategory.type === 'income'
                      ? '収入'
                      : '支出・収入両方'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              このカテゴリを使用している取引がある場合、どこに移動しますか？
            </p>
            
            <Select
              label="取引の移動先"
              options={mergeOptions}
              value={mergeToId}
              onChange={(e) => setMergeToId(e.target.value)}
              placeholder="移動先を選択"
            />
          </div>

          <p className="text-sm text-gray-500">
            削除されたカテゴリは復元できません。慎重に操作してください。
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
                setMergeToId('');
              }}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1"
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}