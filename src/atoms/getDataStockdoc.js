import conn from './../conn'
import GedError from "../Class/GedError";
import moment from "moment";

export default function (numDoc, numeroEquinoxe) {
    return new Promise((resolve, reject) => {
        conn.pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                //".$_POST['list'][$i]."
                connection.query(`select numdon,numimage,nopage,numenreg,taille,type,val4,val5 from STOCKDOC where ${numeroEquinoxe ? "val4" : "val1"} ='${numDoc}' and val1 is not null and taille>='232'`, function (err, lines) {
                    if (err) {
                        throw err;
                        // reject(new GedError("204", `erreur au moment de requete ${numEquinoxe}`, position.archiveSource, position.archiveSource, err, position.codeEdi, 2, false));
                    } else {
                        if (lines.length > 0) {
                            const result = [];
                            lines.forEach((line, index) => {
                                result.push({
                                    numdon: line.numdon,
                                    numimage: line.numimage,
                                    numenreg: line.numenreg,
                                    taille: line.taille,
                                    type: line.type,
                                    jobid: `${moment().format("ymdhms")}${line.numenreg}${index}`,
                                    nopage: line.nopage,
                                    val5: line.val5,
                                    numeroEquinoxe: line.val4
                                })
                            });
                            resolve(result);
                        } else {
                            throw "No data found";
                            // reject(new GedError("204", `no data found for ${numEquinoxe}`, "unknown", position.archiveSource, `no data found for ${numEquinoxe}`, position.codeEdi, 2, false));
                        }
                    }
                    connection.release();
                });
            }
        });
    })
}