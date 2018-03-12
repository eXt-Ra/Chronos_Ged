import SocieteMongo from "../Schema/SocieteSchema";


export default function getSiretSociete(codeEdi) {
    return new Promise((resolve, reject) => {
        SocieteMongo.findOne({
            codeEdi: codeEdi
        }).then((societe) => {
            if (societe != null) {
                resolve(societe.siret);
            } else {
                resolve("");
            }
        }).catch(err => {
            if (err) {
                resolve("");
            }
        });
    })
}