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
                        converToPdf(position.documents, position.numEquinoxe, remettant).then(documents => {
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

        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
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
                return convertoRetourFiletype(position, conf.fileType, false);
            }
        }).then(files => {
            const promiseQ = [];

            mkdirp(`${archiveLocation}${path.join("reception", position.codeEdi, "remonte")}`, () => {

                const options = [{
                    title: "SUFFIXE",
                    fnc: () => {
                        return conf.nomenclature.suffixe
                    }
                }, {
                    title: "PREFIXE",
                    fnc: () => {
                        return conf.nomenclature.prefixe
                    }
                }, {
                    title: "NUMEROEQUINOXE",
                    fnc: () => {
                        return position.numEquinoxe
                    }
                }, {
                    title: "DATE",
                    fnc: () => {
                        return moment().format();
                    }
                }, {
                    title: "PAGE",
                    fnc: (file) => {
                        return file.charAt(0);
                    }
                }, {
                    title: "REFDISTRI",
                    fnc: () => {
                        return position.codeEdi;
                    }
                }, {
                    title: "REFTMS",
                    fnc: () => {
                        getRefTMS(position).then(refTMS => {
                            console.log(refTMS);
                            return refTMS;
                        })
                    }
                }];

                const currentOption = [];
                options.forEach(option => {
                    if (conf.nomenclature.pattern.indexOf(option.title) > -1) {
                        currentOption.push(option);
                    }
                });

                function generateNomenclature(nomenclature, currentOption, file, refTMS) {
                    currentOption.forEach(option => {
                        if (option.title === "REFTMS") {
                            nomenclature = nomenclature.replace("REFTMS", refTMS);
                        } else {
                            nomenclature = nomenclature.replace(option.title, option.fnc(file));
                        }

                    });
                    return nomenclature;
                }

                files.forEach(file => {
                    promiseQ.push(new Promise((resolve2, reject2) => {
                        if (conf.nomenclature.pattern.indexOf("REFTMS") > -1) {
                            getRefTMS(position).then(refTMS => {
                                const newFilePath = `${generateNomenclature(conf.nomenclature.pattern, currentOption, file, refTMS)}${file.substr(file.length - 4)}`;
                                fs.copy(
                                    path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file),
                                    path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte",
                                        newFilePath),
                                    err => {
                                        if (err) {
                                            return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                        }
                                        console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                        resolve2(newFilePath);
                                    });
                            });
                        } else {
                            const newFilePath = `${generateNomenclature(conf.nomenclature.pattern, currentOption, file)}${file.substr(file.length - 4)}`;
                            fs.copy(
                                path.join(`${archiveLocation}`, position.documents[0].currentFileLocation, file),
                                path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte",
                                    newFilePath),
                                err => {
                                    if (err) {
                                        return reject2(new GedError("Copy Retour", `Copy du fichier pour retour fail pour ${file}`, path.join(position.documents[0].currentFileLocation, file), position.documents[0].archiveSource, err, position.codeEdi, 3, false));
                                    }
                                    console.log(`Move ok de ${path.join(`${archiveLocation}reception`, remettant === true ? position.remettant.codeEdi : position.codeEdi, "remonte", newFilePath)}`);
                                    resolve2(newFilePath);
                                });
                        }
                    }));
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