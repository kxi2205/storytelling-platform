# Project Title: Collaborative Storytelling Platform with AI Characters

## Overview

This project aims to develop a web-based platform where users can collaboratively write stories and interact with AI-driven characters. The platform will allow multiple users to co-author narratives in real-time, leveraging AI to generate character dialogues, suggest plot twists, and enrich the storytelling experience. The goal is to create an immersive and dynamic environment for creative writing, enhanced by intelligent AI assistance.

## Tech Stack

The project is built using the MERN stack:
*   **MongoDB**: NoSQL database for storing user data, stories, and AI character information.
*   **Express.js**: Backend framework for building robust APIs.
*   **React**: Frontend library for creating a dynamic and interactive user interface.
*   **Node.js**: JavaScript runtime environment for the backend server.

## Features Implemented So Far

*   **User Authentication**: Secure signup and login functionality using JSON Web Tokens (JWT).
*   **User Roles**: Basic implementation of user roles ('Writer', 'Reader', 'Collaborator', 'Admin') with 'Writer' as the default role on signup. The frontend currently allows selection between 'Writer' and 'Reader'.
*   **Story Creation**: Authenticated users can create new stories by providing a title, genre, and description.
*   **Dashboard**: Users can view a list of their own created stories on their dashboard, sorted by the most recently updated.
*   **Theme Switching**: Frontend allows users to switch between Light/Dark themes and different accent colors, with preferences saved in local storage.

## Planned Features (High-Level from Roadmap)

*   **Story Editor with Collaborative Features**: A rich text editor enabling multiple users to write and edit stories simultaneously, with real-time updates.
*   **AI Character Integration**:
    *   Users can create and customize AI characters for their stories.
    *   AI characters can generate dynamic dialogue and interact within the story.
*   **Advanced Machine Learning Integration**:
    *   AI-powered plot suggestions and story branching.
    *   Sentiment analysis for story tone and character emotions.
*   **Version Control for Stories**: System for tracking changes, reverting to previous versions, and managing story history.
*   **Commenting and Suggestions**: Features for users to leave comments and suggestions on stories.
*   **Story Sharing and Permissions**: Granular control over story visibility (public/private) and collaborator permissions.

## Getting Started / Setup Instructions

### Prerequisites

*   **Node.js**: Make sure you have Node.js installed (which includes npm). You can download it from [nodejs.org](https://nodejs.org/).
*   **MongoDB**: An instance of MongoDB should be running. You can use a local installation or a cloud service like MongoDB Atlas.

### Backend Setup

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Create a `.env` file**:
    In the `backend` directory, create a file named `.env` and add the following environment variables. Replace the placeholder values with your actual MongoDB connection string and a strong JWT secret key.
    ```env
    MONGO_URI=your_mongodb_connection_string_here
    JWT_SECRET=your_super_secret_jwt_key_here
    PORT=5000 # Optional, defaults to 5000 if not specified
    ```
    *Example for `MONGO_URI` (local MongoDB instance):* `mongodb://localhost:27017/your_database_name`
4.  **Start the backend server**:
    You can run the server in development mode (with automatic restarts on file changes using `nodemon`, if configured in `package.json`'s scripts) or standard mode.
    ```bash
    npm run dev  # If you have a 'dev' script (e.g., using nodemon)
    # OR
    npm start    # For a standard start
    ```
    The backend server will typically run on `http://localhost:5000` (or the `PORT` specified in your `.env` file).

### Frontend Setup

1.  **Navigate to the project root directory** (if you were in the `backend` directory, go one level up):
    ```bash
    cd .. 
    # Or, if you are starting from scratch and are in the project's root directory already, skip this step.
    ```
2.  **Install frontend dependencies**:
    (Assuming the main `package.json` in the root is for the React app, which is typical if Create React App was used as a base for the frontend and then a `backend` folder was added).
    ```bash
    npm install
    ```
3.  **Start the frontend React app**:
    ```bash
    npm start
    ```
    The React development server will usually open the application in your default web browser at `http://localhost:3000`. The frontend is configured to make API requests to the backend server (assumed to be running on `http://localhost:5000`).

## Project Structure

*   **`backend/`**: Contains all the server-side code.
    *   `models/`: Mongoose schemas for MongoDB collections (e.g., `User.js`, `Story.js`).
    *   `routes/`: Express API route definitions (e.g., `auth.js`, `stories.js`).
    *   `middleware/`: Custom middleware functions (e.g., `authMiddleware.js` for JWT verification).
    *   `server.js`: The main backend server entry point.
*   **`src/`**: Contains all the React frontend application code.
    *   `components/`: Reusable React components (e.g., `HomePage.jsx`, `Dashboard.jsx`, `LoginPage.jsx`).
    *   `AuthContext.js`: React Context for managing authentication state.
    *   `App.js`: The main application component, handling routing and layout.
    *   `index.js`: The entry point for the React application.
    *   Other supporting files (CSS, assets, etc.).
*   **`public/`**: Standard Create React App directory containing static assets like `index.html`, favicons, etc.

---
*This README provides a snapshot of the project. Details may evolve as development progresses.*
