import './organisms/watcher';
import './api'

require("./connmongo")();
// Use native promises
import mongoose from "mongoose";
import PositionMongo from "./Schema/PositionSchema";
import GedError from "./Class/GedError";

mongoose.Promise = Promise;


// new PositionMongo({
//     numEquinoxe: '8183014',
//     codeEdi: 'FOURTOU',
//     societe: {
//         _id: '5a82fc5567f04119a13396b4',
//         nomSociete: 'FOURNIE 31',
//         codeEdi: 'FOURTOU',
//         siret: 49,
//         params: {numEquiInFilename: true},
//         retour:
//             {
//                 multi: true,
//                 nomenclature: 'numeroEquinoxe_date',
//                 fileType: 'pdf'
//             },
//         __v: 0
//     },
//     documents:
//         [{
//             barcode: [{
//                 barcode: ['8183014'],
//                 codeEdi: 'FOURTOU',
//                 dateTreatment: '2018-02-23T17:01:46+01:00',
//                 archiveSource: 'fournie31_201802151551.zip',
//                 fileName: '8183014-SCAN_1.pdf',
//                 currentFileLocation: 'output/FOURTOU/fournie31_201802151551'
//             }],
//             codeEdi: 'FOURTOU',
//             dateTreatment: '2018-02-23T17:01:46+01:00',
//             archiveSource: 'fournie31_201802151551.zip',
//             fileName: '8183014-SCAN_1.pdf',
//             currentFileLocation: 'output/FOURTOU/fournie31_201802151551'
//         }],
//     dateTreatment: '2018-02-23T17:01:48+01:00',
//     archiveSource: 'fournie31_201802151551.zip',
//     remettant: {
//         _id: '5a82fc5567f04119a13396a3',
//         nomSociete: 'LECAMUS',
//         codeEdi: 'LECASAI',
//         siret: 32,
//         __v: 0
//     },
//     numeroDoc: '0490001201802130028'
// }).save((err) => {
//     if (err) {
//         reject(new GedError("DB", `Insert DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
//     } else {
//         console.log("insert ok")
//         resolve()
//     }
// });