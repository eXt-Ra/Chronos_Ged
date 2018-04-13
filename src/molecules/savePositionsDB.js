import PositionMongo from './../Schema/PositionSchema'
import GedError from "../Class/GedError";
import setError from "./setError";
import * as async from "async";

export default function (positions) {
    function mongodbTransaction(position) {
        return new Promise((resolve, reject) => {
            // PositionMongo.update({numEquinoxe: position.numEquinoxe}, position.toSchema(), {upsert: true, setDefaultsOnInsert: true}, (err, model) => {
            //     if (err) {
            //         console.log(err);
            //         reject(new GedError("202", `Insert DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
            //     } else {
            //         resolve();
            //     }
            // });
            PositionMongo.findOne({
                numEquinoxe: position.numEquinoxe
            }).then((positionInMongo) => {
                if (positionInMongo == null) {
                    new PositionMongo(position.toSchema()).save().then(() => {
                        resolve()
                    }).catch(err => {
                        if (err) {
                            setError(new GedError("202", `Insert DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                        } else {
                            resolve()
                        }
                    })
                } else {
                    //position exist add document to the positionInMongo
                    PositionMongo.update(
                        {numEquinoxe: position.numEquinoxe},
                        {
                            $set: {
                                docs: positionInMongo.docs.concat(position.docsToSchema)
                            }
                        },
                        {safe: true, upsert: true},
                        function (err, model) {
                            if (err) {
                                console.log(err);
                                setError(new GedError("203", `Update DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                            }
                            console.log(model);
                            resolve()
                        }
                    );
                }
            }).catch(err => {
                setError(new GedError("204", `Select DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
            });
        }).catch(errObj => {
            setError(errObj);
        })
    }

    return new Promise((resolve, reject) => {
        // const promiseQ = [];
        // positions.forEach(position => {
        //     promiseQ.push(
        //         mongodbTransaction(position)
        //     )
        // });
        // Promise.all(promiseQ).then(() => {
        //     resolve(positions);
        // }).catch(errObj => {
        //     //TODO did this trigger ?
        //     console.log("Err that should not be trigger");
        //     reject(errObj);
        // });


        async.eachLimit(positions, 1,
            function (position, callback) {
                mongodbTransaction(position).then(() => {
                    callback();
                }).catch(errObj => {
                    //TODO did this trigger ?
                    console.log("Err that should not be trigger");
                    console.log(errObj);
                    callback();
                })
            },
            function (err) {
                // if any of the file processing produced an error, err would equal that error
                if (err) {
                    // One of the iterations produced an error.
                    // All processing will now stop.
                    console.log('A file failed to process');
                } else {
                    resolve(positions);
                }
            });
    })
}