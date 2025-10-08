import React, { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { supplierService } from '../../services/supplierService';
import { supabase } from '../../lib/supabase';

interface Supplier {
  id: string;
  name: string;
  category: string;
}

interface SupplierTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoId: string;
  galleryId: string;
  currentSupplierId?: string;
  onTagged: () => void;
}

export function SupplierTagModal({
  isOpen,
  onClose,
  photoId,
  galleryId,
  currentSupplierId,
  onTagged
}: SupplierTagModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>(currentSupplierId);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      setSelectedSupplier(currentSupplierId);
    }
  }, [isOpen, currentSupplierId]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const allSuppliers = await supplierService.getAllSuppliers();
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTag = async (supplierId: string) => {
    setTagging(true);
    try {
      if (selectedSupplier === supplierId) {
        await supabase
          .from('photo_suppliers')
          .delete()
          .eq('photo_id', photoId)
          .eq('supplier_id', supplierId);

        setSelectedSupplier(undefined);
      } else {
        if (selectedSupplier) {
          await supabase
            .from('photo_suppliers')
            .delete()
            .eq('photo_id', photoId)
            .eq('supplier_id', selectedSupplier);
        }

        await supabase
          .from('photo_suppliers')
          .insert({
            photo_id: photoId,
            supplier_id: supplierId,
            gallery_id: galleryId
          });

        setSelectedSupplier(supplierId);
      }

      await onTagged();
      onClose();
    } catch (error) {
      console.error('Error tagging supplier:', error);
    } finally {
      setTagging(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marcar Fornecedor">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum fornecedor cadastrado
            </p>
          </div>
        ) : (
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {suppliers.map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => handleTag(supplier.id)}
                disabled={tagging}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  selectedSupplier === supplier.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                } ${tagging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedSupplier === supplier.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <Tag size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {supplier.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {supplier.category}
                    </p>
                  </div>
                </div>
                {selectedSupplier === supplier.id && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={tagging}
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
