# Simple Community Forum

This is a simple, single-page community forum application built with a Vanilla JavaScript frontend and a Node.js/Express backend.

## Features

- User registration and login system using JWT for authentication.
- Create, Read, Update, and Delete (CRUD) operations for posts.
- Create, Read, Update, and Delete (CRUD) operations for comments on posts.
- A responsive, single-page interface.

**Note:** This application uses an **in-memory data store**, which means all data (users, posts, comments) will be **reset** every time the server is restarted.

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Authentication:** `jsonwebtoken` for JWT, `bcrypt` for password hashing

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/spread-one/jules-test.git
    cd jules-test
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    -   Create a file named `.env` in the root of the project.
    -   Add a secret key for signing JWTs. You can use any long, random string.

        ```
        JWT_SECRET=your_super_secret_and_random_key
        ```

4.  **Run the server:**
    ```bash
    npm start
    ```

5.  **Open the application:**
    -   Navigate to `http://localhost:3000` in your web browser.