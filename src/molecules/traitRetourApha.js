import wantRetour from '../atoms/wantRetour'
import traitFileRetourAlpha from '../atoms/traitFileRetourAlpha'
import * as async from "async";

export default function traitRetour(positions) {
    return new Promise(resolve => {
        const promiseQ = [];
        positions.forEach(position => {
            if (wantRetour(position.societe)) {
                if (position.societe.retour.wantRemettant) {
                    console.log(`>> Traitement retour pour ${position.societe.codeEdi} en tant que distributeur <<`);
                    promiseQ.push(
                        function (callback) {
                            try {
                                traitFileRetourAlpha(position, position.societe).then(() => {
                                    callback(null);
                                })
                            } catch (err) {
                                callback(null);
                            }
                        }
                    )
                }
            }
        });

        async function asyncForEach(array, callback) {
            for (let index = 0; index < array.length; index++) {
                await callback(array[index], index, array)
            }
        }

        async.parallelLimit(promiseQ, 3,
            function (err, results) {
                const promiseQB = [];
                positions.forEach(position => {
                    if (wantRetour(position.remettant)) {
                        // if (position.remettant.retour.wantRemettant) {
                        promiseQB.push(
                            function (callback) {
                                try {
                                    traitFileRetourAlpha(position, position.remettant).then(() => {
                                        callback(null);
                                    })
                                } catch (err) {
                                    callback(null);
                                }
                            }
                        )
                        // }
                    }
                });
                async.parallelLimit(promiseQB, 3,
                    function (err, resultsB) {
                        console.log("finish retour");
                        resolve(results.concat(resultsB));
                    });
            });
    })
}