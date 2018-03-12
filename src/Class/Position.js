import moment from 'moment'

export default class Position {
    get numeroDoc() {
        return this._numeroDoc;
    }

    set numeroDoc(value) {
        this._numeroDoc = value;
    }

    get remettant() {
        return this._remettant;
    }
    set remettant(value) {
        this._remettant = value;
    }

    get archiveSource() {
        return this._archiveSource;
    }

    set archiveSource(value) {
        this._archiveSource = value;
    }

    get dateTreatment() {
        return this._dateTreatment;
    }

    set dateTreatment(value) {
        this._dateTreatment = value;
    }

    get documents() {
        return this._documents;
    }

    set documents(value) {
        this._documents = value;
    }

    get societe() {
        return this._societe;
    }

    set societe(value) {
        this._societe = value;
    }

    get codeEdi() {
        return this._codeEdi;
    }

    set codeEdi(value) {
        this._codeEdi = value;
    }

    get numEquinoxe() {
        return this._numEquinoxe;
    }

    set numEquinoxe(value) {
        this._numEquinoxe = value;
    }

    toSchema() {
        const outputDoc = [];
        this._documents.forEach(document => {
            outputDoc.push(document.toSchema())
        });
        return {
            numEquinoxe: this._numEquinoxe,
            codeEdi: this._codeEdi,
            societe: this._societe,
            docs: outputDoc,
            dateTreatment: this._dateTreatment,
            archiveSource: this._archiveSource,
            remettant: this._remettant,
            numeroDoc: this._numeroDoc
        };
    }

    constructor(numEquinoxe, codeEdi, societe, archiveSource) {
        this._numEquinoxe = numEquinoxe;
        this._codeEdi = codeEdi;
        this._societe = societe;
        this._documents = [];
        this._dateTreatment = moment().format();
        this._archiveSource = archiveSource;
        this._remettant = "";
        this._numeroDoc = "";
    }
}