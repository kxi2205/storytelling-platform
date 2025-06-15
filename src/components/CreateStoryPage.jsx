import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Strike from "@tiptap/extension-strike";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
// eslint-disable-next-line
import Underline from '@tiptap/extension-underline';
// eslint-disable-next-line
import Image from '@tiptap/extension-image';

import "./CreateStoryPage.css";

const GENRES = [
  "Romance", "Action & Adventure", "Horror&Mystery", "Fanfic", "LGBTQ", "Female Fantasy", "Public Book"
];

const TAGS = [
  "CEO", "Mafia", "Love After Marriage", "TimeTravel", "Love With A Soldier", "School life", "Rebirth",
  "Revenge", "Taboo love", "Doctor", "Ghost", "Vampire", "Werewolf", "Urban Romance", "Tragic", "Hades",
  "Memory Loss", "Sweet", "Fated", "One-night Stand", "Playboy", "Comedy", "Age Gap", "Childhood Sweetheart",
  "Taekook", "Showbiz", "Witch", "Omegaverse", "Magic", "Eastern Cultivation", "System", "Murder", "Crime",
  "Detectives", "Spy", "Reset world", "Virtual World", "Doomsday", "Game", "Zombie", "Substitute", "Betrayal",
  "Contract Marriage", "Cute Baby", "Reunion", "Cheating", "Love triangle", "Counterattack", "Disguise",
  "AI Robots", "Love at first sight", "Love grows over", "Action", "Supernatural", "Prison of Love",
  "Live Broadcast/Reality Show", "Sci-Fi", "Psychopath", "Office Romance", "Cultivation and Improvement",
  "Adventure", "First Love", "Regretful Husband", "Hidden Identity", "Single Mom", "Arranged Marriage",
  "Horror", "Mystery", "Light Novel", "Romantic Comedy", "Cross Classes", "Chick Lit", "Male Urban",
  "Modern Fantasy", "Paranormal Romance", "Ancient Romance", "Male Fantasy", "Forced Marriage", "Boys’ Love",
  "Possessive", "Dark romance", "Completed", "Girl Power", "Heartwarming"
];

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [story, setStory] = useState({
    title: "",
    genres: [],
    tags: [],
    description: "",
    status: "on going",
    coverPage: null,
    episodeTitle: "",
    episodeContent: "",
    adult: "No",
    online: "",
    textForm: "Body text",
  });

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [submitted, setSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isAuthenticated") === "true");

  const editor = useEditor({
    extensions: [StarterKit, Underline, Strike, Superscript, Subscript, Image],
    content: story.episodeContent,
    editable: step === 2,
    onUpdate: ({ editor }) => {
      setStory((prev) => ({ ...prev, episodeContent: editor.getHTML() }));
    },
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleGenreToggle = (genre) => {
    setStory((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleTagToggle = (tag) => {
    setStory((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFileChange = (e) => {
    setStory({ ...story, coverPage: e.target.files[0] });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStory((prev) => ({ ...prev, [name]: value }));
  };

  const handleDraft = () => {
    localStorage.setItem("draftStory", JSON.stringify(story));
    alert("Draft saved!");
  };

  const handleSubmit = () => {
    // Simulate backend submit
    setSubmitted(true);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step-circle ${step === 1 ? "active" : ""}`}>1</div>
      <span>Create a work</span>
      <div className={`step-circle ${step === 2 ? "active" : ""}`}>2</div>
      <span>Add Episode</span>
      <div className={`step-circle ${step === 3 ? "active" : ""}`}>3</div>
      <span>Publish</span>
    </div>
  );

  const renderStep1 = () => (
    <div className="step">
      <label> * Title: </label>
      <input name="title" value={story.title} onChange={handleChange} />

      <label>* Genre:</label>
      <div className="genre-grid">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`bubble ${story.genres.includes(g) ? "selected" : ""}`}
            onClick={() => handleGenreToggle(g)}
            type="button"
          >
            {g}
          </button>
        ))}
      </div>

      <label>Tag:</label>
      <div className="tag-grid">
        {TAGS.map((t) => (
          <button
            key={t}
            className={`bubble ${story.tags.includes(t) ? "selected" : ""}`}
            onClick={() => handleTagToggle(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      <label>Status:</label>
      <select name="status" value={story.status} onChange={handleChange}>
        <option value="on going">on going</option>
        <option value="completed">completed</option>
      </select>

      <label>Cover Page:</label>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {story.coverPage && (
        <img
          src={URL.createObjectURL(story.coverPage)}
          alt="Preview"
          className="cover-preview"
        />
      )}

      <label>* Description:</label>
      <textarea name="description" value={story.description} onChange={handleChange} />

      <div className="step-buttons">
        <button onClick={handleDraft}>Save Draft</button>
        <button onClick={() => setStep(2)}>Next</button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step">
      <label>* Episode Title:</label>
      <input
        name="episodeTitle"
        value={story.episodeTitle}
        onChange={handleChange}
        maxLength={100}
      />

      <label>* Content:</label>
      <div className="editor">
        <EditorContent editor={editor} />
      </div>

      <label>Adult content included:</label>
      <select name="adult" value={story.adult} onChange={handleChange}>
        <option value="No">No</option>
        <option value="Yes">Yes</option>
      </select>

      <label>Available online:</label>
      <select name="online" value={story.online} onChange={handleChange}>
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>

      <label>Text form:</label>
      <select name="textForm" value={story.textForm} onChange={handleChange}>
        <option value="Body text">Body text</option>
        <option value="Non-body text">Non-body text</option>
      </select>

      <div className="step-buttons">
        <button onClick={() => setStep(1)}>Back</button>
        <button onClick={handleSubmit}>Publish</button>
        <button onClick={handleDraft}>Save Draft</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step success-step">
      <div className="success-icon">✔</div>
      <h3>Successfully submitted, please be patient and wait for the review</h3>
      <p>
        You can continue to modify, save or re-submit your work before we complete the review.
      </p>
      <p className="gray-text">
        Your work has been published to your "My Stories" section. Thank you for your contribution.
      </p>

      <div className="step-buttons">
        <button onClick={() => navigate("/dashboard")}>Back to details</button>
        <button onClick={() => {
          setStory({ ...story, episodeTitle: "", episodeContent: "" });
          setStep(2);
        }}>Add another episode</button>
      </div>
    </div>
  );

  return (
    <div className={`create-story-page ${theme}`}>
      <NavBar
        theme={theme}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
      />
      {renderStepIndicator()}
      {submitted ? renderStep3() : step === 1 ? renderStep1() : step === 2 ? renderStep2() : null}
    </div>
  );
};

export default CreateStoryPage;
