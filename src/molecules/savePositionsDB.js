import PositionMongo from './../Schema/PositionSchema'
import GedError from "../Class/GedError";
import setError from "./setError";

export default function (positions) {
    function mongodbTransaction(position) {
        return new Promise((resolve, reject) => {
            PositionMongo.findOne({
                numEquinoxe: position.numEquinoxe
            }).then((positionInMongo) => {
                if (positionInMongo == null) {
                    new PositionMongo(position.toSchema()).save((err) => {
                        if (err) {
                            reject(new GedError("DB", `Insert DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                        } else {
                            resolve()
                        }
                    });
                } else {
                    //position exist add document to the positionInMongo
                    positionInMongo.docs.push(position.documents);
                    positionInMongo.save((err) => {
                        if (err) {
                            reject(new GedError("DB", `Update DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
                        } else {
                            resolve()
                        }
                    });
                }
            }).catch(err => {
                reject(new GedError("DB", `Select DB échoué pour ${position.numEquinoxe}`, position.numEquinoxe, position.archiveSource, err, position.codeEdi, 3, false));
            });
        }).catch(errObj => {
            setError(errObj);
        })
    }

    return new Promise((resolve, reject) => {
        const promiseQ = [];
        positions.forEach(position => {
            promiseQ.push(mongodbTransaction(position))
        });
        Promise.all(promiseQ).then(() => {
            resolve(positions);
        }).catch(errObj => {
            //TODO did this trigger ?
            console.log("Err that should not be trigger");
            reject(errObj);
        })
    })
}