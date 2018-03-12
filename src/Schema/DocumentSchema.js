import mongoose from "mongoose";

const Schema = mongoose.Schema;

const documentSchema = new Schema(
    {
        barcode: {type: [String], required: true},
        codeEdi: {type: String, required: true},
        dateTreatment: {type: Date, required: true},
        archiveSource: {type: String, required: true},
        fileName: {type: String, required: true},
        currentFileLocation: {type: String, required: true}
    },
    {usePushEach: true});

documentSchema.pre("save", function (next) {
    next();
});

const DocumentMongo = mongoose.model("Document", documentSchema);
module.exports = DocumentMongo;