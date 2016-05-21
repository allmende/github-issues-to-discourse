var config = require('../../config')(process.env.CONFIG);
var winston = require('winston');

// Set log level;
winston.level = config.logging.level;
winston.add(winston.transports.File, { filename: config.logging.path, handleExceptions: true });

module.exports = winston;