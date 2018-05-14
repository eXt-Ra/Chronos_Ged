import chokidar from 'chokidar';
import _ from 'lodash';
import unZip from '../atoms/unzipper';
import traitFiles from './../molecules/traitFiles';
import readBarcode from '../molecules/readBarcode';
import traitBarcode from '../molecules/traitBarcode';
import savePositionsDB from '../molecules/savePositionsDB';
import saveGedDownloadDB from '../molecules/saveGedDownloadDB';
import createLdsAndJpg0 from '../molecules/createLdsAndJpg0';
import archiveFiles from "../atoms/archiveFiles";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import {addSuivi, changeProgress, changeStatus, removeSuivi} from "./suiviTreatment";
import Suivi from "../Class/Suivi";
import GedDownload from './../Schema/GedDownloadSchema'

import LineByLineReader from 'line-by-line';
import downloadImages from "../atoms/downloadImages";
import path from 'path'
import traitRetour from "../molecules/traitRetour";
import async from "async";
import fileTypeCheck from "../atoms/fileTypeCheck";
import generateNomenclature from "../atoms/generateNomenclature";
import {CronJob} from "cron";
import fs from "fs";

const currentSuivi = [];
export {currentSuivi};

let watcher;
console.log(process.env.NODE_ENV);

const promiseQueue = [];
const folderToWatch = [];

function initFoler() {
    return new Promise(resolve => {
        fs.readdir("Z:\\reception", function (err, codeEdis) {
            codeEdis.forEach((codeEdi, index) => {
                if (codeEdi !== "CALVACOM") {
                    fs.readdir(`Z:\\reception\\${codeEdi}`, function (err, folders) {
                        folders.forEach((folder) => {
                            if (folder === "descente") {
                                folderToWatch.push(`Z:\\reception\\${codeEdi}\\${folder}`)
                            }
                            if ((codeEdis.length - 1) === index) {
                                resolve(folderToWatch);
                            }
                        })
                    });
                }
            })
        });
    })
}

const jobMissZip = new CronJob('0 */30 * * * *', function () {
    console.log("RUN CRON JOB");
    fs.readdir("Z:\\reception", function (err, items) {
        items.forEach(codeEdi => {
            fs.readdir(`Z:\\${path.join("reception", codeEdi, "descente")}`, function (err, files) {
                if (!err) {
                    files.forEach(file => {
                        treatmentZip(`Z:\\reception\\${codeEdi}\\descente\\${file}`);
                    })
                }
            });
        });
    });
}, null, false, 'Europe/Paris');

initFoler().then((results) => {
    watcher = chokidar.watch(results, {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        }
    });

    watcher.on('add', filePath => {
        treatmentZip(filePath);
    });

    setTimeout(() => jobMissZip.start(), (15 * 60) * 1000)
});

