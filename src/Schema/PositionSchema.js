import mongoose from "mongoose";
import {documentSchema} from './DocumentSchema'

const Schema = mongoose.Schema;

const statePosition = new Schema(
	{
	  retourRemettant: {type: Boolean},
	  retourDistributeur: {type: Boolean},
	  jp0Generate: {type: Boolean},
	});

const positionSchema = new Schema(
	{
	  numEquinoxe: {type: String, required: true, unique: true},
	  codeEdi: {type: String, required: true},
	  societe: {type: Object, required: true},
	  docs: {type: [], required: true},
	  dateTreatment: {type: Date, required: true},
	  archiveSource: {type: String, required: true},
	  remettant: {type: Object, required: true},
	  numeroDoc: {type: String, required: true},
	  state: {type: statePosition}
	});

positionSchema.pre("save", function (next) {
  next();
});

const PositionMongo = mongoose.model("Position", positionSchema);
module.exports = PositionMongo;

