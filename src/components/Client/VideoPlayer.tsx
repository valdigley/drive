import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoType: 'mp4' | 'youtube';
  thumbnail?: string;
  title?: string;
}

export function VideoPlayer({ videoUrl, videoType, thumbnail, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  if (videoType === 'youtube') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={getYouTubeEmbedUrl(videoUrl)}
          title={title || 'YouTube Video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            {isPlaying ? (
              <Pause size={32} className="text-gray-900 ml-0.5" />
            ) : (
              <Play size={32} className="text-gray-900 ml-1" />
            )}
          </button>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={toggleMute}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
