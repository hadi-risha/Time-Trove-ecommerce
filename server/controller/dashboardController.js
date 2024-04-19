const productDB = require("../model/productModel");
const shoppingCartDB = require("../model/shoppingCartModel");
const Orderdb = require("../model/orderModel");
const puppeteer = require('puppeteer');
const AddressDB = require("../model/address-model");
const wishlistDB = require('../model/wishlistModel')
const walletDB = require('../model/walletModel')
const mongoose = require('mongoose');
userdbCollection = require ('../model/model')
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// var { generatePdf } = require('../nodemailerStuff/generatePuppeteer');


//bestSellingProducts - POST
const bestSellingItems = {
    bestProduct: async (req, res) => {
        try {
            const interval = req.query.interval; 
            console.log("Interval", interval);
            let startDate, endDate;
            console.log("startDate", startDate , "endDate" , endDate);

            switch (interval) {
                case 'yearly':
                    startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                    endDate = new Date();
                    break;
                case 'monthly':
                    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
                    endDate = new Date();
                    break;
                case 'weekly':
                    startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                    endDate = new Date();
                    break;
                case 'daily':
                default:
                    startDate = new Date(new Date().setDate(new Date().getDate() - 1));
                    endDate = new Date();
                    break;
            }
            console.log("startDate", startDate , "endDate" , endDate);

            const products = await Orderdb.aggregate([
                { $unwind: '$orderItems' },
                { $match: { 'orderDate': { $gte: startDate, $lt: endDate } } },
                { $group: { _id: '$orderItems.pName', total: { $sum: '$orderItems.userAddedQty' } } },
                { $sort: { total: -1 } },
                { $limit: 10 },
            ]);
            
            console.log('products..', products);
            res.json(products);
        } catch (err) {
            console.log('error fetching best selling product', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};


//bestSellingCategory - POST
const bestSellingcategory = {
    bestCategory: async (req, res) =>{
        try {

            const interval = req.query.interval; // Get the interval from the query parameters

            console.log("Interval...........:", interval);
            let startDate, endDate;

            console.log("startDate", startDate , "endDate" , endDate);

            // Determine the start and end dates based on the interval
            switch (interval) {
                case 'yearly':
                    startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                    endDate = new Date();
                    break;
                case 'monthly':
                    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
                    endDate = new Date();
                    break;
                case 'weekly':
                    startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                    endDate = new Date();
                    break;
                case 'daily':
                default:
                    startDate = new Date(new Date().setDate(new Date().getDate() - 1));
                    endDate = new Date();
                    break;
            }
            console.log("startDate", startDate , "endDate" , endDate);



            const categories = await Orderdb.aggregate([
                { $unwind: '$orderItems' },
                { $match: { 'orderDate': { $gte: startDate, $lt: endDate } } },
                { $group: { _id: '$orderItems.category', total: { $sum: '$orderItems.userAddedQty' } } },
                { $sort: { total: -1 } },
                { $limit: 10 },
            ]);
            console.log('categories.......', categories);
            res.json(categories);
        } catch (err) {
            console.log('error fetching best selling category', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};


//bestSellingBrands - POST
const bestSellingBrands = {
    bestBrand: async (req, res) =>{
        try {
            const interval = req.query.interval; 
            console.log("Interval", interval);
            let startDate, endDate;

            console.log("startDate", startDate , "endDate" , endDate);

            switch (interval) {
                case 'yearly':
                    startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                    endDate = new Date();
                    break;
                case 'monthly':
                    startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
                    endDate = new Date();
                    break;
                case 'weekly':
                    startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                    endDate = new Date();
                    break;
                case 'daily':
                default:
                    startDate = new Date(new Date().setDate(new Date().getDate() - 1));
                    endDate = new Date();
                    break;
            }
            console.log("startDate", startDate , "endDate" , endDate);

            const brands = await Orderdb.aggregate([
                { $unwind: '$orderItems' },
                { $match: { 'orderDate': { $gte: startDate, $lt: endDate } } }, 
                { $group: { _id: '$orderItems.pName', total: { $sum: '$orderItems.userAddedQty' } } },
                { $sort: { total: -1 } },
                { $limit: 10 },
              ]);

              console.log('brands..', brands);
              res.json(brands);
        } catch (err) {
            console.log('error fetching best selling brands', err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};


//sales report - POST
const downloadSalesReport = {
    download: async (req, res) =>{
        try { 

            // Function to generate PDF
            async function generatePDF(data) {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();

                // Load the EJS template
                const templatePath = path.join( 'views', 'salespdf.ejs');
                const template = fs.readFileSync(templatePath, 'utf8');

                // Render the template with dynamic data
                const html = ejs.render(template, data);

                // Set the HTML content of the page
                await page.setContent(html);

                // Generate the PDF
                const pdfOptions = {
                    format: 'A4',
                    printBackground: true,
                };
                const pdf = await page.pdf(pdfOptions);

                await browser.close();

                return pdf;
            }



            // console.log("startDate", req.query.startDate , "endDate" , req.query.endDate);

            // switch (interval) {
            //     case 'yearly':
            //         startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
            //         endDate = new Date();
            //         break;
            //     case 'monthly':
            //         startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
            //         endDate = new Date();
            //         break;
            //     case 'weekly':
            //         startDate = new Date(new Date().setDate(new Date().getDate() - 7));
            //         endDate = new Date();
            //         break;
            //     case 'daily':
            //     default:
            //         startDate = new Date(new Date().setDate(new Date().getDate() - 1));
            //         endDate = new Date();
            //         break;
            // }
            // console.log("startDate", startDate , "endDate" , endDate);


            console.log("interval---------------------", req.query.interval);
            const interval = req.query.interval;

            let startDate, endDate;
            const now = new Date();

            // Calculate start and end dates based on the interval
            if (interval === 'daily') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            } else if (interval === 'weekly') {
                const startOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
                endDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek + 7);
            } else if (interval === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (interval === 'yearly') {
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
            } else {
                // If no valid interval is provided, show all data
                startDate = new Date(0); // Very old date
                endDate = new Date(); // Current date
            }


            const totalUsers = await userdbCollection.countDocuments();

            const latestOrders = await Orderdb.countDocuments({
                orderDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            });

            let totalSalesAmount = await Orderdb.aggregate([
                {
                    $match: {
                        orderDate: {
                            $gte: startDate,
                            $lt: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null, 
                        total: { $sum: "$finalAmount" }
                    }
                }
            ]);
            totalSalesAmount = totalSalesAmount[0]?.total
            const noOrders = totalSalesAmount[0]?.total === 0 || latestOrders === 0;
            console.log("totalSalesAmounth---------", totalSalesAmount);
            const data = {
                noOrders : noOrders,
                totalUsers: totalUsers ,
                latestOrders: latestOrders ,
                totalSalesAmount: totalSalesAmount ,
            };


            try {
                const pdf = await generatePDF(data);
                res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdf.length });
                res.end(pdf);
            } catch (error) {
                console.error('Error generating PDF:', error);
                res.status(500).send('Error generating PDF');
            }

        } catch (err) {
            console.error('Failed to generate PDF:', err.message);
            console.error(err.stack); // Log the error stack for more detailed information
            res.status(500).send(`Failed to generate PDF: ${err.message}`);
        }
    },
};


//excel - sales report - POST
const downloadExcel = {
    downloadSalesReport: async (req, res) =>{
        try { 

            // console.log("startDate exc", req.query.startDate);
            // console.log("endDate exc", req.query.endDate);

            // const startDate = req.query.startDate;
            // const endDate = req.query.endDate;

            console.log("interval---------------------", req.query.interval);
            const interval = req.query.interval;

            let startDate, endDate;
            const now = new Date();

            // Calculate start and end dates based on the interval
            if (interval === 'daily') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            } else if (interval === 'weekly') {
                const startOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
                endDate = new Date(now.getFullYear(), now.getMonth(), startOfWeek + 7);
            } else if (interval === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (interval === 'yearly') {
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
            } else {
                // If no valid interval is provided, show all data
                startDate = new Date(0); // Very old date
                endDate = new Date(); // Current date
            }


            const totalUsers = await userdbCollection.countDocuments();

            const latestOrders = await Orderdb.countDocuments({
                orderDate: {
                    $gte: startDate,
                    $lt: endDate
                }
            });

            let sales = await Orderdb.aggregate([
                {
                    $match: {
                        orderDate: {
                            $gte: startDate,
                            $lt: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: null, 
                        total: { $sum: "$finalAmount" }
                    }
                }
            ]);
        
            sales = sales[0]?.total;
            const noOrders = sales[0]?.total === 0 || latestOrders === 0;



            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; 
            const day = currentDate.getDate();
            const formattedDate = `${day}/${month}/${year}`;
            console.log(formattedDate)
            
            // Define the headers and data as arrays of arrays
            const headers = [[ 'Date','Total Users', 'New Orders', 'Total Sales']];
            const data = [
                [formattedDate, totalUsers, latestOrders, sales]
            ];
            

            // Combine headers and data into a single array of arrays
            const wsData = [...headers, ...data];

            // Create a new worksheet with the combined data
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Define cell styles for headers
            const headerStyles = {
                fill: {
                    fgColor: { rgb: "FF00FF00" } // Green color
                },
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center"
                }
            };

            for (let i = 0; i < headers[0].length; i++) {
                const cell = XLSX.utils.encode_cell({r: 0, c: i}); // Encode cell address
                ws[cell].s = headerStyles; // Apply styles
            }
            
            // Add the worksheet to the workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
            
            // Write the workbook to a file
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
            fs.writeFileSync('SalesReport.xlsx', wbout);
            
            // Send the file as a response
            res.download('SalesReport.xlsx', (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error generating Excel file');
                }
                // Delete the file after sending it
                fs.unlinkSync('SalesReport.xlsx');
            });

        } catch (err) {
            console.error('Failed to generate excel:', err.message);
            console.error(err.stack); 
            res.status(500).send(`Failed to generate excel: ${err.message}`);
        }
    },
};






module.exports = {bestSellingItems, bestSellingcategory, bestSellingBrands, downloadSalesReport, downloadExcel}