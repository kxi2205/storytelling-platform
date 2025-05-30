// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./AuthContext";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import themes from "./themes";
import "./App.css";

const App = () => {
  const availableThemes = Object.keys(themes);
  const savedTheme = localStorage.getItem("theme") || "light";
  const [theme, setTheme] = React.useState(savedTheme);
  const [showLogin, setShowLogin] = React.useState(false);

  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const newTheme = availableThemes[nextIndex];

    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  React.useEffect(() => {
    const themeSettings = themes[theme];
    if (themeSettings) {
      Object.entries(themeSettings).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [theme]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className={`app-container ${theme}`}>
          {showLogin && (
            <LoginPage
              closeModal={() => setShowLogin(false)}
              openSignup={() => {
                console.log("Signup modal trigger");
              }}
            />
          )}
          <AuthContext.Consumer>
            {({ isLoggedIn }) => (
              <Routes>
              <Route
                path="/"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <HomePage
                      theme={theme}
                      toggleTheme={toggleTheme}
                      openLogin={() => setShowLogin(true)}
                    />
                  )
                }
              />
              <Route
                path="/homepage"
                element={
                  <HomePage
                    theme={theme}
                    toggleTheme={toggleTheme}
                    openLogin={() => setShowLogin(true)}
                  />
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>            
            )}
          </AuthContext.Consumer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
