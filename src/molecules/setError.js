import mkdirp from "mkdirp";
import ErrorSchema from '../Schema/ErrorSchema'
import fs from 'fs'
import _ from 'lodash'
import {currentSuivi} from "../organisms/watcher";
import ErrorBot from "../organisms/errorBot";

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
            console.log(errObj);
            let archiveLocation;
            if (process.env.NODE_ENV === "development") {
                archiveLocation = "";
            } else {
                archiveLocation = "Z:\\";
            }

            console.log(`ERROR result : ${(errObj.source !== "unknown" || errObj.source.indexOf("archive") === -1) && errObj.type !== "100"}`);

            function moveErrSource() {
                return new Promise(resolve2 => {
                    if ((errObj.source !== "unknown" || errObj.source.indexOf("archive") === -1) && errObj.type !== "100") {
                        mkdirp(`${path}error/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}`, (err) => {
                            const is = fs.createReadStream(`${path}${_.endsWith(errObj.source, '.zip') === true ? `${archiveLocation}reception/${errObj.codeEdi}/descente` : `output/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}`}/${errObj.source}`),
                                os = fs.createWriteStream(`${path}error/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}/${errObj.source}`);
                            is.pipe(os);
                            is.on('end', function () {
                                fs.unlink(`${path}${_.endsWith(errObj.source, '.zip') === true ? `${archiveLocation}reception/${errObj.codeEdi}/descente` : `output/${errObj.codeEdi}/${errObj.sourceArchive.slice(0, -4)}`}/${errObj.source}`, err => {
                                    if (err) {
                                        console.log(err);
                                        reject(err);
                                    } else {
                                        resolve2(true);
                                    }
                                });
                            });
                            is.on('error', function (err) {
                                console.log(err);
                            });
                            os.on('error', function (err) {
                                console.log(err);
                            });
                        });
                    } else {
                        resolve2(false);
                    }
                })
            }


            moveErrSource().then(isFileInErrorFolder => {
                // new ErrorBot(errObj,isFileInErrorFolder);
            }).catch(err => {
                // new ErrorBot(errObj,false);
            });

            if (errObj.stopProcess) {
                //kill suivi
                currentSuivi.splice(currentSuivi.indexOf(x => x.id === `${errObj.codeEdi}_${errObj.sourceArchive.slice(0, -4)}`), 1);
            }
        });
    }))
}