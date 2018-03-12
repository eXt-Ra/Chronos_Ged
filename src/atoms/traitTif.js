import convertPdfToJpg from "./convertPdfToSplitJpg";

export default function traitTif(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        documents.forEach(document => {
            promiseQ.push(convertPdfToJpg(document));
        });

        Promise.all(promiseQ).then(results => {
            resolve(results);
        }).catch(errObj => {
            //TODO did this trigger ?
            console.log("Err that should not be trigger");
            reject(errObj);
        });
    }).catch(err => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
        // reject(errObj);
    });
}