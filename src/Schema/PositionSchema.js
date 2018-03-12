import mongoose from "mongoose";

const Schema = mongoose.Schema;

const positionSchema = new Schema(
    {
        numEquinoxe: {type: String, required: true, unique: true},
        codeEdi: {type: String, required: true},
        societe: {type: Object, required: true},
        docs: {type: Array, required: true},
        dateTreatment: {type: Date, required: true},
        archiveSource: {type: String, required: true},
        remettant: {type: Object, required: true},
        numeroDoc: {type: String, required: true}
    },
    {usePushEach: true});

positionSchema.pre("save", function (next) {
    next();
});

const PositionMongo = mongoose.model("Position", positionSchema);
module.exports = PositionMongo;