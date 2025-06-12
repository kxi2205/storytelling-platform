import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // ← ADD THIS
import { AuthContext } from "../AuthContext";
import "./Modal.css";

const LoginPage = ({ closeModal, openSignup }) => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ← ADD THIS

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError("All fields are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      login(data.token);    // ← update context
      closeModal();         // ← close modal
      navigate("/dashboard"); // ← navigate to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="modal-form">
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
          {error && <p className="error">{error}</p>}
          <button type="submit" className="modal-button">
            Login
          </button>
        </form>
        <p>
          Don't have an account?{" "}
          <span onClick={openSignup} className="modal-link">
            Sign Up
          </span>
        </p>
        <button className="modal-button close-btn" onClick={closeModal}>
          Close
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
