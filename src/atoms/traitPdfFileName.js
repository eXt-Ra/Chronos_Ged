import convertPdfToJpg from "./convertPdfToSplitJpg";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import * as async from "async";

export default function traitFileName(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        const documentsFilter = [];
        documents.forEach(document => {
            if (document.fileName.length > 6) {
                document.barecode = [document.fileName.substring(0, 7)];
                documentsFilter.push(document);
            } else {
                setError(new GedError("jpgFileName", `nom de fichier trop court ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false))
            }
        });
        documentsFilter.forEach(document => {
            promiseQ.push(
                function (callback) {
                convertPdfToJpg(document).then(data => callback(null, data))
            });
        });

        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                resolve(results);
            });

        resolve(documentsFilter);

        // Promise.all(promiseQ).then(results => {
        //     resolve(results);
        // }).catch(errObj => {
        //     //TODO did this trigger ?
        //     console.log("Err that should not be trigger");
        //     reject(errObj);
        // });
    }).catch(errObj => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
    });
}