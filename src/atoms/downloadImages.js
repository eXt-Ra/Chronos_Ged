import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Document from "../Class/Document";
import SocieteMongo from "../Schema/SocieteSchema";
import GedError from "../Class/GedError";
import * as async from "async";
import mkdirp from "mkdirp";
import setError from "../molecules/setError";
import gm from "gm";

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

  // return a promise and resolve when download finishes
  return new Promise(async (resolve, reject) => {

	try {
	  const response = await axios({
		method: 'GET',
		url: imgToDl.fileUrl,
		responseType: 'stream',
		timeout: 120000,
	  });

	  if (imgToDl.numeroEquinoxe.includes("/")) {
		reject(`mauvais numéro equinoxe ${imgToDl.numeroEquinoxe}`);
		return;
	  }

	  const filePath = path.join("output",
		  codeEdi,
		  source !== null ? source.slice(0, -4) : imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length - 1].slice(0, -4),
		  `${imgToDl.numeroEquinoxe}-${imgToDl._id}.${getFileType(response.headers['content-type'])}`);
	  // pipe the result stream into a file on disc
	  response.data.pipe(fs.createWriteStream(filePath));

	  response.data.on('end', () => {
		SocieteMongo.findOne({
		  codeEdi: imgToDl.codeEdi
		}).then((societe) => {
		  if (societe != null) {
			fs.stat(filePath, (err, stats) => {
			  if (err){
				reject(err);
			  }else{
			    if (stats["size"] > 0){
				  const newDoc = new Document(imgToDl.codeEdi, societe, source !== null ? source : imgToDl.fileName.split(path.sep)[imgToDl.fileName.split(path.sep).length - 1], filePath);
				  newDoc.barecode = [`POLE${imgToDl.numeroEquinoxe}`];
				  resolve(newDoc);
			    }else{
				  reject(new Error("File size 0 ko"));
				}
			  }
			});
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

	  response.data.on('error', (err) => {
		console.log(err);
		reject(err);
	  })
	}
	catch (err) {
	  console.log(err);
	  reject(err);
	}
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
	  console.log(outPutDir);
	  mkdirp(outPutDir, () => {
		downloadImage(imgToDl, codeEdi, source).then((document) => {
		  console.log("finish Download");
		  documents.push(document);
		  console.log(`${documents.length}/${imagesToDl.length}`);
		  callback(null);
		}).catch(err => {
		  console.log(err);
		  setError(new GedError("121", `Erreur lors du téléchargement de l'url ${imgToDl.fileUrl}`, "unknown", source, err, codeEdi, 1, false));
		  callback();
		})
	  });
	}, function (err) {
	  console.log("finish dl image");
	  resolve(documents);
	});


  })
};