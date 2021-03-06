// import convertPdfToJpg from "./convertPdfToSplitJpg";
// import setError from "../molecules/setError";
// import GedError from "../Class/GedError";
// import * as async from "async";
//
// export default function traitFileName(documents) {
//     return new Promise((resolve, reject) => {
//         const promiseQ = [];
//         const documentsFilter = [];
//         documents.forEach(document => {
//             if (document.fileName.length > 6) {
//                 document.barecode = [document.fileName.substring(0, 7)];
//                 documentsFilter.push(document);
//             } else {
//                 setError(new GedError("jpgFileName", `nom de fichier trop court ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false))
//             }
//         });
//         documentsFilter.forEach(document => {
//             promiseQ.push(
//                 function (callback) {
//                     convertPdfToJpg(document).then(data => callback(null, data))
//                 });
//         });
//
//         async.parallelLimit(promiseQ, 3,
//             function (err, results) {
//                 resolve(results);
//             });
//
//         resolve(documentsFilter);
//
//         // Promise.all(promiseQ).then(results => {
//         //     resolve(results);
//         // }).catch(errObj => {
//         //     //TODO did this trigger ?
//         //     console.log("Err that should not be trigger");
//         //     reject(errObj);
//         // });
//     }).catch(errObj => {
//         //TODO did this trigger ?
//         console.log("Err that should not be trigger");
//     });
// }
import splitPdf from './../atoms/splitPdf'
import checkPdfNbPage from './../atoms/checkPdfNbPage'
import convertPdfToJpg from './../atoms/convertPdfToSplitJpg'
import async from 'async';
import GedError from "../Class/GedError";
import setError from "../molecules/setError";

export default function traitPdf(documents) {
    return new Promise((resolve, reject) => {
        const functions = [];
        async.eachLimit(documents, 1, function (document, callback) {
            checkPdfNbPage(document.filePath).then(nb => {
                    if (nb > 1) {
                        functions.push(splitPdf(document));
                    } else {
                        functions.push(new Promise(resolve => {
                            resolve([document])
                        }));
                    }
                    callback(null);
                }
            ).catch(err => {
                callback(null);
                setError(new GedError("Pdf", `Erreur lors du calcule du nombre de page du pdf de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 3, false));
            });
        }, function (err) {
            // if (err) {
            //     console.log('A file failed to process')
            // } else {
            Promise.all(functions).then(results => {
                const documents = [];
                results.forEach(arr => {
                    if (arr !== undefined) {
                        documents.push.apply(documents, arr);
                    }
                });
                console.log(documents.length);
                const promiseQ = [];
                const documentsFilter = [];
                documents.forEach(document => {
                    if (document.fileName.length > 6) {
                        // trait spé pour les positions > 10 000 000
                        if (document.fileName.startsWith("1")) {
                            document.barecode = [document.fileName.substring(0, 8)];
                        } else {
                            document.barecode = [document.fileName.substring(0, 7)];
                        }
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
                reject(errObj);
            });
            // }
        });
    });
}