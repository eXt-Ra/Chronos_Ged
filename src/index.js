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
//
// import PositionSchema from './Schema/PositionSchema'
// console.log("ISTART")
// PositionSchema.find({
//   "dateTreatment": {
// 	"$gte": "2018-05-01",
//   }
// }).then(positions => {
//     console.log(positions.length)
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

// import _ from 'lodash'
//
// // numEquinoxe: "8215296"
// // numEquinoxe: "8778839"
// PositionSchema.find({}).then(positions => {
    // (position => {
    // position.docs.forEach(document =>{
    //     console.log(document.currentFileLocation);
    //     document.currentFileLocation = document.currentFileLocation.replace("output", "archive");
    //     console.log(document.currentFileLocation);
    // });
    // position.markModified('docs');
    // console.log("success");
    // position.save();
    // const arr = positions.docs.filter((thing, index, self) =>
    //     index === self.findIndex((t) => {
    //         return t.fileName === thing.fileName && t.archiveSource === thing.archiveSource
    //     })
    // );
//
//     const dupli = [];
//     positions.forEach(position => {
//         let asDuplicate = false;
//         position.docs.forEach(i => {
//             position.docs.forEach(o => {
//                 if (i.fileName === o.fileName && i.archiveSource === o.archiveSource) {
//                     if (position.docs.indexOf(o) !== position.docs.indexOf(i)) {
//                         if (!dupli.includes(position.docs.indexOf(i))) {
//                             asDuplicate = {
//                                 numEquinoxe: position.numEquinoxe,
//                                 fileName: asDuplicate.fileName ? asDuplicate.fileName.concat(i.fileName) : [i.fileName]
//                             }
//                         }
//                     }
//                 }
//             })
//
//         });
//         if (asDuplicate !== false) {
//             dupli.push(asDuplicate)
//         }
//     })
//     if (dupli.length > 0) {
//         console.log(dupli)
//     }
// });

import cluster from 'cluster'
import * as async from "async";

if (cluster.isMaster) {
    console.log(`
    ---🤘  Master ${process.pid} is running 🤘---
  `)
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

// ["A", "B", "C", "D", "E", "F"].forEach(async (val, index) => {
//     console.log(val);
//     console.log(index);
//     await setTimeout(() => {
//         console.log("wait");
//     }, 1000)
// });


// const start = async () => {
//     await asyncForEach(["A", "B", "C", "D", "E", "F"], async (num, index) => {
//         console.log(num)
//         console.log(index)
//     })
//     console.log('Done')
// }
// start()

