
import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { AdhkarItem as AdhkarItemType } from '@/data/adhkarData';

interface AdhkarItemProps {
  item: AdhkarItemType;
}

const AdhkarItem: React.FC<AdhkarItemProps> = ({ item }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audio] = useState<HTMLAudioElement | null>(
    typeof window !== 'undefined' ? new Audio(item.audio) : null
  );

  const handlePlay = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div className="bg-islamic-beige/50 p-4 rounded-lg shadow hover:bg-islamic-beige/60 transition-colors">
      <div className="flex justify-between mb-2">
        <div className="flex items-center">
          <button
            onClick={handlePlay}
            className="p-2 rounded-full bg-islamic-green/10 text-islamic-green hover:bg-islamic-green/20 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <p className="text-islamic-dark font-medium text-right leading-relaxed mb-2">
        {item.text}
      </p>
      
      <div className="flex justify-end items-center mt-2 text-sm text-islamic-dark/60">
        <span>{item.from}</span>
      </div>
    </div>
  );
};

export default AdhkarItem;
