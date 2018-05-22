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
import * as async from "async";
import setError from "../molecules/setError";
import generateNomenclature from "./generateNomenclature";

export default function traitFileRetour(position, remettant) {
    //copy du fichier dans le dossier retour avec la bonne nomenclature et le bon type de fichier
    return new Promise((resolve, reject) => {
        let conf = {};
        if (!remettant) {
            conf = position.societe.retour;
        } else {
            conf = position.remettant.retour;
        }
        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }

        function merge(position, type) {
            return new Promise(((resolve2, reject2) => {
                switch (type) {
                    case "pdf":
                        mergePdf(position.documents, position.numEquinoxe).then(files => {
                            resolve2(files);
                        }).catch(err => {
                            reject2(err);
                        });
                        break;
                    case "jpg":
                        mergeJpg(position.documents, position.numEquinoxe).then(files => {
                            resolve2(files);
                        }).catch(err => {
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
                        reject2(new GedError("104", `Erreur fichier non supporté`, "unknown", document.archiveSource, "", position.documents[0].codeEdi, 3, false));
                        return;
                }
            }))
        }

        function convertoRetourFiletype(position, type, merge) {
            return new Promise(((resolve2, reject2) => {
                switch (type) {
                    case "pdf":
                        // converToPdf(position.documents, position.numEquinoxe, remettant).then(documents => {
                        if (merge) {
                            mergePdf(position.documents, position.numEquinoxe).then(files => {
                                //delete old pdf
                                resolve2(files);
                            }).catch(err => {
                                console.log(err);
                                reject2(err);
                            });
                        } else {
                            const output = [];
                            position.documents.forEach((document) => {
                                output.push(document.fileName);
                            });
                            resolve2(output);
                        }
                        // }).catch(err => {
                        //     console.log(err);
                        //     reject2(err);
                        // });
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
                        reject2(new GedError("104", `Erreur fichier non supporté`, "unknown", position.documents[0].archiveSource, "", position.documents[0].codeEdi, 3, false));
                        return;
                }
            }))
        }

        function duplicateFile(position) {
            return new Promise((resolve2, reject2) => {
                const promiseQ = [];
                position.documents.forEach((document, index) => {
                    promiseQ.push(
                        new Promise(resolve3 => {
                            fs.copy(
                                path.join(`${archiveLocation}`, document.currentFileLocation, document.fileName),
                                path.join(`${archiveLocation}`, document.currentFileLocation, `${index}${document.fileNameNoExt}_copy${document.fileName.substr(document.fileName.length - 4)}`),
                                err => {
                                    if (err) {
                                        // throw err;
                                    }
                                    resolve3(`${index}${document.fileNameNoExt}_copy${document.fileName.substr(document.fileName.length - 4)}`);
                                })
                        })
                    )
                });
                Promise.all(promiseQ).then(result => {
                    console.log(result);
                    resolve2(result);
                })
            })
        }


        fileTypeCheck(path.join(archiveLocation, position.documents[0].filePath)).then(type => {
            if (conf.multi) {
                //merge des fichiers
                if (conf.fileType === type) {
                    return merge(position, type)
                } else {
                    return convertoRetourFiletype(position, conf.fileType, true)
                }
            } else {
                if (conf.fileType === type) {
                    return duplicateFile(position);
                } else {
                    return convertoRetourFiletype(position, conf.fileType, false)
                }
            }
        }).then(files => {
            const promiseQ = [];

            mkdirp(`${archiveLocation}${path.join("reception", remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte")}`, () => {
                files.forEach(file => {
                    promiseQ.push(
                        function (callback) {
                            if (conf.nomenclature.pattern.indexOf("REFTMS") > -1) {
                                getRefTMS(position).then(refTMS => {
                                    const newFilePath = `${generateNomenclature(conf.nomenclature.pattern, position, file, refTMS)}${file.substr(file.length - 4)}`;
                                    // fs.copy(
                                    //     path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file),
                                    //     path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte",
                                    //         newFilePath),
                                    //     err => {
                                    //         if (err) {
                                    //             setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                    //             callback(null);
                                    //         } else {
                                    //             console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                    //             callback(null, path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath));
                                    //         }
                                    //     });
                                    const is = fs.createReadStream(path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file)),
                                        os = fs.createWriteStream(path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath));

                                    is.pipe(os);

                                    is.on('end', function () {
                                        fs.unlink(path.join(`${archiveLocation}reception`, "CALVACOM", "descente", position.archiveSource), err => {
                                            console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                            callback(null);
                                        });
                                    });
                                    is.on('error', function (err) {
                                        setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                    });
                                    os.on('error', function (err) {
                                        setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                    });
                                }).catch(err => {
                                    setError(new GedError("REFTMS", `Error find ref tms for ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                    callback(null);
                                })
                            } else {
                                const newFilePath = `${generateNomenclature(conf.nomenclature.pattern, position, file)}${file.substr(file.length - 4)}`;
                                // fs.copy(
                                //     path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file),
                                //     path.join(`${archiveLocation}reception`,
                                //         remettant === true ?
                                //             position.remettant.codeEdi === "FOURREI"
                                //                 ? "FOURTOU" : position.remettant.codeEdi :
                                //             position.codeEdi === "FOURREI" ? "FOURTOU" : position.codeEdi,
                                //         "remonte", newFilePath),
                                //     err => {
                                //         if (err) {
                                //             setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                //             callback(null);
                                //         } else {
                                //             console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                //             callback(null, path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath));
                                //         }
                                //     });
                                const is = fs.createReadStream(path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file)),
                                    os = fs.createWriteStream(path.join(`${archiveLocation}reception`,
                                        remettant === true ?
                                            position.remettant.codeEdi === "FOURREI"
                                                ? "FOURTOU" : position.remettant.codeEdi :
                                            position.codeEdi === "FOURREI" ? "FOURTOU" : position.codeEdi,
                                        "remonte", newFilePath));

                                is.pipe(os);

                                is.on('end', function () {
                                    fs.unlink(path.join(`${archiveLocation}reception`, "CALVACOM", "descente", position.archiveSource), err => {
                                        console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                        callback(null);
                                    });
                                });
                                is.on('error', function (err) {
                                    setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                });
                                os.on('error', function (err) {
                                    setError(new GedError("111", `Copy du fichier pour retour fail pour ${file}`, file, position.documents[0].archiveSource, err, position.codeEdi, 3, false, position));
                                });
                            }
                        }
                    );
                });

                async.parallelLimit(promiseQ, 3,
                    function (errObj, results) {
                        // if (errObj) {
                        //     // console.log(errObj);
                        //     setError(errObj)
                        // }
                        resolve(results);
                    });

                // Promise.all(promiseQ).then(results => {
                //
                // }).catch(err => {
                //     console.log(err);
                // });
            });
        }).catch(err => {
            setError(new GedError("104", `Erreur survenue lors des traitements`, "unknown", position.documents[0].archiveSource, "", position.documents[0].codeEdi, 3, false))
            resolve();
        });

    })
}