import chokidar from 'chokidar';
import _ from 'lodash';
import unZip from '../atoms/unzipper';
import traitFiles from './../molecules/traitFiles';
import readBarcode from '../molecules/readBarcode';
import traitBarcode from '../molecules/traitBarcode';
import savePositionsDB from '../molecules/savePositionsDB';
import saveGedDownloadDB from '../molecules/saveGedDownloadDB';
import createLdsAndJpg0 from '../molecules/createLdsAndJpg0';
import archiveFiles from "../atoms/archiveFiles";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import {addSuivi, changeProgress, changeStatus, removeSuivi} from "./suiviTreatment";
import Suivi from "../Class/Suivi";
import GedDownload from './../Schema/GedDownloadSchema'

import LineByLineReader from 'line-by-line';
import downloadImages from "../atoms/downloadImages";
import path from 'path'
import traitRetour from "../molecules/traitRetour";
import async from "async";
import fileTypeCheck from "../atoms/fileTypeCheck";
import generateNomenclature from "../atoms/generateNomenclature";
import {CronJob} from "cron";
import fs from "fs";
import traitRetourApha from "../molecules/traitRetourApha";
import moment from "moment/moment";
import diffMongoMysql from "../atoms/diffMongoMysql";
import checkManquantretour from "../atoms/checkManquantretour";

const currentSuivi = [];
export {currentSuivi};

let watcher;
console.log(process.env.NODE_ENV);

const promiseQueue = [];
const folderToWatch = [];

function initFoler() {
  return new Promise(resolve => {
	if (process.env.NODE_ENV === "development") {
	  fs.readdir("reception", function (err, codeEdis) {
		codeEdis.forEach((codeEdi, index) => {
		  // if (codeEdi !== "CALVACOM" && codeEdi !== ".DS_Store") {
		  if (codeEdi === "DETHSAI") {
			fs.readdir(`reception/${codeEdi}`, function (err, folders) {
			  folders.forEach((folder) => {
				if (folder === "descente") {
				  folderToWatch.push(`reception/${codeEdi}/${folder}`)
				}
				if (index == 66) {
				  resolve(folderToWatch);
				}
			  })
			});
		  }
		})
	  });
	} else {
	  fs.readdir("Z:\\reception", function (err, codeEdis) {
		codeEdis.forEach((codeEdi, index) => {
		  if (codeEdi !== "CALVACOM") {
			// if (codeEdi === "DETHSAI") {
			fs.readdir(`Z:\\reception\\${codeEdi}`, function (err, folders) {
			  folders.forEach((folder) => {
				if (folder === "descente") {
				  folderToWatch.push(`Z:\\reception\\${codeEdi}\\${folder}`)
				}
				if ((codeEdis.length - 1) === index) {
				  resolve(folderToWatch);
				}
			  })
			});
		  }
		})
	  });
	}
  })
}

const jobMissZip = new CronJob('0 */60 * * * *', function () {
  console.log("RUN CRON jobMissZip");
  fs.readdir("Z:\\reception", function (err, items) {
	items.forEach(codeEdi => {
	  fs.readdir(`Z:\\${path.join("reception", codeEdi, "descente")}`, function (err, files) {
		if (!err) {
		  files.forEach(file => {
			treatmentZip(`Z:\\reception\\${codeEdi}\\descente\\${file}`);
		  })
		}
	  });
	});
  });
}, null, false, 'Europe/Paris');


const jobMissInStockdoc = new CronJob('00 30 23 * * 1-5', function () {
  console.log("RUN CRON jobMissInStockdoc");
  diffMongoMysql(moment().format("YYYY-MM-DD"));
  checkManquantretour(moment().format("YYYY-MM-DD").subtract(1, "days"));
}, null, false, 'Europe/Paris');

jobMissInStockdoc.start();

initFoler().then((results) => {
  watcher = chokidar.watch(results, {
	// watcher = chokidar.watch([`Z:\\reception\\CLAUPUL\\descente`], {
	usePolling: true,
	awaitWriteFinish: {
	  stabilityThreshold: 60000,
	  pollInterval: 30000
	}
  });

  watcher.on('add', filePath => {
	treatmentZip(filePath);
  });

  setTimeout(() => jobMissZip.start(), (15 * 60) * 1000)
});

