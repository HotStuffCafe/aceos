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

// HTML Admin Dashboard Route
app.get('/api/admin/view-data', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>A.C.E. Admin Dashboard</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-8">
            <div class="max-w-7xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold text-gray-900">A.C.E. Waitlist Dashboard</h1>
                    <span class="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full">Live Database</span>
                </div>
                
                <div class="bg-white shadow-md rounded-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sport & Level</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody id="table-body" class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">Loading entries...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <script>
                async function loadData() {
                    try {
                        const response = await fetch('/api/admin/json-data');
                        const data = await response.json();
                        const tbody = document.getElementById('table-body');
                        
                        if (data.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No registrations found yet.</td></tr>';
                            return;
                        }

                        tbody.innerHTML = data.map(row => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#${row.id}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${row.user_type}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${row.name}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.mobile}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.city}, ${row.state}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.sport} (<span class="text-gray-700 font-semibold">${row.level}</span>)</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${new Date(row.registration_date).toLocaleString()}</td>
                            </tr>
                        `).join('');
                    } catch (error) {
                        console.error('Error loading data:', error);
                    }
                }
                loadData();
            </script>
        </body>
        </html>
    `);
});

// A helper JSON route to feed data into our new HTML table smoothly
app.get('/api/admin/json-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM waitlist ORDER BY registration_date DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error fetching data" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`A.C.E. Server is actively running on port ${PORT}`);
});
