const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 9191;

// Serve static files from Angular build directory
const buildPath = path.join(__dirname, 'dist', 'observation-portal', 'browser');
app.use('/observations',express.static(buildPath));

// Fallback to index.html for SPA routing
app.get('/observations/*path', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
