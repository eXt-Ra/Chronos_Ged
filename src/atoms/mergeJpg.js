import GedError from "../Class/GedError";
import * as path from "path";
import gm from "gm";

const exec = require('child_process').exec;

export default function mergeJpg(documents, numEquinoxe) {
    return new Promise((resolve, reject) => {
        const arrInputJpg = [];
        documents.forEach(document => {
            arrInputJpg.push(`${path.join(document.currentFileLocation, document.fileName)}`)
        });

        gm().append(arrInputJpg)
            .write(path.join(documents[0].currentFileLocation,`${numEquinoxe}_cat.jpg`), function (err) {
                if (err) {
                    reject(new GedError("mergeJpg", `Error on gm cmd de ${numEquinoxe}`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
                }else{
                    resolve([`${numEquinoxe}_cat.jpg`]);
                }
            });
    })
}