import moment from "moment/moment";
import PositionSchema from "../Schema/PositionSchema";
import Document from "../Class/Document";
import Position from "../Class/Position";
import createLdsAndJpg0 from "../molecules/createLdsAndJpg0";
import GedError from "../Class/GedError";
import async from "async";
import * as path from "path";
import traitRetourApha from "../molecules/traitRetourApha";
import fs from 'fs';

export default function checkManquantretour(from) {

  const query = {
	"$and": [
	  {
		"dateTreatment": {
		  "$lt": moment().format()
		}
	  },
	  {
		"dateTreatment": {
		  "$gt": from
		}
	  },
	  {
		"$or": [
		  {
			"remettant.retour": {
			  "$exists": true
			}
		  },
		  {
			"societe.retour.wantRemettant": true
		  }
		]
	  },
	  {
		"$or": [
		  {
			"state": {
			  "$exists": false
			}
		  },
		  {
			"$or": [
			  {
				"state.retourDistributeur": false
			  },
			  {
				"state.retourRemettant": false
			  }
			]
		  }
		]
	  }
	]
  };

  const resultPos = [];
  return new Promise((resolve, reject) => {
	const resultPos = [];
	return new Promise((resolve, reject) => {
	  PositionSchema.find(query)
		  .then(positions => {
			const result = [];
			console.log(`Nb positions select ${positions.length}`);
			async.each(positions, function (pos, callback) {
			  PositionSchema.findOne(
				  {numEquinoxe: pos.numEquinoxe}
			  ).then(position => {
				if (position != null) {
				  position.documents = position.numEquinoxe;
				  const pos = new Position(position.numEquinoxe, position.codeEdi, position.societe, position.archiveSource);
				  pos.remettant = position.remettant;
				  pos.numeroDoc = position.numeroDoc;
				  position.docs.forEach(doc => {
					doc.currentFileLocation = doc.currentFileLocation.replace("output", "archive");
					const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join(doc.currentFileLocation, doc.fileName));
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
			  traitRetourApha(resultPos).then(data => {
				resolve("Régénération Retour terminé");
			  }).catch(err => {
				console.log(err);
			  });
			});
			fs.writeFile(path.join("report", `resultManquantRetour${moment().format("DDMMYYHHMMSS")}.json`), JSON.stringify(result), (err) => {
			  if (err) {
				console.error(err);
				return;
			  }
			  console.log("File has been created");
			});
		  });
	})
  })
}