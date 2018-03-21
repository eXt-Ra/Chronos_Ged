import mongoose from "mongoose";

const Schema = mongoose.Schema;

const gedDownloadSchema = new Schema(
    {
        codeEdi: {type: String, required: true},
        numeroEquinoxe: {type: String, required: true},
        dateTreatment: {type: Date, required: true},
        fileUrl: {type: String, required: true},
        fileName: {type: String, required: true},
        status: {type: String, required: true},
    },
    {usePushEach: true});

gedDownloadSchema.pre("save", function (next) {
    next();
});

const DownloadGed = mongoose.model("DownloadGed", gedDownloadSchema);
module.exports = DownloadGed;