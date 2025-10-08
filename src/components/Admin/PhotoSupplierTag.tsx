import React, { useState, useEffect } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types';

interface PhotoSupplierTagProps {
  photoId: string;
  galleryId: string;
  onTagged?: () => void;
}

export function PhotoSupplierTag({ photoId, galleryId, onTagged }: PhotoSupplierTagProps) {
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [taggedSuppliers, setTaggedSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTaggedSuppliers();
  }, [photoId]);

  useEffect(() => {
    if (showModal) {
      loadData();
    }
  }, [showModal, photoId]);

  const loadTaggedSuppliers = async () => {
    const photoSuppliers = await supplierService.getPhotoSuppliers(photoId);
    setTaggedSuppliers(photoSuppliers);
  };

  const loadData = async () => {
    setLoading(true);
    const [allSuppliers, photoSuppliers] = await Promise.all([
      supplierService.getAllSuppliers(),
      supplierService.getPhotoSuppliers(photoId),
    ]);
    setSuppliers(allSuppliers);
    setTaggedSuppliers(photoSuppliers);
    setLoading(false);
  };

  const handleToggleTag = async (supplier: Supplier) => {
    const isTagged = taggedSuppliers.some(s => s.id === supplier.id);

    try {
      if (isTagged) {
        await supplierService.untagPhotoFromSupplier(photoId, supplier.id);
        setTaggedSuppliers(taggedSuppliers.filter(s => s.id !== supplier.id));
      } else {
        const result = await supplierService.tagPhotoWithSupplier(photoId, supplier.id, galleryId);
        if (result) {
          setTaggedSuppliers([...taggedSuppliers, supplier]);
        }
      }

      onTagged?.();
    } catch (error) {
      console.error('Error toggling tag:', error);
    }
  };

  const categoryColors: Record<string, string> = {
    fotografia: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    buffet: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    decoracao: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    musica: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    locacao: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    outros: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="flex items-center gap-1"
        title="Marcar fornecedores"
      >
        <Tag size={16} />
        {taggedSuppliers.length > 0 && (
          <span className="text-xs">{taggedSuppliers.length}</span>
        )}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Marcar Fornecedores"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum fornecedor cadastrado. Cadastre fornecedores primeiro.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suppliers.map((supplier) => {
              const isTagged = taggedSuppliers.some(s => s.id === supplier.id);
              return (
                <button
                  key={supplier.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTag(supplier);
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    isTagged
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[supplier.category]}`}>
                          {supplierService.getCategoryLabel(supplier.category)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {supplier.email}
                      </span>
                    </div>
                    {isTagged && (
                      <Check size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <Button onClick={(e) => {
            e.stopPropagation();
            setShowModal(false);
          }}>
            Fechar
          </Button>
        </div>
      </Modal>
    </>
  );
}
