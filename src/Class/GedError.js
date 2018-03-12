import moment from "moment";

export default class GedError {
    get status() {
        return this._status;
    }

    set status(value) {
        this._status = value;
    }
    get dateError() {
        return this._dateError;
    }

    set dateError(value) {
        this._dateError = value;
    }
    get stopProcess() {
        return this._stopProcess;
    }

    set stopProcess(value) {
        this._stopProcess = value;
    }
    get criticality() {
        return this._criticality;
    }

    set criticality(value) {
        this._criticality = value;
    }
    get codeEdi() {
        return this._codeEdi;
    }

    set codeEdi(value) {
        this._codeEdi = value;
    }
    get error() {
        return this._error;
    }

    set error(value) {
        this._error = value;
    }
    get sourceArchive() {
        return this._sourceArchive;
    }

    set sourceArchive(value) {
        this._sourceArchive = value;
    }
    get source() {
        return this._source;
    }

    set source(value) {
        this._source = value;
    }
    get message() {
        return this._message;
    }

    set message(value) {
        this._message = value;
    }
    get type() {
        return this._type;
    }

    set type(value) {
        this._type = value;
    }

    get toSchema() {
        return {
            type : this._type,
            message: this._message,
            source: this._source,
            sourceArchive: this._sourceArchive,
            err: this._error,
            codeEdi: this._codeEdi,
            criticality: this._criticality,
            stopProcess: this._stopProcess,
            dateError: this._dateError,
            status: this._status
        };
    }
    constructor(type, message, source, sourceArchive, err, codeEdi, criticality, stopProcess) {
        this._type = type;
        this._message = message;
        this._source = source;
        this._sourceArchive = sourceArchive;
        this._error = err;
        this._codeEdi = codeEdi;
        this._criticality = criticality;
        this._stopProcess = stopProcess;
        this._dateError = moment().format();
        this._status = "Open";
    }
}