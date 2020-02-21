const mailgun = require('mailgun-js');
const path =  require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../../.env') });
const DOMAIN = process.env.MG_DOMAIN;
const api_key = process.env.MG_API_KEY;
const mg = mailgun({apiKey: api_key, domain: DOMAIN});

module.exports =  async (data) => {

   // Turn the mailgun-js send function into a promise
   return new Promise((resolve, reject) => {
      return mg.messages().send(data, (error, result) => {
         if (error) {
            return reject(error);
         }
         return resolve(result);
      });
   })
};