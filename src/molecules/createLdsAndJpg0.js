import fs from 'fs'
import mkdirp from 'mkdirp';
import getSiretSociete from "../atoms/getSiretSociete";
import GedError from "../Class/GedError";
import setError from "./setError";
import * as path from "path";
import moment from 'moment'
import * as async from "async";
import traitJpg from "../atoms/traitJpg";
import traitPdf from "../atoms/traitPdf";
import traitTif from "../atoms/traitTif";
import fileTypeCheck from "../atoms/fileTypeCheck";
import duplicateJpg from "../atoms/duplicateJpg";
import gm from "gm";

const exec = require('child_process').exec;

export default function createLdsAndJpg0(positions) {
  return new Promise((resolve, reject) => {
	const promiseQ = [];

	async.each(positions, function (position, callback) {
	  position.documents.forEach((document, idx, array) => {
		const val1 = position.numeroDoc,
			val2 = moment().format("DD/MM/YYYY"),
			val3 = position.societe.siret,
			val4 = position.numEquinoxe,
			val5 = position.codeEdi,
			val6 = "",
			val7 = position.remettant.codeEdi,
			val8 = "",
			val9 = "",
			val10 = new Date().toISOString().slice(0, 10).replace(/-/g, ""),
			val11 = `${document.fileNameNoExt}.jpg`,
			val12 = "ok";

		const dataLds = `<LDS001>\r\n<idx nb=12>\r\n${val1}\r\n${val2}\r\n${val3}\r\n${val4}\r\n${val5}\r\n${val6}\r\n${val7}\r\n${val8}\r\n${val9}\r\n${val10}\r\n${val11}\r\n${val12}\r\n<stamp nb=12>\r\n${val1}\r\n${val2}\r\n${val3}\r\n${val4}\r\n${val5}\r\n${val6}\r\n${val7}\r\n${val8}\r\n${val9}\r\n${val10}\r\n${val11}\r\n${val12}`;

		promiseQ.push(
			function (callback) {
			  mkdirp(path.join(document.currentFileLocation, "lds"), () => {
				fs.writeFile(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.lds`), dataLds, (err) => {
				  if (err) {
					setError(new GedError("105", `Creation LDS échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
					callback(null);
				  } else {
					fileTypeCheck(document.filePath).then(type => {
					  switch (type) {
						case "pdf":
						  // exec(`gm convert -density 150 "${document.filePath}" -quality 90 -resize 80% "${path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`)}"`, (err) => {
						  // if (err) {
						  //   setError(new GedError("105", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
						  //   callback(null);
						  // } else {
						  //   fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
						  // 	if (err) {
						  // 	  setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
						  // 	}
						  // 	callback(null);
						  //   });
						  // }
						  // });
						  gm(document.filePath)
							  .quality(92)
							  .density(400, 400)
							  .resize('25%')
							  .write(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), function (err) {
								if (err) {
								  setError(new GedError("105", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
								  callback(null);
								} else {
								  fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
									if (err) {
									  setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
									}
									callback(null);
								  });
								}
							  });
						  // gm(document.filePath)
						  //   .quality(75)
						  //   //.compress("JPEG")
						  //   // .density(72, 72)
						  //   // .bitdepth(8)
						  //   .write(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), function (err) {
						  // 	if (err) {
						  // 	  setError(new GedError("105", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
						  // 	  callback(null);
						  // 	} else {
						  // 	  fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
						  // 		if (err) {
						  // 		  setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
						  // 		}
						  // 		callback(null);
						  // 	  });
						  // 	}
						  //   });
						  break;
						case "jpg":
						  fs.createReadStream(document.filePath)
							  .pipe(fs.createWriteStream(`${document.currentFileLocation}/lds/${document.fileNameNoExt}.jpg`))
							  .on('close', () => {
								fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
								  if (err) {
									setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
								  }
								  callback(null);
								});
							  });
						  break;
						case "tif":
						  exec(`gm convert -density 150 "${document.filePath}" -quality 90 -resize 80% "${path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`)}"`, (err) => {
							if (err) {
							  callback(new GedError("105", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
							} else {
							  fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
								if (err) {
								  setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
								}
								callback(null);
							  });
							}
						  });
						  // gm(document.filePath)
						  //   .quality(75)
						  //   //.compress("JPEG")
						  //   // .density(72, 72)
						  //   // .bitdepth(8)
						  //   .write(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), function (err) {
						  // 	if (err) {
						  // 	  setError(new GedError("105", `Creation du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false, dataLds));
						  // 	  callback(null);
						  // 	} else {
						  // 	  fs.rename(path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg`), path.join(document.currentFileLocation, "lds", `${document.fileNameNoExt}.jpg0`), function (err) {
						  // 		if (err) {
						  // 		  setError(new GedError("106", `Rename du jp0 échoué ${ document.fileName}`, document.fileName, document.archiveSource, err, document.codeEdi, 2, false));
						  // 		}
						  // 		callback(null);
						  // 	  });
						  // 	}
						  //   });
						  break;
						default:
						  setError(new GedError("104", `Erreur fichier non supporté ${type}`, document.archiveSource, document.archiveSource, "", document.codeEdi, 3, true));
						  callback(null);
						  return;
					  }
					}).catch(err => {
					  setError(new GedError("103", `Erreur lors du test de type de fichier`, document.fileName, document.archiveSource, err, document.codeEdi, 3, true));
					  callback(null);
					});
				  }
				});
			  });
			}
		);
		if (idx === array.length - 1) {
		  callback();
		}
	  });
	}, function () {
	  async.parallelLimit(promiseQ, 3,
		  function (errObj, results) {
			// if (errObj) {
			//     setError(errObj);
			// }
			console.log(`NbPositions : ${positions.length}`);
			console.log(`NbFichiers : ${promiseQ.length}`);
			console.log(`Résultats : ${results.length}`);
			resolve(positions);
		  });
	});

	// async.parallelLimit(promiseQ, 3,
	//     function (errObj, results) {
	//         if (errObj) {
	//             setError(errObj);
	//         }
	//         console.log(`Taille : ${positions.length}`);
	//         resolve(positions);
	//     });


	// Promise.all(promiseQ).then(() => {
	//     resolve(positions);
	// }).catch(err => {
	//     //TODO did this trigger ?
	//     console.log("Err that should not be trigger");
	//     reject(err);
	// })


  });
};