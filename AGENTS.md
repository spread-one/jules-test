## Tech Stack
- **Frontend:** Vanilla JavaScript (ES6 Modules)
- **Backend:** Express.js + Node.js
- **Styling:** Plain CSS

## Backend Details
- **Authentication:** JWT (JSON Web Tokens) with `bcrypt` for password hashing.
- **Database:** None. Uses a volatile in-memory object (`src/dataStore.js`) for storing data. All data is reset on server restart.

## Coding Standards
- Use ESLint + Prettier (Note: not currently configured in `package.json`).
- Function names should be camelCase.
- API endpoints should follow RESTful conventions.
- Add JSDoc comments to functions where the purpose is not immediately obvious.

## Project Structure
- `src/`: Contains all source code.
  - `css/`: CSS stylesheets.
  - `js/`: Frontend JavaScript files, organized into modules.
    - `main.js`: Main entry point for the frontend.
    - `api.js`: Handles all communication with the backend API.
    - `auth.js`: Manages user authentication state.
    - `ui.js`: Controls all DOM manipulation and UI rendering.
  - `middleware/`: Express middleware.
  - `routes/`: Express route definitions.
  - `index.html`: Main HTML file for the application.
  - `server.js`: The Node.js server entry point.
- `.env`: Contains environment variables (e.g., `JWT_SECRET`). **This file is not committed to git.**
- `package.json`: Defines project metadata and dependencies.

## How to Run the Project
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Set Up Environment Variables:**
   - Create a `.env` file in the project root.
   - Add the following line:
     ```
     JWT_SECRET=your_super_secret_key_here
     ```
3. **Start the Server:**
   ```bash
   npm start
   ```
4. **Access the Application:**
   - Open your web browser and go to `http://localhost:3000`.
