import fs from 'fs-extra';
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
    let archiveLocation;
    if (process.env.NODE_ENV === "development") {
        archiveLocation = "";
    } else {
        archiveLocation = "Z:\\";
    }

    return new Promise((resolve, reject) => {
            const promiseQ = [];
            positions.forEach(position => {
                mkdirp(position.documents[0].currentFileLocation.replace("output", `${archiveLocation}archive`), () => {
                    position.documents.forEach(document => {
                        promiseQ.push(
                            new Promise((resolve, reject) => {
                                const is = fs.createReadStream(document.filePath),
                                    os = fs.createWriteStream(document.filePath.replace("output", `${archiveLocation}archive`));

                                is.pipe(os);

                                is.on('end', function () {
                                    fs.unlink(document.filePath, err => {
                                        if (err) {
                                            console.log(err);
                                            //setError(new GedError("110", `Delete du fichier source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                        } else {
                                            resolve();
                                        }
                                    });
                                });
                                is.on('error', function (err) {
                                    setError(new GedError("108", `Stream vers le fichier source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                });
                                os.on('error', function (err) {
                                    setError(new GedError("109", `Stream vers la destination source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));

                                });

                            }).catch(errObj => {
                                setError(errObj);
                            })
                        )
                    });
                });
            });

            if (positions[0].documents[0].filePath.indexOf("CALVACOM") > -1) {
                positions.forEach(position => {
                    promiseQ.push(
                        new Promise((resolve, reject) => {
                            mkdirp(position.documents[0].currentFileLocation.replace("output", `${archiveLocation}archive`), () => {
                                const is = fs.createReadStream(path.join(`${archiveLocation}reception`, "CALVACOM", "descente", position.archiveSource)),
                                    os = fs.createWriteStream(path.join(position.documents[0].currentFileLocation.replace("output", `${archiveLocation}archive`), position.archiveSource));

                                is.pipe(os);

                                is.on('end', function () {
                                    fs.unlink(path.join(`${archiveLocation}reception`, "CALVACOM", "descente", position.archiveSource), err => {
                                        resolve();
                                    });
                                });
                                is.on('error', function (err) {
                                    setError(new GedError("108", `Stream vers le fichier source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                });
                                os.on('error', function (err) {
                                    setError(new GedError("109", `Stream vers la destination source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                });
                            });

                        }).catch(errObj => {
                            setError(errObj);
                        })
                    );
                })
            } else {
                promiseQ.push(
                    new Promise((resolve, reject) => {
                        mkdirp(positions[0].documents[0].currentFileLocation.replace("output", `${archiveLocation}archive`), () => {
                            const is = fs.createReadStream(path.join(`${archiveLocation}reception`, positions[0].codeEdi, "descente", positions[0].archiveSource)),
                                os = fs.createWriteStream(path.join(positions[0].documents[0].currentFileLocation.replace("output", `${archiveLocation}archive`), positions[0].archiveSource));

                            is.pipe(os);

                            is.on('end', function () {
                                fs.unlink(path.join(`${archiveLocation}reception`, positions[0].codeEdi, "descente", positions[0].archiveSource), err => {
                                    if (err) {
                                        console.log(err)
                                        //setError(new GedError("110", `Delete du fichier source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                    } else {
                                        resolve();
                                    }
                                });
                            });
                            is.on('error', function (err) {
                                setError(new GedError("108", `Stream vers le fichier source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                            });
                            os.on('error', function (err) {
                                setError(new GedError("109", `Stream vers la destination source pour archivage échoué ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                            });
                        });

                    }).catch(errObj => {
                        setError(errObj);
                    })
                );
            }
            promiseQ.push(
                new Promise((resolve, reject) => {
                    ncp(path.join(positions[0].documents[0].currentFileLocation, "lds"), `${archiveLocation}lds`, function (err) {
                        if (err) {
                            reject(new GedError("107", `Déplacement des LDS échoué de ${positions[0].documents[0].currentFileLocation}/lds`, positions[0].archiveSource, positions[0].archiveSource, err, positions[0].codeEdi, 2, false, positions));
                        }
                        resolve();
                    })
                }).catch(errObj => {
                    setError(errObj);
                })
            );
            Promise.all(promiseQ).then(() => {
                if (positions[0].documents[0].filePath.indexOf("CALVACOM") > -1) {
                    positions.forEach(position => {
                        position.documents.forEach(document => {
                            document.currentFileLocation = document.currentFileLocation.replace("output", "archive")
                        });

                        // PositionSchema.findOneAndUpdate(
                        //     {numEquinoxe: position.numEquinoxe},
                        //     {$set: {docs: position.docsToSchema}}, function (err) {
                        //         if (err) {
                        //             console.log(err);
                        //         }
                        //     });

                        PositionSchema.findOne({
                            numEquinoxe: position.numEquinoxe
                        }).then((positionInMongo) => {
                            if (positionInMongo != null) {
                                positionInMongo.docs.forEach(document => {
                                    document.currentFileLocation = document.currentFileLocation.replace("output", "archive");
                                });
                                positionInMongo.markModified('docs');
                                positionInMongo.save();
                            }
                        }).catch(err => {
                            reject(new GedError("204", `Select DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                        });
                    });
                    resolve(positions);
                } else {
                    rimraf(positions[0].documents[0].currentFileLocation, () => {
                        positions.forEach(position => {
                            position.documents.forEach(document => {
                                document.currentFileLocation = document.currentFileLocation.replace("output", "archive")
                            });

                            // PositionSchema.findOneAndUpdate(
                            //     {numEquinoxe: position.numEquinoxe},
                            //     {$set: {docs: position.docsToSchema}}, function (err) {
                            //         if (err) {
                            //             console.log(err);
                            //         }
                            //     });

                            PositionSchema.findOne({
                                numEquinoxe: position.numEquinoxe
                            }).then((positionInMongo) => {
                                console.log(positionInMongo);
                                if (positionInMongo != null) {
                                    positionInMongo.docs.forEach(document => {
                                        document.currentFileLocation = document.currentFileLocation.replace("output", "archive");
                                    });
                                    positionInMongo.markModified('docs');
                                    positionInMongo.save();
                                }
                            }).catch(err => {
                                reject(new GedError("204", `Select DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                            });
                        });
                        resolve(positions);
                    });
                }
            }).catch(err => {
                //TODO did this trigger ?
                console.log("Err that should not be trigger");
                reject(err);
            })

        }
    )
}