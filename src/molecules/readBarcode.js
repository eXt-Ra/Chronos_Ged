import async from 'async'
import base64Img from 'base64-img'
import axios from 'axios'
import _ from 'lodash'
import GedError from "../Class/GedError";
import setError from "./setError";
import * as path from "path";

const exec = require('child_process').exec;

export default function readBarcode(documents) {
    return new Promise((resolve, reject) => {
        const documentsFilter = [];
        if (process.env.NODE_ENV !== "development") {
            async.eachOfLimit(documents, 1, (document, index, callback) => {
                findPoleBarcode(document).then(barcode => {
                    if (barcode !== "noBarcode") {
                        console.log(barcode);
                        document.barecode = barcode;
                    } else {
                        console.log("noBarcode");
                        document.barecode = "noBarcode";
                    }
                    documentsFilter.push(document);
                    callback();
                }).catch(errObj => {
                    setError(errObj);
                    console.log("Error");
                    document.barecode = "Error";
                    documentsFilter.push(document);
                    // documents.splice(index, 1);
                    callback();
                })
            }, function () {
                resolve(documentsFilter);
            });
        } else {
            async.eachOfLimit(documents, 1, (document, index, callback) => {
                findPoleBarcodeApi(document).then(barcode => {
                    document.barecode = barcode;
                    documentsFilter.push(document);
                    callback();
                }).catch(errObj => {
                    setError(errObj);

                    // documents.splice(index, 1);
                    callback();
                })
            }, function () {
                resolve(documentsFilter);
            });
        }
    });
};

function findPoleBarcode(document) {
    return new Promise((resolve, reject) => {
        exec(`php barcodereader.php ${document.filePath}`, function (err, data) {
            if (err) {
                reject(new GedError("Barcode", `Erreur lors du barcodereader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                return
            }

            if (data !== "noBarcode") {
                if (_.startsWith(data, '[')) {
                    resolve(JSON.parse(data));
                } else {
                    setTimeout(() => {
                        exec(`php barcodereader.php ${document.filePath}`, function (err, data) {
                            if (err) {
                                reject(new GedError("Barcode", `Erreur lors du barcodereader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                                return
                            }

                            if (data !== "noBarcode") {
                                if (_.startsWith(data, '[')) {
                                    resolve(JSON.parse(data));
                                } else {
                                    reject(new GedError("Barcode", `Erreur lors du barcodereader de ${document.fileName}`, document.fileName, document.archiveSource, data, document.codeEdi, 2, false));
                                }

                            } else if (data === "noBarcode") {
                                resolve("noBarcode");
                            }

                        });
                    }, 1000)
                }

            } else if (data === "noBarcode") {
                resolve("noBarcode");
            }

        });

    });
}

function findPoleBarcodeApi(document) {
    return new Promise((resolve, reject) => {
        base64Img.base64(path.join(document.currentFileLocation, "img", document.jpgFile), function (err, data) {
            if (err) {
                reject(new GedError("Barcode", `Erreur lors du base64Img de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                return
            }
            console.log("Start read");
            axios.post(`http://172.18.17.4:81/GED/ged_project/barcodereader.php`, {
                image_file: data,
            }).then(res => {
                console.log(res.data);
                if (res.data !== "noBarcode") {
                    resolve(String(res.data));
                } else if (res.data === "noBarcode") {
                    resolve("noBarcode");
                }
            }).catch(err => {
                reject(new GedError("Barcode", `Erreur lors du axios de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
            })
        });
    });
}

