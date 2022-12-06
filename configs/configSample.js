/****************************
 Configuration
 ****************************/
// For environment variables [will work with .env file]
require('custom-env').env()
// require("custom-env").env("local");
// require("custom-env").env("dev");
// require("custom-env").env("uat");
// require("custom-env").env("qa");
// require("custom-env").env("staging");

let ENV_VARIABLES = process.env;

console.log("ENV_VARIABLES", ENV_VARIABLES.db)

module.exports = {
    ...ENV_VARIABLES,
};
