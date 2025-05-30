import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import "./Modal.css";
import "./HomePage.css";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

const Dashboard = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/");
  };

  const carouselItems = [
    { title: "Collaborative Writing", description: "Work together in real-time to create amazing stories.", image: "https://wallpaperaccess.com/full/5844490.jpg" },
    { title: "AI Characters", description: "Interact with AI-driven characters to enhance your plot.", image: "https://cdn.wallpapersafari.com/23/82/vbc3Xy.jpg" },
    { title: "Dynamic Storytelling", description: "Let AI suggest plots and twists for your stories.", image: "https://getwallpapers.com/wallpaper/full/4/9/e/1207123-best-magical-wallpapers-for-desktop-1920x1080.jpg" },
    { title: "Immersive Worlds", description: "Build expansive universes with AI-generated settings.", image: "https://wallpapercave.com/wp/wp8531912.jpg" },
    { title: "Seamless Collaboration", description: "Invite friends to co-author stories effortlessly.", image: "https://wallpaperaccess.com/full/270305.jpg" }
  ];

  return (
    <div className={`home-container ${theme}`}>
      <NavBar theme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} handleLogout={handleLogout} />

      <div className="carousel-container">
        <Carousel
          additionalTransfrom={0}
          autoPlay
          autoPlaySpeed={10000}
          infinite
          arrows
          itemClass="carousel-item"
          responsive={{
            desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
            tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
            mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
          }}
        >
          {carouselItems.map((item, index) => (
            <div className="carousel-slide" key={index} style={{ backgroundImage: `url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center" }}>
              <div className="carousel-text">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Only show "Go to Dashboard" if needed */}
        {isAuthenticated && (
          <button className="cta-button" onClick={() => navigate("/dashboard")}>
            You're Already in Dashboard
          </button>
        )}
      </div>

      <div className="story-carousel-container">
        <h2>Newest Stories</h2>
        <Carousel additionalTransfrom={0} infinite arrows itemClass="carousel-item" responsive={{
          desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
          tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
          mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
        }}>
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
        </Carousel>
      </div>

      <div className="story-carousel-container">
        <h2>Most Popular Stories</h2>
        <Carousel
          additionalTransfrom={0}
          infinite
          arrows
          itemClass="carousel-item"
          responsive={{
            desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
            mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
          }}
        >
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
        </Carousel>
      </div>

      <div className="story-carousel-container">
        <h2>Editor's Picks</h2>
        <Carousel
          additionalTransfrom={0}
          infinite
          arrows
          itemClass="carousel-item"
          responsive={{
            desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
            tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
            mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
          }}
        >
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
          <div className="placeholder-slide">Coming Soon</div>
        </Carousel>
      </div>
    </div>
  );
};

export default Dashboard;
