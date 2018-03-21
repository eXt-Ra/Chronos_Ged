import fs from 'fs'
import mkdirp from 'mkdirp';
import getSiretSociete from "../atoms/getSiretSociete";
import GedError from "../Class/GedError";
import setError from "./setError";
import * as path from "path";
import moment from 'moment'
import * as async from "async";

const exec = require('child_process').exec;

export default function createLdsAndJpg0(positions) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        positions.forEach(position => {
            position.documents.forEach(document => {
                const val1 = position.numeroDoc,
                    val2 = moment().format("DD/MM/YYYY"),
                    val3 = position.societe.siret,
                    val4 = position.numEquinoxe,
                    val5 = position.codeEdi,
                    val6 = "",
                    val7 = position.remettant.codeEdi,
                    val8 = "",
                    val9 = "",
                    val10 = new Date().toISOString().slice(0, 10).replace(/-/g, ""),
                    val11 = `${document.fileNameNoExt}.jpg`,
                    val12 = "ok";

                const dataLds = `<LDS001>\r\n<idx nb=12>\r\n${val1}\r\n${val2}\r\n${val3}\r\n${val4}\r\n${val5}\r\n${val6}\r\n${val7}\r\n${val8}\r\n${val9}\r\n${val10}\r\n${val11}\r\n${val12}\r\n<stamp nb=12>\r\n${val1}\r\n${val2}\r\n${val3}\r\n${val4}\r\n${val5}\r\n${val6}\r\n${val7}\r\n${val8}\r\n${val9}\r\n${val10}\r\n${val11}\r\n${val12}`;

                promiseQ.push(
                    function (callback) {
                        mkdirp(path.join(document.currentFileLocation, "lds"), () => {
                            fs.writeFile(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.lds`), dataLds, (err) => {
                                if (err) {
                                    callback(new GedError("LDS", `Creation LDS échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                }else{
                                    exec(`gm convert -density 400 "${document.filePath}" -resize 25% -quality 92 "${path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`)}"`, (err) => {
                                        if (err) {
                                            callback(new GedError("JP0", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                        }else{
                                            fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
                                                if (err) {
                                                    callback(new GedError("JP0", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                                }
                                                callback(null);
                                            });
                                        }
                                    })
                                }

                            });
                        });
                    }
                )
            });
        });

        async.parallelLimit(promiseQ, 3,
            function (errObj, results) {
                if (errObj) {
                    setError(errObj);
                }
                resolve(positions);
            });

        // Promise.all(promiseQ).then(() => {
        //     resolve(positions);
        // }).catch(err => {
        //     //TODO did this trigger ?
        //     console.log("Err that should not be trigger");
        //     reject(err);
        // })


    });
};