function treatmentZip(filePath) {
    const codeEdi = filePath.split(path.sep)[filePath.split(path.sep).length - 3];
    const zipName = filePath.split(path.sep)[filePath.split(path.sep).length - 1].substring(0, filePath.split(path.sep)[filePath.split(path.sep).length - 1].length - 4);
    const id = `${codeEdi}_${zipName}`;
    if (_.endsWith(filePath, '.zip')) {
        console.log(`File ${filePath} has been added`);
        addSuivi(new Suivi(codeEdi, filePath.split(path.sep)[filePath.split(path.sep).length - 1]));
        changeStatus(id, "Unzipper");
        unZip(filePath)
            .then(documents => {
                if (documents.length > 0) {
                    changeStatus(id, "TraitFiles");
                    return traitFiles(documents);
                } else {
                    changeStatus(id, "Error Unzipper");
                    return Promise.reject(new GedError("Stop", `Stop after unzipper pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after unzipper", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(documents => {
                if (documents[1].length > 0) {
                    changeStatus(id, "ReadBarcodes");
                    changeProgress(id, 10);
                    return readBarcode(documents[1]);

                } else {
                    changeStatus(id, "Error TraitFiles");
                    return Promise.reject(new GedError("Stop", `Stop after traiFiles pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traiFiles", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(documents => {
                if (documents.length > 0) {
                    changeStatus(id, "TraitBarcodes");
                    changeProgress(id, 30);
                    return traitBarcode(documents);
                } else {
                    changeStatus(id, "Error ReadBarcodes");
                    return Promise.reject(new GedError("Stop", `Stop after readBarcodes pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after readBarcodes", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(positions => {
                if (positions.length > 0) {
                    changeStatus(id, "SavePositionsDB");
                    changeProgress(id, 50);
                    return savePositionsDB(positions);
                } else {
                    changeStatus(id, "Error TraitBarcodes");
                    return Promise.reject(new GedError("Stop", `Stop after traitBarcode pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traitBarcode", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(positions => {
                if (positions.length > 0) {
                    changeStatus(id, "CreateLdsAndJpg0");
                    changeProgress(id, 70);
                    return createLdsAndJpg0(positions);
                } else {
                    changeStatus(id, "Error SavePositionsDB");
                    return Promise.reject(new GedError("Stop", `Stop after savePositionsDB pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after savePositionsDB", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(positions => {
                if (positions.length > 0) {
                    changeStatus(id, "Archivage");
                    changeProgress(id, 80);
                    return archiveFiles(positions);
                } else {
                    changeStatus(id, "Error CreateLdsAndJpg0");
                    return Promise.reject(new GedError("Stop", `Stop after createLdsAndJpg0 pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after createLdsAndJpg0", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
                }
            })
            .then(positions => {
                changeStatus(id, "Retour");
                changeProgress(id, 90);
                return traitRetour(positions);
            })
            .then(() => {
                changeProgress(id, 100);
                removeSuivi(id);
                console.log("finish")
            })
            .catch(err => {
                //error handler
                console.log("Good error handling");
                console.log(err);
                setError(err);
            })
    }
}

// if (process.env.NODE_ENV === "development") {
//     watcher = chokidar.watch('reception', {
//         usePolling: true,
//         awaitWriteFinish: {
//             stabilityThreshold: 30000,
//             pollInterval: 5000
//         },
//         ignored: [
//             'reception/CALVACOM'
//         ]
//     });
// } else {
//     watcher = chokidar.watch(folderToWatch, {
//         usePolling: true,
//         awaitWriteFinish: {
//             stabilityThreshold: 30000,
//             pollInterval: 5000
//         }
//         // ,
//         // ignored: [
//         //     'Z:\\reception\\CALVACOM',
//         //     'Z:\\reception\\WILLLAL\\remonte',
//         //     'Z:\\reception\\TRAZMAR\\remonte'
//         // ]
//     });
// }


// watcher
//     .on('addDir', filePath => {
//         console.log(filePath);
//     })
//     .on('add', filePath => {
//         console.log(filePath);
//     });
// .on('unlinkDir', filePath => console.log(`Directory ${filePath} has been removed`))
// .on('error', error => console.log(`Watcher error: ${error}`))
// .on('ready', () => {
//     console.log(`>>>>INIALE ADD ${promiseQueue.length}`);
//     async.parallelLimit(promiseQueue, 1,
//         function (err, results) {
//             console.log(`>>>>FINISH INITIAL ADD ${promiseQueue.length}`);
//         })
// });

// .on('raw', (event, filePath, details) => {
//     console.log('Raw event info:', event, filePath, details);
// })
// .on('change', filePath => console.log(`File ${filePath} has been changed`))
// .on('unlink', filePath => console.log(`File ${filePath} has been removed`));


// watcherCalva
//     .on('unlinkDir', filePath => console.log(`Directory ${filePath} has been removed`))
//     .on('error', error => console.log(`Watcher error: ${error}`))
//     .on('ready', () => console.log('Initial scan complete. Ready for changes'))
//     // .on('raw', (event, filePath, details) => {
//     //     console.log('Raw event info:', event, filePath, details);
//     // })
//     .on('change', filePath => console.log(`File ${filePath} has been changed`))
//     .on('unlink', filePath => console.log(`File ${filePath} has been removed`));


let watcherCalva;
if (process.env.NODE_ENV === "development") {
    watcherCalva = chokidar.watch('reception/CALVACOM', {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        },
    });
} else {
    watcherCalva = chokidar.watch('Z:\\reception/CALVACOM/descente', {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        },
    });
}

let lines = [];
let treatCalvaActive = false;

function startTreatmentCalva() {
    setTimeout(() => {
        treatCalvaActive = false;
        saveGedDownloadDB(lines).then(imagesToDl => {
            lines = [];
            downloadImages(imagesToDl).then(documents => {
                //TODO status dl
                return traitBarcode(documents);
            }).then(positions => {
                return savePositionsDB(positions);
            }).then(positions => {
                return createLdsAndJpg0(positions);
            }).then(positions => {
                console.log(positions);
                return archiveFiles(positions);
            }).then(positions => {
                return traitRetour(positions);
            }).then(() => {
                //TODO status terminé delete de la bdd
            }).catch(err => {
                console.log(err);
            })
        }).catch(err => {
            console.log(err);
        })
    }, 5000)
}

// GedDownload.find({}).then(geds => {
//     traitBarcode(geds).then(positions => {
//         return savePositionsDB(positions);
//     }).then(positions => {
//         return createLdsAndJpg0(positions);
//     }).then(positions => {
//         return archiveFiles(positions);
//     }).then(positions => {
//         return traitRetour(positions);
//     })
// });

watcherCalva.on('add', filePath => {
    console.log(`File ${filePath} has been added`);
    if (_.endsWith(filePath, '.TXT')) {
        const lr = new LineByLineReader(filePath);
        lr.on('error', function (err) {
            // 'err' contains error object
        });

        lr.on('line', function (line) {
            lines.push({line: line, filePath: filePath});
        });

        lr.on('end', function () {
            if (!treatCalvaActive) {
                treatCalvaActive = true;
                startTreatmentCalva();
            }
        });
    }

});

// fs.readdir("Z:\\reception\\**\\descente", function (err, items) {
//     console.log("READIR END");
//     items.forEach(file => {
//         fs.createReadStream(`Z:\\reception\\AIO-LIS\\descente\\${file}`).pipe(unzip.Extract({path: "E:\\TEST"}))
//     });
// });


// import PositionMongo from "../Schema/PositionSchema";
//
//
//
// fs.readdir("Z:\\reception", function (err, items) {
//     items.forEach(codeEdi => {
//         console.log(`Z:\\${path.join("reception", codeEdi, "descente")}`)
//         // fs.readdir(`Z:\\reception\\${codeEdi}\\descente\\`, function (err, zips) {
//         fs.readdir(`Z:\\${path.join("reception", codeEdi, "descente")}`, function (err, zips) {
//             if (err) {
//
//             } else {
//                 zips.forEach(zip => {
//                     if (_.endsWith(zip, '.zip')) {
//                         fs.createReadStream(`Z:\\reception\\${codeEdi}\\descente\\${zip}`).pipe(unzip.Extract({path: `E:\\Ged_NodeJS\\output\\${codeEdi}\\${zip.slice(0, -4)}\\`}))
//                             .on('close', () => {
//                                 console.log('Ecriture output zip Close');
//                                 const outputDir = `output\\${codeEdi}\\${zip.slice(0, -4)}\\`;
//                                 const zipName = zip;
//                                 const filePath = `Z:\\reception\\${codeEdi}\\descente\\${zip}`;
//                                 new Promise((resolve, reject) => {
//                                     console.log(outputDir);
//                                     fs.readdir(outputDir, function (err, items) {
//                                         if (err) {
//                                             reject(new GedError("102", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
//                                             return;
//                                         }
//                                         const files = [];
//                                         SocieteMongo.findOne({
//                                             codeEdi: codeEdi
//                                         }).then((societe) => {
//                                             if (societe != null) {
//                                                 items.forEach(file => {
//                                                     const pathFile = path.join(outputDir, file);
//                                                     if (file !== "img" && file !== "doc_data.txt") {
//                                                         files.push(
//                                                             new Document(codeEdi, societe, zipName, pathFile)
//                                                         );
//                                                     }
//                                                 });
//                                                 resolve(files);
//
//                                             } else {
//                                                 reject(new GedError("200", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
//                                             }
//                                         }).catch(err => {
//                                             if (err) {
//                                                 reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
//                                             }
//                                         });
//                                     });
//                                 })
//                                     .then(documents => {
//                                         console.log("AFTER UNZIP")
//                                         if (documents.length > 0) {
//                                             return traitFiles(documents);
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after unzipper pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after unzipper", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(documents => {
//                                         console.log("AFTER TRAITFILE")
//                                         if (documents[1].length > 0) {
//                                             return readBarcode(documents[1]);
//
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after traiFiles pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traiFiles", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(documents => {
//                                         console.log("AFTER READ")
//                                         if (documents.length > 0) {
//                                             return traitBarcode(documents);
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after readBarcodes pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after readBarcodes", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(positions => {
//                                         if (positions.length > 0) {
//                                             return savePositionsDB(positions);
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after traitBarcode pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traitBarcode", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(positions => {
//                                         if (positions.length > 0) {
//                                             return createLdsAndJpg0(positions);
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after savePositionsDB pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after savePositionsDB", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(positions => {
//                                         if (positions.length > 0) {
//                                             return archiveFiles(positions);
//                                         } else {
//                                             return Promise.reject(new GedError("Stop", `Stop after createLdsAndJpg0 pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after createLdsAndJpg0", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
//                                         }
//                                     })
//                                     .then(positions => {
//                                         return traitRetour(positions);
//                                     })
//                                     .then(() => {
//                                         console.log("finish")
//                                     })
//                                     .catch(err => {
//                                         //error handler
//                                         console.log("Good error handling");
//                                         console.log(err);
//                                         setError(err);
//                                     })
//                             })
//                             .on('error', (err) => {
//                                 // console.log(`Z:\\reception\\${codeEdi}\\descente\\${zip}`);
//                                 // console.log(err)
//                             })
//                     }
//                 })
//
//
//             }
//         });
//     });
// });

//fs.createReadStream(`Z:\\reception\\AIO-LIS\\descente\\${file}`).pipe(unzip.Extract({path: "E:\\TEST"}))
