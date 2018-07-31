import mergePdfPdftk from "../atoms/mergePdfPdftk";
import mergePdf from "../atoms/mergePdf";
import generateOldGed from "../molecules/generateOldGed";
import PositionSchema from "../Schema/PositionSchema";
import * as path from "path";
import fileTypeCheck from "../atoms/fileTypeCheck";
import {updateSuiviRequestGed} from "./suiviRequestGed";
import fs from "fs-extra";
import url_crypt from "url-crypt";
import mkdirp from "mkdirp";
import converToPdf from "../atoms/converToPdf";
import converToJpg from "../atoms/converToJpg";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import gm from "gm";
import Document from "../Class/Document";
import pdftk from "node-pdftk";

const urlCrypt = url_crypt('~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF');

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
	await callback(array[index], index, array)
  }
}

function deleteFiles(files, callback) {
  let i = files.length;
  files.forEach(function (filepath) {
	fs.unlink(filepath, function (err) {
	  i--;
	  if (err) {
		callback(err);
		return;
	  } else if (i <= 0) {
		callback(null);
	  }
	});
  });
}

function convertFile(filePath, fileType, outputFile) {
  return new Promise((resolve, reject) => {
	switch (fileType) {
	  case "jpg":
		gm(filePath)
			.quality(92)
			//.compress("JPEG")
			.density(400, 400)
			.resize('25%')
			// .bitdepth(8)
			.write(outputFile, function (err) {
			  if (err) {
				reject(err);
			  } else {
				resolve(outputFile);
			  }
			});

		break;
	  case "pdf":
		gm(filePath)
			.quality(75)
			//.compress("JPEG")
			// .density(400, 400)
			// .resize('25%')
			.bitdepth(8)
			.write(outputFile, function (err) {
			  if (err) {
				reject(err);
			  } else {
				resolve(outputFile);
			  }
			});
		break;
	  default:
		reject(`Erreur fichier non supporté`);
		return;
	}
  })
}

function duplicateFile(source, copy, fileType) {
  return new Promise((resolve, reject) => {
	switch (fileType) {
	  case "jpg":
		fs.copy(
			source,
			copy,
			err => {
			  if (err) {
				reject(err);
			  }
			  resolve(copy);
			});
		break;
	  case "pdf":
		fs.stat(source, (err, stats) => {
		  console.log(`Fichier source pdf size = ${stats.size}`);
		  if (stats.size > 1500000) {
			console.log("Compress");
			gm(source)
				.quality(92)
				//.compress("JPEG")
				.density(400, 400)
				.resize('25%')
				.write(copy, function (err) {
				  if (err) {
					reject(err);
				  } else {
					resolve(copy);
				  }
				});
		  } else {
			console.log("Duplicate");
			fs.copy(
				source,
				copy,
				err => {
				  if (err) {
					reject(err);
				  }
				  resolve(copy);
				});
		  }
		});

		break;
	  default:
		reject(`Erreur fichier non supporté`);
		return;
	}
  })
}

