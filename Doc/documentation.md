# Chronos GED : Documentation

## File System
E: _Bilbon_ > Machine de traitement
* Ged_NodeJS
    - error (Stockage des fichiers mit en erreurs)
    - report (Stockage des fichiers report journa.)
    - output (Dossier de traitement)
    - main.js (fichier src du serveur nodeJS)

Z: _Hobbot_ > Machine d'archivage
* archive
* lds
* reception
    

## API routes
### Régénération des fichiers manquants
#### Régénération jp0 / lds pour l'intégration dans l'ancienne GED
>POST: http://10.101.0.62:8082/jp0/regen

```
{
    "numEquinoxe": [
        "10572993","10572569"
    ]
}
```
#### Régénération des retours
>POST: http://10.101.0.62:8082/retour/multiregen

```
{
    "numEquinoxe": [
        "10572993","10572569"
    ]
}
```
> _Attention cette route regénère les retours aux remettants et distributeurs_

#### Régénération des retours uniquement aux distributeurs
>POST: http://10.101.0.62:8082/retour/multiregenonlydistri

```
{
    "numEquinoxe": [
        "10572993","10572569"
    ]
}
```

#### Régénération des retours pour un adhérent borné par des dates
>GET: http://10.101.0.62:8082/retour/**CODEEDI**/2018-06-01/2018-06-02

#### Régénération des manquants dans la BDD SQL pour un jour
>GET: http://10.101.0.62:8082/checkStockdoc/2018-07-25

Une fois cette commande exécutée, un fichier _report_ est créé dans le dossier GED_Chronos/report

> _Cette commande est appelée chaque jour à 23h30_
#### Régénération des retours manquants pour un jour
>GET: http://10.101.0.62:8082/checkManquant/2018-07-25

Une fois cette commande exécutée, un fichier _report_ est créé dans le dossier GED_Chronos/report

> _Cette commande est appelée chaque jour à 23h30_
## Cmd process

### Lancer le serveur NodeJS
> pm2 start main.js

### Lister les process NodeJS

> pm2 list
### Relancer le serveur NodeJS
> pm2 restart {idprocess}
### Stoper le serveur NodeJS
> pm2 stop {idprocess}

## Logs
### Afficher les logs du process en live
> pm2 log {idprocess}

### Consulter les logs d'erreurs du proccess
> nano C:\Users\Administrateur\.pm2\logs\main-error.log

## Errors
[Google sheet](https://docs.google.com/spreadsheets/d/1ttd_HXYAnm9TLHvM4FtoepAp4nEjqL4Jy1a4yjcSaCY/edit?usp=sharing)


