import PositionSchema from './../Schema/PositionSchema'
import async from 'async'
import moment from "moment/moment";
import conn from './../conn'
import fs from 'fs';

export default function diffMongoMysql() {
  return new Promise((resolve, reject) => {
	PositionSchema.find({
	  "dateTreatment": {
		"$gte": "2018-06-01",
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
				throw err;
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
		// if any of the file processing produced an error, err would equal that error
		if (err) {
		  // One of the iterations produced an error.
		  // All processing will now stop.
		  console.log('A file failed to process');
		} else {
		  console.log(`Nb positions select ${positions.length}`);
		  resolve(result);
		  fs.writeFile("./resultDiff.json", JSON.stringify(result), (err) => {
			if (err) {
			  console.error(err);
			  return;
			};
			console.log("File has been created");
		  });
		}
	  });
	});
  })
}