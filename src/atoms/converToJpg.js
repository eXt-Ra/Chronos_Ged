import GedError from "../Class/GedError";
import * as path from "path";
import gm from "gm";
const exec = require('child_process').exec;

export default function converToJpg(documents, numEquinoxe) {
    return new Promise((resolve, reject) => {
        const output = [];
        const promiseQ = [];
        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }
        documents.forEach((document, index) => {
            promiseQ.push(new Promise((resolve2, reject2) => {

                exec(`gm convert -density 400 "${archiveLocation}${path.join(document.currentFileLocation, document.fileName)}" -resize 25% -quality 92 "${path.join(archiveLocation, documents[0].currentFileLocation, `${index}_${document.fileNameNoExt}_cv.jpg`)}"`,
                    err => {
                        if (err) {
                            reject(new GedError("113", `Error on gm cmd de ${numEquinoxe}`, "unknown", documents[0].archiveSource, err, documents[0].codeEdi, 2, false,numEquinoxe));
                        } else {
                            document.fileName = `${index}_${document.fileNameNoExt}_cv.jpg`;
                            resolve2(document);
                        }
                    });
                // gm(`${archiveLocation}${path.join(document.currentFileLocation, document.fileName)}`)
                //     .quality(100)
                //     .write(path.join(archiveLocation, documents[0].currentFileLocation, `${index}_${document.fileNameNoExt}_cv.jpg`), function (err) {
                //         if (err) {
                //             reject(new GedError("113", `Error on gm cmd de ${numEquinoxe}`, "unknown", documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
                //         } else {
                //             document.fileName = `${index}_${document.fileNameNoExt}_cv.jpg`;
                //             resolve2(document);
                //         }
                //     });
            }))
        });
        Promise.all(promiseQ).then(results => {
            resolve(results);
        }).catch(err => {
            console.log(err);
        });
    })
}