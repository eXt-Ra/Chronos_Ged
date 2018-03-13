import fs from 'fs';
import mkdirp from "mkdirp";
import rimraf from 'rimraf';
import GedError from "../Class/GedError";
import setError from "../molecules/setError";
import * as path from "path";
import SuiviSchema from "../Schema/SuiviSchema";
import PositionSchema from "../Schema/PositionSchema";

var ncp = require('ncp').ncp;
ncp.limit = 16;

export default function archiveFiles(positions) {
    return new Promise((resolve, reject) => {
            const promiseQ = [];
            positions.forEach(position => {
                mkdirp(position.documents[0].currentFileLocation.replace("output", "archive"), () => {
                    position.documents.forEach(document => {
                        promiseQ.push(
                            new Promise((resolve, reject) => {
                                fs.rename(document.filePath, document.filePath.replace("output", "archive"), function (err) {
                                    if (err) {
                                        reject(new GedError("Archive", `Archive du fichier échoué de ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                    } else {
                                        resolve();
                                    }
                                });
                            }).catch(errObj => {
                                setError(errObj);
                            })
                        )
                    });
                });
            });
            promiseQ.push(
                new Promise((resolve, reject) => {
                    fs.rename(path.join("reception", positions[0].codeEdi, "descente", positions[0].archiveSource), path.join(positions[0].documents[0].currentFileLocation.replace("output", "archive"), positions[0].archiveSource), function (err) {
                        if (err) {
                            console.log("archive du erreur");
                            reject(new GedError("Archive", `Archive du zip échoué de ${ positions[0].archiveSource}`, positions[0].archiveSource, positions[0].archiveSource, err, positions[0].codeEdi, 2, false));
                        }
                        resolve();
                    });
                }).catch(errObj => {
                    setError(errObj);
                })
            );
            promiseQ.push(
                new Promise((resolve, reject) => {
                    ncp(path.join(positions[0].documents[0].currentFileLocation, "lds"), `lds`, function (err) {
                        if (err) {
                            reject(new GedError("Archive", `Déplacement des LDS échoué de ${positions[0].documents[0].currentFileLocation}/lds`, positions[0].archiveSource, positions[0].archiveSource, err, positions[0].codeEdi, 2, false));
                        }
                        resolve();
                    })
                }).catch(errObj => {
                    setError(errObj);
                })
            );
            Promise.all(promiseQ).then(() => {
                rimraf(positions[0].documents[0].currentFileLocation, () => {
                    positions.forEach(position => {
                        position.documents.forEach(document => {
                            document.currentFileLocation = document.currentFileLocation.replace("output", "archive")
                        });

                        PositionSchema.findOneAndUpdate(
                            {numEquinoxe: position.numEquinoxe},
                            {$set: {docs: position.docsToSchema}}, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    });
                    resolve(positions);
                });
            }).catch(err => {
                //TODO did this trigger ?
                console.log("Err that should not be trigger");
                reject(err);
            })

        }
    )
}