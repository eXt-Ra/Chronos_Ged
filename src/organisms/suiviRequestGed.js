const suiviRequestGed = [];

function addSuiviRequestGed(suivi) {
    suiviRequestGed.push(suivi);
}

function removeSuiviRequestGed(ids) {
    ids.forEach(id => {
        const index = suiviRequestGed.findIndex(item => {
            return item.id === id;
        });
        if (index > -1) {
            suiviRequestGed.splice(index, 1);
        }
    });
}

function updateSuiviRequestGed(suivi) {
    const index = suiviRequestGed.findIndex(item => {
        return item.id === suivi.id;
    });
    if (index !== -1) {
        suiviRequestGed[index] = suivi;
    }
}

function getSuiviRequestGed(ids) {
    return suiviRequestGed.filter(suivi => {
        return ids.filter(id => {
            return suivi.id === id
        });
    })
}

export {addSuiviRequestGed, removeSuiviRequestGed, updateSuiviRequestGed, getSuiviRequestGed};