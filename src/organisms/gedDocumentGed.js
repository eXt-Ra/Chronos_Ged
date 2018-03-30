import mergePdfPdftk from "../atoms/mergePdfPdftk";
import mergePdf from "../atoms/mergePdf";
import generateOldGed from "../molecules/generateOldGed";
import PositionSchema from "../Schema/PositionSchema";
import * as path from "path";
import fileTypeCheck from "../atoms/fileTypeCheck";
import {updateSuiviRequestGed} from "./suiviRequestGed";
import fs from 'fs'
import url_crypt from "url-crypt";
const urlCrypt = url_crypt('~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF');

export default function gedDocumentGed(numDocument, suivi) {
    let archiveLocation;
    if (process.env.NODE_ENV === "development") {
        archiveLocation = "";
    } else {
        archiveLocation = "Z:\\";
    }

    return new Promise(((resolve, reject) => {
        PositionSchema.findOne({
            numeroDoc: numDocument
        }).then(position => {
            if (position !== null) {
                suivi.statut = "Documents trouvés ...";
                suivi.numeroEquinoxe = position.numEquinoxe;
                position.docs.forEach(doc => {
                    suivi.files.push({
                        fileName: doc.fileName
                    })
                });
                updateSuiviRequestGed(suivi);
                //retourner les documents merger en pdf
                fileTypeCheck(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, position.docs[0].fileName)}`).then(type => {
                    switch (type) {
                        case "pdf":
                            suivi.statut = "Requête en préparation ...";
                            suivi.progress = 70;
                            updateSuiviRequestGed(suivi);
                            mergePdfPdftk(position.docs, position.numEquinoxe).then(files => {
                                const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                    os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
                                is.pipe(os);
                                is.on('end', function () {
                                    suivi.statut = "Fichier prêt";
                                    suivi.fileName = urlCrypt.cryptObj(files[0]);
                                    suivi.progress = 100;
                                    updateSuiviRequestGed(suivi);
                                    resolve(path.join("temp", files[0]));
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
                        case "jpg":
                            suivi.statut = "Requête en préparation ...";
                            suivi.progress = 70;
                            updateSuiviRequestGed(suivi);
                            mergePdf(position.docs, position.numEquinoxe).then(files => {
                                const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                    os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
                                is.pipe(os);
                                is.on('end', function () {
                                    suivi.statut = "Fichier prêt";
                                    suivi.fileName = urlCrypt.cryptObj(files[0]);
                                    suivi.progress = 100;
                                    resolve(path.join("temp", files[0]));
                                    updateSuiviRequestGed(suivi);
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
                        case "tif":
                            //TODO
                            break;
                        default:
                            // res.status(404).send("Erreur fichier non supporté");
                            return;
                    }
                });
            } else {
                generateOldGed(numDocument, suivi).then(file => {
                    suivi.statut = "Fichier prêt";
                    suivi.fileName = urlCrypt.cryptObj(file);
                    suivi.progress = 100;
                    updateSuiviRequestGed(suivi);
                    resolve(path.join("temp", file));

                    () => {
                        // res.set({
                        //     'Content-Type': 'application/pdf',
                        //     'Transfer-Encoding': 'chunked'
                        // });

                        // file = "./test.pdf";
                        // fs.stat(file, function (err, stats) {
                        //     const fileSize = stats.size;
                        //     let uploadedSize = 0;

                        // Create a new read stream so we can plug events on it, and get the upload progress
                        // // // fileReadStream.pipe(res);
                        // fileReadStream.on('end', function (dd) {
                        //     const data = {
                        //         id: id,
                        //         numeroEquinoxe: numeroEquinoxe,
                        //         statut: "process",
                        //         files: [],
                        //         base64 : dd
                        //     };
                        //     const appString = renderToString(<DocumentInterface data={data}/>);
                        //
                        // res.send(template({
                        //     body: appString,
                        //     title: numeroEquinoxe
                        // }));
                        // });


                        // const fileReadStream = fs.createReadStream(file, {encoding: 'base64'});
                        // let base64 = "";
                        // fileReadStream.on('data', function (buffer) {
                        //     const segmentLength = buffer.length;
                        //
                        //     // Increment the uploaded data counter
                        //     uploadedSize += segmentLength;
                        //     base64 += buffer;
                        //
                        //     // Display the upload percentage
                        //     console.log("Progress:\t", ((uploadedSize / fileSize * 100).toFixed(2) + "%"));
                        // });
                        //
                        // // Some other events you might want for your code
                        // fileReadStream.on('end', function () {
                        //     // console.log(base64)
                        //     const data = {
                        //         id: id,
                        //         numeroEquinoxe: numeroEquinoxe,
                        //         statut: "process",
                        //         files: [],
                        //         base64: base64
                        //     };
                        // });
                        //
                        // fileReadStream.on('close', function () {
                        //     console.log("Event: close");
                        // });
                        // });
                    }


                }).catch(err => {
                    //TODO
                })
            }
        })
    }))
}