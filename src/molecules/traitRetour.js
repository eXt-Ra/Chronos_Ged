import wantRetour from '../atoms/wantRetour'
import traitFileRetour from '../atoms/traitFileRetour'
import * as async from "async";

export default function traitRetour(positions) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        //societe want retour ?

        positions.forEach(position => {
            if (wantRetour(position.societe)) {
                promiseQ.push(
                    function (callback) {
                        traitFileRetour(position, false).then(data => callback(null, data))
                    }
                )
            }
        });

        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                const promiseQB = [];

                positions.forEach(position => {
                    if (wantRetour(position.remettant)) {
                        promiseQB.push(
                            function (callback) {
                                traitFileRetour(position, true).then(data => callback(null, data))
                            }
                        )
                    }
                });
                async.parallelLimit(promiseQB, 3,
                    function (err, resultsB) {
                        console.log("finish retour");
                        resolve(results.concat(resultsB));
                    });
                // Promise.all(promiseQB).then(results => {
                //     console.log("finish retour");
                //     resolve();
                // });
            });


        // Promise.all(promiseQ).then(results => {
        //     const promiseQB = [];
        //
        //     positions.forEach(position => {
        //         if (wantRetour(position.remettant)) {
        //             promiseQB.push(
        //                 traitFileRetour(position, true)
        //             )
        //         }
        //     });
        //     Promise.all(promiseQB).then(results => {
        //         console.log("finish retour");
        //         resolve();
        //     });
        //
        //     //
        //     // const output = [];
        //     // results.forEach(arr => {
        //     //     console.log(arr);
        //     //     if (arr !== undefined) {
        //     //         output.concat(arr);
        //     //     }
        //     // });
        //     //nocp des fichier retour
        // }).catch(err => {
        //     console.log(err);
        // })
    })
}