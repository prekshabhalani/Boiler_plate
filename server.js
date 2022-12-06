/****************************
 SERVER MAIN FILE
 ****************************/

 const i18n = require('i18n');
 const fs = require('fs');
 const swaggerUi = require('swagger-ui-express');
 const basicAuth = require('basic-auth');
 let express = require('./configs/express');
 const mongoose = require('./configs/mongoose');
 let config = require('./configs/configs');
 const app = express();
 var path = require('path');
 let exp = require('express');
 const multer = require('multer');
 app.use('/public', exp.static(path.join(__dirname,'public')));
 let seedService = require("./app/services/Seed");

 i18n.configure({
     locales: ['en','de'],
     directory: __dirname + '/app/locales',
     defaultLocale: 'en',
     register: global
 });
 
 let auth = function (req, res, next) {
     let user = basicAuth(req);
     if (!user || !user.name || !user.pass) {
         res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
         res.sendStatus(401);
         return;
     }
     if (user.name === config.HTTPAuthUser && user.pass === config.HTTPAuthPassword) {
         next();
     } else {
         res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
         res.sendStatus(401);
         return;
     }
 }
 db = mongoose();
 if (process.env.NODE_ENV !== "production") {
     let options = {
         customCss: '.swagger-ui .models { display: none }'
     };
     let mainSwaggerData = JSON.parse(fs.readFileSync('swagger.json'));
     mainSwaggerData.host = config.host;
     mainSwaggerData.basePath = config.baseApiUrl;
     const modules = './app/modules';
     fs.readdirSync(modules).forEach(file => {
         if (fs.existsSync(modules + '/' + file + '/swagger.json')) {
             const stats = fs.statSync(modules + '/' + file + '/swagger.json');
             const fileSizeInBytes = stats.size;
             if (fileSizeInBytes) {
                 let swaggerData = fs.readFileSync(modules + '/' + file + '/swagger.json');
                 swaggerData = swaggerData ? JSON.parse(swaggerData) : { paths: {}, definitions: {} };
                 mainSwaggerData.paths = { ...swaggerData.paths, ...mainSwaggerData.paths };
                 mainSwaggerData.definitions = { ...swaggerData.definitions, ...mainSwaggerData.definitions };
             }
         }
     });
     if (config.isHTTPAuthForSwagger && config.isHTTPAuthForSwagger == 'true') {
         app.get('/docs', auth, (req, res, next) => {
             next();
         });
     }
     let swaggerDocument = mainSwaggerData;
     app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
 }
 
 new seedService().seedData();

 global.appRoot = path.resolve(__dirname);
 
 // Server running
 app.listen(parseInt(config.serverPort), async () => {
     console.log('process.env.NODE_ENV', process.env.NODE_ENV);
     console.log(`Server running at http://localhost:${config.serverPort}`);
 });
 