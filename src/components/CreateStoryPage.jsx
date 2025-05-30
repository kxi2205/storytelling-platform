import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateStoryPage.css'; // We'll create this for basic styling

const CreateStoryPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!formData.title) {
      setError('Title is required.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a story.');
      // Optionally, redirect to login: navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create story. Status: ' + response.status);
      }

      console.log('Story created successfully:', data);
      navigate('/dashboard'); // Redirect to dashboard
    } catch (err) {
      console.error('Create story error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="create-story-container">
      <h2>Create New Story</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="create-story-form">
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="genre">Genre:</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
          ></textarea>
        </div>
        <button type="submit" className="submit-button">Create Story</button>
      </form>
    </div>
  );
};

export default CreateStoryPage;
