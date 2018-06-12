import {currentSuivi} from "./organisms/watcher";
import SuiviSchema from './Schema/SuiviSchema'
import ErrorSchema from './Schema/ErrorSchema'
import SocieteSchema from './Schema/SocieteSchema'
import PositionSchema from './Schema/PositionSchema'
import Position from './Class/Position'
import Document from './Class/Document'
import fs from 'fs';
var ncp = require('ncp').ncp;
ncp.limit = 16;
import uid from "rand-token";
import async from 'async';
const app = express();
import bodyParser from 'body-parser';
import mergePdf from "./atoms/mergePdf";
import mergePdfPdftk from "./atoms/mergePdfPdftk";
import converToPdf from "./atoms/converToPdf";
import fileTypeCheck from "./atoms/fileTypeCheck";
import GedError from "./Class/GedError";
import mergeJpg from "./atoms/mergeJpg";
import * as path from "path";
import React from 'react';
import {renderToString} from 'react-dom/server';
import template from './View/template';
import DocumentInterface from "./View/Document/index";
import TestForm from "./View/TestForm/index";
import axios from "axios/index";
import traitRetour from "./molecules/traitRetour";
import createLdsAndJpg0 from './molecules/createLdsAndJpg0';
import gedDocumentGed from './organisms/gedDocumentGed'
import generateOldGed from "./molecules/generateOldGed";
import generateNomenclature from "./atoms/generateNomenclature"
import UserApi from './Schema/UserApiSchema'

import {
    addSuiviRequestGed, getSuiviRequestGed, removeSuiviRequestGed,
    updateSuiviRequestGed
} from "./organisms/suiviRequestGed";
import crypto from "crypto";
import url_crypt from "url-crypt";

import archiver from "archiver";
import rimraf from "rimraf";

import express from "express";
import moment from "moment";
import setError from "./molecules/setError";
import mkdirp from "mkdirp";

const urlCrypt = url_crypt('~{ry*I)==yU/]9<7DPk!Hj"R#:-/Z7(hTBnlRS=4CXF');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//Dashboard
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    if ("OPTIONS" == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});
app.get('/currentsuivi', function (req, res) {
    res.json(currentSuivi);
});
app.get('/suivihistory', function (req, res) {
    SuiviSchema.find({}, [], {
        sort: {
            dateStart: -1 //Sort by Date Added DESC
        }
    }).then(resData => {
        res.json(resData);
    })
});
app.get('/error', function (req, res) {

    return ErrorSchema.aggregate([
        {
            $group: {
                _id: {source: '$sourceArchive', codeEdi: '$codeEdi'},
                codeEdi: {$last: "$codeEdi"},
                source: {$last: "$sourceArchive"},
                nb: {$sum: 1},
                lastError: {
                    $last: {
                        type: "$type",
                        message: "$message",
                        dateError: "$dateError"
                    }
                },
                erreurs: {$push: "$$ROOT"}
            },
        }, {
            $sort: {
                "lastError.dateError": -1
            }
        }
    ], function (err, result) {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });

});
app.get('/societe', function (req, res) {
    SocieteSchema.find({}, [], {
        sort: {
            codeEdi: 1
        }
    }).then(resData => {
        res.json(resData);
    })
});
app.get('/societe', function (req, res) {
    SocieteSchema.find({}, [], {
        sort: {
            codeEdi: 1
        }
    }).then(resData => {
        res.json(resData);
    })
});
app.post('/societe/params', function (req, res) {
    SocieteSchema.findOneAndUpdate(
        {codeEdi: req.body.codeEdi},
        {$set: {params: JSON.parse(req.body.params)}}, function (err) {
            if (err) {
                res.status(500).send("Aie");
            } else {
                res.status(200).send("Done");
            }
        });
});
app.post('/societe/retour', function (req, res) {
    SocieteSchema.findOneAndUpdate(
        {codeEdi: req.body.codeEdi},
        {$set: {retour: JSON.parse(req.body.retour)}}, function (err) {
            if (err) {
                res.status(500).send("Aie");
            } else {
                res.status(200).send("Done");
            }
        });
});
app.get('/retour/regen', (req, res) => {
    PositionSchema.findOne({numEquinoxe: req.query.numEquinoxe})
        .then(position => {
            if (position != null) {
                position.documents = position.docs;
                const pos = new Position(position.numEquinoxe, position.codeEdi, position.societe, position.archiveSource);
                pos.remettant = position.remettant;
                pos.numeroDoc = position.numeroDoc;
                position.docs.forEach(doc => {
                    const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join(doc.currentFileLocation, doc.fileName));
                    pos.documents.push(newDoc);
                });
                traitRetour([pos]).then(data => {
                    res.send(data);
                });
            } else {
                res.send("position inconnu");
            }
        })
});

