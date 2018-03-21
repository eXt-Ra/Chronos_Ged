import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Document from "../Class/Document";
import SocieteMongo from "../Schema/SocieteSchema";
import GedError from "../Class/GedError";

function getFileType(contentType) {
    switch(contentType){
        case "application/pdf":
            return "pdf";
    }
}

async function downloadImage(imgToDl) {
    const response = await
        axios({
            method: 'GET',
            url: imgToDl.fileUrl,
            responseType: 'stream'
        });
    const filePath = path.join("output","CALVACOM",`${imgToDl.numeroEquinoxe}-${imgToDl._id}.${getFileType(response.headers['content-type'])}`);
    // pipe the result stream into a file on disc
    response.data.pipe(fs.createWriteStream(filePath));

    // return a promise and resolve when download finishes
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            SocieteMongo.findOne({
                codeEdi: imgToDl.codeEdi
            }).then((societe) => {
                if (societe != null) {
                    const newDoc = new Document(imgToDl.codeEdi, societe,imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length -1 ] , filePath);
                    newDoc.barecode = [`POLE${imgToDl.numeroEquinoxe}`];
                    resolve(newDoc);
                } else {
                    reject(new GedError("DB", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                }
            }).catch(err => {
                if (err) {
                    reject(new GedError("DB", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
                }
            });
        });

        response.data.on('error', () => {
            reject()
        })
    });
}


export default function (imagesToDl) {
    return new Promise((resolve, reject) => {
        const promiseQ = [];
        imagesToDl.forEach(imgToDl => {
            promiseQ.push(downloadImage(imgToDl));
        });
        Promise.all(promiseQ).then((documents) => {
            resolve(documents);
        });
    })
};