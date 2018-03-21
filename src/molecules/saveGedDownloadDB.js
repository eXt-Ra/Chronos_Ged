import GedDownload from './../Schema/GedDownloadSchema'
import GedError from "../Class/GedError";
import setError from "./setError";
import moment from "moment";

export default function (lines) {
    function mongodbTransaction(lineArr, filePath) {
        return new Promise((resolve, reject) => {
            const newGedDl = new GedDownload({
                numeroEquinoxe: lineArr[0],
                codeEdi: lineArr[2],
                dateTreatment: moment().format(),
                fileUrl: lineArr[1],
                fileName: filePath,
                status : "Not Download"
            });

            newGedDl.save((err) => {
                if (err) {
                    reject(new GedError("DB", `Insert DB échoué pour ${filePath}`, filePath, filePath, err, lineArr[0], 3, false));
                } else {
                    resolve(newGedDl);
                }
            });
        }).catch(errObj => {
            setError(errObj);
        })
    }

    return new Promise((resolve, reject) => {
        const promiseQ = [];
        lines.forEach(line => {
            console.log(line.line);
            promiseQ.push(mongodbTransaction(line.line.split(';'), line.filePath))
        });
        Promise.all(promiseQ).then(results => {
            resolve(results);
        }).catch(errObj => {
            //TODO did this trigger ?
            console.log("Err that should not be trigger");
            reject(errObj);
        })
    })
}