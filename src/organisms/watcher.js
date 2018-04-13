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

const currentSuivi = [];
export {currentSuivi};

let watcher;
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
    watcher = chokidar.watch('reception', {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        },
        ignored: [
            'reception/CALVACOM'
        ]
    });
} else {
    watcher = chokidar.watch('Z:\\reception', {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        },
        ignored: [
            'reception/CALVACOM'
        ]
    });
}

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
    watcherCalva = chokidar.watch('Z:\\reception/CALVACOM', {
        usePolling: true,
        awaitWriteFinish: {
            stabilityThreshold: 30000,
            pollInterval: 5000
        },
    });
}


watcher
// .on('addDir', filePath => {
//     console.log(filePath.split(path.sep))
// })
    .on('unlinkDir', filePath => console.log(`Directory ${filePath} has been removed`))
    .on('error', error => console.log(`Watcher error: ${error}`))
    .on('ready', () => console.log('Initial scan complete. Ready for changes'))
    // .on('raw', (event, filePath, details) => {
    //     console.log('Raw event info:', event, filePath, details);
    // })
    .on('change', filePath => console.log(`File ${filePath} has been changed`))
    .on('unlink', filePath => console.log(`File ${filePath} has been removed`));

watcher.on('add', filePath => {
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
});


watcherCalva
    .on('unlinkDir', filePath => console.log(`Directory ${filePath} has been removed`))
    .on('error', error => console.log(`Watcher error: ${error}`))
    .on('ready', () => console.log('Initial scan complete. Ready for changes'))
    // .on('raw', (event, filePath, details) => {
    //     console.log('Raw event info:', event, filePath, details);
    // })
    .on('change', filePath => console.log(`File ${filePath} has been changed`))
    .on('unlink', filePath => console.log(`File ${filePath} has been removed`));

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