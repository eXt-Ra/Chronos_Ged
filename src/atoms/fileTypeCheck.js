import fileType from 'file-type';
import readChunk from 'read-chunk';

export default function fileTypeCheck(file) {
    return new Promise((resolve, reject) => {
        readChunk(file, 0, 41000).then(buffer => {
            if (fileType(buffer)) {
                resolve(fileType(buffer).ext)
            }else{
                resolve(file.substr(file.length - 3))
            }
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    })
}