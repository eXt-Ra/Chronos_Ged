import Document from "../Class/Document";

const exec = require('child_process').exec;
import fs from 'fs'
import mkdirp from 'mkdirp';
import _ from 'lodash'
import GedError from "../Class/GedError";
import setError from "../molecules/setError";
import * as path from "path";

export default function convertPdfToSplitJpg(document) {
    return new Promise((resolve, reject) => {
        mkdirp(`${document.currentFileLocation}/img`, () => {
            fs.readdir(`${document.currentFileLocation}/img`, function (err, files) {
                if (err) {
                    reject(new GedError("PdfToJpg", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                    return;
                }
                const currentFileInImg = files;
                exec(`gm convert -verbose -density 150 -trim "${document.filePath}" -quality 100 -flatten -sharpen 0x1.0 "${path.join(document.currentFileLocation,"img",`${document.fileNameNoExt}.jpg`)}"`, (error) => {
                    if (error) {
                        reject(new GedError("PdfToJpg", `Error on gm cmd de ${document.fileName}`, document.fileName, document.archiveSource, error, document.codeEdi, 2, false));
                        return;
                    }
                    fs.readdir(`${document.currentFileLocation}/img`, function (err, items) {
                        if (err) {
                            reject(new GedError("PdfToJpg", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                            return;
                        }
                        _.difference(items, currentFileInImg).forEach(newImg => {
                            if (newImg.indexOf(document.fileNameNoExt) !== -1){
                                document.jpgFile = newImg;
                            }
                        });
                        resolve(document);
                    });
                })
            });
        });
    }).catch(errObj =>{
        //TODO
        setError(errObj);
    });
}