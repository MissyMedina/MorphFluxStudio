const express = require('express');
const router = express.Router();

// Placeholder for transformation routes
router.get('/test', (req, res) => {
  res.json({ message: 'Transformation routes working' });
});

module.exports = router;
