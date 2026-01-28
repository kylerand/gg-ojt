import { useState, useEffect } from 'react';

function BookmarkButton({ moduleId, stepId, stepTitle, traineeId }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const storageKey = `bookmarks-${traineeId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const bookmarks = JSON.parse(stored);
      setIsBookmarked(bookmarks.some(b => b.stepId === stepId && b.moduleId === moduleId));
    }
  }, [storageKey, moduleId, stepId]);

  const toggleBookmark = () => {
    const stored = localStorage.getItem(storageKey);
    let bookmarks = stored ? JSON.parse(stored) : [];

    if (isBookmarked) {
      bookmarks = bookmarks.filter(b => !(b.stepId === stepId && b.moduleId === moduleId));
    } else {
      bookmarks.push({
        moduleId,
        stepId,
        stepTitle,
        timestamp: new Date().toISOString()
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(bookmarks));
    setIsBookmarked(!isBookmarked);
  };

  return (
    <button 
      className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
      onClick={toggleBookmark}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this step'}
    >
      {isBookmarked ? '🔖' : '🏷️'}
      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}

export default BookmarkButton;
