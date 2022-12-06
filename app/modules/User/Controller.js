const i18n = require("i18n");
const _ = require("lodash");
const Config = require("../../../configs/configs");
const Controller = require("../Base/Controller");
const RequestBody = require("../../services/RequestBody");
const Globals = require("../../services/Globals");
const seedFile = require("../../services/Seed");
const configs = require("../../../configs/configs");
const ObjectId = require("mongoose").Types.ObjectId;

class UserController extends Controller {
    constructor() {
        super();
    }
    
}

module.exports = UserController;