import moment from "moment";
import _ from "lodash"

export default function (documents) {
    return new Promise((resolve, reject) => {

            const preInsertD_JOBS = "insert into D_JOBS (jobid,jobtyp,jobpriority,plgid,jobcreator,jobstate,jobdateask,jobtimeask)values";
            const preInsertD_JOBS2 = "insert into D_JOBSPARAM values";
            const preReq = "insert into temp_job values";
            const insertD_JOBS = [];
            const insertD_JOBS2 = [];
            const req = [];
            const affectedJobId = [];

            documents.forEach(document => {
                switch (document.type) {
                    case "4":
                        document.format = "1";
                        break;
                    case "8":
                        document.format = "65535";
                        break;
                    default:
                        document.format = "65535";
                        break;
                }

                affectedJobId.push(document.jobid);

                insertD_JOBS.push(`('${document.jobid}','O','1','GetPage','DEALTIS JOB','IDL','${moment().format("Ymd")}','${moment().format("Hms")}')`);
                insertD_JOBS2.push(`('${document.jobid}','Iitem','0','MANAGER;MGR;TOTO;STOCKDOC;${document.type};${document.numdon};${document.numimage};${document.numenreg};${document.taille};${document.nopage};' ),('${document.jobid}','Oitem','0','${document.type === "8" ? "e:\\\\Chronos_Ged\\\\temp\\\\" : "e:\\\\Chronos_Ged\\\\temp\\\\"}'),( '${document.jobid}','JobUnit','0',''),( '${document.jobid}','Format','0',${document.format}),( '${document.jobid}','Zoom','0','100'),( '${document.jobid}','Epa','0',''),( '${document.jobid}','Rotation','0','0'),('${document.jobid}','Wpa','0',''),( '${document.jobid}','Spa','0','')`);
                req.push(`('${document.jobid}','${moment().format("Ymd")}','${_.trim(document.numenreg)}')`);
            });
            resolve({
                requests: [
                    preInsertD_JOBS + insertD_JOBS.join(","),
                    preInsertD_JOBS2 + insertD_JOBS2.join(","),
                    preReq + req.join(",")],
                jobIDs: affectedJobId
            });
        }
    )
}