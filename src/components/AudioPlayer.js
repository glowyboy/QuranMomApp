import React, { useState } from 'react';
import { Howl } from 'howler';

const AudioPlayer = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Function to play audio
  const playAudio = () => {
    const sound = new Howl({
      src: [audioUrl],
      autoplay: true,
      loop: true,  // Set to true if you want it to loop
      volume: 1.0,
    });

    sound.play();
    setIsPlaying(true);
  };

  // Function to stop audio
  const stopAudio = () => {
    Howler.stop();
    setIsPlaying(false);
  };

  return (
    <div>
      <button onClick={isPlaying ? stopAudio : playAudio}>
        {isPlaying ? 'Stop' : 'Play'} Audio
      </button>
    </div>
  );
};

export default AudioPlayer;
