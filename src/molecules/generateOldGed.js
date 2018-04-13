import getDataStockdoc from "../atoms/getDataStockdoc";
import genImgOldGed from "./genImgOldGed";
import insertJOBS from "../atoms/insertJOBS";
import conn from './../conn'
import * as path from "path";
import mergePdf from "../atoms/mergePdf";
import {updateSuiviRequestGed} from "../organisms/suiviRequestGed";
import fs from 'fs';
import PositionSchema from "../Schema/PositionSchema";
import converToPdf from "../atoms/converToPdf";
import mkdirp from "mkdirp";
import Position from "../Class/Position";
import mergeJpg from "../atoms/mergeJpg";

export default function (numDoc, suivi, mode, type, merge) {
    let archiveLocation;
    if (process.env.NODE_ENV === "development") {
        archiveLocation = "";
    } else {
        archiveLocation = "Z:\\";
    }
    let numeroEquinoxe = "";
    let codeEdi = "";
    return new Promise((resolve, reject) => {
        function findPosition() {
            if (mode === "numDocument") {
                return getDataStockdoc(numDoc, false)
            } else {
                return getDataStockdoc(numDoc, true)
            }
        }

        findPosition().then(documents => {
            numeroEquinoxe = documents[0].numeroEquinoxe;
            codeEdi = documents[0].val5;
            if (suivi !== null) {
                suivi.statut = "Documents trouvés ...";
                suivi.numeroEquinoxe = documents[0].numeroEquinoxe;
                documents.forEach(doc => {
                    suivi.files.push({
                        fileName: doc.numenreg
                    })
                });
                updateSuiviRequestGed(suivi);
            }
            genImgOldGed(documents).then(result => {
                if (suivi !== null) {
                    suivi.statut = "Requête en préparation ...";
                    suivi.progress = 25;
                    updateSuiviRequestGed(suivi);
                }
                return insertJOBS(result.requests, result.jobIDs);
            }).then(jobIDs => {
                if (suivi !== null) {
                    suivi.statut = "File d'attente ...";
                    suivi.progress = 50;
                    updateSuiviRequestGed(suivi);
                }
                const promiseQ = [];
                jobIDs.forEach(jobId => {
                    // console.log(jobId);
                    promiseQ.push(new Promise((resolve2, reject2) => {
                        function requestStatutJob(jobId) {
                            conn.pool.getConnection((err, connection) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    connection.query(`select JOBSTATE from d_jobs where jobid = '${jobId}'`, function (error, lines) {
                                        if (error) {
                                            throw error;
                                        }
                                        switch (lines[0].JOBSTATE) {
                                            case "IDL":
                                                setTimeout(() => {
                                                    // console.log("IDL");
                                                    requestStatutJob(jobId);
                                                }, 1000);
                                                connection.release();
                                                break;
                                            case "CRS":
                                                setTimeout(() => {
                                                    // console.log("CRS");
                                                    requestStatutJob(jobId);
                                                }, 1000);
                                                connection.release();
                                                break;
                                            case "ERR":
                                                console.log("ERR");
                                                connection.release();
                                                reject2("error");
                                                break;
                                            case "END":
                                                // console.log("END");
                                                connection.release();
                                                resolve2(path.join("temp", `${jobId}.JPG0`));
                                                break;
                                            default:
                                                console.log(lines[0].JOBSTATE);
                                                connection.release();
                                                break;
                                        }
                                    });
                                }
                            });
                        }

                        setTimeout(() => {
                            requestStatutJob(jobId);
                        }, 1000);
                    }))
                });
                Promise.all(promiseQ).then((filesPath) => {
                    if (suivi !== null) {
                        suivi.statut = "Fichier en préparation pour envoi ...";
                        suivi.progress = 70;
                        updateSuiviRequestGed(suivi);
                    }
                    // resolve("test.pdf");
                    if (mode === "numDocument") {
                        mergePdf(filesPath, numeroEquinoxe !== "" ? numeroEquinoxe : numDoc, true).then(files => {
                            //unlink des filesPath
                            filesPath.forEach(file => {
                                fs.unlink(path.join(archiveLocation, file), err => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            });

                            resolve(files[0]);
                        }).catch(err => {
                            console.log(err);
                        });
                    } else {
                        switch (type) {
                            case "pdf":
                                mkdirp(path.join(archiveLocation, "temp", numeroEquinoxe), (err) => {
                                    if (merge) {
                                        mergePdf(filesPath, numeroEquinoxe !== "" ? numeroEquinoxe : numDoc, true).then(files => {
                                            //unlink des filesPath
                                            filesPath.forEach(file => {
                                                fs.unlink(path.join(archiveLocation, file), err => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                });
                                            });
                                            const is = fs.createReadStream(path.join(archiveLocation, "temp", files[0])),
                                                os = fs.createWriteStream(path.join(archiveLocation, "temp", numeroEquinoxe, files[0]));
                                            is.pipe(os);
                                            is.on('end', function () {
                                                resolve([path.join(archiveLocation, "temp", numeroEquinoxe), new Position(numeroEquinoxe, codeEdi, "", "")]);
                                                // fs.unlink(path.join(archiveLocation, "temp", document.fileName), err => {
                                                //     if (err) {
                                                //         throw err;
                                                //     }
                                                // });
                                            });
                                            is.on('error', function (err) {
                                                throw err;
                                            });
                                            os.on('error', function (err) {
                                                throw err;
                                            });
                                        }).catch(err => {
                                            console.log(err);
                                        });
                                    } else {
                                        converToPdf(filesPath, numeroEquinoxe, false, true).then(documents => {
                                            documents.forEach(document => {
                                                const is = fs.createReadStream(path.join(archiveLocation, "temp", document.fileName)),
                                                    os = fs.createWriteStream(path.join(archiveLocation, "temp", numeroEquinoxe, document.fileName));
                                                is.pipe(os);
                                                is.on('end', function () {
                                                    resolve([path.join(archiveLocation, "temp", numeroEquinoxe), new Position(numeroEquinoxe, codeEdi, "", "")]);
                                                    // fs.unlink(path.join(archiveLocation, "temp", document.fileName), err => {
                                                    //     if (err) {
                                                    //         throw err;
                                                    //     }
                                                    // });
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
                            case "jpg":
                                mkdirp(path.join(archiveLocation, "temp", numeroEquinoxe), (err) => {
                                    if (merge) {
                                        mergeJpg(filesPath, numeroEquinoxe !== "" ? numeroEquinoxe : numDoc, true).then(files => {
                                            //unlink des filesPath
                                            filesPath.forEach(file => {
                                                fs.unlink(path.join(archiveLocation, file), err => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                });
                                            });
                                            const is = fs.createReadStream(path.join(archiveLocation, "temp", files[0])),
                                                os = fs.createWriteStream(path.join(archiveLocation, "temp", numeroEquinoxe, files[0]));
                                            is.pipe(os);
                                            is.on('end', function () {
                                                resolve([path.join(archiveLocation, "temp", numeroEquinoxe), new Position(numeroEquinoxe, codeEdi, "", "")]);
                                                // fs.unlink(path.join(archiveLocation, "temp", document.fileName), err => {
                                                //     if (err) {
                                                //         throw err;
                                                //     }
                                                // });
                                            });
                                            is.on('error', function (err) {
                                                throw err;
                                            });
                                            os.on('error', function (err) {
                                                throw err;
                                            });
                                        }).catch(err => {
                                            console.log(err);
                                        });
                                    } else {
                                        filesPath.forEach((file, index) => {
                                            const is = fs.createReadStream(path.join(archiveLocation, file)),
                                                // os = fs.createWriteStream(path.join(archiveLocation, `${file.substring(0, file.length - 5)}.jpg`));
                                                os = fs.createWriteStream(path.join(archiveLocation, "temp", numeroEquinoxe, `${index}_${file.split(path.sep)[1].substring(0, file.length - 5)}.jpg`));
                                            is.pipe(os);
                                            is.on('end', function () {
                                                resolve([path.join(archiveLocation, "temp", numeroEquinoxe), new Position(numeroEquinoxe, codeEdi, "", "")]);
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
                            default:
                                console.log(type);
                                console.log("Type de fichier non pris en charge");
                                break;
                        }
                    }
                }).catch(err => {
                    if (suivi !== null) {
                        suivi.statut = "ERROR";
                        suivi.progress = 70;
                        updateSuiviRequestGed(suivi);
                    }
                    console.log("ERROR 1");
                    reject(err);
                });
            })
        })
    })
}