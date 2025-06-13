import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import 'react-quill/dist/quill.snow.css'; // For consistent display of chapter content
import './StoryEditorPage.css';

const StoryEditorPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found. Please log in.');
        setIsLoading(false);
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/stories/story/${storyId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          // Attempt to make error more specific if possible
          let errorMsg = data.error || `Failed to fetch story. Status: ${response.status}`;
          if (response.status === 403) errorMsg = "Forbidden: You might not have access to this story or your session expired.";
          if (response.status === 404) errorMsg = "Story not found.";
          throw new Error(errorMsg);
        }
        setStory(data);
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId, navigate]);

  if (isLoading) {
    return <div className="story-viewer-container"><p>Loading story...</p></div>;
  }

  if (error) {
    // Display the error message within the styled container for consistency
    return <div className="story-viewer-container"><p className="error-message">Error: {error}</p></div>;
  }

  if (!story) {
    return <div className="story-viewer-container"><p>Story not found.</p></div>;
  }

  // Assuming author object might be populated like: story.author = { _id: "...", username: "..." }
  const authorName = story.author ? (story.author.username || 'Unknown Author') : 'Unknown Author';

  return (
    <div className="story-viewer-container">
      <h1 className="story-title">{story.title || 'Untitled Story'}</h1>
      <p className="story-author">By: {authorName}</p>

      {story.coverPageUrl && (
        <div className="story-cover-image-wrapper">
          <img src={story.coverPageUrl} alt={`${story.title} Cover`} className="story-cover-image" />
        </div>
      )}
      
      {story.description && (
        <div className="story-section story-description">
           <h3>Description</h3>
           <p>{story.description}</p>
        </div>
      )}

      {story.genre && (
        <div className="story-section story-genre">
           <p><strong>Genre:</strong> {story.genre}</p>
        </div>
      )}


      {story.characters && story.characters.length > 0 && (
        <div className="story-section characters-section">
          <h3>Characters</h3>
          <ul className="characters-list">
            {story.characters.map((character, index) => (
              <li key={character._id || index} className="character-item-display">
                <strong>{character.name}</strong>
                {character.category && <span className="category"> ({character.category})</span>}
                {character.details && <p>{character.details}</p>}
                {/* profilePicUrl could be an img tag if it's a direct image link */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {story.chapters && story.chapters.length > 0 && (
        <div className="story-section chapters-section">
          <h3>Chapters</h3>
          {story.chapters.map((chapter, index) => (
            <div key={chapter._id || index} className="chapter-display">
              <h4 className="chapter-title-display">{chapter.chapterTitle || `Chapter ${index + 1}`}</h4>
              <div
                className="chapter-content-display ql-editor" // Apply ql-editor for Quill styles
                dangerouslySetInnerHTML={{ __html: chapter.chapterContent }}
              />
            </div>
          ))}
        </div>
      )}

      {(!story.chapters || story.chapters.length === 0) &&
       (!story.characters || story.characters.length === 0) && (
        <p>This story doesn't have any characters or chapters defined yet.</p>
      )}

      <div className="edit-story-button-wrapper">
        {/* Link to the new CreateStoryPage, assuming it can handle editing existing stories by ID in the future */}
        {/* For now, a simple link or a link to dashboard might be more appropriate if CreateStoryPage is only for new stories */}
        <Link to={`/create-story`} className="edit-story-button" onClick={() => alert("Full editing is done via the 'Create / Edit Story' page. This page is currently a viewer. You can start a new story or manage existing ones from the dashboard.")}>
            Go to Editor / Create New
        </Link>
         {/* Or, if CreateStoryPage is adapted to take an ID for editing:
         <Link to={`/create-story/${storyId}`} className="edit-story-button">Edit Story</Link>
         For now, the alert and link to /create-story (new) is safer.
         Or simply navigate to dashboard:
         <button onClick={() => navigate('/dashboard')} className="edit-story-button">Back to Dashboard</button>
         */}
      </div>
    </div>
  );
};

export default StoryEditorPage;