app.post('/jp0/regen', (req, res) => {
    const posInconnu = [];
    const posConnu = [];
    const positions = [];

    async.each(req.body.numEquinoxe, function (numEquinoxe, callback) {
        PositionSchema.findOne(
            {numEquinoxe: numEquinoxe}
        ).then(position => {
            if (position != null) {
                console.log(position.numEquinoxe);
                position.documents = position.numEquinoxe;
                const pos = new Position(position.numEquinoxe, position.codeEdi, position.societe, position.archiveSource);
                pos.remettant = position.remettant;
                pos.numeroDoc = position.numeroDoc;
                position.docs.forEach(doc => {
                    const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join("Z:", doc.currentFileLocation, doc.fileName));
                    pos.documents.push(newDoc);
                });
                posConnu.push(numEquinoxe);
                positions.push(pos);
            } else {
                posInconnu.push(numEquinoxe);
            }
            callback();
        })
    }, function () {
        console.log("STSRATATA");
        createLdsAndJpg0(positions).then(data => {
            positions.forEach(pos => {
                ncp(path.join(pos.documents[0].currentFileLocation, "lds"), `Z:\\lds`, function (err) {
                    if (err) {
                        console.log(new GedError("107", `Déplacement des LDS échoué de ${pos.documents[0].currentFileLocation}/lds`, pos.archiveSource, pos.archiveSource, err, pos.codeEdi, 2, false, ""));
                    }else{
                        console.log("Régénération jp0 terminé")
                    }
                })
            });
        }).catch(err => {
            console.log(err);
        });
        res.send([posConnu, posInconnu]);
    });

});
app.get('/file', (req, res) => {
    fs.readFile(path.join("error", req.query.codeEdi, req.query.folder, req.query.file), function (err, data) {
        if (err) {
            const appString = renderToString(<Page404/>);
            // res.send(template({
            //     body: appString,
            //     title: 'Page 404'
            // }))
        } else {
            res.contentType("application/pdf");
            res.send(data);
        }
    });
});
app.get('/read', (req, res) => {
    axios.post(`http://localhost/inlite/api/inlite`, {
        documents: [path.join("error", req.query.codeEdi, req.query.folder, req.query.file)],
    }).then(result => {
        console.log(result.data[0].PathName);
        res.send(result.data);
    }).catch(err => {
        console.log(err);
        res.send(err)
    })
});
app.use('/dash', express.static('public'));
app.use('/form', (req, res) => {
    const appString = renderToString(<TestForm/>);

    res.send(template({
        body: appString,
        title: "Formulaire",
        initialState: ""
    }));
});
app.use('/assets', express.static('assets'));

//Api GED Open
const gedRouter = express.Router();

//Middleware
gedRouter.use(function timeLog(req, res, next) {
    console.time("requestApi");
    next();
});

let archiveLocation;
if (process.env.NODE_ENV === "development") {
    archiveLocation = "";
} else {
    archiveLocation = "Z:\\";
}


function encrypt(key, text) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let crypted = cipher.update(text, 'utf-8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
}

function decrypt(key, data) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
}

const key = "chronosged";

app.get('/crypt/:numdoc', (req, res) => {
    res.send(encrypt(key, req.params.numdoc));
});


// gedRouter.get('/:numdoccrypt', function (req, res) {
//     const numDocument = decrypt(key, req.params.numdoccrypt);
//     const id = `${numDocument}-${uid.uid(16)}`;
//     const suivi = {
//         id: id,
//         numeroEquinoxe: numDocument,
//         statut: "En attente ...",
//         files: [],
//         progress: 0
//     };
//     addSuiviRequestGed(suivi);
//
//     const initialState = {suivi};
//     const appString = renderToString(<DocumentInterface {...initialState} />);
//
//     res.send(template({
//         body: appString,
//         title: numDocument,
//         initialState: JSON.stringify(initialState)
//     }));
//     gedDocumentGed(numDocument, suivi).then()
//
// });

//Token Security for api
// gedRouter.use(function (req, res, next) {
//     UserApi.findOne({
//         token: req.headers["x-access-token"]
//     }, (err, user) => {
//         if (err) {
//             throw err;
//         }
//         if (!user) {
//             return res.status(403).send({
//                 success: false,
//                 message: "No valid token provided."
//             });
//         } else if (user) {
//             if (user.active) {
//                 next();
//                 user.save((err) => {
//                     if (err) {
//                         throw err;
//                     }
//                 });
//             } else {
//                 return res.status(403).send({
//                     success: false,
//                     message: "Token désactivé"
//                 });
//             }
//         }
//     });
// });

