import React from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

interface CategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  title?: string;
}

const categories = [
  { id: 'making_of', label: 'Making Of', icon: '🎬', description: 'Bastidores e preparação' },
  { id: 'cerimonia', label: 'Cerimônia', icon: '💍', description: 'Momentos da cerimônia' },
  { id: 'festa', label: 'Festa', icon: '🎉', description: 'Celebração e diversão' },
  { id: 'outros', label: 'Outros', icon: '📸', description: 'Outras fotos e vídeos' },
];

export function CategorySelector({ isOpen, onClose, onSelect, title = 'Selecione uma categoria' }: CategorySelectorProps) {
  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="text-4xl mb-2">{category.icon}</div>
            <div className="font-semibold text-lg mb-1 group-hover:text-blue-600">
              {category.label}
            </div>
            <div className="text-sm text-gray-500">
              {category.description}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
