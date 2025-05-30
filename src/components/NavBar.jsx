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
        const response = await fetch("http://localhost:5000/auth/profile", {
          headers: {
            Authorization: token,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setUserData(data);
        } else {
          console.error("Failed to fetch user:", data.error);
          if (data.error === "Invalid token.") {
            setTokenExpired(true);
            setIsLoggedIn(false);
            localStorage.removeItem("token");
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/homepage";
  };

  const filteredThemes = Object.keys(themes).filter(
    (themeName) => themes[themeName].mode === theme
  );

  return (
    <div ref={navRef} className={`nav-bar ${expandedSection ? "expanded" : ""}`}>
      {/* Navigation Icons */}
      <div className="nav-icon" title="Home"><FaHome /></div>
      <div className="nav-icon" title="Created Stories"><FaBookOpen /></div>
      <div className="nav-icon" title="Collaboration"><FaUsers /></div>
      <div className="nav-icon" title="Explore"><FaGlobe /></div>
      <div className="nav-icon" title="AI Characters"><FaRobot /></div>

      {/* Profile icon (only if logged in) */}
      {isLoggedIn && (
        <div className="nav-icon" title="Profile" onClick={() => toggleSection("profile")}>
          <FaUser />
        </div>
      )}

      {/* Theme Palette icon (visible always) */}
      <div className="nav-icon" title="Change Theme" onClick={() => toggleSection("theme")}>
        <FaPalette />
      </div>

      {/* Expanded Theme Panel (only accessible when expanded) */}
      {expandedSection === "theme" && (
        <div className="theme-options">
          {/* Sun/Moon toggle at the top of the theme panel */}
          <div className="theme-toggle-panel" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
            {theme === "light" ? <FaSun className="theme-icon" /> : <FaMoon className="theme-icon" />}
            <span style={{ marginLeft: 8 }}>
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </span>
          </div>
          <hr />
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
      )}

      {/* Expanded Profile Panel (only if logged in) */}
      {expandedSection === "profile" && isLoggedIn && (
        <div className="theme-options profile-options">
          <img
            src={userData?.profilePic || "https://i.imgur.com/6VBx3io.png"}
            alt="Profile"
            className="profile-pic"
          />
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
