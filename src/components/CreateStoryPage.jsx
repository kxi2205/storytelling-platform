import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import './CreateStoryPage.css';

const CreateStoryPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [storyData, setStoryData] = useState({
    _id: null,
    title: 'Untitled Story', // Default title for initialization
    genre: '',
    description: '', // Will be part of a general settings step or combined with step 1 later
    coverPageFile: null,
    coverPageUrlPreview: null,
    characters: [],
    chapters: [],
  });
  const [currentCharacter, setCurrentCharacter] = useState({
    name: '',
    details: '',
    category: 'lead', // Default category
    profilePicUrl: '',
  });
  const [currentChapterData, setCurrentChapterData] = useState({ chapterTitle: '', chapterContent: '' });
  const [editingChapterIndex, setEditingChapterIndex] = useState(null); // null for new, index for editing
  const [previewChapterContent, setPreviewChapterContent] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For async operations like saving
  const navigate = useNavigate();

  // Initialize story on component mount
  useEffect(() => {
    const initializeStory = async () => {
      if (storyData._id) return; // Already initialized

      setError('');
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a story.');
        setIsLoading(false);
        // navigate('/login'); // Optionally redirect
        return;
      }

      try {
        // Backend now creates story with default title or empty and returns it
        const response = await fetch('http://localhost:5000/api/stories/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          // The backend /create route was updated to only require title,
          // and can handle it being optional if we want to send an empty body.
          // For now, send the default title.
          body: JSON.stringify({ title: storyData.title }),
        });
        const newStory = await response.json();
        if (!response.ok) {
          throw new Error(newStory.error || 'Failed to initialize story');
        }
        setStoryData(prev => ({ ...prev, _id: newStory._id, title: newStory.title }));
      } catch (err) {
        console.error('Initialize story error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount if no _id

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setError(''); // Clear error on new input

    if (type === 'file' && name === 'coverPageFile') {
      const file = files && files.length > 0 ? files[0] : null;

      // Revoke previous object URL if it exists to prevent memory leaks
      if (storyData.coverPageUrlPreview && storyData.coverPageUrlPreview.startsWith('blob:')) {
        URL.revokeObjectURL(storyData.coverPageUrlPreview);
      }

      if (file) {
        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png'];
        const maxSize = 2 * 1024 * 1024; // 2MB

        if (!allowedTypes.includes(file.type)) {
          setError('Invalid file type. Only JPG/JPEG and PNG are allowed.');
          e.target.value = null; // Clear the file input
          setStoryData(prev => ({
            ...prev,
            coverPageFile: null,
            coverPageUrlPreview: null,
          }));
          return;
        }

        if (file.size > maxSize) {
          setError('File is too large. Maximum size is 2MB.');
          e.target.value = null; // Clear the file input
          setStoryData(prev => ({
            ...prev,
            coverPageFile: null,
            coverPageUrlPreview: null,
          }));
          return;
        }

        setStoryData(prev => ({
          ...prev,
          coverPageFile: file,
          coverPageUrlPreview: URL.createObjectURL(file),
        }));
      } else {
        // No file selected or selection cleared
        setStoryData(prev => ({
          ...prev,
          coverPageFile: null,
          coverPageUrlPreview: null, // Clears any existing blob preview
        }));
      }
    } else {
      setStoryData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Effect for cleaning up ObjectURL on unmount
  useEffect(() => {
    return () => {
      if (storyData.coverPageUrlPreview && storyData.coverPageUrlPreview.startsWith('blob:')) {
        URL.revokeObjectURL(storyData.coverPageUrlPreview);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // This cleans up when component unmounts. handleChange handles intermediate changes.

  // --- Character Management Handlers ---
  const handleCharacterChange = (e) => {
    const { name, value } = e.target;
    setCurrentCharacter(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on new input for character
  };

  const handleAddCharacter = (e) => {
    e.preventDefault(); // Prevent form submission if it's part of a form element
    if (!currentCharacter.name.trim() || !currentCharacter.category) {
      setError('Character name and category are required.');
      return;
    }
    setError('');
    // Note: Backend will assign actual _id. For client-side list management before first save,
    // we rely on array index or can add a temporary client-generated ID if needed for more complex ops.
    setStoryData(prev => ({
      ...prev,
      characters: [...prev.characters, currentCharacter],
    }));
    setCurrentCharacter({ name: '', details: '', category: 'lead', profilePicUrl: '' }); // Reset form
  };

  const handleRemoveCharacter = (indexToRemove) => {
    setStoryData(prev => ({
      ...prev,
      characters: prev.characters.filter((_, index) => index !== indexToRemove),
    }));
  };

  // --- Chapter Management Handlers ---
  const handleChapterDataChange = (fieldOrContent, value) => {
    setError(''); // Clear error on new input
    if (typeof fieldOrContent === 'string' && fieldOrContent === 'chapterContent') { // From ReactQuill
      setCurrentChapterData(prev => ({ ...prev, chapterContent: value }));
    } else { // From text input for title
      const {name, value: inputValue} = fieldOrContent.target; // e.target
      setCurrentChapterData(prev => ({ ...prev, [name]: inputValue }));
    }
  };

  const handleAddOrUpdateChapter = (e) => {
    e.preventDefault();
    if (!currentChapterData.chapterTitle.trim()) {
      setError('Chapter title is required.');
      return;
    }
    setError('');

    const newChapters = [...storyData.chapters];
    if (editingChapterIndex !== null) {
      newChapters[editingChapterIndex] = currentChapterData;
    } else {
      newChapters.push(currentChapterData);
    }
    setStoryData(prev => ({ ...prev, chapters: newChapters }));
    setCurrentChapterData({ chapterTitle: '', chapterContent: '' });
    setEditingChapterIndex(null);
  };

  const handleEditChapter = (index) => {
    setCurrentChapterData({ ...storyData.chapters[index] });
    setEditingChapterIndex(index);
    window.scrollTo(0, 0); // Scroll to top to see the editor
  };

  const handleRemoveChapterFromList = (indexToRemove) => {
    setStoryData(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, index) => index !== indexToRemove),
    }));
    if(editingChapterIndex === indexToRemove) { // If removing the chapter currently being edited
        setCurrentChapterData({ chapterTitle: '', chapterContent: '' });
        setEditingChapterIndex(null);
    }
  };

  const handleCancelEditChapter = () => {
    setCurrentChapterData({ chapterTitle: '', chapterContent: '' });
    setEditingChapterIndex(null);
    setError('');
  };

  const handlePreviewChapterModal = (index) => {
    setPreviewChapterContent(storyData.chapters[index].chapterContent);
    setShowPreviewModal(true);
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{ 'align': [] }],
      ['link'], // Consider adding image/video if backend supports storage
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'color': [] }, { 'background': [] }], // Text and background color
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align', 'link',
    'script', 'color', 'background'
  ];

  // --- General Save and Navigation ---
  const saveStepData = async (stepToSave) => {
    if (!storyData._id) {
      setError("Story not initialized. Cannot save.");
      return false;
    }
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('token');
    let url = `http://localhost:5000/api/stories/${storyData._id}/step${stepToSave}`;
    let payload;
    let headers = { 'Authorization': `Bearer ${token}` };

    try {
      if (stepToSave === 1) {
        // For step 1, we might send title and cover page (if file exists)
        // If coverPageFile exists, it needs to be FormData
        if (storyData.coverPageFile) {
          payload = new FormData();
          payload.append('title', storyData.title);
          // payload.append('genre', storyData.genre); // If genre/desc are in step 1
          // payload.append('description', storyData.description);
          payload.append('coverPage', storyData.coverPageFile);
          // No 'Content-Type': 'application/json' for FormData, browser sets it
        } else {
          payload = JSON.stringify({ title: storyData.title /*, genre, description */ });
          headers['Content-Type'] = 'application/json';
        }
      } else if (stepToSave === 2) {
        payload = JSON.stringify({ characters: storyData.characters });
        headers['Content-Type'] = 'application/json';
      } else if (stepToSave === 3) {
        payload = JSON.stringify({ chapters: storyData.chapters });
        headers['Content-Type'] = 'application/json';
      } else {
        setIsLoading(false);
        return true; // Or handle as unknown step
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: payload,
      });

      const updatedStory = await response.json();
      if (!response.ok) {
        throw new Error(updatedStory.error || `Failed to save step ${stepToSave}`);
      }

      // Update storyData with potentially updated fields from backend (e.g., new coverPageUrl string)
      setStoryData(prev => ({ ...prev, ...updatedStory }));
      if (stepToSave === 1 && updatedStory.coverPageUrl) {
        // If backend sends back a URL (either new or existing if no file was uploaded)
        // And if a local file was just uploaded and saved, the preview is already from that file.
        // If no local file was selected, this updates the preview to the one from DB.
        // Also, clear coverPageFile as it's now processed.
        setStoryData(prev => ({
          ...prev,
          ...updatedStory, // This should include the new coverPageUrl from server
          coverPageFile: null, // File has been processed
          // If updatedStory.coverPageUrl is what we want for preview after save:
          coverPageUrlPreview: prev.coverPageFile ? prev.coverPageUrlPreview : updatedStory.coverPageUrl
                                  // Keep local blob if just uploaded, else use server URL.
                                  // Actually, after successful upload, better to use the server URL if available
                                  // and revoke the local blob.
        }));
        // More robust update after step 1 save:
        if (storyData.coverPageFile && updatedStory.coverPageUrl) { // if a file was uploaded and server confirmed with a URL
            if(storyData.coverPageUrlPreview && storyData.coverPageUrlPreview.startsWith('blob:')) {
                 URL.revokeObjectURL(storyData.coverPageUrlPreview); // Revoke old blob
            }
             setStoryData(prev => ({
                ...prev,
                ...updatedStory, // contains the new coverPageUrl
                coverPageFile: null, // clear the processed file
                coverPageUrlPreview: updatedStory.coverPageUrl, // show the persisted image URL
            }));
        } else if (updatedStory.coverPageUrl) { // No file uploaded, but title might have saved, and BE sends existing URL
             setStoryData(prev => ({
                ...prev,
                ...updatedStory,
                coverPageUrlPreview: updatedStory.coverPageUrl,
            }));
        } else { // No coverPageUrl from BE (e.g. it was deleted or never set)
             setStoryData(prev => ({
                ...prev,
                ...updatedStory,
                coverPageUrlPreview: null, // Clear preview if no URL from backend
            }));
        }

      } else {
        setStoryData(prev => ({ ...prev, ...updatedStory }));
      }
      console.log(`Step ${stepToSave} data saved successfully:`, updatedStory);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error(`Save step ${stepToSave} error:`, err);
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  };

  const handleNext = async () => {
    const success = await saveStepData(currentStep);
    if (success && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div>
      <h3>Step 1: Basic Info & Cover</h3>
      <div className="form-group">
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={storyData.title}
          onChange={handleChange}
          disabled={isLoading || !storyData._id}
        />
      </div>
      <div className="form-group">
        <label htmlFor="coverPageFile">Cover Page Image (PNG, JPG - Max 2MB):</label>
        <input
          type="file"
          id="coverPageFile"
          name="coverPageFile"
          accept="image/png, image/jpeg"
          onChange={handleChange}
          disabled={isLoading || !storyData._id}
        />
      </div>
      {(storyData.coverPageUrlPreview || (storyData.coverPageUrl && !storyData.coverPageFile)) && (
        <div className="form-group cover-preview">
          <p>Cover Preview:</p>
          <img
            src={storyData.coverPageUrlPreview || storyData.coverPageUrl}
            alt="Cover Preview"
            style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px', border: '1px solid #ddd' }}
          />
        </div>
      )}
      {/* Genre and Description could be added here or in a separate "General Settings" step later */}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3>Step 2: Add Characters</h3>
      <div className="character-form-section">
        <h4>Add New Character</h4>
        <form onSubmit={handleAddCharacter}> {/* Use onSubmit on form for enter key submission */}
          <div className="form-group">
            <label htmlFor="charName">Name:</label>
            <input
              type="text"
              id="charName"
              name="name"
              value={currentCharacter.name}
              onChange={handleCharacterChange}
              placeholder="Character Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="charDetails">Details:</label>
            <textarea
              id="charDetails"
              name="details"
              value={currentCharacter.details}
              onChange={handleCharacterChange}
              placeholder="Character details, backstory, etc."
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="charCategory">Category:</label>
            <select
              id="charCategory"
              name="category"
              value={currentCharacter.category}
              onChange={handleCharacterChange}
              required
            >
              <option value="lead">Lead</option>
              <option value="supporting">Supporting</option>
              <option value="background">Background</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="charProfilePicUrl">Profile Picture URL (optional):</label>
            <input
              type="url"
              id="charProfilePicUrl"
              name="profilePicUrl"
              value={currentCharacter.profilePicUrl}
              onChange={handleCharacterChange}
              placeholder="http://example.com/image.png"
            />
          </div>
          <button type="submit" className="button-secondary" disabled={isLoading}>
            Add Character to List
          </button>
        </form>
      </div>

      <div className="character-list-section">
        <h4>Current Characters ({storyData.characters.length})</h4>
        {storyData.characters.length === 0 ? (
          <p>No characters added yet.</p>
        ) : (
          <ul className="character-list">
            {storyData.characters.map((character, index) => (
              <li key={index} className="character-item"> {/* Use index as key if no stable ID yet */}
                <div>
                  <strong>{character.name}</strong> ({character.category})
                  {character.details && <p style={{ fontSize: '0.9em', margin: '5px 0' }}>Details: {character.details}</p>}
                  {character.profilePicUrl && (
                    <p style={{ fontSize: '0.9em', margin: '5px 0' }}>
                      Pic URL: <a href={character.profilePicUrl} target="_blank" rel="noopener noreferrer">{character.profilePicUrl}</a>
                    </p>
                  )}
                </div>
                <button onClick={() => handleRemoveCharacter(index)} disabled={isLoading} className="button-danger-small">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3>Step 3: Write Chapters</h3>
      <div className="chapter-form-section" style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h4>{editingChapterIndex !== null ? 'Edit Chapter' : 'Add New Chapter'}</h4>
        <form onSubmit={handleAddOrUpdateChapter}>
          <div className="form-group">
            <label htmlFor="chapterTitle">Chapter Title:</label>
            <input
              type="text"
              id="chapterTitle"
              name="chapterTitle" // for handleChapterDataChange if it uses name
              value={currentChapterData.chapterTitle}
              onChange={(e) => handleChapterDataChange(e)} // Pass event directly
              placeholder="Enter chapter title"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="chapterContent">Content:</label>
            <ReactQuill
              theme="snow"
              value={currentChapterData.chapterContent}
              onChange={(content) => handleChapterDataChange('chapterContent', content)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write your chapter content here..."
              style={{ backgroundColor: 'white', color: 'black', minHeight: '200px' }}
              readOnly={isLoading}
            />
          </div>
          <button type="submit" className="button-primary" style={{marginRight: '10px'}} disabled={isLoading}>
            {editingChapterIndex !== null ? 'Update Chapter' : 'Add Chapter to Story'}
          </button>
          {editingChapterIndex !== null && (
            <button type="button" onClick={handleCancelEditChapter} className="button-secondary" disabled={isLoading}>
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="chapter-list-section">
        <h4>Current Chapters ({storyData.chapters.length})</h4>
        {storyData.chapters.length === 0 ? (
          <p>No chapters added yet.</p>
        ) : (
          <ul className="chapter-list">
            {storyData.chapters.map((chapter, index) => (
              <li key={index} className="chapter-item">
                <h5>{chapter.chapterTitle || `Chapter ${index + 1}`}</h5>
                {/* Optional: Display a snippet of content, but be careful with HTML */}
                {/* <div style={{fontSize: '0.9em', maxHeight: '50px', overflow: 'hidden'}} dangerouslySetInnerHTML={{ __html: chapter.chapterContent.substring(0,100)+"..." }} /> */}
                <div className="chapter-actions">
                  <button onClick={() => handleEditChapter(index)} disabled={isLoading} className="button-secondary-small">Edit</button>
                  <button onClick={() => handleRemoveChapterFromList(index)} disabled={isLoading} className="button-danger-small">Remove</button>
                  <button onClick={() => handlePreviewChapterModal(index)} disabled={isLoading} className="button-tertiary-small">Preview</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Chapter Preview</h3>
            <div
              className="ql-editor" // Use Quill's editor class for consistent styling if desired
              style={{ maxHeight: '70vh', overflowY: 'auto', border: '1px solid #eee', padding: '15px', backgroundColor: '#f9f9f9' }}
              dangerouslySetInnerHTML={{ __html: previewChapterContent }}
            />
            <button onClick={() => setShowPreviewModal(false)} className="button-primary" style={{marginTop: '15px'}}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    if (!storyData._id && !error && isLoading) {
      return <p>Initializing story...</p>;
    }
    if (!storyData._id && error) {
        return <p>Error initializing story. Please try refreshing. Details: {error}</p>
    }


    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return <p>Unknown step.</p>;
    }
  };

  return (
    <div className="create-story-container">
      <h2>Create New Story {storyData.title && storyData._id ? `- ${storyData.title}` : ''} (Step {currentStep} of 3)</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="story-steps-content">
        {renderCurrentStep()}
      </div>

      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button onClick={handlePrevious} disabled={isLoading} className="button-secondary">
            Previous
          </button>
        )}
        {currentStep < 3 ? (
          <button onClick={handleNext} disabled={isLoading || !storyData._id} className="button-primary">
            {isLoading ? 'Saving...' : 'Next'}
          </button>
        ) : (
          <button onClick={() => saveStepData(3).then(success => { if(success) navigate('/dashboard'); })} disabled={isLoading || !storyData._id} className="button-primary">
            {isLoading ? 'Saving...' : 'Finish & Save'}
          </button>
        )}
        {/* A general save draft button, could be shown on all steps */}
        {storyData._id && currentStep <=3 && (
             <button
                onClick={() => saveStepData(currentStep)}
                disabled={isLoading}
                className="button-tertiary"
                style={{ marginLeft: '10px' }}
             >
               {isLoading ? 'Saving...' : 'Save Draft'}
             </button>
        )}
      </div>
    </div>
  );
};

export default CreateStoryPage;
