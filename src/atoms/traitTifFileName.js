import convertTifToSplitJpg from "./convertTifToSplitJpg";
import * as async from "async";
import wantRetour from "./wantRetour";
import traitFileRetour from "./traitFileRetour";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";

export default function traitTifWithFileName(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];


        documents.forEach(document => {
            promiseQ.push(
                function (callback) {
                    convertTifToSplitJpg(document).then(data => callback(null, data))
                }
            )
        });



        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                const documents = [];
                const documentsFilter = [];
                results.forEach(arr => {
                    if (arr !== undefined) {
                        documents.push.apply(documents, arr);
                    }
                });
                documents.forEach(document => {
                    if (document.fileName.length > 6) {
                        document.barecode = [document.fileName.substring(0, 7)];
                        documentsFilter.push(document);
                    } else {
                        setError(new GedError("tifFileName", `nom de fichier trop court ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false))
                    }
                });
                console.log(documentsFilter.length);
                resolve(documentsFilter);
            });
    }).catch(err => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
        // reject(errObj);
    });
}