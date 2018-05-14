import GedError from "../Class/GedError";
import * as path from "path";

const exec = require('child_process').exec;

export default function mergePdf(documents, numEquinoxe, ...args) {
    return new Promise((resolve, reject) => {
        const arrInputPdf = [];

        let archiveLocation;
        if (process.env.NODE_ENV === "development") {
            archiveLocation = "";
        } else {
            archiveLocation = "Z:\\";
        }

        documents.forEach(document => {
            if (!args[0]) {
                arrInputPdf.push(`"${path.join(archiveLocation, document.currentFileLocation, document.fileName)}"`)
            } else {
                arrInputPdf.push(`"${path.join(archiveLocation, document)}"`)
            }
        });

        const inputPdf = arrInputPdf.join(" ");


        // exec(`pdftk ${inputPdf} cat output ${archiveLocation}${ !args[0] ? path.join(documents[0].currentFileLocation, `${numEquinoxe}_cat.pdf`) : path.join("temp", `${numEquinoxe}.pdf`)}`, (error, stdout, stderr) => {
        exec(`gm convert -density 150 ${inputPdf} -quality 90 -resize 80% ${archiveLocation}${ !args[0] ? path.join(documents[0].currentFileLocation, `${numEquinoxe}_cat.pdf`) : path.join("temp", `${numEquinoxe}.pdf`)}`, (error, stdout, stderr) => {
            if (error) {
                reject(new GedError("113", `Error on gm cmd de ${numEquinoxe}`, "unknown", documents[0].archiveSource, error, documents[0].codeEdi, 2, false, numEquinoxe));
            }
            resolve([`${!args[0] ? `${numEquinoxe}_cat.pdf` : `${numEquinoxe}.pdf`}`]);
        })
    })
}