import _ from 'lodash'

export default function wantRetour(societe) {
    if (_.isUndefined(societe.retour)) {
        return false;
    } else {
        if (_.isUndefined(societe.retour.fileType)) {
            return false;
        } else {
            return true;
        }
    }
}