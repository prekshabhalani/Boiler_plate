const i18n = require("i18n");
const jwt = require("jsonwebtoken");
const config = require("../../configs/configs");
const Moment = require("moment");
const _ = require("lodash");
const { forEach } = require("lodash");
const path = require("path");
const json2xls = require("json2xls");
const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const fetch = require('node-fetch');

class Globals {
    static setLocalLanguage(req, res, next) {
        req.headers.language ?
            i18n.setLocale(req.headers.language) :
            i18n.setLocale("en");
        next();
    }

    // verify for indianic email
    verifyEmail(emailId) {
        return new Promise(async (resolve, reject) => {
            try {
                let domain = emailId.substring(emailId.lastIndexOf("@") + 1);
                if (domain == "gmail.com") {
                    return resolve(true);
                } else {
                    return resolve(false);
                }
            } catch (err) {
                return reject({ message: err, status: 0 });
            }
        });
    }


    // ID Validator function
    static isValidObjectId(id) {
        if (ObjectId.isValid(id)) {
            if (String(new ObjectId(id)) == id) return true;
            return false;
        }
        return false;
    }

    /********************* FOR FILTER */
    listingWithFilter(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let filter = data.filter ? data.filter : null;
                let search = data.search ? data.search : null;
                let query = data.query ? data.query : { isDeleted: false };
                let collection = data.collection;
                let getData = [];
                let totalCount = 0;
                let projection = data.projection ? data.projection : { __v: 0 };
                let aggregatePopulate = data.aggregatePopulate ?
                    data.aggregatePopulate :
                    null;
                let normalPopulate = data.normalPopulate ? data.normalPopulate : null;
                let sort = data.sort ? data.sort : { createdAt: -1 };
                let pipeline = this.createPipeline(aggregatePopulate, filter, search);
                let filteredId = [];
                let newGetData = [];
                if (data.page && data.pageSize) {
                    let skip = (parseInt(data.page) - 1) * parseInt(data.pageSize);
                    if (filter) {
                        
                        // console.log("filter+page+pageSize",pipeline[14]['$match']['$and'][2]); //[16]['$match']['$and']
                        getData = await collection.aggregate(pipeline).exec();
                        filteredId = getData[0] && getData[0].ids ? getData[0].ids : [];
                    
                        newGetData = await collection
                            .find({ _id: { $in: filteredId } })
                            .sort(sort)
                            .skip(skip)
                            .limit(data.pageSize)
                            .select(projection)
                            .populate(normalPopulate);
                        totalCount = getData[0] && getData[0].count ? getData[0].count : 0;
                    } else {
                        //console.log(pipeline);
                        getData = await collection.aggregate(pipeline).exec();
                        filteredId = getData[0] && getData[0].ids ? getData[0].ids : [];
                        
                        newGetData = await collection
                            .find({ _id: { $in: filteredId } })
                            .sort(sort)
                            .limit(data.pageSize)
                            .skip(skip)
                            .select(projection)
                            .populate(normalPopulate);
                        totalCount = getData[0] && getData[0].count ? getData[0].count : 0;

                    }
                } else {
                    getData = await collection.aggregate(pipeline);
                    filteredId = getData[0] && getData[0].ids ? getData[0].ids : [];
                    newGetData = await collection
                        .find({ _id: { $in: filteredId } })
                        .sort(sort)
                        .select(projection)
                        .populate(normalPopulate);

                    totalCount = getData[0] && getData[0].count ? getData[0].count : 0;
                }
                return resolve({
                    status: 1,
                    message: i18n.__("SUCCESS"),
                    data: newGetData,
                    totalCount,
                    page: parseInt(data.page),
                    pageSize: parseInt(data.pageSize),
                });
            } catch (err) {
                console.log(err);
            }
        });
    }

    createPipeline(populate = [], filter, search) {
        let pipeline = [];
        for (let index = 0; index < populate.length; index++) {
            pipeline.push({
                $lookup: {
                    from: populate[index].collectionName,
                    localField: populate[index].populateOn,
                    foreignField: populate[index].foreignField ?
                        populate[index].foreignField : "_id",
                    as: populate[index].as ?
                        populate[index].as : populate[index].populateOn,
                },
            });
            //Only create data array of lookups field which need to search
            // if (filter) {
            //     let filtersFieldNames = (Object.keys(filter).map((element) => {
            //         return _.first(element.split('.'));
            //     }))
            //     if (_.includes(filtersFieldNames, populate[index].populateOn)) {
            //        pipeline.push({ '$unwind': { 'path': '$' + populate[index].populateOn, 'preserveNullAndEmptyArrays': true } })
            //     }
            // }
            pipeline.push({
                $unwind: {
                    path: `$${populate[index].as !== undefined
                        ? populate[index].as
                        : populate[index].populateOn
                        }`,
                    preserveNullAndEmptyArrays: true,
                },
            });
        }
        //For match all filters
        let matchPipeline = {};
        matchPipeline["$match"] = {};
        matchPipeline["$match"]["$and"] = [];
        if (search) {
            matchPipeline["$match"]["$and"].push(search);
        }
        if (filter) {
            let booleanFields = [];
            let multipleIdFields = [];
            let numberFields = [];
            let idFields = [];
            let customFields = [];
            let combineFields = [];
            let multiRegexArrayFields = [];
            let multiCombineRegexFields = [];
            let dateFields = [];
            let extraFilter = [];

            for (const filterName in filter) {
                /**Date filter + gte and lte  */
                if (
                    _.includes(dateFields, filterName) &&
                    filter[filterName]["$gte"] &&
                    filter[filterName]["$lte"]
                ) {
                    filter[filterName]["$gte"] = new Date(
                        Moment(filter[filterName]["$gte"]).startOf("day")
                    );
                    filter[filterName]["$lte"] = new Date(
                        Moment(filter[filterName]["$lte"]).endOf("day")
                    );
                    let key = filterName;
                    let dateFilter = {};
                    dateFilter[key] = filter[filterName];
                    matchPipeline["$match"]["$and"].push(dateFilter);
                } else if (_.includes(idFields, filterName)) {
                    let idField = {};
                    idField[filterName] = filter[filterName];
                    extraFilter.push(idField);
                } else if (
                    Array.isArray(filter[filterName]) &&
                    filterName !== "_id" &&
                    !_.includes(multipleIdFields, filterName)
                ) {
                    let key = "$or";
                    let multiFieldRegexArrayFieldFilter = {}; //$or : [{},{}]
                    let forOr = [];
                    if (_.includes(multiRegexArrayFields, filterName)) {
                        filter[filterName].map((singleSearch) => {
                            let newFilter = {
                                $expr: {
                                    $regexMatch: {
                                        input: "$" + filterName,
                                        regex: singleSearch,
                                        options: "i",
                                    },
                                },
                            };
                            forOr.push(newFilter);
                        });
                    } else if (_.includes(multiCombineRegexFields, filterName)) {
                        filter[filterName].map((singleSearch) => {
                            let newFilter = {
                                $expr: {
                                    $regexMatch: {
                                        input: {
                                            $concat: [
                                                "$" + filterName + ".firstName",
                                                " ",
                                                "$" + filterName + ".lastName",
                                            ],
                                        },
                                        regex: singleSearch,
                                        options: "i",
                                    },
                                },
                            };
                            forOr.push(newFilter);
                        });
                    } else {
                        filter[filterName].map((singleSearch) => {
                            let key = filterName;
                            let newFilter = {};
                            newFilter[key] = singleSearch;
                            forOr.push(newFilter);
                        });
                    }
                    multiFieldRegexArrayFieldFilter[key] = forOr;
                    matchPipeline["$match"]["$and"].push(multiFieldRegexArrayFieldFilter);
                } else if (_.includes(numberFields, filterName)) {
                    filter[filterName] = parseInt(filter[filterName]);
                    let key = filterName;
                    let dateFilter = {};
                    dateFilter[key] = filter[filterName];
                    matchPipeline["$match"]["$and"].push(dateFilter);
                } else if (_.includes(booleanFields, filterName)) {
                    let key = filterName;
                    let booleanFilter = {};
                    booleanFilter[key] = filter[filterName];
                    matchPipeline["$match"]["$and"].push(booleanFilter);
                } else if (_.includes(multipleIdFields, filterName)) {
                    let idFilter = {};
                    let ids = filter[filterName].map((id) => ObjectId(id));
                    idFilter[filterName] = { $in: ids };
                    matchPipeline["$match"]["$and"].push(idFilter);
                } else if (_.includes(customFields, filterName)) {
                    let key = filterName;
                    let customFieldsFilter = {};
                    customFieldsFilter[key] = filter[filterName];
                    matchPipeline["$match"]["$and"].push(customFieldsFilter);
                } else if (_.includes(combineFields, filterName)) {
                    let newFilter = {
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: [
                                        "$" + filterName + ".firstName",
                                        " ",
                                        "$" + filterName + ".lastName",
                                    ],
                                },
                                regex: filter[filterName],
                                options: "i",
                            },
                        },
                    };
                    matchPipeline["$match"]["$and"].push(newFilter);
                } else {
                    let newFilter = {
                        $expr: {
                            $regexMatch: {
                                input: "$" + filterName,
                                regex: filter[filterName],
                                options: "i",
                            },
                        },
                    };
                    matchPipeline["$match"]["$and"].push(newFilter);
                }
            }
            if (extraFilter.length > 0) {
                let key = "$or";
                let extraFilterListingfilter = {};
                extraFilterListingfilter[key] = extraFilter;
                matchPipeline["$match"]["$and"].push(extraFilterListingfilter);
            }
            //console.log(matchPipeline)
            // for (let index = 0; index < matchPipeline["$match"]["$and"].length; index++) {
            //     const element = matchPipeline["$match"]["$and"][index];
            //     console.log(element)
            // }
            pipeline.push(matchPipeline);
        }
        pipeline.push({
            $group: {
                _id: "$_id",
            },
        }, {
            $group: {
                _id: null,
                ids: { $push: "$_id" },
                count: { $sum: 1 },
            },
        }
            //   {
            //     '$addFields':{
            //       "ids1": { '$slice': ['$ids',1,1] },//for skip and limit
            //     }
            //  }
        );
        // console.log(pipeline[10]['$match']['$and'][0]['$or'])
        return pipeline;
    }


    //Async forEach for recursive database code
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    // Common API call function
    APIService(url, method, headers, body) {
        return new Promise(async (resolve, reject) => {
            try {
                let preview;

                //Call APIs
                if (method === 'GET') {
                    await fetch(url, { method, headers })
                        .then((res) => {
                            return res.json()
                        })
                        .then(json => {
                            preview = json;
                            // console.log("URL = ", url);
                            // console.log("Preview = ", preview)
                        });
                } else {
                    await fetch(url, { method, headers, body })
                        .then((res) => {
                            return res.json()
                        })
                        .then(json => {
                            preview = json;
                            // console.log("URL = ", url);
                            // console.log("Preview = ", preview)
                        });
                }
                return resolve(preview);

            } catch (err) {
                console.log("Token authentication", err);
                return res.send({ status: 0, message: err });
            }
        });
    }


}
module.exports = Globals;