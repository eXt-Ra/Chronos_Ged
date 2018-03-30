import conn from './../conn'
import GedError from "../Class/GedError";
import moment from "moment";

export default function (requests, jobIDs) {
    return new Promise((resolve, reject) => {
        conn.pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                const promiseQ = [];
                requests.forEach(request => {
                    promiseQ.push(
                        new Promise((resolve2, reject2) => {
                            connection.query(request, function (error, results, fields) {
                                if (error) {
                                    throw error;
                                }
                                resolve2();
                            })
                        })
                    );
                });

                Promise.all(promiseQ).then(()=>{
                    resolve(jobIDs);
                });
            }
        });
    })
}