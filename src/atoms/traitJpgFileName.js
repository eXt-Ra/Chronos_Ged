import duplicateJpg from "./duplicateJpg";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";

export default function traitJpgFileName(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        const documentsFilter = [];
        documents.forEach((document, index) => {
            if (document.fileName.length > 6) {
                document.barecode = [document.fileName.substring(0, 7)];
                documentsFilter.push(document);
            } else {
                setError(new GedError("jpgFileName", `nom de fichier trop court ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false))
            }
        });
        documentsFilter.forEach(document => {
            promiseQ.push(duplicateJpg(document));
        });

        Promise.all(promiseQ).then(results => {
            resolve(results);
        }).catch(errObj => {
            //TODO did this trigger ?
            console.log("Err that should not be trigger");
            reject(errObj);
        });
    }).catch(errObj => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
        // reject(errObj);
    });
}