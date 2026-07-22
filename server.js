const express = require('express');
const path = require('path');
const app = express();

// Serve the static frontend UI from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route to ensure the homepage loads
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`A.C.E. Server is actively running on port ${PORT}`);
});
