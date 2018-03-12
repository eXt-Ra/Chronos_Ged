import fileType from 'file-type';
import readChunk from 'read-chunk';

export default function fileTypeCheck(file) {
    return new Promise((resolve, reject) => {
        readChunk(file, 0, 41000).then(buffer => {
            resolve(fileType(buffer).ext)
        }).catch(err => {
            console.log(err);
            reject(err);
        });
    })
}