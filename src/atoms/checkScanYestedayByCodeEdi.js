import GedError from "../Class/GedError";
import SocieteMongo from "../Schema/SocieteSchema";
import PositionSchema from "../Schema/PositionSchema";
import moment from "moment/moment";
import async from 'async'

export default function () {
  return new Promise((resolve, reject) => {
	SocieteMongo.find({}).then((societes) => {
	  async.eachLimit(societes,1, function (societe, callback) {
		PositionSchema.aggregate([
		  {
			"$match" : {
			  "codeEdi" : societe.codeEdi,
			  "dateTreatment" : {
				"$gt" : moment().subtract(1, "days").toDate()
			  }
			}
		  },
		  {
			"$count" : "count"
		  }
		], function (err, result) {
		  if(result[0]){
			console.log(result[0].count);
		  }else{
		    console.log(`nothing for ${societe.codeEdi}`)
		  }
		  callback();
		});

	  }, function (err) {
		// if any of the file processing produced an error, err would equal that error
		if (err) {
		  // One of the iterations produced an error.
		  // All processing will now stop.
		  console.log('A file failed to process');
		} else {
		  console.log('All files have been processed successfully');
		}
	  });
	})
  })
}