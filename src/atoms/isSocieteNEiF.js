import _ from 'lodash'

export default function isSocieteNEiF(societe) {
    if (_.isUndefined(societe.params)) {
        return false;
    } else if (!(_.isUndefined(societe.params.numEquiInFilename))) {
        return societe.params.numEquiInFilename;
    } else {
        return false;
    }
}