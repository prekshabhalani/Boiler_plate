const express = require('express');
const fs = require('fs');
const glob = require('glob');
const cors = require('cors');
const session = require('express-session');
const config = require("../configs/configs");

module.exports = function () {
    let app = express();
  
    app.use(express.json());

    app.use(cors());

    // =======   Settings for CORS
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    
    app.use(session({
      cookie: { maxAge: 30000 },
      saveUninitialized: true,
      resave: true,
      secret: config.sessionSecret
    }));
  
    // =======   Routing
    const modules = '/../app/modules';
    glob(__dirname + modules + '/**/*Routes.js', {}, (err, files) => {
      files.forEach((route) => {
        const stats = fs.statSync(route);
        const fileSizeInBytes = stats.size;
        if (fileSizeInBytes) {
          require(route)(app, express);
        }
      });
    });
    return app;
  };
  