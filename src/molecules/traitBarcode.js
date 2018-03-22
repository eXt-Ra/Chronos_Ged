import Position from '../Class/Position'
import _ from "lodash"
import getDataWithNumEquinoxe from './../atoms/getDataWithBarcode'
import isSocieteNEiF from './../atoms/isSocieteNEiF'
import GedError from "../Class/GedError";
import setError from "./setError";
import Document from "../Class/Document";
import SocieteMongo from "../Schema/SocieteSchema";
import path from "path";

export default function traitBarcode(documents) {
    return new Promise((resolve, reject) => {
        const positions = [];
        let isLastDocError = false;

        function isPole(barecode) {
            let output = "";
            barecode.forEach(item => {
                if (item.includes("POLE")) {
                    output = item;
                }
            });
            return output;
        }

        documents.forEach((document, index) => {
            if (document.barecode !== "noBarcode" && document.barecode !== "Error") {
                //document barcode not equal noBarcode
                const isNEiF = isSocieteNEiF(document.societe);
                if (isPole(document.barecode) !== "" || isNEiF) {
                    isLastDocError = false;
                    //barcode is numEquinoxe
                    if (positions.length !== 0) {
                        if (positions[positions.length - 1].numEquinoxe === _.trim(_.replace(document.barecode, 'POLE', ''))) {
                            //ajout du doc à la Position
                            positions[positions.length - 1].documents.push(document);
                        } else {
                            //creation new Position
                            positions.push(
                                new Position(
                                    isNEiF ? document.barecode[0] : _.trim(_.replace(isPole(document.barecode), 'POLE', '')), document.codeEdi, document.societe, document.archiveSource)
                            );
                            positions[positions.length - 1].documents.push(document);
                        }
                    } else {
                        positions.push(
                            new Position(
                                isNEiF ? document.barecode[0] : _.trim(_.replace(isPole(document.barecode), 'POLE', '')), document.codeEdi, document.societe, document.archiveSource)
                        );
                        positions[positions.length - 1].documents.push(document);
                    }

                } else {
                    //barcode is not a numEquinoxe
                    if (positions.length > 0) {
                        positions[positions.length - 1].documents.push(document);
                        //GEODIS
                    } else {
                        //not position to attach to
                        //aie
                        //reject("no position to attach to")
                        setError(new GedError("301", `pas de position en amont de ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false));
                    }
                }

            } else {
                if (document.barecode === "noBarcode") {
                    //document sans barcode
                    if (isLastDocError) {
                        setError(new GedError("302", `document en amont de ${ document.fileName} was in error`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false));
                    } else {
                        if (index !== 0) {
                            if (positions.length > 0) {
                                positions[positions.length - 1].documents.push(document);
                            } else {
                                //reject("no position to attach to")
                                setError(new GedError("301", `pas de position en amont de ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false));
                            }

                        } else {
                            //reject("first document noBarcode")
                            setError(new GedError("303", `first document nobarcode ${ document.fileName}`, document.fileName, document.archiveSource, "", document.codeEdi, 2, false));
                        }
                    }
                } else if (document.barecode === "Error") {
                    //put in memory that last barcode was an error
                    isLastDocError = true;
                }
            }
        });
        const promiseQ = [];
        const positionsFilter = [];
        positions.forEach((position, index) => {
            promiseQ.push(new Promise((resolve, reject) => {
                getDataWithNumEquinoxe(position.numEquinoxe, position).then(data => {
                    SocieteMongo.findOne({
                        codeEdi: data[0]
                    }).then((societe) => {
                        if (societe != null) {
                            position.remettant = societe;
                            position.numeroDoc = data[1];
                            positionsFilter.push(position);
                            resolve();
                        } else {
                            reject(new GedError("200", `Societe introuvable pour le codeEdi ${data[0]}`, position.archiveSource, position.archiveSource, `Societe introuvable pour le codeEdi ${data[0]}`, position.codeEdi, 1, false));
                        }
                    }).catch(err => {
                        if (err) {
                            reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${data[0]}`, position.archiveSource, position.archiveSource, err, position.codeEdi, 1, false));
                        }
                    });

                }).catch(errObj => {
                    //find and delete pos
                    // positions.splice(index, 1);
                    setError(errObj);
                    resolve();
                })
            }))
        });
        Promise.all(promiseQ).then(() => {
            resolve(positionsFilter);
        }).catch(err => {
            reject(err);
        })
    })
}