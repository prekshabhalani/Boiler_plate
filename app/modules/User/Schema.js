let mongoose = require("mongoose");
let schema = mongoose.Schema;
const _ = require("lodash");
const { times } = require("lodash");

let user = new schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    emailId: { type: String, required: true, unique: true },
    // googleId: { type: String, required: true, unique: true },
    role: { type: schema.Types.ObjectId, ref: "Roles" },
    address: { type: schema.Types.ObjectId, ref: "Addresses" },
    photo: { type: String, required: false },
    mobile: { type: String },
    dob: { type: String }
  },
  {
    timestamps: true,
  }
);
let Users = mongoose.model("Users", user);

module.exports = {
  Users
};
