const { reject } = require("lodash");

class RequestBody {
    constructor() {
    }
    checkEmptyWithFields(body, fieldsArray) {
        return new Promise(async (resolve, reject) => {
            try {
                let requiredFields = [];
                fieldsArray.forEach(element => {
                    if (!(element in body) || body[element] === "" || typeof body[element] === "undefined" || (typeof body[element] === "string" && body[element].trim() == '')) {
                        requiredFields.push(element);
                    }
                });
                resolve(requiredFields);
            } catch (error) {
                reject(error);
            }
        });

    }
    processRequestBody(body,fieldsArray){
        return new Promise(async (resolve,reject)=>{
            try{
                let data = {};
                fieldsArray.forEach(field =>{
                    field in body && typeof body[field] != "undefined" 
                    ?data[field] = typeof body[field] === 'string'
                    ?body[field].trim()
                    :body[field]
                    :delete data[field]
                })
                return resolve(data);
            }
            catch(error){
                reject(error);
            }
        })
    }
}
module.exports = RequestBody