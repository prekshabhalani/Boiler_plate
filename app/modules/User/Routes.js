
module.exports = (app, express) => {
    const router = express.Router();
    const config = require('../../../configs/configs');
    const UserController = require('../User/Controller');
    const Globals = require('../../services/Globals');
    const Validator = require('./Validator');

    router.post('/welcome', Globals.setLocalLanguage, (req, res, next) => {
        const userObj = (new UserController()).boot(req, res);
        return userObj.userListing();
    });


    app.use(config.baseApiUrl, router);
}