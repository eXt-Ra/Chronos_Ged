import mongoose from "mongoose";

const Schema = mongoose.Schema;

const societeSchema = new Schema(
    {
        nomSociete: {type: String, required: true, unique: true},
        codeEdi: {type: String, required: true},
        siret: {type: Number, required: true},
        params:{type: Object},
        retour:{type: Object}
    },
    {usePushEach: true});

societeSchema.pre("save", function (next) {
    next();
});

const SocieteMongo = mongoose.model("Societe", societeSchema);
module.exports = SocieteMongo;