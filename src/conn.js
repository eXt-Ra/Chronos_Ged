import mysql from 'mysql';

exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: '172.18.17.4',
    user: 'root',
    password: 'phiphi',
    database: 'dealtis_ged',
    port: '3307'
});
