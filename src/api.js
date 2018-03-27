import {currentSuivi} from "./organisms/watcher";
import SuiviSchema from './Schema/SuiviSchema'
import ErrorSchema from './Schema/ErrorSchema'
import SocieteSchema from './Schema/SocieteSchema'
import PositionSchema from './Schema/PositionSchema'
import Position from './Class/Position'
import Document from './Class/Document'
import fs from 'fs';

const express = require('express');
const app = express();
import bodyParser from 'body-parser';
import mergePdf from "./atoms/mergePdf";
import converToPdf from "./atoms/converToPdf";
import fileTypeCheck from "./atoms/fileTypeCheck";
import GedError from "./Class/GedError";
import mergeJpg from "./atoms/mergeJpg";
import * as path from "path";


import React from 'react';
import {renderToString} from 'react-dom/server';
import Page404 from "./View/404";
import template from './View/template';
import axios from "axios/index";
import traitRetour from "./molecules/traitRetour";

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
                        message: "$message"
                    }
                },
                erreurs: {$push: "$$ROOT"}
            },
        }, {
            $sort: {
                "archives.dateError": -1
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
                position.docs.forEach(doc =>{
                    const newDoc = new Document(doc.codeEdi, position.societe, doc.archiveSource, path.join(doc.currentFileLocation,doc.fileName));
                    pos.documents.push(newDoc);
                });
                traitRetour([pos]).then(data => {
                    res.send(data);
                });
            } else {
                const appString = renderToString(<Page404/>);
                res.send(template({
                    body: appString,
                    title: 'Page 404'
                }))
            }
        })
});
app.get('/file', (req, res) => {
    fs.readFile(path.join("error", req.query.codeEdi, req.query.folder, req.query.file), function (err, data) {
        if (err) {
            const appString = renderToString(<Page404/>);
            res.send(template({
                body: appString,
                title: 'Page 404'
            }))
        } else {
            res.contentType("application/pdf");
            res.send(data);
        }
    });
});
app.get('/read', (req, res) => {
    axios.post(`http://localhost:51265/api/inlite`, {
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

gedRouter.get('/:numeroequinoxe', function (req, res) {
    PositionSchema.findOne({
        numEquinoxe: req.params.numeroequinoxe
    }).then(position => {
        if (position !== null) {
            //retourner les documents merger en pdf
            fileTypeCheck(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, position.docs[0].fileName)}`).then(type => {
                switch (type) {
                    case "pdf":
                        mergePdf(position.docs, position.numEquinoxe).then(files => {
                            const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                os = fs.createWriteStream(path.join("temp", files[0]));
                            is.pipe(os);
                            is.on('end', function () {
                                fs.readFile(path.join("temp", files[0]), function (err, data) {
                                    res.contentType("application/pdf");
                                    res.send(data);
                                    console.timeEnd("requestApi");
                                });
                                fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                    if (err) {
                                        throw err;
                                    }
                                });
                            });
                            is.on('error', function (err) {
                                throw err;
                            });
                            os.on('error', function (err) {
                                throw err;
                            });
                        }).catch(err => {
                            res.status(500).send(err);
                        });
                        break;
                    case "jpg":
                        converToPdf(position.docs, position.numEquinoxe).then(docs => {
                            mergePdf(docs, position.numEquinoxe).then(files => {
                                const is = fs.createReadStream(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`),
                                    os = fs.createWriteStream(path.join("temp", files[0]));
                                is.pipe(os);
                                is.on('end', function () {
                                    fs.readFile(path.join("temp", files[0]), function (err, data) {
                                        res.contentType("application/pdf");
                                        res.send(data);
                                        console.timeEnd("requestApi");
                                    });
                                    fs.unlink(`${archiveLocation}${path.join(position.docs[0].currentFileLocation, files[0])}`, err => {
                                        if (err) {
                                            throw err;
                                        }
                                    });
                                });
                                is.on('error', function (err) {
                                    throw err;
                                });
                                os.on('error', function (err) {
                                    throw err;
                                });
                            }).catch(err => {
                                res.status(500).send(err);
                            });
                        });
                        break;
                    case "tif":
                        //TODO
                        break;
                    default:
                        res.status(404).send("Erreur fichier non supporté");
                        return;
                }
            });
        } else {
            const appString = renderToString(<Page404/>);

            res.send(template({
                body: appString,
                title: '404'
            }))
        }
    })

});

app.use('/ged', gedRouter);

app.listen(8082, function () {
    console.log('App listening on port 8082!')
});