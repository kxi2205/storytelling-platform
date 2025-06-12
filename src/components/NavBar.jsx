import React, { useState, useEffect, useRef } from "react";
import {
  FaHome, FaBookOpen, FaUsers, FaGlobe, FaRobot,
  FaUser, FaPalette, FaSun, FaMoon, FaSignOutAlt
} from "react-icons/fa";
import themes from "../themes";
import "./NavBar.css";

const NavBar = ({ theme, toggleTheme }) => {
  const [expandedSection, setExpandedSection] = useState(null); // "theme" | "profile" | null
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem("selectedTheme") || "light");
  const [userData, setUserData] = useState(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navRef = useRef();

  const toggleSection = (section) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const applyTheme = (themeName) => {
    const themeSettings = themes[themeName];
    if (themeSettings) {
      Object.entries(themeSettings).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
      setSelectedTheme(themeName);
      localStorage.setItem("selectedTheme", themeName);
    }
  };

  useEffect(() => {
    applyTheme(selectedTheme);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        if (Date.now() >= expiry) {
          console.warn("Token expired.");
          setTokenExpired(true);
          setIsLoggedIn(false);
          localStorage.removeItem("token");
        } else {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Token parsing error:", err);
        setTokenExpired(true);
        setIsLoggedIn(false);
        localStorage.removeItem("token");
      }
    } else {
      setIsLoggedIn(false);
    }
    // eslint-disable-next-line
  }, [selectedTheme]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
    const response = await fetch("http://localhost:5000/api/auth/profile", {
      headers: {
        Authorization: token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUserData(data);
    } else {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
      console.error("Failed to fetch user:", errorData.error || response.statusText);
      if (response.status === 401 || errorData.error === "Invalid token.") {
        handleLogout();
      }
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    // It might be good to logout here too if there's a network error and user expects to be logged in
  }
};

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]); // Added handleLogout to dependency array if it's memoized, but it's not here.

const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setUserData(null); // Clear user data on logout
  window.location.href = "/homepage"; // Consider using React Router for navigation
};

  const handleProfilePicChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/auth/profile/picture", {
        method: 'PUT',
        headers: {
          Authorization: token,
        },
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUserData((prev) => ({
          ...prev,
          profilePic: data.profilePic,
        }));
      } else {
        console.error("Failed to update profile picture");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
    }
  };

  // Filter out the current theme from the theme list
  const filteredThemes = Object.keys(themes).filter((t) => t !== selectedTheme);

  return (
    <div className="navbar" ref={navRef}>
      {/* Theme Palette icon (visible always) */}
      <div className="nav-icon" title="Change Theme" onClick={() => toggleSection("theme")}>
        <FaPalette />
      </div>

      {/* Expanded Theme Panel (only accessible when expanded) */}
      {expandedSection === "theme" && (
        <div className="theme-options theme-panel-content">
          {/* Sun/Moon toggle at the top of the theme panel */}
          <div className="theme-toggle-panel" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
            {theme === "light" ? <FaSun className="theme-icon" /> : <FaMoon className="theme-icon" />}
            <span style={{ marginLeft: 8 }}>
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </span>
          </div>
          <hr className="theme-divider" />
          <div className="theme-scroll-container">
            {filteredThemes.map((themeName) => (
              <div
                key={themeName}
                className="theme-option"
                onClick={() => applyTheme(themeName)}
              >
                {themeName.replace(/([A-Z])/g, " $1").trim()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Profile Panel (only if logged in) */}
      {expandedSection === "profile" && isLoggedIn && (
        <div className="theme-options profile-options">
          <div className="profile-pic-wrapper">
            <img
              src={
                userData?.profilePic && userData.profilePic.startsWith('/')
                  ? `http://localhost:5000${userData.profilePic}`
                  : userData?.profilePic || "https://i.imgur.com/6VBx3io.png"
              }
              alt="Profile"
              className="profile-pic"
              onClick={() => document.getElementById("uploadProfilePic").click()}
            />
            <div
              className="profile-pic-overlay"
              onClick={() => document.getElementById("uploadProfilePic").click()}
            >
              Change
            </div>
            <input
              type="file"
              id="uploadProfilePic"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
            />
          </div>

          <div className="profile-details">
            {tokenExpired ? (
              <>
                <strong>Session expired</strong>
                <span>Please login again</span>
              </>
            ) : userData ? (
              <>
                <strong>{userData.name}</strong>
                <span>@{userData.username}</span>
              </>
            ) : (
              <strong>Loading profile...</strong>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default NavBar;
