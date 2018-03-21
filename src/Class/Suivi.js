import moment from 'moment';

export default class Suivi {
    get progress() {
        return this._progress;
    }

    set progress(value) {
        this._progress = value;
    }
    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get log() {
        return this._log;
    }

    set log(value) {
        this._log = value;
    }

    get dateEnd() {
        return this._dateEnd;
    }

    set dateEnd(value) {
        this._dateEnd = value;
    }

    get dateStart() {
        return this._dateStart;
    }

    set dateStart(value) {
        this._dateStart = value;
    }

    get status() {
        return this._status;
    }

    set status(value) {
        this._status = value;
    }

    get archiveSource() {
        return this._archiveSource;
    }

    set archiveSource(value) {
        this._archiveSource = value;
    }

    get codeEdi() {
        return this._codeEdi;
    }

    set codeEdi(value) {
        this._codeEdi = value;
    }

    addLog(log) {
        this._log.push(log);
    }

    toSchema() {
        return {
            id: this._id,
            codeEdi: this._codeEdi,
            archiveSource: this._archiveSource,
            dateStart: this.dateStart,
            dateEnd: this.dateEnd,
            log: this._log,
            status : this._status
        }
    }

    constructor(codeEdi, archiveSource) {
        this._codeEdi = codeEdi;
        this._archiveSource = archiveSource;
        this._status = "progress";
        this._dateStart = moment().format();
        this._dateEnd = "";
        this._id = `${codeEdi}_${archiveSource.slice(0, -4)}`;
        this._log = [];
        this._progress = 0;
    }
}