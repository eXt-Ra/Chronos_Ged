import mongoose from "mongoose";

const Schema = mongoose.Schema;

const errorSchema = new Schema(
    {
        type: {type: String, required: true},
        message: {type: String, required: true},
        source: {type: String, required: true},
        sourceArchive: {type: String, required: true},
        err: {type: Object},
        codeEdi: {type: String, required: true},
        criticality: {type: String, required: true},
        stopProcess: {type: Boolean, required: true},
        dateError: {type: Date, required: true},
        status: {type: String, required: true},
    },
    {usePushEach: true});

errorSchema.pre("save", function (next) {
    next();
});

const ErrorSchema = mongoose.model("Error", errorSchema);
module.exports = ErrorSchema;