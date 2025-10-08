import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Copy, Mail, Phone, Calendar, Link as LinkIcon } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { clientService, Client } from '../../services/clientService';

interface ClientWithGalleryCount extends Client {
  galleryCount?: number;
}

export function ClientManager() {
  const [clients, setClients] = useState<ClientWithGalleryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await clientService.getAllClients();

      const clientsWithCounts = await Promise.all(
        clientsData.map(async (client) => {
          const galleries = await clientService.getClientGalleries(client.id);
          return {
            ...client,
            galleryCount: galleries.length,
          };
        })
      );

      setClients(clientsWithCounts);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, formData);
      } else {
        await clientService.createClient(formData);
      }
      await loadClients();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return;
    }

    try {
      await clientService.deleteClient(client.id);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Código copiado!');
  };

  const copyAccessLink = (code: string) => {
    const link = `${window.location.origin}?code=${code}`;
    navigator.clipboard.writeText(link);
    alert('Link de acesso copiado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Clientes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Cadastre clientes e gere códigos de acesso
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={20} />
          Novo Cliente
        </Button>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Client Info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {client.name}
                  </h3>
                  {client.galleryCount !== undefined && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {client.galleryCount} galeria{client.galleryCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenModal(client)}
                  className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            {(client.email || client.phone) && (
              <div className="space-y-1 mb-3 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Access Code */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código de Acesso</p>
                  <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                    {client.accessCode}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyAccessCode(client.accessCode)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Copiar código"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => copyAccessLink(client.accessCode)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Copiar link de acesso"
                  >
                    <LinkIcon size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {client.notes}
              </p>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Calendar size={12} />
              <span>Criado em {client.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum cliente cadastrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Comece criando seu primeiro cliente
            </p>
            <Button onClick={() => handleOpenModal()}>
              <Plus size={20} className="mr-2" />
              Criar Cliente
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo do cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-mail
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas sobre o cliente..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingClient ? 'Salvar' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
