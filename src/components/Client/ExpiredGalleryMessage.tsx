import { Clock, Heart, Download, Image } from 'lucide-react';
import { Button } from '../UI/Button';

interface ExpiredGalleryMessageProps {
  galleryName: string;
  expirationDate: Date;
  photoCount: number;
}

export function ExpiredGalleryMessage({
  galleryName,
  expirationDate,
  photoCount
}: ExpiredGalleryMessageProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Gostaria de renovar o acesso à galeria "${galleryName}" que expirou em ${formatDate(expirationDate)}.`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Clock size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Galeria Expirada</h1>
            <p className="text-white/90 text-lg">
              O prazo de acesso desta galeria terminou
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {galleryName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Esta galeria expirou em <span className="font-semibold text-gray-900 dark:text-white">{formatDate(expirationDate)}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {photoCount} {photoCount === 1 ? 'foto estava' : 'fotos estavam'} disponíveis
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 mb-8 border border-blue-100 dark:border-gray-600">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Quer manter suas memórias vivas?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Suas fotos são preciosas! Renove o acesso por mais 1 ano e continue aproveitando
                    suas memórias especiais a qualquer momento.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Download size={16} className="text-blue-500" />
                      <span>Download ilimitado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Heart size={16} className="text-blue-500" />
                      <span>Favoritos salvos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Image size={16} className="text-blue-500" />
                      <span>Qualidade original</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Renovação por</span>
                      <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">R$ 100</span>
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Acesso garantido por 12 meses
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleContactWhatsApp}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg py-4 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-2">
                  Renovar Acesso via WhatsApp
                </span>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Após a renovação, você receberá acesso imediato à galeria
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
