import fileTypeCheck from "./fileTypeCheck";
import * as path from "path";
import fs from "fs-extra";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import gm from "gm";
import getRefTMS from "./getRefTMS";
import generateNomenclature from "./generateNomenclature";
import mkdirp from "mkdirp";
import * as async from "async";

import pdftk from "node-pdftk";

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
	await callback(array[index], index, array)
  }
}

export default function traitFileRetourAlpha(position, societe) {

  let archiveLocation;
  if (process.env.NODE_ENV === "development") {
	archiveLocation = "";
  } else {
	archiveLocation = "Z:\\";
  }


  const config = societe.retour;

  function fileTreatment(position, merge) {
	return new Promise(async (resolve, reject) => {
	  const stackFile = [];
	  await asyncForEach(position.documents, async (document, index) => {
		let type = "";
		let copyFile;
		let convFile;
		try {
		  if (archiveLocation === "") {
			document.currentFileLocation = document.currentFileLocation.replace(/\\/g, "/");
		  }
		  type = await fileTypeCheck(path.join(archiveLocation, document.filePath));
		  if (config.fileType === type) {
			try {
			  copyFile = await duplicateFile(
				  path.join(`${archiveLocation}`, document.filePath),
				  path.join(`${archiveLocation}`, document.currentFileLocation, `${index}${document.fileNameNoExt}_dup${document.fileName.substr(document.fileName.length - 4)}`),
			  );
			  stackFile.push(copyFile);
			}
			catch (err) {
			  setError(new GedError("119", `Error lors de la duplication du fichier pour le retour ${document.filepath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false))
			}
			finally {
			  // callback(null);
			  console.log(`Duplicate ${copyFile} done`)
			}
		  } else {
			try {
			  convFile = await convertFile(
				  path.join(`${archiveLocation}`, document.filePath),
				  config.fileType,
				  path.join(`${archiveLocation}`, document.currentFileLocation, `${index}${document.fileNameNoExt}_conv.${config.fileType}`)
			  );
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
		  reject(new GedError("103", `Erreur lors du test de type de fichier ${document.filePath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false));
		}
	  });
	  console.log('Done');
	  if (merge) {
		const inputArr = [];
		stackFile.forEach(filePath => {
		  inputArr.push(filePath)
		});

		// const inputFile = inputArr.join(" ");
		console.log(config.fileType);
		switch (config.fileType) {
		  case "pdf":
			pdftk
				.input(inputArr)
				.cat([])
				.output(`${archiveLocation}${path.join(position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)}`)
				.then(buffer => {
				  setTimeout(() => {
					resolve([path.join(archiveLocation, position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)]);
				  }, 1000);
				})
				.catch(err => {
				  reject(new GedError("113", `Error on pdtk cmd de ${position.numEquinoxe}`, "unknown", position.documents[0].archiveSource, err, position.documents[0].codeEdi, 2, false));
				});
			break;
		  case "jpg":
			gm()
				.adjoin(inputArr)
				// .quality(60)
				// .density(72, 72)
				.write(`${archiveLocation}${path.join(position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)}`, function (err) {
				  if (err) {
					reject(new GedError("113", `Error on gm cmd de ${position.numEquinoxe}`, "unknown", position.documents[0].archiveSource, err, position.documents[0].codeEdi, 2, false));
				  } else {
					setTimeout(() => {
					  resolve([path.join(archiveLocation, position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)]);
					}, 1000);
				  }
				});
			break;
		  default:
			reject(new GedError("104", `Erreur fichier non supporté`, "unknown", position.documents[0].archiveSource, "", position.documents[0].codeEdi, 3, false));
		}

	  } else {
		resolve(stackFile)
	  }
	  // async.eachOfLimit(position.documents, 1, async (document, index, callback) => {
	  // position.documents.forEach(async (document, index, callback) => {
	  //     let type;
	  //     try {
	  //         if (archiveLocation === "") {
	  //             document.currentFileLocation = document.currentFileLocation.replace(/\\/g, "/");
	  //         }
	  //         console.log(document.currentFileLocation)
	  //         type = await fileTypeCheck(path.join(archiveLocation, document.filePath));
	  //         if (config.fileType === type) {
	  //             try {
	  //                 const copyFile = await duplicateFile(
	  //                     path.join(`${archiveLocation}`, document.filePath),
	  //                     path.join(`${archiveLocation}`, document.currentFileLocation, `${index}${document.fileNameNoExt}_dup${document.fileName.substr(document.fileName.length - 4)}`),
	  //                 );
	  //                 stackFile.push(copyFile);
	  //             }
	  //             catch (err) {
	  //                 setError(new GedError("119", `Error lors de la duplication du fichier pour le retour ${document.filepath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false))
	  //             }
	  //             finally {
	  //                 callback(null);
	  //             }
	  //         } else {
	  //             try {
	  //                 const convFile = await convertFile(
	  //                     path.join(`${archiveLocation}`, document.filePath),
	  //                     config.fileType,
	  //                     path.join(`${archiveLocation}`, document.currentFileLocation, `${index}${document.fileNameNoExt}_conv.${config.fileType}`)
	  //                 );
	  //                 stackFile.push(convFile);
	  //             }
	  //             catch (err) {
	  //                 setError(new GedError("119", `Error lors de la conversion du fichier pour le retour ${document.filepath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false))
	  //             }
	  //             finally {
	  //                 callback(null);
	  //             }
	  //         }
	  //     }
	  //     catch (err) {
	  //         reject(new GedError("103", `Erreur lors du test de type de fichier ${document.filePath}`, "unknown", document.archiveSource, err, document.codeEdi, 3, false));
	  //     }
	  // }, () => {
	  //     //merge stack
	  //     if (merge) {
	  //         const inputArr = [];
	  //         stackFile.forEach(filePath => {
	  //             inputArr.push(filePath)
	  //         });
	  //
	  //         const inputFile = inputArr.join(" ");
	  //
	  //         gm().append(inputFile)
	  //             .quality(100)
	  //             .write(`${archiveLocation}${path.join(position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)}`, function (err) {
	  //                 if (err) {
	  //                     reject(new GedError("113", `Error on gm cmd de ${position.numEquinoxe}`, "unknown", position.documents[0].archiveSource, err, position.documents[0].codeEdi, 2, false));
	  //                 } else {
	  //                     resolve([path.join(position.documents[0].currentFileLocation, `${position.numEquinoxe}_cat.${config.fileType}`)]);
	  //                 }
	  //             });
	  //     } else {
	  //         resolve(stackFile)
	  //     }
	  //
	  // });
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
			  // .bitdepth(8)
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

  function duplicateFile(source, copy) {
	return new Promise((resolve, reject) => {
	  fs.copy(
		  source,
		  copy,
		  err => {
			if (err) {
			  reject(err);
			}
			resolve(copy);
		  })
	})
  }

  function moveTo(from, to) {
	return new Promise((resolve, reject) => {
	  const is = fs.createReadStream(from),
		  os = fs.createWriteStream(to);
	  is.pipe(os);
	  is.on('end', function () {

		setTimeout(() => {
		  fs.unlink(from, err => {
			// if (err) {
			//     reject(err);
			// } else {
			//     resolve();
			// }
		  });
		}, 60000);
		resolve();
	  });
	  is.on('error', function (err) {
		reject(err);
	  });
	  os.on('error', function (err) {
		reject(err);
	  });
	});
  }

  return new Promise(async (resolve, reject) => {
	let fileToMove = [];
	try {
	  fileToMove = await fileTreatment(position, config.multi);
	  // eachOfLimit(fileToMove, 1, async (filePath, index, callback) => {
	  // eachOfLimit(fileToMove, 1, async (filePath, index, callback) => {
	  await asyncForEach(fileToMove, async (filePath, index) => {
		mkdirp(`${archiveLocation}${path.join("reception", societe.codeEdi, "remonte")}`, async () => {
		  let refTMS = "";
		  if (config.nomenclature.pattern.indexOf("REFTMS") > -1) {
			refTMS = await getRefTMS(position);
		  }

		  function getRetourFolder(codeEdi) {
			switch (codeEdi) {
			  case "FOURREI":
				return "FOURTOU";
			  case "GAUTFRO":
				return "GAUTSAI";
			  case "MESSPOL":
			  case "JEANBES":
			  case "SDTLFRO":
			  case "COMAGAR":
			  case "COMACAM":
			  case "STJOCHA":
			  case "STJOCHO":
				return "RODIGEN";
			  default:
				return codeEdi;
			}
		  }

		  const fileName = filePath.split(path.sep)[filePath.split(path.sep).length - 1];
		  const newFilePath = path.join(`${archiveLocation}reception`,
			  getRetourFolder(societe.codeEdi), "remonte",
			  `${generateNomenclature(config.nomenclature.pattern, position, fileName, refTMS)}${fileName.substr(fileName.length - 4)}`);

		  await moveTo(
			  filePath,
			  newFilePath
		  );
		  console.log(`Move ${filePath} to ${newFilePath}`);
		});
	  });
	  console.log(`Finish traitFileRetourAlpha pour ${position.numEquinoxe} for ${societe.codeEdi}`);
	  resolve(fileToMove);
	}
	catch (err) {
	  setError(err);
	  resolve();
	}
  });
}