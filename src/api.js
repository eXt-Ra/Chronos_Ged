import {currentSuivi} from "./organisms/suiviTreatment";
import SuiviSchema from './Schema/SuiviSchema'
import ErrorSchema from './Schema/ErrorSchema'
import SocieteSchema from './Schema/SocieteSchema'

const express = require('express');
const app = express();

import bodyParser from 'body-parser';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    SuiviSchema.find({},[],{
        sort:{
            dateStart: -1 //Sort by Date Added DESC
        }
    }).then(resData => {
        res.json(resData);
    })
});

app.get('/error', function (req, res) {
    ErrorSchema.find({},[],{
        sort:{
            dateError: -1 //Sort by Date Added DESC
        }
    }).then(resData => {
        res.json(resData);
    })
});

app.get('/societe', function (req, res) {
    SocieteSchema.find({},[],{
        sort:{
            codeEdi : 1
        }
    }).then(resData => {
        res.json(resData);
    })
});

app.get('/societe', function (req, res) {
    SocieteSchema.find({},[],{
        sort:{
            codeEdi : 1
        }
    }).then(resData => {
        res.json(resData);
    })
});

app.post('/societe/params', function (req, res) {
    SocieteSchema.findOneAndUpdate(
        { codeEdi: req.body.codeEdi},
        {$set: {params: JSON.parse(req.body.params)}}, function (err) {
            if (err) {
                res.status(500).send("Aie");
            }else{
                res.status(200).send("Done");
            }
        });
});

app.post('/societe/retour', function (req, res) {
    SocieteSchema.findOneAndUpdate(
        { codeEdi: req.body.codeEdi},
        {$set: {retour: JSON.parse(req.body.retour)}}, function (err) {
            if (err) {
                res.status(500).send("Aie");
            }else{
                res.status(200).send("Done");
            }
        });
});


app.use('/dash', express.static('public'));

app.listen(8082, function () {
    console.log('App listening on port 8082!')
});