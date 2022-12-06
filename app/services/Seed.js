/****************************
 SEED DATA
 ****************************/
const _ = require("lodash");

class Seed {
    constructor() { }

    async seedData() {
        try {
            this.justSet();
        } catch (error) {
            console.log("error", error);
        }
    }

    async justSet() {
        try {
            return;
        } catch (error) {
            console.log("error", error);
            return;
        }
    }

}

module.exports = Seed;
