import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Document from "../Class/Document";
import SocieteMongo from "../Schema/SocieteSchema";
import GedError from "../Class/GedError";
import * as async from "async";
import mkdirp from "mkdirp";

function getFileType(contentType) {
    switch (contentType) {
        case "application/pdf":
            return "pdf";
        case "image/tif":
            return "tif";
        case "image/tiff":
            return "tif";
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
    }
}

async function downloadImage(imgToDl, codeEdi, source) {

    const response = await
        axios({
            method: 'GET',
            url: imgToDl.fileUrl,
            responseType: 'stream'
        });
    const filePath = path.join("output", codeEdi, source !== null ? source.slice(0, -4) : imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length - 1].slice(0, -4), `${imgToDl.numeroEquinoxe}-${imgToDl._id}.${getFileType(response.headers['content-type'])}`);
    // pipe the result stream into a file on disc
    response.data.pipe(fs.createWriteStream(filePath));

    // return a promise and resolve when download finishes
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            SocieteMongo.findOne({
                codeEdi: imgToDl.codeEdi
            }).then((societe) => {
                if (societe != null) {
                    const newDoc = new Document(imgToDl.codeEdi, societe, source !== null ? source : imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length - 1], filePath);
                    newDoc.barecode = [`POLE${imgToDl.numeroEquinoxe}`];
                    resolve(newDoc);
                } else {
                    // reject(new GedError("DB", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                    reject(`Societe introuvable pour le codeEdi ${imgToDl.codeEdi}`);
                }
            }).catch(err => {
                if (err) {
                    // reject(new GedError("DB", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                    reject(`Societe introuvable pour le codeEdi ${imgToDl.codeEdi}`);
                }
            });
        });

        response.data.on('error', () => {
            reject()
        })
    });
}


export default function (imagesToDl, codeEdi, source) {
    return new Promise((resolve, reject) => {
        // const promiseQ = [];
        // imagesToDl.forEach(imgToDl => {
        //     promiseQ.push(downloadImage(imgToDl));
        // });
        // Promise.all(promiseQ).then((documents) => {
        //     resolve(documents);
        // });
        const documents = [];
        async.eachLimit(imagesToDl, 1, function (imgToDl, callback) {
            console.log("start Download");

            const outPutDir = path.join("output", codeEdi, source !== null ? source.slice(0, -4) : imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length - 1].slice(0, -4));
            mkdirp(outPutDir, () => {
                downloadImage(imgToDl, codeEdi, source).then((document) => {
                    console.log("finish Download");
                    documents.push(document);
                    console.log(`${documents.length}/${imagesToDl.length}`);
                    callback(null);
                }).catch(err => {
                    console.log(err);
                    callback();
                })
            });
        }, function (err) {
            console.log("finish dl image");
            resolve(documents);
        });


    })
};