function treatmentZip(filePath) {
  const codeEdi = filePath.split(path.sep)[filePath.split(path.sep).length - 3];
  const zipName = filePath.split(path.sep)[filePath.split(path.sep).length - 1].substring(0, filePath.split(path.sep)[filePath.split(path.sep).length - 1].length - 4);
  const id = `${codeEdi}_${zipName}`;
  console.log(`File ${filePath} has been added`);
  if (_.endsWith(filePath, '.zip')) {
	addSuivi(new Suivi(codeEdi, filePath.split(path.sep)[filePath.split(path.sep).length - 1]));
	changeStatus(id, "Unzipper");
	unZip(filePath)
		.then(documents => {
		  if (documents.length > 0) {
			changeStatus(id, "TraitFiles");
			return traitFiles(documents);
		  } else {
			changeStatus(id, "Error Unzipper");
			return Promise.reject(new GedError("401", `Stop after unzipper pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after unzipper", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(documents => {
		  if (documents[1].length > 0) {
			changeStatus(id, "ReadBarcodes");
			changeProgress(id, 10);
			return readBarcode(documents[1]);

		  } else {
			changeStatus(id, "Error TraitFiles");
			return Promise.reject(new GedError("402", `Stop after traiFiles pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traiFiles", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(documents => {
		  if (documents.length > 0) {
			changeStatus(id, "TraitBarcodes");
			changeProgress(id, 30);
			return traitBarcode(documents);
		  } else {
			changeStatus(id, "Error ReadBarcodes");
			return Promise.reject(new GedError("403", `Stop after readBarcodes pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after readBarcodes", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(positions => {
		  if (positions.length > 0) {
			changeStatus(id, "SavePositionsDB");
			changeProgress(id, 50);
			return savePositionsDB(positions);
		  } else {
			changeStatus(id, "Error TraitBarcodes");
			return Promise.reject(new GedError("404", `Stop after traitBarcode pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after traitBarcode", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(positions => {
		  if (positions.length > 0) {
			changeStatus(id, "CreateLdsAndJpg0");
			changeProgress(id, 70);
			return createLdsAndJpg0(positions);
		  } else {
			changeStatus(id, "Error SavePositionsDB");
			return Promise.reject(new GedError("405", `Stop after savePositionsDB pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after savePositionsDB", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(positions => {
		  if (positions.length > 0) {
			changeStatus(id, "Archivage");
			changeProgress(id, 80);
			return archiveFiles(positions);
		  } else {
			changeStatus(id, "Error CreateLdsAndJpg0");
			return Promise.reject(new GedError("406", `Stop after createLdsAndJpg0 pour ${ filePath.split(path.sep)[filePath.split(path.sep).length - 1]}`, filePath.split(path.sep)[filePath.split(path.sep).length - 1], filePath.split(path.sep)[filePath.split(path.sep).length - 1], "Stop after createLdsAndJpg0", filePath.split(path.sep)[filePath.split(path.sep).length - 3], 3, true));
		  }
		})
		.then(positions => {
		  changeStatus(id, "Retour");
		  changeProgress(id, 90);
		  return traitRetourApha(positions);
		})
		.then(() => {
		  changeProgress(id, 100);
		  removeSuivi(id);
		  console.log("finish")
		})
		.catch(err => {
		  //error handler
		  console.log("Good error handling");
		  console.log(err);
		  setError(err);
		})
  }
}


let watcherCalva;
if (process.env.NODE_ENV === "development") {
  watcherCalva = chokidar.watch('reception/CALVACOM', {
	usePolling: true,
	awaitWriteFinish: {
	  stabilityThreshold: 30000,
	  pollInterval: 5000
	},
  });
} else {
  watcherCalva = chokidar.watch('Z:\\reception/CALVACOM/descente', {
	usePolling: true,
	awaitWriteFinish: {
	  stabilityThreshold: 30000,
	  pollInterval: 5000
	},
  });
}

let lines = [];
let treatCalvaActive = false;

function startTreatmentCalva() {
  setTimeout(() => {
	treatCalvaActive = false;
	saveGedDownloadDB(lines).then(imagesToDl => {
	  lines = [];
	  downloadImages(imagesToDl, "CALVACOM", null).then(documents => {
		//TODO status dl
		return traitBarcode(documents);
	  }).then(positions => {
		return savePositionsDB(positions);
	  }).then(positions => {
		return createLdsAndJpg0(positions);
	  }).then(positions => {
		return archiveFiles(positions);
	  }).then(positions => {
		return traitRetourApha(positions);
	  }).then(() => {
		//TODO status terminé delete de la bdd
	  }).catch(err => {
		console.log(err);
	  })
	}).catch(err => {
	  console.log(err);
	})
  }, 5000)
}

watcherCalva.on('add', filePath => {
  console.log(`File ${filePath} has been added`);
  if (_.endsWith(filePath, '.TXT')) {
	const lr = new LineByLineReader(filePath);
	lr.on('error', function (err) {
	  // 'err' contains error object
	});

	lr.on('line', function (line) {
	  lines.push({line: line, filePath: filePath});
	});

	lr.on('end', function () {
	  if (!treatCalvaActive) {
		treatCalvaActive = true;
		startTreatmentCalva();
	  }
	});
  }

});
