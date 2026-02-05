import ReactPlayer from 'react-player';

// Local fallback videos until production videos are uploaded to Cloudinary/S3
const LOCAL_FALLBACK_VIDEOS = [
  '/videos/video-01.mp4',
  '/videos/video-02.mp4',
  '/videos/video-03.mp4',
  '/videos/video-04.mp4',
  '/videos/video-05.mp4',
  '/videos/video-06.mp4',
];

// Check if a URL is a placeholder that won't work
function isPlaceholderUrl(url) {
  if (!url) return true;
  return url.includes('via.placeholder.com') || 
         url.includes('placeholder');
}

// Check if URL is a direct video file (use native video element for these)
function isDirectVideoFile(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
}

// Get a consistent fallback video based on the original URL
function getFallbackVideo(originalUrl) {
  // Use a hash of the URL to consistently pick the same fallback video
  let hash = 0;
  const str = originalUrl || 'default';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % LOCAL_FALLBACK_VIDEOS.length;
  return LOCAL_FALLBACK_VIDEOS[index];
}

function VideoPlayer({ url, onEnded, onProgress }) {
  // Use fallback if URL is a placeholder
  const videoUrl = isPlaceholderUrl(url) ? getFallbackVideo(url) : url;

  // Use native video element for local files AND direct video URLs (more reliable than ReactPlayer)
  const useNativeVideo = videoUrl.startsWith('/videos/') || isDirectVideoFile(videoUrl);
  
  if (useNativeVideo) {
    return (
      <div className="video-container">
        <video
          src={videoUrl}
          controls
          width="100%"
          height="100%"
          onEnded={onEnded}
          onTimeUpdate={(e) => {
            if (onProgress && e.target.duration) {
              const progress = {
                played: e.target.currentTime / e.target.duration,
                playedSeconds: e.target.currentTime,
              };
              onProgress(progress);
            }
          }}
          controlsList="nodownload"
          style={{ maxHeight: '500px', backgroundColor: '#000' }}
          playsInline
        />
      </div>
    );
  }

  // Use ReactPlayer for YouTube, Vimeo, etc.
  return (
    <div className="video-container">
      <ReactPlayer
        url={videoUrl}
        controls
        width="100%"
        height="100%"
        onEnded={onEnded}
        onProgress={onProgress}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />
    </div>
  );
}

export default VideoPlayer;
