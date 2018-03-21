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
        findPoleBarcode(documents).then(barcodes => {
            documents.forEach((doc) => {
                const barecode = barcodes.find(item => {
                    return item.PathName.split(path.sep)[item.PathName.split(path.sep).length - 1] === doc.fileName;
                });

                function error() {
                    throw new Error("Pas trouvée no prod")
                }

                doc.barecode = barecode ? barecode.codebarres : error()
            });
            resolve(documents);
        }).catch(errObj => {
            setError(errObj);
            resolve([])
        })
    });
};

function findPoleBarcode(documents) {
    return new Promise((resolve, reject) => {
        const postDocumentsFilepath = [];
        documents.forEach(doc => {
            postDocumentsFilepath.push(doc.filePath);
        });
        axios.post(`http://localhost:51265/api/inlite`, {
            documents: postDocumentsFilepath,
        }).then(res => {
            console.log(res.data[0].PathName)
            resolve(res.data);
        }).catch(err => {
            reject(new GedError("Barcode", `Erreur lors du axios de ${documents[0].fileName}`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
        })
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

