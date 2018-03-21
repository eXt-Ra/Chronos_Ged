import wantRetour from '../atoms/wantRetour'
import traitFileRetour from '../atoms/traitFileRetour'

export default function traitRetour(positions) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        //societe want retour ?

        positions.forEach(position => {
            if (wantRetour(position.societe)) {
                promiseQ.push(
                    traitFileRetour(position, false)
                )
            }
        });

        Promise.all(promiseQ).then(results => {
            const promiseQB = [];

            positions.forEach(position => {
                if (wantRetour(position.remettant)) {
                    promiseQB.push(
                        traitFileRetour(position, true)
                    )
                }
            });
            Promise.all(promiseQB).then(results => {
                console.log("finish retour");
                resolve();
            });

            //
            // const output = [];
            // results.forEach(arr => {
            //     console.log(arr);
            //     if (arr !== undefined) {
            //         output.concat(arr);
            //     }
            // });
            //nocp des fichier retour
        }).catch(err => {
            console.log(err);
        })
    })
}