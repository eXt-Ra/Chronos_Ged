import GedError from "../Class/GedError";
import * as path from "path";
import gm from "gm";

export default function converToPdf(documents, numEquinoxe, remettant) {
    return new Promise((resolve, reject) => {
        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }

        const output = [];
        const promiseQ = [];
        documents.forEach((document, index) => {
            promiseQ.push(new Promise((resolve2, reject2) => {
                gm(`${archiveLocation}${path.join(document.currentFileLocation, document.fileName)}`)
                    .write(`${archiveLocation}${path.join(documents[0].currentFileLocation, `${index}_${document.fileName.substring(0, document.fileName.length - 4)}${remettant ? "_cvr.pdf" : "_cv.pdf"}`)}`, function (err) {
                        if (err) {
                            reject(new GedError("converToPdf", `Error on gm cmd de ${numEquinoxe}`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
                        } else {
                            document.fileName = `${index}_${document.fileName.substring(0, document.fileName.length - 4)}${remettant ? "_cvr.pdf" : "_cv.pdf"}`;
                            resolve2(document);
                        }
                    });
            }))
        });
        Promise.all(promiseQ).then(results => {
            resolve(results);
        }).catch(err => {
            console.log(err);
        });
    })
}