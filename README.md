# Library Management System (Supabase Edition)

A simple, web-based Library Management System built with HTML, Tailwind CSS, and JavaScript. It uses **Supabase** as a free, open-source backend with a real-time PostgreSQL database to manage books, users, and borrowing activities.

---

## Features

* **Book Management**: Add new books with titles, authors, and quantities. View a list of all available books.
* **User Management**: Register new library users and deregister existing ones.
* **Borrowing & Returns**: Issue books to registered users and process book returns.
* **Late Fee Calculation**: Automatically calculates late fees for overdue books upon return (based on a $1/day fee after a 14-day borrowing period).
* **Real-time Updates**: All data is synced in real-time across all users of the application thanks to Supabase's real-time subscriptions.

---

## Technologies Used

* **Frontend**: HTML, Tailwind CSS, JavaScript
* **Backend/Database**: **Supabase** (PostgreSQL)

---

## Local Setup Instructions

To set up and run this project on your local machine, follow these steps:

### 1. Create Project Files

Create a new folder for your project and add the following three files inside it: `index.html`, `style.css`, and `script.js`. Copy the code provided for each file.

### 2. Set up Supabase

This project requires a Supabase project to handle the backend database.

1.  Go to [supabase.com](https://supabase.com/) and sign up for a free account.
2.  Click on **"New project"** to create a new project. Give it a name and generate a secure password.
3.  Once your project is created, navigate to the **Table Editor** using the sidebar. You need to create three tables:

    * **Create the `books` table:**
        * Click **"Create a new table"**.
        * Name it `books`.
        * **Disable "Row Level Security (RLS)"** for this simple project.
        * Add the following columns:
            * `title` (type: `text`)
            * `author` (type: `text`)
            * `quantity` (type: `int8`)
            * `available` (type: `int8`)
        * Click **Save**.

    * **Create the `users` table:**
        * Click **"Create a new table"**.
        * Name it `users`.
        * **Disable "Row Level Security (RLS)"**.
        * Add the following columns:
            * `name` (type: `text`)
            * `active` (type: `bool`, default value: `true`)
        * Click **Save**.

    * **Create the `transactions` table:**
        * Click **"Create a new table"**.
        * Name it `transactions`.
        * **Disable "Row Level Security (RLS)"**.
        * Add the following columns:
            * `book_id` (type: `int8`)
            * `user_id` (type: `int8`)
            * `issue_date` (type: `timestamptz`)
            * `return_date` (type: `timestamptz`, check "Is Nullable")
            * `status` (type: `text`)
        * Click **Save**.

4.  After creating the tables, go to **Database** > **Replication** in the sidebar. Ensure that replication is enabled for your `public` schema so that real-time changes will work.

### 3. Configure `script.js`

1.  In your Supabase project, go to **Project Settings** (the gear icon).
2.  Click on **API** in the settings menu.
3.  You will find your **Project URL** and your **Project API Keys**. You need the `anon` `public` key.
4.  Open your `script.js` file and replace the placeholder values with your actual URL and anon key:

    ```javascript
    // From:
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

    // To (Example):
    const supabaseUrl = '[https://abcdefghijklmnopqrst.supabase.co](https://abcdefghijklmnopqrst.supabase.co)';
    const supabaseAnonKey = 'ey...';
    ```

### 4. Run the Project

Since the JavaScript file uses ES Modules (`import`), you must serve the files using a local web server.

1.  The easiest way is with the **Live Server** extension in Visual Studio Code.
2.  Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3.  Open your project folder in VS Code, right-click `index.html`, and select **"Open with Live Server"**.
4.  This will open the application in your browser, fully connected to your new Supabase backend.

---

## Project Structure
```\
|-- index.html      # The main HTML file with the page structure.
|-- style.css       # Custom CSS styles for the application.
|-- script.js       # JavaScript logic, including Firebase integration.
|-- README.md       # This file.
```