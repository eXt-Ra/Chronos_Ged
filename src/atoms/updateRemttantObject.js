import getDataWithNumEquinoxe from "./getDataWithBarcode";
import setError from "../molecules/setError";
import GedError from "../Class/GedError";
import SocieteMongo from "../Schema/SocieteSchema";
import * as path from "path";
import Document from "../Class/Document";
import Position from "../Class/Position";
import PositionSchema from "../Schema/PositionSchema";

export default function updateRemttantObject(arrNumequinoxe) {
	return new Promise(resolve => {
	  const promiseQ = [];
	  const positionsFilter = [];
	  arrNumequinoxe.forEach((numEquinoxe, index) => {
		PositionSchema.findOne({numEquinoxe: numEquinoxe})
			.then(position => {
			  if (position != null) {
				promiseQ.push(new Promise((resolve, reject) => {
				  getDataWithNumEquinoxe(numEquinoxe, position).then(data => {
					SocieteMongo.findOne({
					  codeEdi: data[0]
					}).then((societe) => {
					  if (societe != null) {
						position.remettant = societe;
						positionsFilter.push(position);
						position.save()
					  } else {
						reject(new GedError("200", `Societe introuvable pour le codeEdi ${data[0]}`, position.archiveSource, position.archiveSource, `Societe introuvable pour le codeEdi ${data[0]}`, position.codeEdi, 1, false));
					  }
					  resolve()
					})
				  }).catch(errObj => {
					//find and delete pos
					// positions.splice(index, 1);
					setError(errObj);
					resolve();
				  })
				}))
			  } else {
				positionsInconnu.push(numEquinoxe);
			  }
			})
	  });
	  Promise.all(promiseQ).then(() => {
		resolve(positionsFilter);
	  }).catch(err => {
	    console.log(err)
		resolve();
		// reject(err);
	  })
	})
}