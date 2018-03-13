import fileTypeCheck from "./fileTypeCheck";
import traitJpg from "./traitJpg";
import traitTif from "./traitTif";
import GedError from "../Class/GedError";
import traitPdf from "./traitPdf";
import mergePdf from "./mergePdf"
import mergeJpg from "./mergeJpg"
import converToPdf from "./converToPdf"
import converToJpg from "./converToJpg"
import getRefTMS from "./getRefTMS"
import fs from 'fs-extra'
import * as path from "path";
import moment from "moment";
import mkdirp from "mkdirp";

export default function traitFileRetour(position, remettant) {
    //copy du fichier dans le dossier retour avec la bonne nomenclature et le bon type de fichier
    return new Promise((resolve, reject) => {
        let conf = {};
        if (!remettant) {
            conf = position.societe.retour;
        } else {
            conf = position.remettant.retour;
        }

        function merge(position, type) {
            return new Promise(((resolve2, reject2) => {
                switch (type) {
                    case "pdf":
                        mergePdf(position.documents, position.numEquinoxe).then(files => {
                            resolve2(files);
                        }).catch(err => {
                            console.log(err);
                            reject2(err);
                        });
                        break;
                    case "jpg":
                        mergeJpg(position.documents, position.numEquinoxe).then(files => {
                            resolve2(files);
                        }).catch(err => {
                            console.log(err);
                            reject2(err);
                        });
                        break;
                    case "tif":
                        //TODO
                        mergeTif(position.documents, position.numEquinoxe).then(() => {
                            resolve2();
                        });
                        break;
                    default:
                        reject2(new GedError("File", `Erreur fichier non supporté`, position.documents[0].archiveSource, document.archiveSource, "", position.documents[0].codeEdi, 3, false));
                        return;
                }
            }))
        }

        function convertoRetourFiletype(position, type, merge) {
            return new Promise(((resolve2, reject2) => {
                switch (type) {
                    case "pdf":
                        converToPdf(position.documents, position.numEquinoxe).then(documents => {
                            if (merge) {
                                mergePdf(documents, position.numEquinoxe).then(files => {
                                    //delete old pdf
                                    resolve2(files);
                                }).catch(err => {
                                    console.log(err);
                                    reject2(err);
                                });
                            } else {
                                const output = [];
                                documents.forEach((document) => {
                                    output.push(document.fileName);
                                });
                                resolve2(output);
                            }
                        }).catch(err => {
                            console.log(err);
                            reject2(err);
                        });
                        break;
                    case "jpg":
                        converToJpg(position.documents, position.numEquinoxe).then(documents => {
                            if (merge) {
                                mergeJpg(documents, position.numEquinoxe).then(files => {
                                    //delete old pdf
                                    resolve2(files);
                                }).catch(err => {
                                    console.log(err);
                                    reject2(err);
                                });
                            } else {
                                const output = [];
                                documents.forEach((document) => {
                                    output.push(document.fileName);
                                });
                                resolve2(output);
                            }
                        }).catch(err => {
                            console.log(err);
                            reject2(err);
                        });
                        break;
                        break;
                    case "tif":
                        //TODO
                        converToTif(position.documents, position.numEquinoxe).then(() => {
                            resolve2();
                        });
                        break;
                    default:
                        reject2(new GedError("File", `Erreur fichier non supporté`, position.documents[0].archiveSource, position.documents[0].archiveSource, "", position.documents[0].codeEdi, 3, false));
                        return;
                }
            }))
        }

        fileTypeCheck(position.documents[0].filePath).then(type => {
            if (conf.multi) {
                //merge des fichiers
                if (conf.fileType === type) {
                    return merge(position, type)
                } else {
                    return convertoRetourFiletype(position, conf.fileType, true)
                }
            } else {
                return convertoRetourFiletype(position, conf.fileType, false);
            }
        }).then(files => {
            const promiseQ = [];
            mkdirp(`${path.join("reception",position.codeEdi,"remonte")}`, () => {
                files.forEach(file => {
                    switch (conf.nomenclature) {
                        case "numeroEquinoxe_date":
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${position.numEquinoxe}_${moment().format()}${file.substr(file.length - 4)}`), err => {
                                    if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    resolve2(`${position.numEquinoxe}_${moment().format()}${file.substr(file.length - 4)}`);
                                })
                            }));
                            break;
                        case "numeroEquinoxe_date_page":
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${position.numEquinoxe}_${moment().format()}_${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                    if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    resolve2(`${position.numEquinoxe}_${moment().format()}_${file.charAt(0)}${file.substr(file.length - 4)}`);
                                })
                            }));
                            break;
                        case "PA-numeroEquinoxe_page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`PA-${position.numEquinoxe}_${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                    if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    resolve2(`PA-${position.numEquinoxe}_${file.charAt(0)}${file.substr(file.length - 4)}`);
                                })
                            }));
                            break;
                        case "numeroEquinoxe-page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${position.numEquinoxe}-${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                    if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    resolve2(`${position.numEquinoxe}-${file.charAt(0)}${file.substr(file.length - 4)}`);
                                })
                            }));
                            break;
                        case "RE-refTMS_page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                getRefTMS(position).then(refTMS => {
                                    fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`RE-${refTMS}_${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                        if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                        resolve2(`RE-${refTMS}_${file.charAt(0)}${file.substr(file.length - 4)}`);
                                    })
                                });
                            }));
                            break;
                        case "refTMS-page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                getRefTMS(position).then(refTMS => {
                                    fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${refTMS}-${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                        if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                        resolve2(`${refTMS}-${file.charAt(0)}${file.substr(file.length - 4)}`);
                                    })
                                });
                            }));
                            break;
                        case "numeroEquinoxe-refDitri_page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${position.numEquinoxe}-${position.codeEdi}_${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                    if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    resolve2(`${position.numEquinoxe}-${position.codeEdi}_${file.charAt(0)}${file.substr(file.length - 4)}`);
                                })
                            }));
                            break;
                        case "numeroEquinoxe-refDitri-refTMS_page" :
                            promiseQ.push(new Promise((resolve2, reject2) => {
                                getRefTMS(position).then(refTMS => {
                                    fs.copy(path.join(position.documents[0].currentFileLocation, file), path.join("reception",position.codeEdi,"remonte",`${position.numEquinoxe}-${position.codeEdi}-${refTMS}_${file.charAt(0)}${file.substr(file.length - 4)}`), err => {
                                        if (err) return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                        resolve2(`${position.numEquinoxe}-${position.codeEdi}-${refTMS}_${file.charAt(0)}${file.substr(file.length - 4)}`);
                                    })
                                });
                            }));
                            break;
                        default:
                            reject(new GedError("Nomenclature", `Nomenclature inconnu ${conf.nomenclature} for ${file}`, position.archiveSource, position.archiveSource, "", position.codeEdi, 3, false));
                            break;
                    }
                });
                Promise.all(promiseQ).then(results => {
                    resolve(results);
                }).catch(err => {
                    console.log(err);
                });
            });
        }).catch(err => {
            console.log(err);
        });

    })
}