gedRouter.get('/old/:numeroequinoxe', function (req, res) {
    const numeroEquinoxe = req.params.numeroequinoxe;
    const id = `${numeroEquinoxe}-${uid.uid(16)}`;

    const suivi = {
        id: id,
        numeroEquinoxe: numeroEquinoxe,
        statut: "En attente ...",
        files: [],
        progress: 0
    };
    addSuiviRequestGed(suivi);

    const initialState = {suivi};
    const appString = renderToString(<DocumentInterface {...initialState} />);

    res.send(template({
        body: appString,
        title: numeroEquinoxe,
        initialState: JSON.stringify(initialState)
    }));


    generateOldGed(req.params.numeroequinoxe, suivi).then(file => {
        suivi.statut = "Fichier prêt";
        suivi.fileName = urlCrypt.cryptObj(file);
        suivi.progress = 100;
        updateSuiviRequestGed(suivi);

        () => {
            // res.set({
            //     'Content-Type': 'application/pdf',
            //     'Transfer-Encoding': 'chunked'
            // });

            // file = "./test.pdf";
            // fs.stat(file, function (err, stats) {
            //     const fileSize = stats.size;
            //     let uploadedSize = 0;

            // Create a new read stream so we can plug events on it, and get the upload progress
            // // // fileReadStream.pipe(res);
            // fileReadStream.on('end', function (dd) {
            //     const data = {
            //         id: id,
            //         numeroEquinoxe: numeroEquinoxe,
            //         statut: "process",
            //         files: [],
            //         base64 : dd
            //     };
            //     const appString = renderToString(<DocumentInterface data={data}/>);
            //
            // res.send(template({
            //     body: appString,
            //     title: numeroEquinoxe
            // }));
            // });


            // const fileReadStream = fs.createReadStream(file, {encoding: 'base64'});
            // let base64 = "";
            // fileReadStream.on('data', function (buffer) {
            //     const segmentLength = buffer.length;
            //
            //     // Increment the uploaded data counter
            //     uploadedSize += segmentLength;
            //     base64 += buffer;
            //
            //     // Display the upload percentage
            //     console.log("Progress:\t", ((uploadedSize / fileSize * 100).toFixed(2) + "%"));
            // });
            //
            // // Some other events you might want for your code
            // fileReadStream.on('end', function () {
            //     // console.log(base64)
            //     const data = {
            //         id: id,
            //         numeroEquinoxe: numeroEquinoxe,
            //         statut: "process",
            //         files: [],
            //         base64: base64
            //     };
            // });
            //
            // fileReadStream.on('close', function () {
            //     console.log("Event: close");
            // });
            // });
        }


    }).catch(err => {
        //TODO
    })


});
gedRouter.post('/suivi', function (req, res) {
    res.send(getSuiviRequestGed(req.body.ids));
});
gedRouter.post('/removesuivi', function (req, res) {
    removeSuiviRequestGed(req.body.ids);
    res.send("ok");
});
gedRouter.get('/file/:file', function (req, res) {
    const pathFile = urlCrypt.decryptObj(req.params.file);
    fs.readFile(path.join(archiveLocation, "temp", pathFile), function (err, data) {
        res.contentType("application/pdf");
        res.setHeader('Content-disposition', `inline; filename="${pathFile.split(path.sep)[pathFile.split(path.sep).length - 1]}"`);
        res.send(data);
        console.timeEnd("requestApi");
    });
});

gedRouter.post('/', (req, res) => {
    const suivis = [];
    const ids = [];
    const promiseQ = [];
    const requestId = uid.uid(8);
    req.body.numdocs.forEach(numdoc => {
        if (numdoc !== "") {
            // const numDocument = decrypt(key, numdoc);
            const numDocument = numdoc;
            const id = `${requestId}-${uid.uid(8)}`;
            const suivi = {
                id: id,
                numeroEquinoxe: numDocument,
                statut: "En attente ...",
                files: [],
                progress: 0,
                requestEnd: ""
            };
            suivis.push(suivi);
            ids.push(id);
            addSuiviRequestGed(suivi);
            promiseQ.push(gedDocumentGed(numDocument, suivi));
        }
    });


    const initialState = {suivis, ids};
    const appString = renderToString(<DocumentInterface {...initialState} />);

    res.send(template({
        body: appString,
        title: "Chronos Ged",
        initialState: JSON.stringify(initialState)
    }));

    Promise.all(promiseQ).then(results => {
        console.log("finish all");
        mergePdfPdftk(results, requestId, true).then(files => {
            suivis[0].requestEnd = urlCrypt.cryptObj(files[0]);
            updateSuiviRequestGed(suivis[0]);
        }).catch(err => {
            console.log(err);
            suivis[0].requestEnd = "ERROR";
            updateSuiviRequestGed(suivis[0]);
        });
    })
});

