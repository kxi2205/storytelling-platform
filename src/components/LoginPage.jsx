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
  setError(""); // Reset error

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

    const text = await response.text(); // Always read as text first
    console.log("RAW response text:", text);

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("❌ JSON parse failed:", parseError);
      // If JSON parsing fails, the server likely returned non-JSON data
      // when an error occurred. Log the raw text for debugging.
      console.error("Raw response text:", text);
      setError("Server returned invalid data.");
      return;
    }

    if (!response.ok) {
      console.error("❌ Server responded with error status:", response.status);
      // Log the parsed data (or empty object if parsing failed) in case
      // it contains useful error information.
      console.error("Parsed error data:", data);
      setError(data.message || "Login failed.");
      return;
    }

    if (!data.token) {
      console.error("❌ No token found in response.");
      setError("Invalid login response from server.");
      return;
    }

    localStorage.setItem("token", data.token);
    login(data.token);
    closeModal();
    navigate("/dashboard");

  } catch (err) {
    console.error("❌ Network or code error during login:", err);
    setError(err.message || "Something went wrong.");
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
