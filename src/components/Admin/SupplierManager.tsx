import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Store, Mail, Phone, Tag, Key, Copy } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types';

export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'outros' as Supplier['category'],
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const data = await supplierService.getAllSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone || '',
        category: supplier.category,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'outros',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      category: 'outros',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSupplier) {
      await supplierService.updateSupplier(editingSupplier.id, formData);
    } else {
      await supplierService.createSupplier(formData);
    }

    await loadSuppliers();
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este fornecedor?')) {
      await supplierService.deleteSupplier(id);
      await loadSuppliers();
    }
  };

  const handleCopyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Código de acesso copiado!');
  };

  const handleCopyGalleryLink = (e: React.MouseEvent, accessCode: string) => {
    e.preventDefault();
    e.stopPropagation();
    const galleryUrl = `${window.location.origin}/?code=${accessCode}`;
    navigator.clipboard.writeText(galleryUrl);
    alert('Link da galeria copiado!');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fornecedores</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus fornecedores e parceiros</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} />
          Novo Fornecedor
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Store size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum fornecedor cadastrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Comece adicionando seus fornecedores e parceiros
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Store size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[supplier.category]}`}>
                      {supplierService.getCategoryLabel(supplier.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    {supplier.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        {supplier.email}
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {supplier.phone}
                      </div>
                    )}
                  </div>
                  {supplier.accessCode && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Key size={14} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {supplier.accessCode}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        (Galeria do fornecedor)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {supplier.accessCode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleCopyGalleryLink(e, supplier.accessCode!)}
                    className="flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Copiar Link
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenModal(supplier)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(supplier.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Nome do fornecedor"
            icon={<Store />}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="email@exemplo.com"
            icon={<Mail />}
          />

          <Input
            label="Telefone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            icon={<Phone />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Supplier['category'] })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="fotografia">Fotografia</option>
              <option value="buffet">Buffet</option>
              <option value="decoracao">Decoração</option>
              <option value="musica">Música</option>
              <option value="locacao">Locação</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingSupplier ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
