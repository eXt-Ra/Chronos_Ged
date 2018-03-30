import './organisms/watcher';
import './api'

require("./connmongo")();
// Use native promises
import mongoose from "mongoose";
import PositionMongo from "./Schema/PositionSchema";
import GedError from "./Class/GedError";
import ErrorBot from "./organisms/errorBot";
import generateOldGed from "./molecules/generateOldGed";

mongoose.Promise = Promise;


// new ErrorBot(new GedError("100", "Erreur lors de l'extraction de l'archive", "toto.zip", "toto.zip", "une erreur", "SOC-TEST", 3, true));

// generateOldGed(8789740);

// import PositionSchema from './Schema/PositionSchema'
// PositionSchema.find({
// }).then(positions => {
//     positions.forEach(position => {
//         position.docs.forEach(document =>{
//             console.log(document.currentFileLocation);
//             document.currentFileLocation = document.currentFileLocation.replace("output", "archive");
//             console.log(document.currentFileLocation);
//         });
//         position.markModified('docs');
//         console.log("success");
//         position.save();
//     })
// });