import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StoryEditorPage.css';

const StoryEditorPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const [story, setStory] = useState(null);
  const [content, setContent] = useState('');
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
        navigate('/login'); // Redirect to login if no token
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
          throw new Error(data.error || `Failed to fetch story. Status: ${response.status}`);
        }

        setStory(data);
        setContent(data.content || ''); // Initialize textarea content
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [storyId, navigate]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Placeholder for save function
  const handleSave = () => {
    console.log('Saving content:', content);
    // Here you would typically make a PUT request to update the story
    alert('Save functionality not yet implemented.');
  };


  if (isLoading) {
    return <div className="story-editor-container"><p>Loading story...</p></div>;
  }

  if (error) {
    return <div className="story-editor-container error-message"><p>Error: {error}</p></div>;
  }

  if (!story) {
    return <div className="story-editor-container"><p>Story not found.</p></div>;
  }

  return (
    <div className="story-editor-container">
      <h2>{story.title || 'Story Editor'}</h2>
      <p>Editing Story ID: {storyId} (Genre: {story.genre || 'N/A'})</p>
      
      <div className="editor-area">
        <textarea
          placeholder="Start writing your amazing story here..."
          className="story-textarea"
          value={content}
          onChange={handleContentChange}
          rows="20"
        ></textarea>
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} className="action-button">Save Draft</button>
        <button className="action-button" onClick={() => alert('Publish functionality not yet implemented.')}>Publish</button>
      </div>
    </div>
  );
};

export default StoryEditorPage;
