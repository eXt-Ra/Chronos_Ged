import GedError from "../Class/GedError";
import * as path from "path";
import gm from "gm";

export default function converToPdf(documents, numEquinoxe) {
    return new Promise((resolve, reject) => {
        const output = [];
        const promiseQ = [];
        documents.forEach((document, index) => {
            promiseQ.push(new Promise((resolve2, reject2) => {
                gm(document.filePath)
                    .write(path.join(documents[0].currentFileLocation, `${index}_${document.fileNameNoExt}_cv.pdf`), function (err) {
                        if (err) {
                            reject(new GedError("converToPdf", `Error on gm cmd de ${numEquinoxe}`, documents[0].fileName, documents[0].archiveSource, err, documents[0].codeEdi, 2, false));
                        } else {
                            document.fileName = `${index}_${document.fileNameNoExt}_cv.pdf`;
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