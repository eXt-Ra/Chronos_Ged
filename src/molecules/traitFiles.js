import fileTypeCheck from './../atoms/fileTypeCheck'
import traitPdfFileName from './../atoms/traitPdfFileName'
import traitJpgFileName from './../atoms/traitJpgFileName'
import traitTifFileName from './../atoms/traitTifFileName'
import GedError from "../Class/GedError";
import traitPdf from "../atoms/traitPdf";
import traitJpg from "../atoms/traitJpg";
import traitTif from "../atoms/traitTif";
import traitCsv from "../atoms/traitCsv";
import isSocieteNEiF from "../atoms/isSocieteNEiF";

export default function traitFiles(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];

        function treatmentWithBarcode() {
            fileTypeCheck(documents[0].filePath).then(type => {
                switch (type) {
                    case "pdf":
                        promiseQ.push(traitPdf(documents));
                        break;
                    case "jpg":
                        promiseQ.push(traitJpg(documents));
                        break;
                    case "tif":
                        promiseQ.push(traitTif(documents));
                        break;
                    case "csv":
                        promiseQ.push(traitCsv(documents));
                        break;
                    default:
                        reject(new GedError("104", `Erreur fichier non supporté`, documents[0].archiveSource, documents[0].archiveSource, "", documents[0].codeEdi, 3, true));
                        return;
                }
                end("barcode");
            }).catch(err => {
                reject(new GedError("103", `Erreur lors du test de type de fichier`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 3, true));
            });
        }

        function treatmentWithFileName() {
            fileTypeCheck(documents[0].filePath).then(type => {
                switch (type) {
                    case "pdf":
                        promiseQ.push(traitPdfFileName(documents));
                        break;
                    case "jpg":
                        promiseQ.push(traitJpgFileName(documents));
                        break;
                    case "tif":
                        promiseQ.push(traitTifFileName(documents));
                        break;
                    default:
                        reject(new GedError("104", `Erreur fichier non supporté ${type}`, documents[0].archiveSource, documents[0].archiveSource, "", documents[0].codeEdi, 3, true));
                        return;
                }
                end("filename");
            }).catch(err => {
                reject(new GedError("103", `Erreur lors du test de type de fichier`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 3, true));
            });
        }

        function end(type) {
            Promise.all(promiseQ).then((documents) => {
                resolve([type, documents[0]]);
            }).catch(errObj => {
                //TODO did this trigger ?
                console.log("Err that shoul not be trigger");
                reject(errObj);
            })
        }

        //check societe params
        if (isSocieteNEiF(documents[0].societe)) {
            treatmentWithFileName();
        } else {
            treatmentWithBarcode();
        }


    })
}