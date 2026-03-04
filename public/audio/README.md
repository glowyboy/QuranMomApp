
# Audio Files for Adhkar

This directory contains audio files for all the Islamic supplications (adhkar) used in the application.

## File Naming Convention

Audio files should be named according to the `filename` property specified in the `adhkar.json` file, with the `.mp3` extension.

For example:
- 1.mp3 (for Adhkar of waking up)
- 75.mp3 (for morning and evening Adhkar)
- 99.mp3 (for bedtime Adhkar)

## Important

Make sure all audio files are placed directly in this directory (`public/audio/`). The application will look for files at paths like `/audio/75.mp3`, which corresponds to `public/audio/75.mp3`.

## Troubleshooting

If you encounter audio playback issues:
- Ensure the audio files exist in this directory (public/audio)
- Verify the file name matches exactly what's referenced in the data file (e.g., "75.mp3")
- Check that the audio format is MP3 and is properly encoded
- Make sure the audio file is accessible and not corrupted
