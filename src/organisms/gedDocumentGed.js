import mergePdfPdftk from "../atoms/mergePdfPdftk";
import mergePdf from "../atoms/mergePdf";
import generateOldGed from "../molecules/generateOldGed";
import PositionSchema from "../Schema/PositionSchema";
import * as path from "path";
import fileTypeCheck from "../atoms/fileTypeCheck";
import {updateSuiviRequestGed} from "./suiviRequestGed";
import fs from 'fs'
import url_crypt from "url-crypt";
import mkdirp from "mkdirp";
import converToPdf from "../atoms/converToPdf";
import converToJpg from "../atoms/converToJpg";

const urlCrypt = url_crypt('~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF');

export default function gedDocumentGed(numDocument, suivi, ...args) {

    let mode = "numDocument";
    if (args[0] !== undefined) {
        mode = "numEquinoxe";
    }

    let archiveLocation;
    if (process.env.NODE_ENV === "development") {
        archiveLocation = "";
    } else {
        archiveLocation = "Z:\\";
    }

    return new Promise(((resolve, reject) => {
        function findPosition() {
            if (mode === "numDocument") {
                return PositionSchema.findOne({
                    numeroDoc: numDocument
                });
            } else {
                return PositionSchema.findOne({
                    numEquinoxe: numDocument
                });
            }
        }

        findPosition()
            .then(position => {
                if (position !== null) {
                    if (suivi !== null) {
                        suivi.statut = "Documents trouvés ...";
                        suivi.numeroEquinoxe = position.numEquinoxe;
                        position.docs.forEach(doc => {
                            suivi.files.push({
                                fileName: doc.fileName
                            })
                        });
                        updateSuiviRequestGed(suivi);
                    }

                    //retourner les documents merger en pdf
                    fileTypeCheck(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, position.docs[0].fileName)}`)
                        .then(type => {
                                console.log(`${type}${args[0] ? `-${args[0]}` : ""}`);
                                switch (`${type}${args[0] ? `-${args[0]}` : ""}`) {
                                    case "pdf":
                                        if (suivi !== null) {
                                            suivi.statut = "Requête en préparation ...";
                                            suivi.progress = 70;
                                            updateSuiviRequestGed(suivi);
                                        }
                                        mergePdfPdftk(position.docs, position.numEquinoxe).then(files => {
                                            const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                                os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
                                            is.pipe(os);
                                            is.on('end', function () {
                                                if (suivi !== null) {
                                                    suivi.statut = "Fichier prêt";
                                                    suivi.fileName = urlCrypt.cryptObj(files[0]);
                                                    suivi.progress = 100;
                                                    updateSuiviRequestGed(suivi);
                                                }
                                                resolve(path.join(archiveLocation, "temp", files[0]));
                                                fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                });
                                            });
                                            is.on('error', function (err) {
                                                throw err;
                                            });
                                            os.on('error', function (err) {
                                                throw err;
                                            });
                                        }).catch(err => {
                                            console.log(err);
                                            // res.status(500).send(err);
                                        });
                                        break;
                                    case "jpg-pdf":
                                    case "tif-pdf":
                                        mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
                                            if (args[1]) {
                                                mergePdf(position.docs, position.numEquinoxe).then(files => {
                                                    const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                                        os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
                                                    is.pipe(os);
                                                    is.on('end', function () {
                                                        resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                        fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                        });
                                                    });
                                                    is.on('error', function (err) {
                                                        throw err;
                                                    });
                                                    os.on('error', function (err) {
                                                        throw err;
                                                    });
                                                }).catch(err => {
                                                    console.log(err);
                                                    // res.status(500).send(err);
                                                });
                                            } else {
                                                converToPdf(position.docs, position.numEquinoxe, false, false).then(documents => {
                                                    documents.forEach(document => {
                                                        const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
                                                            os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, document.fileName));
                                                        is.pipe(os);
                                                        is.on('end', function () {
                                                            resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                            fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`, err => {
                                                                if (err) {
                                                                    throw err;
                                                                }
                                                            });
                                                        });
                                                        is.on('error', function (err) {
                                                            throw err;
                                                        });
                                                        os.on('error', function (err) {
                                                            throw err;
                                                        });
                                                    });
                                                }).catch(err => {
                                                    console.log(err);
                                                })
                                            }

                                        });
                                        break;
                                    case "pdf-jpg":
                                        mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
                                            if (args[1]) {
                                                mergePdf(position.docs, position.numEquinoxe).then(files => {
                                                    const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                                        os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
                                                    is.pipe(os);
                                                    is.on('end', function () {
                                                        resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                        fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                        });
                                                    });
                                                    is.on('error', function (err) {
                                                        throw err;
                                                    });
                                                    os.on('error', function (err) {
                                                        throw err;
                                                    });
                                                }).catch(err => {
                                                    console.log(err);
                                                    // res.status(500).send(err);
                                                });
                                            } else {
                                                converToJpg(position.docs, position.numEquinoxe).then(documents => {
                                                    documents.forEach(document => {
                                                        const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
                                                            os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, document.fileName));
                                                        is.pipe(os);
                                                        is.on('end', function () {
                                                            resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                            fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`, err => {
                                                                if (err) {
                                                                    throw err;
                                                                }
                                                            });
                                                        });
                                                        is.on('error', function (err) {
                                                            throw err;
                                                        });
                                                        os.on('error', function (err) {
                                                            throw err;
                                                        });
                                                    });
                                                })
                                            }
                                        });
                                        break;
                                    case "pdf-pdf":
                                    case "jpg-jpg":
                                    case "tif-tif":
                                        mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
                                            if (args[1]) {
                                                mergePdf(position.docs, position.numEquinoxe).then(files => {
                                                    const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                                        os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
                                                    is.pipe(os);
                                                    is.on('end', function () {
                                                        resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                        fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                                            if (err) {
                                                                throw err;
                                                            }
                                                        });
                                                    });
                                                    is.on('error', function (err) {
                                                        throw err;
                                                    });
                                                    os.on('error', function (err) {
                                                        throw err;
                                                    });
                                                }).catch(err => {
                                                    console.log(err);
                                                    // res.status(500).send(err);
                                                });
                                            } else {
                                                position.docs.forEach((document, index) => {
                                                    const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
                                                        os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, `${index}_${document.fileName}`));
                                                    is.pipe(os);
                                                    is.on('end', function () {
                                                        resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
                                                    });
                                                    is.on('error', function (err) {
                                                        throw err;
                                                    });
                                                    os.on('error', function (err) {
                                                        throw err;
                                                    });
                                                });
                                            }
                                        });
                                        break;
                                    case "jpg":
                                    case "tif":
                                        if (suivi !== null) {
                                            suivi.statut = "Requête en préparation ...";
                                            suivi.progress = 70;
                                            updateSuiviRequestGed(suivi);
                                        }
                                        mergePdf(position.docs, position.numEquinoxe).then(files => {
                                            const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                                os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
                                            is.pipe(os);
                                            is.on('end', function () {
                                                if (suivi !== null) {
                                                    suivi.statut = "Fichier prêt";
                                                    suivi.fileName = urlCrypt.cryptObj(files[0]);
                                                    suivi.progress = 100;
                                                    resolve(path.join("temp", files[0]));
                                                    updateSuiviRequestGed(suivi);
                                                }
                                                fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                });
                                            });
                                            is.on('error', function (err) {
                                                throw err;
                                            });
                                            os.on('error', function (err) {
                                                throw err;
                                            });
                                        }).catch(err => {
                                            //TODO
                                            // res.status(500).send(err);
                                        });
                                        // });
                                        break;
                                        break;
                                    default:
                                        // res.status(404).send("Erreur fichier non supporté");
                                        return;
                                }
                            }
                        );
                } else {
                    generateOldGed(numDocument, suivi, mode, args[0], args[1]).then(file => {
                        if (suivi !== null) {
                            suivi.statut = "Fichier prêt";
                            suivi.fileName = urlCrypt.cryptObj(file);
                            suivi.progress = 100;
                            updateSuiviRequestGed(suivi);
                        }
                        if (mode === "numDocument") {
                            resolve(path.join("temp", file));
                        } else {
                            resolve(file);
                        }
                    }).catch(err => {
                        console.log("ERROR 2");
                        console.log(err);
                        reject(err);
                    })
                }
            })
    }))
}