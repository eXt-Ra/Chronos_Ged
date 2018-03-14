import chokidar from 'chokidar';
import _ from 'lodash';
import unZip from '../atoms/unzipper';
import traitFiles from './../molecules/traitFiles';
import readBarcode from '../molecules/readBarcode';
import traitBarcode from '../molecules/traitBarcode';
import savePositionsDB from '../molecules/savePositionsDB';
import createLdsAndJpg0 from '../molecules/createLdsAndJpg0';
import archiveFiles from "../atoms/archiveFiles";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import {addSuivi, changeProgress, changeStatus, removeSuivi} from "./suiviTreatment";
import Suivi from "../Class/Suivi";

import path from 'path'
import traitRetour from "../molecules/traitRetour";

const watcher = chokidar.watch('reception', {
    awaitWriteFinish: true
});

// addSuivi(new Suivi("SOC-TEST", "test.zip"));
// setTimeout(function () {
//     changeProgress("SOC-TEST_test", 10);
//     changeStatus("SOC-TEST_test", "State 1");
//     setTimeout(function () {
//         changeProgress("SOC-TEST_test", 30);
//         addSuivi(new Suivi("YOLO-TEST", "test.zip"));
//         changeStatus("SOC-TEST_test", "State 2");
//         setTimeout(function () {
//             changeProgress("SOC-TEST_test", 50);
//             changeProgress("YOLO-TEST_test", 20);
//             changeStatus("SOC-TEST_test", "State 3");
//             setTimeout(function () {
//                 changeProgress("SOC-TEST_test", 70);
//                 changeProgress("YOLO-TEST_test", 50);
//                 changeStatus("SOC-TEST_test", "State 4");
//                 setTimeout(function () {
//                     changeProgress("SOC-TEST_test", 90);
//                     changeProgress("YOLO-TEST_test", 70);
//                     changeStatus("SOC-TEST_test", "State 5");
//                     setTimeout(function () {
//                         changeProgress("SOC-TEST_test", 100);
//                         changeProgress("YOLO-TEST_test", 90);
//                         changeStatus("SOC-TEST_test", "State 6");
//                         setTimeout(function () {
//                             changeProgress("YOLO-TEST_test", 100);
//                         }, 3000);
//                     }, 3000);
//                 }, 3000);
//             }, 3000);
//         }, 3000);
//     }, 3000);
// }, 3000);

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
    console.log(`File ${filePath} has been added`);
    const codeEdi = filePath.split(path.sep)[filePath.split(path.sep).length - 3];
    const zipName = filePath.split(path.sep)[filePath.split(path.sep).length - 1].substring(0, filePath.split(path.sep)[filePath.split(path.sep).length - 1].length - 4);
    const id = `${codeEdi}_${zipName}`;
    if (_.endsWith(filePath, '.zip')) {
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
                    if (documents[0] === "barcode") {
                        changeStatus(id, "ReadBarcodes");
                        changeProgress(id, 10);
                        return readBarcode(documents[1]);
                    } else {
                        return Promise.resolve(documents[1]);
                    }
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