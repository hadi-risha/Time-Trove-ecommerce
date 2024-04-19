// const puppeteer = require('puppeteer-core');
// const fs = require('fs-extra');


// (async () => {
//     const generatePdf = {
//         generate: async (req, res) => {
//             try {
                // const browser = await puppeteer.launch({ 
                //     headless: "new",
                //     executablePath: '/snap/bin/chromium',
                //   });
//                 const page = await browser.newPage();



//                 await page.setContent('<h1>hello </h1>');
//                 await page.emulateMediaFeatures('screen');
//                 await page.pdf({
//                     path: 'mypdf.pdf',
//                     format: 'A4',
//                     printBackground: true
//                 });

//                 console.log('done');
//                 await browser.close();
//                 process.exit();

                
//             } catch (err) {
//                 console.error('Failed to generate PDF:', err);
//                 res.status(500).send('Failed to generate PDF');
//             }
//         },
//     };


// })();


// module.exports = {generatePdf}
