import GedError from "../Class/GedError";
import * as conn from "../conn";

export default function getRefTMS(position) {
    return new Promise( (resolve, reject) => {
        conn.pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                connection.query(`SELECT s2.PROPRIETE FROM search_doc s1 INNER JOIN search_doc s2 ON s1.NUM_DOC = s2.NUM_DOC WHERE s1.PROPRIETE = '${position.numEquinoxe}' AND s2.NUM_CHAMPS=2`, function (err, lines) {
                    if (err) {
                        reject(new GedError("DATA EQUINOXE", `erreur au moment de requete ${position.numEquinoxe}`, position.archiveSource, position.archiveSource, err, position.codeEdi, 2, false));
                    } else {
                        if (lines.length > 0) {
                            resolve(lines[0].PROPRIETE);
                        } else {
                            reject(new GedError("DATA EQUINOXE", `no data found for ${position.numEquinoxe}`, position.archiveSource, position.archiveSource, `no data found for ${position.numEquinoxe}`, position.codeEdi, 2, false));
                        }
                    }
                    connection.release();
                });
            }
        });
    })
}