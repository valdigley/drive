/*
  # Add Video Support to Photos Table

  1. Changes
    - Add `media_type` column to distinguish between photo and video
    - Add `video_url` column for YouTube links
    - Add `duration` column for video length in seconds
    - Update metadata to support video-specific fields
    - Keep backward compatibility with existing photos

  2. Notes
    - media_type: 'photo' (default) or 'video'
    - For MP4 videos: stored in R2 with r2_key
    - For YouTube videos: stored in video_url field
    - Thumbnail generation handled separately
*/

-- Add media_type column with default 'photo'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE photos ADD COLUMN media_type text DEFAULT 'photo' CHECK (media_type IN ('photo', 'video'));
  END IF;
END $$;

-- Add video_url for YouTube links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE photos ADD COLUMN video_url text;
  END IF;
END $$;

-- Add duration for video length in seconds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'duration'
  ) THEN
    ALTER TABLE photos ADD COLUMN duration integer;
  END IF;
END $$;

-- Add index for media_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_photos_media_type ON photos(media_type);

-- Add comment for clarity
COMMENT ON COLUMN photos.media_type IS 'Type of media: photo or video';
COMMENT ON COLUMN photos.video_url IS 'YouTube video URL (for embedded videos)';
COMMENT ON COLUMN photos.duration IS 'Video duration in seconds';
