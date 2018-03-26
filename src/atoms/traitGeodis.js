import fs from 'fs-extra'
import setError from "../molecules/setError";
import GedError from "../Class/GedError";

export default function (document) {
    return new Promise((resolve, reject) => {
        fs.copy(document.fullPath, 'e:/dealtis/out/geodis/new/', function (err) {
            if (err) {
                setError(new GedError("118", `Error de copy du fichier pour Geodis`, "unknown", document.archiveSource, err, document.codeEdi, 2, false))
            }
        });
    })
}