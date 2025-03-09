/**
 * Video Layout Manager for handling dynamic arrangement of video elements
 */

// Define custom HTML video element with additional dataset properties
interface CustomHTMLVideoElement extends HTMLVideoElement {
  dataset: {
    isScreenShare?: string;
    socketId?: string;
  }
}

/**
 * Adjusts the layout of videos based on count and screen sharing status
 * @param container - The container element holding all video elements
 * @param videoCount - Number of videos currently in the call
 * @param isScreenSharing - Boolean indicating if someone is screen sharing
 */
export const updateVideoLayout = (
  container: HTMLDivElement | null,
  videoCount: number,
  isScreenSharing: boolean
): void => {
  if (!container) return;
  
  const videos = container.querySelectorAll('video') as NodeListOf<CustomHTMLVideoElement>;
  
  // Reset container styles
  container.style.gridTemplateColumns = '';
  container.style.gridTemplateRows = '';
  container.style.gridGap = '10px'; // Increased gap for better separation
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.padding = '10px'; // Add padding to prevent videos from touching container edge
  
  if (isScreenSharing) {
    // If screen sharing, find the screen sharing video and make it full size
    const screenShareVideo = Array.from(videos).find(
      video => video.dataset.isScreenShare === 'true'
    );
    
    if (screenShareVideo) {
      // Make screen share video fill the container
      videos.forEach(video => {
        if (video === screenShareVideo) {
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'contain';
          video.style.zIndex = '10';
        } else {
          // Hide other videos during screen sharing
          video.style.display = 'none';
        }
      });
      
      return;
    }
  }
  
  // Show all videos when not screen sharing
  videos.forEach(video => {
    video.style.display = 'block';
    video.style.objectFit = 'cover';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.zIndex = '1';
    video.style.maxHeight = '100%';
    video.style.maxWidth = '100%';
    // Remove any previous styling
    video.style.position = '';
    video.style.top = '';
    video.style.left = '';
    video.style.transform = '';
    video.style.margin = '0'; // Reset margins
    video.style.boxSizing = 'border-box'; // Ensure padding is included in dimensions
  });
  
  // Calculate optimal grid layout
  if (videoCount === 0) {
    return;
  } else if (videoCount === 1) {
    // Single video centered
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
  } else {
    // Grid layout for multiple videos
    container.style.display = 'grid';
    
    // Calculate grid dimensions based on aspect ratio of container
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width - 20; // Account for padding
    const containerHeight = containerRect.height - 20; // Account for padding
    const containerAspect = containerWidth / containerHeight;
    
    // Determine optimal grid layout based on number of videos
    let cols: number, rows: number;
    
    if (videoCount === 2) {
      // 2 videos side by side
      cols = 2;
      rows = 1;
    } else if (videoCount === 3 || videoCount === 4) {
      // 3-4 videos: 2x2 grid
      cols = 2;
      rows = 2;
    } else if (videoCount <= 6) {
      // 5-6 videos: 3x2 grid
      cols = 3;
      rows = 2;
    } else if (videoCount <= 9) {
      // 7-9 videos: 3x3 grid
      cols = 3;
      rows = 3;
    } else if (videoCount <= 12) {
      // 10-12 videos: 4x3 grid
      cols = 4;
      rows = 3;
    } else if (videoCount <= 16) {
      // 13-16 videos: 4x4 grid
      cols = 4;
      rows = 4;
    } else {
      // More than 16 videos: calculate based on aspect ratio
      if (containerAspect > 1) {
        // Wider than tall
        cols = Math.ceil(Math.sqrt(videoCount * containerAspect));
        rows = Math.ceil(videoCount / cols);
      } else {
        // Taller than wide
        rows = Math.ceil(Math.sqrt(videoCount / containerAspect));
        cols = Math.ceil(videoCount / rows);
      }
    }
    
    // Set grid template with fixed aspect ratio cells for consistent video display
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    container.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    
    // Calculate unused variables for potential future use
    const cellWidth = containerWidth / cols;
    const cellHeight = containerHeight / rows;
    
    // Apply styles to ensure videos display properly within grid cells
    Array.from(videos).forEach((video) => {
      // Override default video styles for grid layout
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.aspectRatio = '16/9'; // Maintain video aspect ratio
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      video.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      video.style.boxSizing = 'border-box';
    });
  }
};

/**
 * Marks a specific video as a screen share
 * @param videoElement - The video element to mark as screen share
 * @param isScreenShare - Boolean indicating if this is a screen share video
 */
export const markAsScreenShare = (
  videoElement: HTMLVideoElement | null,
  isScreenShare: boolean = true
): void => {
  if (videoElement) {
    (videoElement as CustomHTMLVideoElement).dataset.isScreenShare = isScreenShare.toString();
  }
};

/**
 * Updates the size and position of the local video based on remote video count
 * @param localVideoContainer - The container element for the local video
 * @param remoteVideoCount - Number of remote videos in the call
 * @param isScreenSharing - Boolean indicating if someone is screen sharing
 */
export const updateLocalVideoPosition = (
  localVideoContainer: HTMLDivElement | null,
  remoteVideoCount: number,
  isScreenSharing: boolean
): void => {
  if (!localVideoContainer) return;
  
  if (remoteVideoCount === 0) {
    // If no remote videos, make local video large and centered
    localVideoContainer.style.width = '70%';
    localVideoContainer.style.height = '70vh';
    localVideoContainer.style.position = 'static';
    localVideoContainer.style.margin = '0 auto';
  } else if (isScreenSharing) {
    // During screen sharing, make local video a small picture-in-picture
    localVideoContainer.style.width = '15vw';
    localVideoContainer.style.height = 'auto';
    localVideoContainer.style.position = 'absolute';
    localVideoContainer.style.right = '3rem';
    localVideoContainer.style.bottom = '3rem';
    localVideoContainer.style.zIndex = '100';
  } else {
    // Default position for local video
    localVideoContainer.style.width = '15vw';
    localVideoContainer.style.height = 'auto';
    localVideoContainer.style.position = 'absolute';
    localVideoContainer.style.right = '3rem';
    localVideoContainer.style.bottom = '3rem';
    localVideoContainer.style.zIndex = '100';
  }
};
