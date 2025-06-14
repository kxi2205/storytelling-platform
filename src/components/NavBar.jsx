import React, { useState, useEffect, useRef } from "react";
import {
  FaHome, FaBookOpen, FaUsers, FaGlobe, FaRobot,
  FaUser, FaPalette, FaSun, FaMoon, FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import themes from "../themes";
import "./NavBar.css";

const NavBar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
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
  }, [selectedTheme]);

  useEffect(() => {
    console.log("NavBar main effect: Running on component mount/update.");

    const fetchUserData = async (currentToken) => {
      console.log("NavBar main effect: fetchUserData called with token:", currentToken);
      if (!currentToken) {
        console.log("NavBar main effect: fetchUserData exiting, no token.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: currentToken,
          },
        });
        console.log("NavBar main effect: fetchUserData - response status:", response.status);
        const data = await response.json();
        console.log("Fetched user data from backend:", data); // Existing log
        if (response.ok) {
          console.log("NavBar main effect: fetchUserData - response OK, setting userData.");
          setUserData(data);
        } else {
          console.error("NavBar main effect: fetchUserData - Failed to fetch user:", data.error);
          if (data.error === "Invalid token.") {
            setTokenExpired(true);
            setIsLoggedIn(false);
            localStorage.removeItem("token");
            console.log("NavBar main effect: fetchUserData - Invalid token, logged out.");
          }
        }
      } catch (err) {
        console.error("NavBar main effect: fetchUserData - Error fetching user:", err);
      }
    };

    const token = localStorage.getItem("token");
    console.log("NavBar main effect: Token from localStorage:", token);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        console.log("NavBar main effect: Token payload:", payload, "Expiry:", new Date(expiry));

        if (Date.now() >= expiry) {
          const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        console.log("NavBar main effect: Token payload:", payload, "Expiry:", new Date(expiry));

        if (Date.now() >= expiry) {
          console.warn("NavBar main effect: Token expired."); // This is the line generating the warning.
          setTokenExpired(true);
          setIsLoggedIn(false);
          localStorage.removeItem("token");
        } else {
          console.log("NavBar main effect: Token valid, setting isLoggedIn to true.");
          setIsLoggedIn(true);
          fetchUserData(token); // Call fetchUserData if token is valid
        }
          setTokenExpired(true);
          setIsLoggedIn(false);
          localStorage.removeItem("token");
        } else {
          console.log("NavBar main effect: Token valid, setting isLoggedIn to true.");
          setIsLoggedIn(true);
          fetchUserData(token); // Call fetchUserData if token is valid
        }
      } catch (err) {
        console.error("NavBar main effect: Token parsing error:", err);
        setTokenExpired(true);
        setIsLoggedIn(false);
        localStorage.removeItem("token");
      }
    } else {
      console.log("NavBar main effect: No token found, setting isLoggedIn to false.");
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/homepage";
  };

  const handleHomeClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/homepage');
    }
  };

  const filteredThemes = Object.keys(themes).filter(
    (themeName) => themes[themeName].mode === theme
  );

  return (
    <div ref={navRef} className={`nav-bar ${expandedSection ? "expanded" : ""}`}>
      {/* Navigation Icons */}
      <div className="nav-icon" title="Home" onClick={handleHomeClick}><FaHome /></div>
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
        <div className="theme-options theme-panel-content"> {/* Added theme-panel-content class */}
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
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No token found. Cannot upload profile picture.");
            // Optionally, inform the user they need to be logged in
            return;
          }

          const formData = new FormData();
          formData.append("profilePic", file);

          try {
            const response = await fetch("http://localhost:5000/api/auth/profile/picture", {
              method: "PUT",
              headers: {
                Authorization: token,
              },
              body: formData,
            });

            const responseData = await response.json();

            if (response.ok) {
              if (responseData.user && responseData.user.profilePic) {
                setUserData(prev => ({
                  ...prev,
                  profilePic: responseData.user.profilePic,
                }));
              } else if (responseData.profilePic) { // Fallback if only profilePic is sent
                setUserData(prev => ({
                  ...prev,
                  profilePic: responseData.profilePic,
                }));
              }
              // Optionally, display a success message
            } else {
              console.error("Profile picture update failed:", responseData.error);
              // Optionally, display an error message to the user
            }
          } catch (error) {
            console.error("Error uploading profile picture:", error);
            // Optionally, display an error message
          }
        }}
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
