'use client';

import { useState } from 'react';
import { Edit2, Trash2, Image, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { useTransactions, useCategories, useDatabase } from '@/hooks/useDatabase';
import { Transaction, FilterOptions, SortOptions } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionForm } from './TransactionForm';

interface TransactionListProps {
  filters?: FilterOptions;
  sort?: SortOptions;
  onEditTransaction?: (transaction: Transaction) => void;
}

export function TransactionList({ filters, sort, onEditTransaction }: TransactionListProps) {
  const transactions = useTransactions(filters, sort);
  const categories = useCategories();
  const { deleteTransaction } = useDatabase();
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const categoryMap = new Map(categories?.map(cat => [cat.id, cat]) || []);

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
    onEditTransaction?.(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransaction(selectedTransaction.id);
      showToast({
        type: 'success',
        title: '削除しました',
        message: 'ゴミ箱に移動しました。30日間は復元可能です。'
      });
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Delete failed:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '削除に失敗しました。'
      });
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  if (!transactions) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">取引データがありません</div>
        <div className="text-gray-400 text-sm">
          {filters?.type === 'expense' ? '支出' : filters?.type === 'income' ? '収入' : '取引'}を追加してください
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const category = categoryMap.get(transaction.categoryId);
          const isExpense = transaction.type === 'expense';
          
          return (
            <div
              key={transaction.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{category?.icon || '💰'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {category?.name || '不明なカテゴリ'}
                        </span>
                        {transaction.receiptImage && (
                          <button
                            onClick={() => handleImageClick(transaction.receiptImage!)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="レシート画像を表示"
                          >
                            <Image className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(transaction.date, 'medium')}
                      </div>
                    </div>
                  </div>
                  
                  {transaction.memo && (
                    <p className="text-sm text-gray-700 mb-2 pl-11">
                      {transaction.memo}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${
                        isExpense ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(transaction)}
                      aria-label="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transaction)}
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {selectedTransaction && (
        <TransactionForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          type={selectedTransaction.type}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTransaction(null);
        }}
        title="削除の確認"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            この取引を削除しますか？
          </p>
          {selectedTransaction && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium">
                {categoryMap.get(selectedTransaction.categoryId)?.name || '不明なカテゴリ'}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(selectedTransaction.amount)} - {formatDate(selectedTransaction.date)}
              </div>
              {selectedTransaction.memo && (
                <div className="text-sm text-gray-600 mt-1">
                  {selectedTransaction.memo}
                </div>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500">
            削除された取引は30日間ゴミ箱に保管され、後で復元することができます。
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTransaction(null);
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

      {/* Image Preview Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage('');
        }}
        title="レシート画像"
        size="lg"
      >
        <div className="text-center">
          <img
            src={selectedImage}
            alt="レシート"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </Modal>
    </>
  );
}