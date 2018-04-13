import moment from "moment/moment";
import getRefTMS from "./getRefTMS";

export default function generateNomenclature(nomenclature, position, file, refTMS) {
    const options = [{
        title: "SUFFIXE",
        fnc: () => {
            // return conf.nomenclature.suffixe
        }
    }, {
        title: "PREFIXE",
        fnc: () => {
            // return conf.nomenclature.prefixe
        }
    }, {
        title: "NUMEROEQUINOXE",
        fnc: () => {
            return position.numEquinoxe
        }
    }, {
        title: "DATE",
        fnc: () => {
            return moment().format();
        }
    }, {
        title: "PAGE",
        fnc: (file) => {
            return file.charAt(0);
        }
    }, {
        title: "REFDISTRI",
        fnc: () => {
            return position.codeEdi;
        }
    }, {
        title: "REFTMS",
        fnc: () => {
            // getRefTMS(position).then(refTMS => {
            //     console.log(refTMS);
            //     return refTMS;
            // })
        }
    }];

    const currentOption = [];
    options.forEach(option => {
        if (nomenclature.indexOf(option.title) > -1) {
            currentOption.push(option);
        }
    });

    currentOption.forEach(option => {
        if (option.title === "REFTMS") {
            nomenclature = nomenclature.replace("REFTMS", refTMS);
        } else {
            nomenclature = nomenclature.replace(option.title, option.fnc(file));
        }

    });
    return nomenclature;

}