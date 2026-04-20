require('dotenv').config(); // Ensure env vars are loaded
const rollbar = require('./rollbar');

console.log('Sending test data to Rollbar...');

// Log a generic message
rollbar.log('Rollbar is initialized in tgneDash');

// Log an error manually
try {
  throw new Error('Manual verification error');
} catch (e) {
  rollbar.error(e);
}
