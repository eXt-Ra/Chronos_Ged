import wantRetour from '../atoms/wantRetour'
import traitFileRetour from '../atoms/traitFileRetour'

export default function traitRetour(positions) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        //societe want retour ?
        if (wantRetour(positions[0].codeEdi)) {
            positions.forEach(position => {
                promiseQ.push(
                    traitFileRetour(position, false)
                )
            });
        }
        //remettant want retour ?
        // positions.forEach(position => {
        //     if (wantRetour(position.remettant)) {
        //         promiseQ.push(
        //             traitFileRetour(position, true)
        //         )
        //     }
        // });

        Promise.all(promiseQ).then(results => {
            const output = [];
            results.forEach(arr => {
                console.log(arr);
                if (arr !== undefined) {
                    output.concat(arr);
                }
            });
            //nocp des fichier retour
            resolve(output);
        }).catch(err => {
            console.log(err);
        })
    })
}