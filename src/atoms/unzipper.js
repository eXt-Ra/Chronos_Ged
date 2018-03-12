import unzip from 'unzip';
import fs from 'fs';
import fstream from 'fstream';
import rimraf from 'rimraf';
import fileTypeCheck from './fileTypeCheck'
import mkdirp from 'mkdirp';
import Document from '../Class/Document'
import SocieteMongo from './../Schema/SocieteSchema';
import PositionMongo from "../Schema/PositionSchema";
import GedError from "../Class/GedError";
import path from "path";

export default function unZip(pathZip) {
    return new Promise((resolve, reject) => {
            const arrSplit = pathZip.split(path.sep);
            console.log(arrSplit);
            const codeEdi = arrSplit[arrSplit.length - 3];
            console.log(codeEdi);
            const zipFolder = arrSplit[arrSplit.length - 1].slice(0, -4);
            const zipName = arrSplit[arrSplit.length - 1];
            const outputDir = path.join("output",codeEdi,zipFolder);
            fileTypeCheck(pathZip).then(type => {
                if (type == "zip") {
                    fs.access(outputDir, err => {
                        if (!err) {
                            rimraf(outputDir, () => {
                                unZipInDir(codeEdi, zipName);
                            });
                        } else {
                            unZipInDir(codeEdi, zipName);
                        }

                        function unZipInDir(codeEdi, zipName) {
                            const readStream = fs.createReadStream(pathZip);
                            mkdirp(outputDir, () => {
                                const writeStream = fstream.Writer(outputDir);
                                const stream = readStream
                                    .pipe(unzip.Parse())
                                    .on('error', err => {
                                        reject(new GedError("Zip", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
                                    })
                                    .pipe(writeStream)
                                    .on('error', err => {
                                        reject(new GedError("Zip", "Erreur lors de l'écriture du output du fichier zip", zipName, zipName, err, codeEdi, 3, true));
                                    });

                                stream.on('close', () => {
                                    fs.readdir(outputDir, function (err, items) {
                                        if (err) {
                                            reject(new GedError("Zip", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
                                            return;
                                        }
                                        const files = [];

                                        SocieteMongo.findOne({
                                            codeEdi: codeEdi
                                        }).then((societe) => {
                                            if (societe != null) {
                                                items.forEach(file => {
                                                    const pathFile = path.join(outputDir, file);
                                                    files.push(
                                                        new Document(codeEdi, societe, zipName, pathFile)
                                                    );
                                                });
                                                resolve(files);

                                            } else {
                                                reject(new GedError("DB", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                                            }
                                        }).catch(err => {
                                            if (err) {
                                                reject(new GedError("DB", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    });
                } else {
                    reject(new GedError("Zip", `Pas un fichier .zip`, zipName, zipName, "", codeEdi, 3, true));
                }
            }).catch(err => {
                reject(new GedError("Zip", `Erreur lors du test de type de fichier`, zipName, zipName, err, codeEdi, 3, true));
            })
        }
    );
};