export default function gedDocumentGed(numDocument, suivi, ...args) {

  let mode = "numDocument";
  if (args[0] !== undefined) {
	mode = "numEquinoxe";
  }

  let archiveLocation;
  if (process.env.NODE_ENV === "development") {
	archiveLocation = "";
  } else {
	archiveLocation = "Z:\\";
  }

  return new Promise(((resolve, reject) => {
	function findPosition() {
	  if (mode === "numDocument") {
		return PositionSchema.findOne({
		  numeroDoc: numDocument
		});
	  } else {
		return PositionSchema.findOne({
		  "numEquinoxe": numDocument
		});
	  }
	}

	function belongToToken(numEquinoxe) {
	  return PositionSchema.findOne({
		"numEquinoxe": numEquinoxe,
		$or: [{"codeEdi": args[2].codeEdi}, {"remettant.codeEdi": args[2].codeEdi}]
	  });
	}

	findPosition()
		.then(async position => {
		  if (position !== null) {
			try {
			  const belongPos = await belongToToken(position.numEquinoxe);
			  if (belongPos === null) {
				resolve(
					{
					  status: [
						{
						  success: false,
						  message: "Position don't belong to you",
						  requestNumber: position.numEquinoxe
						}
					  ]
					});
				return;
			  }
			}
			catch (err) {
			  console.log(err)
			}

			if (suivi !== null) {
			  suivi.statut = "Documents trouvés ...";
			  suivi.numeroEquinoxe = position.numEquinoxe;
			  position.docs.forEach(doc => {
				suivi.files.push({
				  fileName: doc.fileName
				})
			  });
			  updateSuiviRequestGed(suivi);
			}
			const stackFile = [];
			const docsStatus = [];

			await asyncForEach(position.docs, async (doc, index) => {
			  const document = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join(doc.currentFileLocation, doc.fileName));
			  let type = "";
			  let copyFile;
			  let convFile;
			  try {
				if (archiveLocation === "") {
				  document.currentFileLocation = document.currentFileLocation.replace(/\\/g, "/");
				}
				type = await fileTypeCheck(path.join(archiveLocation, document.filePath));

				if (suivi !== null) {
				  suivi.statut = "Requête en préparation ...";
				  suivi.progress = 70;
				  updateSuiviRequestGed(suivi);
				}
				await mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe));

				if ((args[0] ? args[0] : "pdf") === type) {
				  try {
					copyFile = await duplicateFile(
						path.join(`${archiveLocation}`, document.filePath),
						path.join(archiveLocation, "temp", position.numEquinoxe, `${index}_${document.fileName}`),
						args[0] ? args[0] : "pdf"
					);
					docsStatus.push({
					  success: true,
					  message: `Duplication réussi de ${document.filepath}`,
					  requestNumber: position.numEquinoxe
					});
					stackFile.push(copyFile);
				  }
				  catch (err) {
					// setError(new GedError("119", `Error lors de la duplication du fichier pour le retour ${document.filepath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false))
					docsStatus.push({
					  success: false,
					  message: `Error lors de la duplication du fichier ${document.filepath}`,
					  err: err,
					  requestNumber: position.numEquinoxe
					})
				  }
				  finally {
					// callback(null);
					console.log(`Duplicate ${copyFile} done`)
				  }
				} else {
				  try {
					convFile = await convertFile(
						path.join(`${archiveLocation}`, document.filePath),
						args[0] ? args[0] : "pdf",
						path.join(archiveLocation, "temp", position.numEquinoxe, `${index}${document.fileNameNoExt}_conv.${args[0] ? args[0] : "pdf"}`)
					);
					docsStatus.push({
					  success: true,
					  message: `Conversion réussi de ${document.filepath} ${type}, ${(args[0] ? args[0] : "pdf")}`,
					  requestNumber: position.numEquinoxe
					});
					stackFile.push(convFile);
				  }
				  catch (err) {
					setError(new GedError("119", `Error lors de la conversion du fichier pour le retour ${document.filepath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false))
				  }
				  finally {
					// callback(null);
					console.log(`Convert ${convFile} done`)
				  }
				}
			  }
			  catch (err) {
				// reject(new GedError("103", `Erreur lors du test de type de fichier ${document.filePath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false));
				docsStatus.push({
				  success: false,
				  message: `Error lors de la conversion du fichier ${document.filepath}, ${(args[0] ? args[0] : "pdf")}`,
				  err: err,
				  requestNumber: position.numEquinoxe
				})
			  }
			});

			if (suivi !== null) {
			  suivi.statut = "Fichier prêt";
			  suivi.fileName = urlCrypt.cryptObj(files[0]);
			  suivi.progress = 100;
			  resolve(path.join("temp", files[0]));
			  updateSuiviRequestGed(suivi);
			}

			if (args[1]) {
			  const inputArr = [];
			  stackFile.forEach(filePath => {
				inputArr.push(filePath)
			  });
			  // const inputFile = inputArr.join(" ");
			  switch (args[0] ? args[0] : "pdf") {
				case "pdf":
				  pdftk
					  .input(inputArr)
					  .cat([])
					  .output(path.join(archiveLocation, "temp", position.numEquinoxe, `${position.numEquinoxe}_cat.pdf`))
					  .then(buffer => {
						setTimeout(() => {
						  deleteFiles(stackFile, function (err) {
							if (err) {
							  console.log(err);
							} else {
							  resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
							}
						  });
						}, 1000);
					  })
					  .catch(err => {
						reject(new GedError("113", `Error on pdtk cmd de ${position.numEquinoxe}`, "unknown", position.docs[0].archiveSource, err, position.docs[0].codeEdi, 2, false));
					  });
				  break;
				case "jpg":
				  gm()
					  .adjoin(inputArr)
					  .write(path.join(archiveLocation, "temp", position.numEquinoxe, `${position.numEquinoxe}_cat.jpeg`), function (err) {
						if (err) {
						  console.log(err);
						  reject(new GedError("113", `Error on gm cmd de ${position.numEquinoxe}`, "unknown", position.docs[0].archiveSource, err, position.docs[0].codeEdi, 2, false));
						} else {
						  setTimeout(() => {
							deleteFiles(stackFile, function (err) {
							  if (err) {
								console.log(err);
							  } else {
								resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
							  }
							});
						  }, 1000);
						}
					  });
				  break;
				default:
				  reject(new GedError("104", `Erreur fichier non supporté`, "unknown", position.documents[0].archiveSource, "", position.documents[0].codeEdi, 3, false));
			  }
			} else {
			  // resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			  resolve(
				  {
					docFolderPath: path.join(archiveLocation, "temp", position.numEquinoxe),
					status: [docsStatus],
					pos : position
				  });
			}

			// fileTypeCheck(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, position.docs[0].fileName)}`)
			// 	.then(type => {
			// 		  console.log(`${type}${args[0] ? `-${args[0]}` : ""}`);
			// 		  switch (`${type}${args[0] ? `-${args[0]}` : ""}`) {
			// 			case "pdf":
			// 			  if (suivi !== null) {
			// 				suivi.statut = "Requête en préparation ...";
			// 				suivi.progress = 70;
			// 				updateSuiviRequestGed(suivi);
			// 			  }
			// 			  mergePdfPdftk(position.docs, position.numEquinoxe).then(files => {
			// 				const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
			// 					os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
			// 				is.pipe(os);
			// 				is.on('end', function () {
			// 				  if (suivi !== null) {
			// 					suivi.statut = "Fichier prêt";
			// 					suivi.fileName = urlCrypt.cryptObj(files[0]);
			// 					suivi.progress = 100;
			// 					updateSuiviRequestGed(suivi);
			// 				  }
			// 				  resolve(path.join(archiveLocation, "temp", files[0]));
			// 				  fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
			// 					if (err) {
			// 					  throw err;
			// 					}
			// 				  });
			// 				});
			// 				is.on('error', function (err) {
			// 				  throw err;
			// 				});
			// 				os.on('error', function (err) {
			// 				  throw err;
			// 				});
			// 			  }).catch(err => {
			// 				console.log(err);
			// 				// res.status(500).send(err);
			// 			  });
			// 			  break;
			// 			case "jpg-pdf":
			// 			case "tif-pdf":
			// 			  mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
			// 				if (args[1]) {
			// 				  mergePdf(position.docs, position.numEquinoxe).then(files => {
			// 					const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
			// 						os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
			// 					is.pipe(os);
			// 					is.on('end', function () {
			// 					  resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 					  fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
			// 						if (err) {
			// 						  throw err;
			// 						}
			// 					  });
			// 					});
			// 					is.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 					os.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 				  }).catch(err => {
			// 					console.log(err);
			// 					// res.status(500).send(err);
			// 				  });
			// 				} else {
			// 				  converToPdf(position.docs, position.numEquinoxe, false, false).then(documents => {
			// 					documents.forEach(document => {
			// 					  const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
			// 						  os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, document.fileName));
			// 					  is.pipe(os);
			// 					  is.on('end', function () {
			// 						resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 						fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`, err => {
			// 						  if (err) {
			// 							throw err;
			// 						  }
			// 						});
			// 					  });
			// 					  is.on('error', function (err) {
			// 						throw err;
			// 					  });
			// 					  os.on('error', function (err) {
			// 						throw err;
			// 					  });
			// 					});
			// 				  }).catch(err => {
			// 					console.log(err);
			// 				  })
			// 				}
			// 			  });
			// 			  break;
			// 			case "pdf-jpg":
			// 			  mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
			// 				if (args[1]) {
			// 				  mergePdf(position.docs, position.numEquinoxe).then(files => {
			// 					const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
			// 						os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
			// 					is.pipe(os);
			// 					is.on('end', function () {
			// 					  resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 					  fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
			// 						if (err) {
			// 						  throw err;
			// 						}
			// 					  });
			// 					});
			// 					is.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 					os.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 				  }).catch(err => {
			// 					console.log(err);
			// 					// res.status(500).send(err);
			// 				  });
			// 				} else {
			// 				  converToJpg(position.docs, position.numEquinoxe).then(documents => {
			// 					documents.forEach(document => {
			// 					  const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
			// 						  os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, document.fileName));
			// 					  is.pipe(os);
			// 					  is.on('end', function () {
			// 						resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 						fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`, err => {
			// 						  if (err) {
			// 							throw err;
			// 						  }
			// 						});
			// 					  });
			// 					  is.on('error', function (err) {
			// 						throw err;
			// 					  });
			// 					  os.on('error', function (err) {
			// 						throw err;
			// 					  });
			// 					});
			// 				  })
			// 				}
			// 			  });
			// 			  break;
			// 			case "pdf-pdf":
			// 			case "jpg-jpg":
			// 			case "tif-tif":
			// 			  mkdirp(path.join(archiveLocation, "temp", position.numEquinoxe), (err) => {
			// 				if (args[1]) {
			// 				  mergePdf(position.docs, position.numEquinoxe).then(files => {
			// 					const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
			// 						os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, files[0]));
			// 					is.pipe(os);
			// 					is.on('end', function () {
			// 					  resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 					  fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
			// 						if (err) {
			// 						  throw err;
			// 						}
			// 					  });
			// 					});
			// 					is.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 					os.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 				  }).catch(err => {
			// 					console.log(err);
			// 					// res.status(500).send(err);
			// 				  });
			// 				} else {
			// 				  position.docs.forEach((document, index) => {
			// 					const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, document.fileName)}`),
			// 						os = fs.createWriteStream(path.join(archiveLocation, "temp", position.numEquinoxe, `${index}_${document.fileName}`));
			// 					is.pipe(os);
			// 					is.on('end', function () {
			// 					  resolve([path.join(archiveLocation, "temp", position.numEquinoxe), position]);
			// 					});
			// 					is.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 					os.on('error', function (err) {
			// 					  throw err;
			// 					});
			// 				  });
			// 				}
			// 			  });
			// 			  break;
			// 			case "jpg":
			// 			case "tif":
			// 			  if (suivi !== null) {
			// 				suivi.statut = "Requête en préparation ...";
			// 				suivi.progress = 70;
			// 				updateSuiviRequestGed(suivi);
			// 			  }
			// 			  mergePdf(position.docs, position.numEquinoxe).then(files => {
			// 				const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
			// 					os = fs.createWriteStream(path.join(archiveLocation, "temp", files[0]));
			// 				is.pipe(os);
			// 				is.on('end', function () {
			// 				  if (suivi !== null) {
			// 					suivi.statut = "Fichier prêt";
			// 					suivi.fileName = urlCrypt.cryptObj(files[0]);
			// 					suivi.progress = 100;
			// 					resolve(path.join("temp", files[0]));
			// 					updateSuiviRequestGed(suivi);
			// 				  }
			// 				  fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
			// 					if (err) {
			// 					  throw err;
			// 					}
			// 				  });
			// 				});
			// 				is.on('error', function (err) {
			// 				  throw err;
			// 				});
			// 				os.on('error', function (err) {
			// 				  throw err;
			// 				});
			// 			  }).catch(err => {
			// 				//TODO
			// 				// res.status(500).send(err);
			// 			  });
			// 			  // });
			// 			  break;
			// 			  break;
			// 			default:
			// 			  // res.status(404).send("Erreur fichier non supporté");
			// 			  return;
			// 		  }
			// 		}
			// 	);
		  }
		  else {
			generateOldGed(numDocument, suivi, mode, args[0], args[1]).then(file => {
			  if (suivi !== null) {
				suivi.statut = "Fichier prêt";
				suivi.fileName = urlCrypt.cryptObj(file);
				suivi.progress = 100;
				updateSuiviRequestGed(suivi);
			  }
			  if (mode === "numDocument") {
				resolve(path.join("temp", file));
			  } else {
				resolve(file);
			  }
			}).catch(err => {
			  console.log("ERROR 2");
			  console.log(err);
			  reject(err);
			})
		  }
		})
  }))
}