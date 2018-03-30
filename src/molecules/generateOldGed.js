import getDataStockdoc from "../atoms/getDataStockdoc";
import genImgOldGed from "./genImgOldGed";
import insertJOBS from "../atoms/insertJOBS";
import conn from './../conn'
import * as path from "path";
import mergePdf from "../atoms/mergePdf";
import {updateSuiviRequestGed} from "../organisms/suiviRequestGed";
import fs from 'fs';

export default function (numDoc, suivi) {
    let archiveLocation;
    if (process.env.NODE_ENV === "development") {
        archiveLocation = "";
    } else {
        archiveLocation = "Z:\\";
    }
    let numeroEquinoxe= "";
    return new Promise((resolve, reject) => {
        getDataStockdoc(numDoc).then(documents => {
            // TODO request with id files = documents, statut Ged trouvé, progress 0%
            suivi.statut = "Documents trouvés ...";
            numeroEquinoxe = documents[0].numeroEquinoxe;
            suivi.numeroEquinoxe = documents[0].numeroEquinoxe;
            documents.forEach(doc => {
                suivi.files.push({
                    fileName: doc.numenreg
                })
            });
            updateSuiviRequestGed(suivi);
            genImgOldGed(documents).then(result => {
                // TODO request with id files progress 25% requete préparé
                suivi.statut = "Requête en préparation ...";
                suivi.progress = 25;
                updateSuiviRequestGed(suivi);
                return insertJOBS(result.requests, result.jobIDs);
            }).then(jobIDs => {
                // TODO request with id files progress 50% requete en file d'attente
                suivi.statut = "File d'attente ...";
                suivi.progress = 50;
                updateSuiviRequestGed(suivi);
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
                    suivi.statut = "Fichier en préparation pour envoi ...";
                    suivi.progress = 70;
                    updateSuiviRequestGed(suivi);
                    // resolve("test.pdf");
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
                }).catch(err => {
                    suivi.statut = "ERROR";
                    suivi.progress = 70;
                    updateSuiviRequestGed(suivi);
                    reject();
                });
            })
        })
    })
}