
module.exports = (app, express) => {
    const router = express.Router();
    const config = require('../../../configs/configs');
    const HealthCheckController = require('../User/Controller');
    const Globals = require('../../services/Globals');
    const Validator = require('./Validator');

    router.get('/welcome', Globals.setLocalLanguage, (req, res, next) => {
        const healthCheckControllerObj = (new HealthCheckController()).boot(req, res);
        return healthCheckControllerObj.Welcome();
    });


    app.use(config.baseApiUrl, router);
}