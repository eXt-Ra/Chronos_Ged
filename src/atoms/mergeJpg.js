import GedError from "../Class/GedError";
import * as path from "path";
import gm from "gm";

const exec = require('child_process').exec;

export default function mergeJpg(documents, numEquinoxe, ...args) {
    return new Promise((resolve, reject) => {
        const arrInputJpg = [];
        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }
        documents.forEach(document => {
            if (!args[0]) {
                arrInputJpg.push(`${path.join(archiveLocation, document.currentFileLocation, document.fileName)}`)
            } else {
                arrInputJpg.push(`${path.join(archiveLocation, document)}`)
            }
        });

        gm().append(arrInputJpg)
            .quality(100)
            .write(`${archiveLocation}${ !args[0] ? path.join(documents[0].currentFileLocation, `${numEquinoxe}_cat.jpg`) : path.join("temp", `${numEquinoxe}.jpg`)}`, function (err) {
                if (err) {
                    reject(new GedError("113", `Error on gm cmd de ${numEquinoxe}`, "unknown", documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
                } else {
                    resolve([`${!args[0] ? `${numEquinoxe}_cat.jpg` : `${numEquinoxe}.jpg`}`]);
                }
            });
    })
}