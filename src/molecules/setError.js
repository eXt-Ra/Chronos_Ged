import mkdirp from "mkdirp";
import ErrorSchema from '../Schema/ErrorSchema'
import fs from 'fs'
import _ from 'lodash'
import {currentSuivi} from "../organisms/suiviTreatment";

export default function setError(errObj) {
    return new Promise(((resolve, reject) => {
        //insert error in db
        const newError = new ErrorSchema(errObj.toSchema);
        newError.save((err) => {
            if (err) {
                reject(err);
            }
            let path = "";
            if (__dirname.indexOf("dev") > -1) {
                path = `${__dirname}/../../`;
            }
            //move pdf to erreur
            console.log(errObj)
            mkdirp(`${path}error/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}`, (err) => {
                fs.rename(`${path}${_.endsWith(errObj.source, '.zip') === true ? `reception/${errObj.codeEdi}/` : `output/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}`}/${errObj.source}`, `${path}error/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}/${errObj.source}`, function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });

            if (errObj.stopProcess){
                //kill suivi
                currentSuivi.splice(currentSuivi.indexOf(x => x.id === `${errObj.codeEdi}_${errObj.sourceArchive.slice(0, -4)}`), 1);
            }
        });
    }))
}