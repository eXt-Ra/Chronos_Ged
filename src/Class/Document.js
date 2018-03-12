import moment from 'moment'
import path from "path";

export default class Document {
    get currentFileLocation() {
        return this._currentFileLocation;
    }

    set currentFileLocation(value) {
        this._currentFileLocation = value;
    }

    get fileName() {
        return this._fileName;
    }

    set fileName(value) {
        this._fileName = value;
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

    get jpgFile() {
        return this._jpgFile;
    }

    set jpgFile(value) {
        this._jpgFile = value;
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

    get barecode() {
        return this._barecode;
    }

    set barecode(value) {
        this._barecode = value;
    }

    get fileNameNoExt() {
        return this._fileName.substring(0, this._fileName.length - 4);
    }

    get filePath() {
        return path.join(this._currentFileLocation, this._fileName);
    }

    toSchema() {
        return {
            barcode: this._barecode,
            codeEdi: this._codeEdi,
            dateTreatment: this._dateTreatment,
            archiveSource: this._archiveSource,
            fileName: this._fileName,
            currentFileLocation: this._currentFileLocation
        }
    }

    constructor(codeEdi, societe, archiveSource, pathFile) {
        this._barecode = [];
        this._codeEdi = codeEdi;
        this._societe = societe;
        this._jpgFile = "";
        this._dateTreatment = moment().format();
        this._archiveSource = archiveSource;
        this._fileName = pathFile.split(path.sep)[pathFile.split(path.sep).length - 1];
        this._currentFileLocation = pathFile.split(path.sep).slice(0, -1).join(path.sep);
    }
}