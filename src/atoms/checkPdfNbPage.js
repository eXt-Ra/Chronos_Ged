import PDFParser from 'pdf2json';

export default function checkPdfNbPage(filePath) {
    return new Promise((resolve, reject) => {

        const pdfParser = new PDFParser();
        pdfParser.loadPDF(filePath);
        pdfParser.on('pdfParser_dataReady', function (pdfData) {
            resolve(pdfData.formImage.Pages.length);
        });
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
    })
}