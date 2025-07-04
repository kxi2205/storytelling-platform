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
  const [userStories, setUserStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchUserStories = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found. Please log in.');
        setIsLoading(false);
        // navigate('/login'); // Optionally redirect to login
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/stories/mystories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch stories. Status: ${response.status}`);
        }

        const data = await response.json();
        setUserStories(data);
      } catch (err) {
        console.error('Error fetching user stories:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserStories();
    }
  }, [isAuthenticated, navigate]);

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

      {/* Add Create New Story Button */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button className="cta-button" onClick={() => navigate("/create-story")}>
          Create New Story
        </button>
      </div>

      <div className="story-carousel-container">
        <h2>My Stories</h2>
        {isLoading && <p>Loading your stories...</p>}
        {error && <p className="error-message" style={{ backgroundColor: '#ffebee', color: 'red', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>Error: {error}</p>}
        {!isLoading && !error && userStories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
            <p>You haven't created any stories yet.</p>
            <p>Click the "Create New Story" button above to start your first adventure!</p>
          </div>
        )}
        {!isLoading && !error && userStories.length > 0 && (
          <Carousel
            additionalTransfrom={0}
            arrows
            infinite={userStories.length > 2} // Only infinite if enough items
            itemClass="carousel-item"
            responsive={{
              desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3, partialVisibilityGutter: 40 },
              tablet: { breakpoint: { max: 1024, min: 464 }, items: 2, partialVisibilityGutter: 30 },
              mobile: { breakpoint: { max: 464, min: 0 }, items: 1, partialVisibilityGutter: 20 }
            }}
          >
            {userStories.map((story) => (
              <div 
                className="story-slide" 
                key={story._id} 
                style={{ padding: '10px', cursor: 'pointer' }} 
                onClick={() => navigate(`/story/${story._id}/edit`)}
              >
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: 'var(--card-bg-color)', height: '100%' }}>
                  <h3 style={{ color: 'var(--text-color)' }}>{story.title}</h3>
                  <p style={{ color: 'var(--text-color-secondary)', fontSize: '0.9em' }}>
                    {story.description ? (story.description.length > 100 ? story.description.substring(0, 97) + '...' : story.description) : 'No description available.'}
                  </p>
                  <p style={{ fontSize: '0.8em', color: '#888' }}>Genre: {story.genre || 'N/A'}</p>
                  <small style={{ color: '#aaa' }}>Last updated: {new Date(story.updatedAt).toLocaleDateString()}</small>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/story/${story._id}/edit`); }} 
                    style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit Story
                  </button>
                </div>
              </div>
            ))}
          </Carousel>
        )}
      </div>

      {/* Keeping other carousels as placeholders for now */}
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
