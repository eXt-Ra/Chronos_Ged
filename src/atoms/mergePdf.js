import GedError from "../Class/GedError";
import * as path from "path";

const exec = require('child_process').exec;

export default function mergePdf(documents, numEquinoxe) {
    return new Promise((resolve, reject) => {
        const arrInputPdf = [];

        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }

        documents.forEach(document => {
            arrInputPdf.push(`"${archiveLocation}${path.join(document.currentFileLocation, document.fileName)}"`)
        });

        const inputPdf = arrInputPdf.join(" ");

        exec(`pdftk ${inputPdf} cat output ${archiveLocation}${path.join(documents[0].currentFileLocation, `${numEquinoxe}_cat.pdf`)}`, (error, stdout, stderr) => {
            if (error) {
                reject(new GedError("mergePdf", `Error on pdftk cmd de ${numEquinoxe}`, documents[0].fileName, documents[0].archiveSource, error, documents[0].codeEdi, 2, false));
            }
            resolve([`${numEquinoxe}_cat.pdf`]);
        })
    })
}