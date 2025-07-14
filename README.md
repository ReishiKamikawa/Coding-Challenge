# Project README

## Overview
This project is a full-stack application with a React frontend and a Node.js/Express backend. It includes features for authentication, board and card management, and real-time updates.

---

## Frontend

**Location:** `frontend/`

### Tech Stack
- React (JSX): JavaScript library for building user interfaces.
- Vite: Fast build tool and development server for modern web projects.
- Tailwind CSS: Utility-first CSS framework for rapid UI development.

### Structure
- `src/`: Contains all source code for the frontend.
  - `App.jsx`: Main React component that serves as the root of the application.
  - `main.jsx`: Entry point for rendering the React app.
  - `index.css`: Global CSS styles.
  - `assets/`: Folder for static assets like images.
  - `components/`: Reusable UI components such as modals and task lists.
  - `pages/`: Page-level components for different views (Login, Trello interface, Card, Verify).
  - `utils/`: Utility functions, including websocket.js for real-time features.

### Key Files
- `vite.config.ts`: Configuration for Vite.
- `tailwind.config.js`: Configuration for Tailwind CSS.
- `package.json`: Lists frontend dependencies and scripts.

### How to Run
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Features
- User authentication (login, verification)
- Board and card management (Trello-like interface)
- Modals for inviting users and project planning
- Real-time updates via websockets

---

## Backend

**Location:** Root folder (controllers/, routes/, etc.)

### Tech Stack
- Node.js: JavaScript runtime for server-side development.
- Express.js: Web framework for building RESTful APIs.
- Firebase: Used for user authentication and real-time database features.

### Structure
- `controllers/`: Contains business logic for authentication, boards, cards, repositories, and tasks.
- `routes/`: Defines API endpoints for each resource.
- `firebase.js`: Sets up Firebase configuration and initialization.
- `index.js`: Main entry point for starting the backend server.
- `package.json`: Lists backend dependencies and scripts.

### Key Files
- `authController.js`: Handles user authentication logic.
- `boardController.js`, `cardController.js`, etc.: Logic for managing boards, cards, repositories, and tasks.
- `authRoutes.js`, `boardRoutes.js`, etc.: Express routes for API endpoints.

### How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node index.js
   ```

### Features
- RESTful API for boards, cards, repositories, and tasks
- User authentication via Firebase
- Real-time communication support

---

## General Notes
- Ensure both frontend and backend are running for full functionality.
- For API testing, use the provided `Code challenge.postman_collection.json`.

---

## Contact & Contribution
- For issues or contributions, please open a pull request or issue in the repository.

