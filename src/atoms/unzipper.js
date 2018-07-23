import unzip from 'unzip';
import fs from 'fs';
import fstream from 'fstream';
import rimraf from 'rimraf';
import fileTypeCheck from './fileTypeCheck'
import mkdirp from 'mkdirp';
import Document from '../Class/Document'
import SocieteMongo from './../Schema/SocieteSchema';
import PositionMongo from "../Schema/PositionSchema";
import GedError from "../Class/GedError";
import path from "path";

import extract from "extract-zip";
import setError from "../molecules/setError";

export default function unZip(pathZip) {
  return new Promise((resolve, reject) => {
	const arrSplit = pathZip.split(path.sep);
	const codeEdi = arrSplit[arrSplit.length - 3];
	const zipFolder = arrSplit[arrSplit.length - 1].slice(0, -4);
	const zipName = arrSplit[arrSplit.length - 1];
	const outputDir = path.join("output", codeEdi, zipFolder);
	fileTypeCheck(pathZip).then(type => {
	  if (type === "zip") {
		fs.access(outputDir, err => {
		  if (!err) {
			rimraf(outputDir, () => {
			  unZipInDir(codeEdi, zipName);
			});
		  } else {
			unZipInDir(codeEdi, zipName);

		  }

		  function unZipInDir(codeEdi, zipName) {
			// const readStream = fs.createReadStream(pathZip);
			// mkdirp(outputDir, () => {
			//Move zip to output
			// const is = fs.createReadStream(pathZip),
			//     os = fs.createWriteStream(path.join("E:", "Ged_NodeJS", outputDir, zipName));
			//
			// is.pipe(os);
			//
			// is.on('end', function () {
			//     extract(path.join("E:", "Ged_NodeJS", outputDir, zipName), {dir: path.join("E:", "Ged_NodeJS", outputDir)}, function (err) {
			//         if (err) {
			//             reject(new GedError("100", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
			//         } else {
			//             console.log('Ecriture output zip Close');
			//             fs.readdir(outputDir, function (err, items) {
			//                 if (err) {
			//                     reject(new GedError("102", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
			//                     return;
			//                 }
			//                 const files = [];
			//
			//                 SocieteMongo.findOne({
			//                     codeEdi: codeEdi
			//                 }).then((societe) => {
			//                     if (societe != null) {
			//                         items.forEach(file => {
			//                             const pathFile = path.join(outputDir, file);
			//                             files.push(
			//                                 new Document(codeEdi, societe, zipName, pathFile)
			//                             );
			//                         });
			//                         resolve(files);
			//
			//                     } else {
			//                         reject(new GedError("200", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//                     }
			//                 }).catch(err => {
			//                     if (err) {
			//                         reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//                     }
			//                 });
			//             });
			//         }
			//     });
			// });
			// is.on('error', function (err) {
			//     setError(new GedError("100", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
			// });
			// os.on('error', function (err) {
			//     setError(new GedError("100", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
			//
			// });

			// setTimeout(() => {
			extract(pathZip, {dir: path.join("E:", "Ged_NodeJS", outputDir)}, function (err) {
			  // extract(pathZip, {dir: path.join("/Users/eXtRa/Documents/Dev/GED/ged_project/dev/Server/", outputDir)}, function (err) {
			  if (err) {
				reject(new GedError("100", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
			  } else {
				console.log('Ecriture output zip Close');
				fs.readdir(outputDir, function (err, items) {
				  if (err) {
					reject(new GedError("102", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
					return;
				  }
				  const files = [];

				  SocieteMongo.findOne({
					codeEdi: codeEdi
				  }).then((societe) => {
					if (societe != null) {
					  items.forEach(file => {
						if (file !== "Thumbs.db") {
						  const pathFile = path.join(outputDir, file);
						  files.push(
							  new Document(codeEdi, societe, zipName, pathFile)
						  );
						}
					  });
					  resolve(files);

					} else {
					  reject(new GedError("200", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
					}
				  }).catch(err => {
					if (err) {
					  reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
					}
				  });
				});
			  }
			});
			// }, 10000)

			// const writeStream = fstream.Writer(outputDir);
			// const stream = readStream
			//     .pipe(unzip.Parse())
			//     .on('error', err => {
			//         reject(new GedError("100", "Erreur lors de l'extraction de l'archive", zipName, zipName, err, codeEdi, 3, true));
			//     })
			//     .on('close', () => {
			//         console.log('Unzip Close');
			//     })
			//     .on('end', () => {
			//         console.log('Unzip End');
			//     })
			//     .pipe(writeStream)
			//     .on('data', (chunk) => {
			//         console.log(`Received ${chunk.length} bytes of data.`);
			//     })
			//     .on('close', () => {
			//         console.log('Ecriture output zip Close');
			//     })
			//     .on('end', () => {
			//         console.log('Ecriture output zip End');
			//     })
			//     .on('error', err => {
			//         reject(new GedError("101", "Erreur lors de l'écriture du output du fichier zip", zipName, zipName, err, codeEdi, 3, true));
			//     });

			// fs.createReadStream(`Z:\\TESTZIP/${file}`).pipe(unzip.Extract({path: "E:\\TEST"}))
			// fs.createReadStream(pathZip).pipe(unzip.Extract({path: outputDir}))
			//     .on('close', () => {
			//         console.timeEnd("ZIP");
			//         console.log('Ecriture output zip Close');
			//         fs.readdir(outputDir, function (err, items) {
			//             if (err) {
			//                 reject(new GedError("102", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
			//                 return;
			//             }
			//             const files = [];
			//
			//             SocieteMongo.findOne({
			//                 codeEdi: codeEdi
			//             }).then((societe) => {
			//                 if (societe != null) {
			//                     items.forEach(file => {
			//                         const pathFile = path.join(outputDir, file);
			//                         files.push(
			//                             new Document(codeEdi, societe, zipName, pathFile)
			//                         );
			//                     });
			//                     resolve(files);
			//
			//                 } else {
			//                     reject(new GedError("200", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//                 }
			//             }).catch(err => {
			//                 if (err) {
			//                     reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//                 }
			//             });
			//         });
			//     });
			// stream.on('close', () => {
			//     console.log('Ecriture output zip Close');
			//     fs.readdir(outputDir, function (err, items) {
			//         if (err) {
			//             reject(new GedError("102", `Impossible de fs.readdir le dossier ${outputDir}`, zipName, zipName, err, codeEdi, 3, true));
			//             return;
			//         }
			//         const files = [];
			//
			//         SocieteMongo.findOne({
			//             codeEdi: codeEdi
			//         }).then((societe) => {
			//             if (societe != null) {
			//                 items.forEach(file => {
			//                     const pathFile = path.join(outputDir, file);
			//                     files.push(
			//                         new Document(codeEdi, societe, zipName, pathFile)
			//                     );
			//                 });
			//                 resolve(files);
			//
			//             } else {
			//                 reject(new GedError("200", `Societe introuvable pour le codeEdi ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//             }
			//         }).catch(err => {
			//             if (err) {
			//                 reject(new GedError("201", `Erreur lors de l'acces MongoDB pour la recherche de societe ${codeEdi}`, zipName, zipName, err, codeEdi, 3, true));
			//             }
			//         });
			//     });
			// });
			// });
			// }

			// });
			// } else {
			//     reject(new GedError("Zip", `Pas un fichier .zip`, zipName, zipName, "", codeEdi, 3, true));
			// }
			// }).catch(err => {
			//     reject(new GedError("103", `Erreur lors du test de type de fichier`, zipName, zipName, err, codeEdi, 3, true));
		  }


		});
	  }
	});
  });
}


