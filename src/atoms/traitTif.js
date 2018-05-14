import convertTifToSplitJpg from "./convertTifToSplitJpg";
import * as async from "async";
import wantRetour from "./wantRetour";
import traitFileRetour from "./traitFileRetour";

export default function traitTif(documents) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];


        documents.forEach(document => {
            promiseQ.push(
                function (callback) {
                    convertTifToSplitJpg(document).then(data => callback(null, data))
                }
            )
        });

        // Promise.all(promiseQ).then(results => {
        //
        // }).catch(errObj => {
        //     //TODO did this trigger ?
        //     console.log("Err that should not be trigger");
        //     reject(errObj);
        // });

        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                const documents = [];
                results.forEach(arr => {
                    if (arr !== undefined) {
                        documents.push.apply(documents, arr);
                    }
                });
                console.log(documents.length);
                resolve(documents);
            });
    }).catch(err => {
        //TODO did this trigger ?
        console.log("Err that should not be trigger");
        // reject(errObj);
    });
}