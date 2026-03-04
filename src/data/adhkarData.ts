// Cloudinary base URL for your audio files
const audioBaseUrl = 'https://res.cloudinary.com/deyz7zctk/video/upload/';

export interface AdhkarItem {
  id: number;
  text: string;
  count: number;
  audio: string;  // URL of the audio file
  filename: string;  // Filename of the audio
  from: string;  // Source of the adhkar
}

export interface AdhkarCategory {
  id: number;
  category: string;
  array: AdhkarItem[];
}

// Import the data from the JSON file
import adhkarJSON from './adhkar.json';

// Process the data to ensure correct audio paths (streaming URL)
const processedAdhkarData: AdhkarCategory[] = adhkarJSON.map(category => ({
  ...category,
  array: category.array.map(item => ({
    ...item,
    // Update the audio path to use the Cloudinary URL
    audio: `${audioBaseUrl}${item.filename}.mp3`  // Cloudinary audio URL
  }))
}));

// Export the typed and processed data
export const adhkarData: AdhkarCategory[] = processedAdhkarData;