gedRouter.post('/pole', (req, res) => {
    const promiseQ = [];
    const filetype = req.body.filetype || null;
    const requestId = uid.uid(8);
    if (filetype !== null) {
        const nomenclature = req.body.nomenclature || null;
        const merge = req.body.merge || false;

        req.body.numEquinoxe.forEach(numeroEquinoxe => {
            if (numeroEquinoxe !== "") {
                promiseQ.push(gedDocumentGed(numeroEquinoxe, null, filetype, merge));
            }
        });

        Promise.all(promiseQ).then(results => {
                const output = fs.createWriteStream(path.join(archiveLocation, "temp", `${requestId}.zip`));
                const archive = archiver('zip', {
                    zlib: {level: 9}
                });
                output.on('close', function () {
                    fs.readFile(path.join(archiveLocation, "temp", `${requestId}.zip`), function (err, data) {
                        res.send(data);
                        console.timeEnd("requestApi");
                    });
                    results.forEach(folder => {
                        rimraf(folder[0], err => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    })
                });

                archive.pipe(output);

                const promiseK = [];
                results.forEach(folder => {
                    const folderName = folder[0].split(path.sep)[folder[0].split(path.sep).length - 1];
                    promiseK.push(
                        new Promise((resolve => {
                            fs.readdir(folder[0], function (err, items) {
                                items.forEach(file => {
                                    archive.file(path.join(archiveLocation, "temp", folderName, file),
                                        {name: `${generateNomenclature(nomenclature, folder[1], file, "REFTMS")}.${filetype}`});
                                });
                                resolve();
                            })
                        }))
                    )
                });
                Promise.all(promiseK).then(() => {
                    archive.finalize();
                })
            }
        ).catch(() => {
            console.log("ERROR 3");
            res.status(500).send("Une erreur est survenue")
        })

    } else {
        res.status(400).send("L'argument filetype est obligatoire");
    }

});

gedRouter.get('/pole/:date', function (req, res) {
    const date = moment(req.params.date);
    const requestId = uid.uid(8);

    UserApi.findOne({
        token: req.headers["x-access-token"]
    }, (err, userApi) => {
        if (err) {
            throw err;
        }
        PositionSchema.find({
            "codeEdi": userApi.codeEdi,
            "dateTreatment": {$gt: date}
        }, {"numEquinoxe": 1}).then(positions => {
            const promiseQ = [];
            positions.forEach(position => {
                promiseQ.push(gedDocumentGed(position.numEquinoxe, null, "pdf", true));
            });

            Promise.all(promiseQ).then(results => {
                    const output = fs.createWriteStream(path.join(archiveLocation, "temp", `${requestId}.zip`));
                    const archive = archiver('zip', {
                        zlib: {level: 9}
                    });
                    output.on('close', function () {
                        fs.readFile(path.join(archiveLocation, "temp", `${requestId}.zip`), function (err, data) {
                            res.send(data);
                            console.timeEnd("requestApi");
                        });
                        results.forEach(folder => {
                            rimraf(folder[0], err => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        })
                    });

                    archive.pipe(output);

                    const promiseK = [];
                    results.forEach(folder => {
                        const folderName = folder[0].split(path.sep)[folder[0].split(path.sep).length - 1];
                        promiseK.push(
                            new Promise((resolve => {
                                fs.readdir(folder[0], function (err, items) {
                                    items.forEach(file => {
                                        archive.file(path.join(archiveLocation, "temp", folderName, file),
                                            {name: `${generateNomenclature(nomenclature, folder[1], file, "REFTMS")}.${filetype}`});
                                    });
                                    resolve();
                                })
                            }))
                        )
                    });
                    Promise.all(promiseK).then(() => {
                        archive.finalize();
                    })
                }
            ).catch(() => {
                console.log("ERROR 3");
                res.status(500).send("Une erreur est survenue")
            })!
        })
    });
});

gedRouter.get('/pole/:dateFrom/:dateTo', function (req, res) {
    const dateFrom = req.params.dateFrom;
    const dateTo = req.params.dateTo;

    // "codeEdi" : "MORABOR",
    //     "dateTreatment" : {
    //     "$gt" : ISODate("2018-02-16T00:00:00.000+0000"),
    //         "$lt" : ISODate("2018-02-16T23:59:59.000+0000")
    // }
});

app.use('/ged', gedRouter);

app.listen(8082, function () {
    console.log('App listening on port 8082!')
});