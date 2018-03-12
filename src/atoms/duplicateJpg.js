import fs from 'fs'
import GedError from "../Class/GedError";
import mkdirp from "mkdirp";
import _ from 'lodash'

export default function duplicateJpg(document) {
    return new Promise(((resolve, reject) => {
        mkdirp(`${document.currentFileLocation}/img`, () => {
            fs.readdir(`${document.currentFileLocation}/img`, function (err, files) {
                if (err) {
                    reject(new GedError("DuplicateJpg", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                    return;
                }
                const currentFileInImg = files;
                const stream = fs.createReadStream(document.filePath).pipe(fs.createWriteStream(`${document.currentFileLocation}/img/${document.fileNameNoExt}.jpg`));

                stream.on('close', () => {
                    fs.readdir(`${document.currentFileLocation}/img`, function (err, items) {
                        if (err) {
                            reject(new GedError("DuplicateJpg", `Erreur lors du fs.reader de ${document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
                            return;
                        }
                        _.difference(items, currentFileInImg).forEach(newImg => {
                            if (newImg.indexOf(document.fileNameNoExt) !== -1) {
                                document.jpgFile = newImg;
                            }
                        });
                        resolve(document);
                    });
                });
            });
        });
    }))
}