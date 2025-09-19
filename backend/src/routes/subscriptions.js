const express = require('express');
const router = express.Router();

// Placeholder for subscription routes
router.get('/test', (req, res) => {
  res.json({ message: 'Subscription routes working' });
});

module.exports = router;
