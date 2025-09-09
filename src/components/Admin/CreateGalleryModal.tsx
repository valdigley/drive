import React, { useState } from 'react';
import { Calendar, Lock, Upload } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { VSModal, VSInput, VSButton } from '../UI/valdigley-design-system';
import { Gallery } from '../../types';
import { galleryService } from '../../services/galleryService';
import { generateSecureId, validatePassword } from '../../utils/fileUtils';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGalleryModal({ isOpen, onClose }: CreateGalleryModalProps) {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    description: '',
    password: '',
    expirationDays: '30',
    allowDownload: true,
    allowComments: false,
    watermark: true,
    downloadQuality: 'print' as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da galeria é obrigatório';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Nome do cliente é obrigatório';
    }

    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    const expirationDays = parseInt(formData.expirationDays);
    if (isNaN(expirationDays) || expirationDays < 1 || expirationDays > 365) {
      newErrors.expirationDays = 'Período deve ser entre 1 e 365 dias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(formData.expirationDays));

    const newGallery: Gallery = {
      id: generateSecureId(),
      name: formData.name.trim(),
      clientName: formData.clientName.trim(),
      description: formData.description.trim() || undefined,
      createdDate: new Date(),
      expirationDate,
      password: formData.password.trim() || undefined,
      photos: [],
      accessCount: 0,
      downloadCount: 0,
      isActive: true,
      settings: {
        allowDownload: formData.allowDownload,
        allowComments: formData.allowComments,
        watermark: formData.watermark,
        downloadQuality: formData.downloadQuality,
      },
    };

    await galleryService.saveGallery(newGallery);
    dispatch({ type: 'ADD_GALLERY', payload: newGallery });
    
    // Reset form
    setFormData({
      name: '',
      clientName: '',
      description: '',
      password: '',
      expirationDays: '30',
      allowDownload: true,
      allowComments: false,
      watermark: true,
      downloadQuality: 'print',
    });
    
    onClose();
  };

  return (
    <VSModal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Galeria"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="vs-space-y-6">
        <div className="vs-grid vs-grid-2 vs-gap-4">
          <VSInput
            label="Nome da Galeria"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ex: Casamento Maria & João"
            error={errors.name}
            icon={<Upload />}
          />
          
          <VSInput
            label="Nome do Cliente"
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
            placeholder="Ex: Maria Silva"
            error={errors.clientName}
          />
        </div>

        <div>
          <label className="vs-form-label">
            Descrição (opcional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="vs-input vs-w-full"
            placeholder="Descrição do evento ou sessão fotográfica..."
          />
        </div>

        <div className="vs-grid vs-grid-2 vs-gap-4">
          <VSInput
            label="Senha de Acesso (opcional)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Mínimo 6 caracteres"
            error={errors.password}
            icon={<Lock />}
          />
          
          <VSInput
            label="Expiração (dias)"
            name="expirationDays"
            type="number"
            value={formData.expirationDays}
            onChange={handleInputChange}
            min="1"
            max="365"
            error={errors.expirationDays}
            icon={<Calendar />}
          />
        </div>

        {/* Settings */}
        <div className="vs-bg-secondary vs-rounded-lg vs-p-4">
          <h3 className="vs-text-sm vs-font-medium vs-text-primary vs-mb-3">Configurações da Galeria</h3>
          
          <div className="vs-space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowDownload"
                checked={formData.allowDownload}
                onChange={handleInputChange}
                className="vs-rounded vs-border-primary vs-text-blue-600 focus:vs-ring-blue-500"
              />
              <span className="vs-ml-2 vs-text-sm vs-text-primary">Permitir downloads</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowComments"
                checked={formData.allowComments}
                onChange={handleInputChange}
                className="vs-rounded vs-border-primary vs-text-blue-600 focus:vs-ring-blue-500"
              />
              <span className="vs-ml-2 vs-text-sm vs-text-primary">Permitir comentários</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="watermark"
                checked={formData.watermark}
                onChange={handleInputChange}
                className="vs-rounded vs-border-primary vs-text-blue-600 focus:vs-ring-blue-500"
              />
              <span className="vs-ml-2 vs-text-sm vs-text-primary">Adicionar marca d'água</span>
            </label>
          </div>
          
          <div className="vs-mt-4">
            <label className="vs-form-label">
              Qualidade de Download
            </label>
            <select
              name="downloadQuality"
              value={formData.downloadQuality}
              onChange={handleInputChange}
              className="vs-input vs-w-full"
            >
              <option value="web">Web (otimizada)</option>
              <option value="print">Print (alta qualidade)</option>
              <option value="original">Original (sem compressão)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="vs-flex vs-justify-end vs-gap-3 vs-pt-4">
          <VSButton type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </VSButton>
          <VSButton type="submit">
            Criar Galeria
          </VSButton>
        </div>
      </form>
    </VSModal>
  );
}