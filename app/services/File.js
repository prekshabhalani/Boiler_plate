/****************************
 FILE HANDLING OPERATIONS
 ****************************/
let fs = require("fs");
let path = require("path");
const _ = require("lodash");
const mv = require("mv");
const config = require("../../configs/configs");
const aws = require("aws-sdk");
const mime = require("mime");

const s3 = new aws.S3({
    // apiVersion: '2006-03-01',
    secretAccessKey: config.SECRET_ACCESS_KEY,
    accessKeyId: config.ACCESS_KEY_ID,
    Bucket: config.S3_BUCKET,
    endpoint: undefined,
    region: config.REGION,
    bucket_endpoint: false,
    use_path_style_endpoint: true,
    sslEnabled: false,
    s3ForcePathStyle: true,
});

class File {
    constructor(file, location) {
        this.file = file;
        this.location = location;
    }

    
    deleteFile(filePath) {
        //TODO
        return new Promise((resolve, reject) => {
            try {
                let Path = path.join(__dirname, "..", "..", filePath);
                fs.unlink(Path, (err) => {
                    if (err && err.code == "ENOENT") {
                        console.info("File_Does_Not_Exist");
                        reject("File_Does_Not_Exist");
                    } else if (err) {
                        console.error("Something went wrong. Please try again later.");
                        reject(err);
                    } else {
                        console.info(`Successfully removed file with the path of ${Path}`);
                        return resolve(Path);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    fileUpload() {
        return new Promise(async (resolve, reject) => {
            if (this.file.file[0].originalFilename == "") {
                return reject("Please send file.");
            }
            let fileName = this.file.file[0].originalFilename.split(".");
            let ext = _.last(fileName);
            // if(ext != "pdf"){
            //   return reject('Please Upload PDF,JPG,PNG,JPEG');
            // }
            let imagePath = "/public/uploads/";
            let name = ext + Date.now().toString() + "." + ext;
            // let name = ext + Date.now().toString() + '.' + ext;
            let filePath = imagePath + name;
            let fileObject = { fileName: name, filePath: imagePath };
            mv(
                this.file.file[0].path,
                appRoot + filePath, { mkdirp: true },
                function (err) {
                    if (err) {
                        reject(err);
                    }
                    if (!err) {
                        return resolve(filePath);
                    }
                }
            );
        });
    }

    removeFileFromS3Bucket(filePath, exports) {
        return new Promise((resolve, reject) => {
            // let Path = path.join('public', 'upload', 'images', filePath);
            // if (exports) {
            //     Path = filePath;
            // }
            let Path = filePath;
            let params = {
                Bucket: config.S3_BUCKET,
                Key: Path,
            };

            s3.deleteObject(params, async function (err, res) {
                if (err) {
                    return reject(err, null);
                } else {
                    console.log(
                        "---->Deleted successfully For check use " +
                        config.S3_ENDPOINT +
                        config.S3_BUCKET +
                        "/" +
                        Path
                    );
                    resolve(filePath);
                }
            });
        });
    }

    uploadExcelFileOnS3(data) {
        return new Promise((resolve, reject) => {
            let listing = data.bodyData;
            let fileName = data.fileName;
            let type = data.type.toLowerCase();
            let ext = type === "csv" ? ".csv" : type === "excel" ? ".xlsx" : ".pdf";

            let imagePath = "public/upload/";
            let name = fileName + "_" + Date.now().toString() + ext;
            let filePath = imagePath + name;

            let fileData = Buffer.from(JSON.stringify(listing));

            let params = {
                // ACL: 'public-read',
                Bucket: config.S3_BUCKET,
                Key: filePath,
                ContentEncoding: "base64",
                Body: fileData,
                ContentType: "application/json",
            };

            s3.upload(params, function (err, params) {
                if (err) {
                    console.log(err);
                    console.log("Error uploading data: ", fileData);
                } else {
                    console.log(`Successfully uploaded at ${config.FILE_URL}${filePath}`);
                }
            });
            return resolve({ filePath: filePath, fileURL: config.FILE_URL });
        });
    }

    uploadFileOnS3(file) {
        return new Promise((resolve, reject) => {
            if (_.isEmpty(this.file)) {
                reject("Please send file.");
            }

            let fileName = this.file.originalFilename.split(".");
            let ext = _.last(fileName);
            let imagePath = "public/upload";
            let year = new Date().getFullYear();
            const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];
            let monthNumber = new Date().getMonth();
            let monthName = monthNames[monthNumber];
            const path = `${year}/${monthName}/`;

            let name = `${path}` + "file_" + Date.now().toString() + "." + ext;
            let filePath = imagePath + "/" + name;
            //Process to actually upload into s3
            let image_path = {
                src: this.file.path,
                dst: filePath,
            };

            fs.readFile(image_path.src, function (err, data) {
                if (err) {
                    console.log("ERROR IN S3 UPLOAD", err);
                    return reject(err);
                }
                let params = {
                    // ACL: 'public-read',
                    Bucket: config.S3_BUCKET,
                    Key: image_path.dst,
                    Body: data,
                    ContentType: mime.getType(image_path.src),
                };
                s3.putObject(params, function (err, res) {
                    if (err) {
                        console.log("ERROR IN S3: ", err);
                        return reject(err);
                    } else {
                        console.log(
                            "---->Upload Successfully For check use " +
                            config.S3_ENDPOINT +
                            image_path.dst
                        );
                        return resolve(filePath);
                    }
                });
            });
        });
    }

    downloadFiles(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let listing = data.bodyData;
                let file = data.fileName;
                let type = data.type.toLowerCase();
                let ext = type === "csv" ? ".csv" : type === "excel" ? ".xlsx" : ".pdf";
                /*********  Data getting from database ends **********/

                if (_.isEmpty(listing)) {
                    return resolve({ status: 0, message: i18n.__("NOT_FOUND") });
                }

                /*********  code excel download begins **********/
                let fields = data.filteredFields;
                const opts = { fields };
                //const filePathAndName = file + '-' + type + '-' + Date.now() + ext;
                const filePathAndName = file + "-" + Date.now() + ext;

                const filePath = path.join(
                    __dirname,
                    `../../public/${type}/`,
                    filePathAndName
                );
                const fileLink =
                    `${config.FILE_URL}/public/${type}/${filePathAndName}`;

                if (type === "csv") {
                    // const csv = json2csv(listing, opts);
                    const csv = json2csv(listing, opts);
                    if (!fs.existsSync(path.join(__dirname, `../../public/${type}/`))) {
                        await fs.mkdirSync(path.join(__dirname, `../../public/${type}/`), {
                            recursive: true,
                        });
                    }
                    await fs.writeFile(filePath, csv, function (err, data) {
                        if (err) {
                            return resolve({
                                status: 0,
                                message: i18n.__("INTERNAL_SERVER_ERROR"),
                            });
                        }
                    });
                    return resolve({ filePathAndName, fileLink, type });
                } else if (type === "excel") {
                    // let excel = json2xls(listing, opts);
                    let excel = json2xls(listing, opts);
                    if (!fs.existsSync(path.join(__dirname, `../../public/${type}/`))) {
                        await fs.mkdirSync(path.join(__dirname, `../../public/${type}/`), {
                            recursive: true,
                        });
                    }
                    await fs.writeFile(filePath, excel, "binary", function (err, data) {
                        if (err) {
                            return resolve({
                                status: 0,
                                message: i18n.__("INTERNAL_SERVER_ERROR"),
                            });
                        }
                    });
                    return resolve({ filePathAndName, fileLink, type });
                } else if (type === "pdf") {
                    /***** write pdf generation code here ******/
                    // let pdf = await this.downloadPdf({ listing, filePathAndName, filePath, fields });
                    let pdf = await new CommonService().downloadPdf({
                        listing,
                        filePathAndName,
                        filePath,
                        fields,
                    });
                    return resolve({ ...pdf });
                } else {
                    /*********  code for csv and excel download ends **********/
                    return resolve({
                        status: 0,
                        message: i18n.__("BAD_REQUEST") + i18n.__("Of_Type_Value"),
                    });
                }
            } catch (error) {
                return reject(error);
            }
        });
    }

}

module.exports = File;