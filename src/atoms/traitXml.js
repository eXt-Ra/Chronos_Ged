import convertTifToSplitJpg from "./convertTifToSplitJpg";
import * as async from "async";
import downloadImages from "./downloadImages";
import LineByLineReader from "line-by-line";
import traitBarcode from "../molecules/traitBarcode";
import saveGedDownloadDB from "../molecules/saveGedDownloadDB";
import moment from "moment/moment";
import GedDownload from "../Schema/GedDownloadSchema";
import {parseString} from "xml2js";
import fs from 'fs';
import * as path from "path";

export default function traitXml(documents) {
  return new Promise((resolve, reject) => {
	const promiseQ = [];
	//lines.push({line: line, filePath: filePath});
	documents.forEach(document => {
	  promiseQ.push(
		  function (callback) {
			const filetoDl = [];
			fs.readFile(document.filePath, function (err, data) {
			  parseString(data, function (err, result) {
				if (result.Expeditions.Expedition[0].URL) {
				  console.log(result.Expeditions.Expedition[0].URL[0]);
				  console.log(result.Expeditions.Expedition[0]["Ref-Expedition"]);
				  filetoDl.push(
					  new GedDownload({
						numeroEquinoxe: result.Expeditions.Expedition[0]["Ref-Expedition"],
						codeEdi: document.codeEdi,
						dateTreatment: moment().format(),
						fileUrl: result.Expeditions.Expedition[0].URL[0],
						fileName: document.filePath,
						status: "Not Download"
					  })
				  );
				  downloadImages(filetoDl, document.codeEdi, document.archiveSource).then(data => callback(null, data))
				} else {
				  console.log("NOTHING");
				  fs.unlink(document.filePath, err => {
				  });
				  callback(null)
				}
			  });

			});
		  }
	  )
	});

	async.parallelLimit(promiseQ, 3,
		function (err, results) {
		  const documents = [];
		  results.forEach(arr => {
			if (arr !== undefined) {
			  documents.push.apply(documents, arr);
			}
		  });
		  resolve(documents);
		});
  }).catch(err => {
	//TODO did this trigger ?
	console.log("Err that should not be trigger");
	console.log(err)
	// reject(errObj);
  });
}