import convertTifToSplitJpg from "./convertTifToSplitJpg";
import * as async from "async";
import downloadImages from "./downloadImages";
import LineByLineReader from "line-by-line";
import traitBarcode from "../molecules/traitBarcode";
import saveGedDownloadDB from "../molecules/saveGedDownloadDB";
import moment from "moment/moment";
import GedDownload from "../Schema/GedDownloadSchema";

export default function traitTif(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];

        //lines.push({line: line, filePath: filePath});

        documents.forEach(document => {

            // csv({
            //     delimiter: ";"
            // })
            //     .fromFile(document.filePath)
            //     .then((jsonObj) => {
            //         console.log(jsonObj[0]);
            //     });

            promiseQ.push(
                function (callback) {
                    const filetoDl = [];
                    const lr = new LineByLineReader(document.filePath);
                    lr.on('error', function (err) {
                        // 'err' contains error object
                    });

                    lr.on('line', function (line) {
                        const lineArr = line.split(';');
                        filetoDl.push(
                            new GedDownload({
                                numeroEquinoxe: lineArr[1],
                                codeEdi: document.codeEdi,
                                dateTreatment: moment().format(),
                                fileUrl: lineArr[2],
                                fileName: document.filePath,
                                status : "Not Download"
                            })
                        )
                    });

                    lr.on('end', function () {
                        downloadImages(filetoDl, document.codeEdi, document.archiveSource).then(data => callback(null, data))
                    });
                }
            )
        });

        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                const documents = [];
                results.forEach(arr => {
                    if (arr !== undefined) {
                        documents.push.apply(documents, arr);
                    }
                });
                resolve(documents);
            });
    }).catch(err => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
        // reject(errObj);
    });
}