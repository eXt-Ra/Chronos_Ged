import Position from "../Class/Position";
import PositionSchema from "../Schema/PositionSchema";
import Document from "../Class/Document";
import * as path from "path";
import createLdsAndJpg0 from "../molecules/createLdsAndJpg0";
import GedError from "../Class/GedError";
import ErrorSchema from "../Schema/ErrorSchema";
import {sendMail} from './../organisms/mailer'
import errorMail from './../View/Mail/ErrorMail'

var ncp = require('ncp').ncp;
ncp.limit = 16;

function regenLdsJp0(self) {
  PositionSchema.findOne(
	  {numEquinoxe: self.args[0].numEquinoxe}
  ).then(position => {
	if (position != null) {
	  position.documents = position.numEquinoxe;
	  const pos = new Position(position.numEquinoxe, position.codeEdi, position.societe, position.archiveSource);
	  pos.remettant = position.remettant;
	  pos.numeroDoc = position.numeroDoc;
	  position.docs.forEach(doc => {
		const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join("Z:", doc.currentFileLocation, doc.fileName));
		pos.documents.push(newDoc);
	  });
	  createLdsAndJpg0([position]).then(data => {
		[position].forEach(pos => {
		  ncp(path.join(pos.documents[0].currentFileLocation, "lds"), `Z:\\lds`, function (err) {
			if (err) {
			  ErrorSchema.update({
					"_id": self.dbErrorID
				  }, {
					$set: {
					  status: "ErrorBot Fail"
					}
				  },
				  function (err, model) {
					if (err) {
					  console.log(err);
					}
				  });

			  sendMail(errorMail({
				code: self.errObj.type,
				codeEdi: self.errObj.codeEdi
			  }));
			} else {
			  ErrorSchema.update({
					"_id": self.dbErrorID
				  }, {
					$set: {
					  status: "Close by ErrorBot"
					}
				  },
				  function (err, model) {
					if (err) {
					  console.log(err);
					}
				  });
			}
		  })
		});
	  }).catch(err => {
		console.log(err);
	  });
	}
  })
}

const errorProcess = [{
  code: "100",
  fnc: () => {
	//retry to treat the zip
	//les zip ne sont plus mit en erreur, on attend simplement que le cron job repasse.
  }
}, {
  code: "101",
  fnc: () => {
	//retry to treat the zip
	//pas d'eeur depuis 04/2018 donc bon
  }
}, {
  code: "102",
  fnc: () => {
	//retry to treat the zip
	//jamais eu cete erreur
  }
}, {
  code: "103",
  fnc: (self) => {
	//retry to treat the zip
	//SI ZIP
	//SI FICHIER IMG
	//TODO
	console.log(self.dbErrorID);
  }
}, {
  code: "105",
  fnc: (self) => {
	//retry to create the lds/jpg0 with position in args[0]
	regenLdsJp0(self);
  }
}, {
  code: "106",
  fnc: (self) => {
	//if the file is in error retry to rename if not retry from archive
	regenLdsJp0(self);
  }
}, {
  code: "107",
  fnc: (self) => {
	//recreate the lds/jp0 with position array in args[0]
	regenLdsJp0(self);
  }
}, {
  code: "108",
  fnc: () => {
	//if file is in error retry to archive else find archeSource unzip it and archive the missing file
	//TODO
  }
}, {
  code: "109",
  fnc: () => {
	//if file is in error retry to archive else find archeSource unzip it and archive the missing file
	//TODO
  }
}, {
  code: "111",
  fnc: () => {
	//retry de la copy du fichier in different location if no success regenerate retour with position in args[0]
  }
}, {
  code: "112",
  fnc: () => {
	//retry du retour du fichier in different location if no success regenerate retour with position in args[0]
  }
}, {
  code: "113",
  fnc: () => {
	//retry du retour du fichier in different location if no success regenerate retour with position in args[0]
  }
}, {
  code: "115",
  fnc: () => {
	//retry du traitement du fichier
  }
}, {
  code: "117",
  fnc: () => {
	//retry du traitement du fichier

  }
}, {
  code: "118",
  fnc: () => {
	//retry du copy du fichier pour geodis
  }
}, {
  code: "120",
  fnc: (self) => {
	sendMail(errorMail({
	  code: "120",
	  codeEdi: self.errObj.codeEdi
	}));
  }
},
  {
	code: "402",
	fnc: (self) => {
	  sendMail(errorMail({
		code: "402",
		codeEdi: self.errObj.codeEdi
	  }));
	}
  }, {
	code: "403",
	fnc: (self) => {
	  sendMail(errorMail({
		code: "403",
		codeEdi: self.errObj.codeEdi
	  }));
	}
  }, {
	code: "404",
	fnc: (self) => {
	  sendMail(errorMail({
		code: "404",
		codeEdi: self.errObj.codeEdi
	  }));
	}
  }, {
	code: "405",
	fnc: (self) => {
	  sendMail(errorMail({
		code: "405",
		codeEdi: self.errObj.codeEdi
	  }));
	}
  }, {
	code: "406",
	fnc: (self) => {
	  sendMail(errorMail({
		code: "406",
		codeEdi: self.errObj.codeEdi
	  }));
	}
  }];

export default class ErrorBot {

  constructor(errObj, isFileInErrorFolder, args, dbErrorID) {
	const self = this;
	self.errObj = errObj;
	self.args = args;
	self.dbErrorID = dbErrorID;
	self.isFileInErrorFolder = isFileInErrorFolder;

	this.runBot = function () {
	  errorProcess.find(item => {
		return item.code === this.errObj.type;
	  }).fnc(self)
	};
	this.runBot();
  }
}