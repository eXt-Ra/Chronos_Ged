import duplicateJpg from "./duplicateJpg";

export default function traitJpg(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        documents.forEach(document => {
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