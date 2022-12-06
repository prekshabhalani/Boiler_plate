const nodemailer = require('nodemailer');
const Config = require("../../configs/configs");

let smtpTransport = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use TLS,
    ignoreTLS: false,
    secure: false,
    tls: {
        rejectUnauthorized: false,
    },
    auth: {
        user: Config.mailUrl,
        pass: Config.mailPassword
    },
    debug: true,
});

class Email {
    send(mailOption) {
        return new Promise(async (resolve, reject) => {
            try {
                smtpTransport.sendMail({
                    from: Config.mailUrl,
                    to: mailOption.emailId,
                    subject: mailOption.subject,
                    html: mailOption.email
                }, (err, result) => {
                    if (err) {
                        console.log("er =", err);
                        return reject({ status: 0, message: err });
                    }
                    // console.log(result)
                    return resolve(result);
                })
            } catch (error) {
                console.log("error", error);
                this.res.send({ status: 0, message: error });
            }
        });
    }
}

module.exports = Email