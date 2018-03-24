/*
 * Copyright 2018 Chris Troutner & P2P VPS Inc.
 * Licensing Information: MIT License
 *
 * This library file to handle managing logging of debug information.
 */

"use strict";

// Libraries
const winston = require("winston");

// Globals

class Logger {
  constructor() {
    // Set up the Winston logging.
    winston.add(winston.transports.File, {
      filename: "./logs/listing-manager.log",
      maxFiles: 1,
      colorize: false,
      timestamp: true,
      datePattern: ".yyyy-MM-ddTHH-mm",
      maxsize: 1000000,
      json: false,
    });

    // Set the logging level.
    winston.level = "debug";

    // Start first line of the log.
    const now = new Date();
    winston.log("info", `Application starting at ${now}`);
  }

  info(log) {
    winston.log("info", log);
  }

  log(log) {
    this.info(log);
  }

  debug(log) {
    winston.log("debug", log);
  }

  error(log, ...args) {
    console.error(log, args);
    winston.error(log, args);
  }

  warn(log, ...args) {
    console.warn(log, ...args);
    winston.warn(log, ...args);
  }
}

module.exports = Logger;
