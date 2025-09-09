import React from 'react';
import { X, Printer, Trash2, MessageCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { formatFileSize } from '../../utils/fileUtils';

interface PrintCartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrintCartPanel({ isOpen, onClose }: PrintCartPanelProps) {
  const { state, dispatch } = useAppContext();
  const { currentGallery, clientSession } = state;

  if (!isOpen || !currentGallery || !clientSession) return null;

  const printCartPhotos = currentGallery.photos.filter(photo =>
    clientSession.printCart?.includes(photo.id) || false
  );

  const handleRemoveFromCart = (photoId: string) => {
    dispatch({ type: 'TOGGLE_PRINT_CART', payload: { photoId } });
  };

  const handleClearCart = () => {
    printCartPhotos.forEach(photo => {
      dispatch({ type: 'TOGGLE_PRINT_CART', payload: { photoId: photo.id } });
    });
  };

  const generateWhatsAppMessage = () => {
    if (printCartPhotos.length === 0) return;

    const photoNames = printCartPhotos
      .map(photo => {
        // Remove extensão do arquivo para ficar apenas o nome
        return photo.filename.replace(/\.[^/.]+$/, '');
      })
      .join(' OR ');

    const message = `Olá! Gostaria de solicitar a impressão das seguintes fotos da galeria "${currentGallery.name}":

${photoNames}

Obrigado!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const totalSize = printCartPhotos.reduce((sum, photo) => sum + photo.size, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Printer size={20} />
              Carrinho de Impressão ({printCartPhotos.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Photos List */}
          <div className="flex-1 overflow-y-auto p-6">
            {printCartPhotos.length === 0 ? (
              <div className="text-center py-8">
                <Printer size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Carrinho vazio</p>
                <p className="text-sm text-gray-500">
                  Adicione fotos ao carrinho para solicitar impressão
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {printCartPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={photo.thumbnail}
                      alt={photo.filename}
                      className="w-12 h-12 object-cover rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {photo.filename.replace(/\.[^/.]+$/, '')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(photo.size)}
                        {photo.metadata && (
                          <span> • {photo.metadata.width} × {photo.metadata.height}</span>
                        )}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveFromCart(photo.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Remover do carrinho"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {printCartPhotos.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>{printCartPhotos.length}</strong> fotos selecionadas</p>
                <p>Total: {formatFileSize(totalSize)}</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={generateWhatsAppMessage}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle size={16} />
                  Solicitar via WhatsApp
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleClearCart}
                  className="w-full"
                >
                  Limpar Carrinho
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}