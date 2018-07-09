import conn from './../conn'
import GedError from "../Class/GedError";

export default function (numEquinoxe, position) {
    return new Promise((resolve, reject) => {
        conn.pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                connection.query(`SELECT s2.PROPRIETE ,s2.NUM_DOC FROM search_doc s1 INNER JOIN search_doc s2 ON s1.NUM_DOC = s2.NUM_DOC WHERE s1.PROPRIETE = '${numEquinoxe}' AND s2.PROPRIETE != 'GENTFRO' AND s2.NUM_CHAMPS=12 order by s2.NUM_DOC desc`, function (err, lines) {
                    if (err) {
                        reject(new GedError("204", `erreur au moment de requete ${numEquinoxe}`, position.archiveSource, position.archiveSource, err, position.codeEdi, 2, false));
                    } else {
                        if (lines.length > 0) {
                            resolve([lines[0].PROPRIETE, lines[0].NUM_DOC]);
                        } else {
                            reject(new GedError("204", `no data found for ${numEquinoxe}`, "unknown", position.archiveSource, `no data found for ${numEquinoxe}`, position.codeEdi, 2, false));
                        }
                    }
                    connection.release();
                });
            }
        });
    })
}