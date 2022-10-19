var appRoot = require('app-root-path');
var winston = require('winston');

// define the custom settings for each transport (file, console)
var options = {
  error: {
    level: 'error',
    filename: `${appRoot}/logs/error.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  info: {
    level: 'info',
    filename: `${appRoot}/logs/info.log`,
    handleExceptions: false,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  notice: {
    level: 'notice',
    filename: `${appRoot}/logs/notice.log`,
    handleExceptions: false,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  console: {
    level: 'console',
    handleExceptions: true,
    json: false,
    colorize: true,
    format: winston.format.simple(),
  },
  levels: {
    error: 0,
    warn: 1,
    notice: 2,
    info: 3,
    console: 4,
  }
};
  


// instantiate a new Winston Logger with the settings defined above
var logger = winston.createLogger({
  levels: options.levels,
  transports: [
    new (winston.transports.File)(options.info),
    new (winston.transports.File)(options.error),
    new (winston.transports.File)(options.notice),
    new (winston.transports.Console)(options.console)
    
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
// logger.stream = {
//   write: function(message, encoding) {
//     // use the 'info' log level so the output will be picked up by both transports (file and console)
//     logger.info(message);
//   },
// };

module.exports = logger;