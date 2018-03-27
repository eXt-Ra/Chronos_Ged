import './organisms/watcher';
import './api'

require("./connmongo")();
// Use native promises
import mongoose from "mongoose";
import PositionMongo from "./Schema/PositionSchema";
import GedError from "./Class/GedError";
import ErrorBot from "./organisms/errorBot";

mongoose.Promise = Promise;


new ErrorBot(new GedError("100", "Erreur lors de l'extraction de l'archive", "toto.zip", "toto.zip", "une erreur", "SOC-TEST", 3, true));