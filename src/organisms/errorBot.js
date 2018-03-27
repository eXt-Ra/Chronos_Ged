const errorProcess = [{
    code: "100",
    fnc: () => {
        //retry to treat the zip
        console.log("yo")
    }
}, {
    code: "101",
    fnc: () => {
        //retry to treat the zip
    }
}, {
    code: "102",
    fnc: () => {
        //retry to treat the zip
    }
}, {
    code: "103",
    fnc: () => {
        //retry to treat the zip
    }
}, {
    code: "105",
    fnc: () => {
        //retry to create the lds/jpg0 with dataLds in args[0]
    }
}, {
    code: "106",
    fnc: () => {
        //if the file is in error retry to rename if not retry from archive
    }
}, {
    code: "107",
    fnc: () => {
        //recreate the lds/jp0 with position array in args[0]
    }
}, {
    code: "108",
    fnc: () => {
        //if file is in error retry to archive else find archeSource unzip it and archive the missing file
    }
}, {
    code: "109",
    fnc: () => {
        //if file is in error retry to archive else find archeSource unzip it and archive the missing file
    }
}, {
    code: "111",
    fnc: () => {
        //retry de la copy du fichier in different location if no success regenerate retour with position in args[0]
    }
}, {
    code: "112",
    fnc: () => {
        //retry du retour du fichier in different location if no success regenerate retour with position in args[0]
    }
}, {
    code: "113",
    fnc: () => {
        //retry du retour du fichier in different location if no success regenerate retour with position in args[0]
    }
}, {
    code: "115",
    fnc: () => {
        //retry du traitement du fichier
    }
}, {
    code: "117",
    fnc: () => {
        //retry du traitement du fichier
    }
}, {
    code: "118",
    fnc: () => {
        //retry du copy du fichier pour geodis
    }
}];


export default class ErrorBot {
    runBot() {
        errorProcess.find( item => {
            return item.code === this.errObj.type;
        }).fnc()
    }

    constructor(errObj, isFileInErrorFolder) {
        this.errObj = errObj;
        this.isFileInErrorFolder = isFileInErrorFolder;
        this.runBot();
    }
}