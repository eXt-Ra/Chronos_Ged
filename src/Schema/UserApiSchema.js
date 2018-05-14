const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userApiSchema = new Schema({
    name: { type: String, required: true, unique: true },
    token: { type: String, required: true, unique: true },
    codeEdi: { type: String, required: true},
    active: { type: Boolean, required: true},
    created_at: Date,
    updated_at: Date
});

userApiSchema.pre("save", function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updated_at = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created_at)
        this.created_at = currentDate;
    next();
});

const UserApi = mongoose.model("UserApi", userApiSchema);
module.exports = UserApi;
