// const exec = require('child_process').exec;
// import fs from 'fs'
// import mkdirp from 'mkdirp';
// import _ from 'lodash'
// import GedError from "../Class/GedError";
// import setError from "../molecules/setError";
// import * as path from "path";
//
// export default function convertTifToSplitJpg(document) {
//     return new Promise((resolve, reject) => {
//         mkdirp(`${document.currentFileLocation}/img`, () => {
//             fs.readdir(`${document.currentFileLocation}/img`, function (err, files) {
//                 if (err) {
//                     reject(new GedError("114", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
//                     return;
//                 }
//                 const currentFileInImg = files;
//
//                 exec(`gm convert "${document.filePath}" +adjoin "${path.join(document.currentFileLocation,"img",`${document.fileNameNoExt}%02d.jpg`)}"`, (error) => {
//                     if (error) {
//                         reject(new GedError("117", `Error on gm cmd de ${document.fileName}`, document.fileName, document.archiveSource, error, document.codeEdi, 2, false));
//                         return;
//                     }
//                     fs.readdir(`${document.currentFileLocation}/img`, function (err, items) {
//                         if (err) {
//                             reject(new GedError("114", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
//                             return;
//                         }
//                         _.difference(items, currentFileInImg).forEach(newImg => {
//                             if (newImg.indexOf(document.fileNameNoExt) !== -1){
//                                 document.jpgFile = newImg;
//                             }
//                         });
//                         resolve(document);
//                     });
//                 })
//             });
//         });
//     }).catch(errObj =>{
//         //TODO
//         setError(errObj);
//     });
// }

import GedError from "../Class/GedError";

const exec = require('child_process').exec;
import fs from 'fs';
import _ from 'lodash';
import Document from './../Class/Document'
import * as path from "path";
import setError from "../molecules/setError";

export default function splittif(document) {
    return new Promise((resolve, reject) => {
        fs.readdir(document.currentFileLocation, function (err, files) {
            if (err) {
                reject(new GedError("114", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                return;
            }
            const currentFiles = files;
            exec(`gm convert "${document.filePath}" +adjoin "${path.join(document.currentFileLocation, `${document.fileNameNoExt}%02d.jpg`)}"`, (error) => {
                if (error) {
                    reject(new GedError("115", `Error on pdftk cmd de ${document.fileName}`, document.fileName, document.archiveSource, error, document.codeEdi, 2, false));
                    return;
                }

                fs.unlink(`${document.filePath}`, err => {
                    if (err) {
                        reject(new GedError("116", `Error au moment de la supp du ficher pdf source du split ${document.fileName}`, "unknown", document.archiveSource, err, document.codeEdi, 1, false));
                    }
                    fs.readdir(document.currentFileLocation, function (err, items) {
                        if (err) {
                            reject(new GedError("114", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                            return;
                        }
                        const newDocs = [];
                        _.difference(items, currentFiles).forEach(newDoc => {
                            if (newDoc.indexOf(document.fileNameNoExt) !== -1) {
                                newDocs.push(new Document(document.codeEdi, document.societe, document.archiveSource, path.join(document.currentFileLocation, newDoc)))
                            }
                        });
                        resolve(newDocs);
                    });
                });

            })

        });
    }).catch(errObj => {
        //TODO
        setError(errObj);
    });
}