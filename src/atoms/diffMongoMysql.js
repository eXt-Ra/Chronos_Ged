import PositionSchema from './../Schema/PositionSchema'
import async from 'async'
import moment from "moment/moment";
import conn from './../conn'
import fs from 'fs';
import createLdsAndJpg0 from "../molecules/createLdsAndJpg0";
import * as path from "path";
import GedError from "../Class/GedError";
import Position from "../Class/Position";
import Document from "../Class/Document";

var ncp = require('ncp').ncp;
ncp.limit = 16;

export default function diffMongoMysql(date) {
  const resultPos = [];
  return new Promise((resolve, reject) => {
	PositionSchema.find({
	  "dateTreatment": {
		"$gte": date,
	  }
	}).then(positions => {
	  const result = [];
	  async.eachLimit(positions, 1, function (position, callback) {
		conn.pool.getConnection((err, connection) => {
		  if (err) {
			reject(err);
		  } else {
			connection.query(`select val4 from STOCKDOC where val4 ='${position.numEquinoxe}'`, function (err, lines) {
			  if (err) {
				// throw err;
				console.log(err);
			  } else {
				if (lines.length > 0) {
				  // console.log(`found ${position.numEquinoxe}`)
				} else {
				  console.log(`not found ${position.numEquinoxe}`);
				  result.push(position.numEquinoxe);
				}
			  }
			  callback(null);
			  connection.release();
			});
		  }
		});
	  }, function (err) {
		if (err) {
		  console.log('A file failed to process');
		} else {
		  console.log(`Nb positions select ${positions.length}`);
		  async.each(result, function (numEquinoxe, callback) {
			PositionSchema.findOne(
				{numEquinoxe: numEquinoxe}
			).then(position => {
			  if (position != null) {
				position.documents = position.numEquinoxe;
				const pos = new Position(position.numEquinoxe, position.codeEdi, position.societe, position.archiveSource);
				pos.remettant = position.remettant;
				pos.numeroDoc = position.numeroDoc;
				position.docs.forEach(doc => {
				  doc.currentFileLocation = doc.currentFileLocation.replace("output", "archive");
				  const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join("Z:", doc.currentFileLocation, doc.fileName));
				  pos.documents.push(newDoc);
				});
				position.markModified('docs');
				position.save();
				resultPos.push(pos);
			  }
			  callback();
			})
		  }, function () {
			console.log("STSRATATA");
			createLdsAndJpg0(resultPos).then(data => {
			  resultPos.forEach(pos => {
				ncp(path.join(pos.documents[0].currentFileLocation, "lds"), `Z:\\lds`, function (err) {
				  if (err) {
					err._error.forEach(errT => {
					  if (errT.syscall !== "unlink") {
						console.log(new GedError("107", `Déplacement des LDS échoué de ${pos.documents[0].currentFileLocation}/lds`, pos.archiveSource, pos.archiveSource, err, pos.codeEdi, 2, false, ""));
					  }
					});
				  } else {
					console.log("Régénération jp0 terminé")
				  }
				})
			  });
			  resolve("Régénération jp0 terminé");
			}).catch(err => {
			  console.log(err);
			});
		  });
		  fs.writeFile(path.join("report", `resultDiff${moment().format("DDMMYYHHMMSS")}.json`), JSON.stringify(result), (err) => {
			if (err) {
			  console.error(err);
			  return;
			}
			console.log("File has been created");
		  });
		}
	  });
	});
  })
}