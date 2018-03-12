import mongoose from "mongoose";
import moment from "moment/moment";

const Schema = mongoose.Schema;

const suiviSchema = new Schema(
    {
        codeEdi: {type: String, required: true},
        archiveSource: {type: String, required: true},
        status: {type: String, required: true},
        dateStart: {type: Date, required: true},
        dateEnd: {type: Date},
        id: {type: String, required: true},
        log: {type: Array},
    },
    {usePushEach: true});


suiviSchema.pre("save", function (next) {
    next();
});

const SuiviSchema = mongoose.model("Suivi", suiviSchema);
module.exports = SuiviSchema;