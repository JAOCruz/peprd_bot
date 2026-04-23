const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-static routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(5174, '0.0.0.0', () => {
  console.log('Dashboard running on http://0.0.0.0:5174');
});
