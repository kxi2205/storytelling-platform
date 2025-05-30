import React, { useState } from "react";
import "./Modal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const SignupPage = ({ closeModal, openLogin, setIsSignedUp }) => {
  const [formData, setFormData] = useState({
    profilePic: null,
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Writer", // Default role
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setFormData({ ...formData, profilePic: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8 || !/[0-9]/.test(formData.password)) {
      setError("Password must be at least 8 characters long and include a number.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const userData = {
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
    };

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      console.log("✅ Signup Successful:", data);
      setIsSignedUp(true); // ✅ Notify parent component
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Sign Up</h2>
        
        <div className="profile-pic">
          {formData.profilePic ? (
            <img src={URL.createObjectURL(formData.profilePic)} alt="Profile" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="profile-icon" />
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="file-upload">
            <input type="file" name="profilePic" onChange={handleFileChange} />
            Choose Profile Picture
          </label>
          <input
            type="text"
            name="name"
            className="modal-input"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            className="modal-input"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            className="modal-input"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            className="modal-input"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="Writer">Writer</option>
            <option value="Reader">Reader</option>
          </select>
          <input
            type="password"
            name="confirmPassword"
            className="modal-input"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="modal-button">Sign Up</button>
        </form>

        <p>
          Already have an account? <span onClick={openLogin} className="modal-link">Login</span>
        </p>
        <button className="modal-button close-btn" onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default SignupPage;
