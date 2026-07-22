const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json()); 

// Serve the static frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// Securely connect to PostgreSQL using the Environment Variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required by Render
});

// Create the database table automatically if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(50),
        name VARCHAR(100),
        mobile VARCHAR(15),
        email VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        sport VARCHAR(100),
        level VARCHAR(50),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(err => console.error("Table creation error:", err));

// API Route to receive form data from your UI
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
        const query = `
            INSERT INTO waitlist (user_type, name, mobile, email, city, state, sport, level)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        // The $1, $2 are variables to protect against hackers (SQL Injection)
        const values = [data.userType, data.name, data.mobile, data.email, data.city, data.state, data.sport, data.level];
        
        await pool.query(query, values);
        res.status(200).json({ message: "Registration successful!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Fallback route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`A.C.E. Server is actively running on port ${PORT}`);
});
