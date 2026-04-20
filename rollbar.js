const Rollbar = require('rollbar');

/**
 * Initialize Rollbar with configuration.
 * Included 'scrubFields' to prevent sensitive data from being logged.
 */
const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    code_version: '1.0.0',
  },
  environment: process.env.ROLLBAR_ENVIRONMENT || 'development',
  scrubFields: ['password', 'secret', 'creditCard', 'authorization', 'cookie', 'token']
});

module.exports = rollbar;