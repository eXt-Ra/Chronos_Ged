import Suivi from "../Class/Suivi";

const currentSuivi = [];
import SuiviSchema from '../Schema/SuiviSchema'



function findSuivi(id) {
    return currentSuivi.findIndex(suivi => {
        return suivi.id === id;
    })
}

const addSuivi = function addSuivi(suivi) {
    return new Promise((resolve, reject) => {
        currentSuivi.push(suivi);
        SuiviSchema.findOne({
            id: suivi.id
        }).then(resSuivi => {
            if (resSuivi == null) {
                const newSuivi = new SuiviSchema(suivi.toSchema());
                newSuivi.save((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            }
        })
    }).catch(err => {
        console.log(err);
    })
};

const removeSuivi = function removeSuivi(id) {
    return new Promise((resolve, reject) => {
        currentSuivi.splice(findSuivi(id), 1);
        SuiviSchema.findOneAndUpdate(
            {id: id},
            {$set: {status: "Close"}}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    }).catch(err => {
        console.log(err);
    })
};

const addLog = function addLog(id, log) {
    return new Promise((resolve, reject) => {
        currentSuivi[findSuivi(id)].addLog(log);
        SuiviSchema.findOneAndUpdate(
            {id: id},
            {$push: {log: log}}, function (err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    }).catch(err => {
        console.log(err);
    })
};

const changeStatus = function changeStatus(id, status) {
    return new Promise((resolve, reject) => {
        currentSuivi[findSuivi(id)].status = status;
        SuiviSchema.findOneAndUpdate(
            {id: id},
            {$set: {status: status}}, function (err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
    }).catch(err => {
        console.log(err);
    })
};

const changeProgress = function changeProgress(id, progress) {
    return new Promise((resolve, reject) => {
        currentSuivi[findSuivi(id)].progress = progress;
        resolve();
    }).catch(err => {
        console.log(err);
    })
};


export {currentSuivi, addSuivi, removeSuivi, addLog, changeStatus, changeProgress}