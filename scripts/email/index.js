const genHTML = require('./genHTML');
const sendEmail = require('./sendEmail');
const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../../.env') });
const DOMAIN = process.env.MG_DOMAIN;

module.exports = async ({template, params, email, subject}) => {

   // Generate the HTML for the email
   const htmlFile = await genHTML({template, params});

   // a data object that contains all the variables we need for this email
   const data = {
      // from could be a string that is stored as a constant and imported into every trigger
      from: `Sparklist <noreply@${DOMAIN}>`,
      // If you're in debug mode you'll want to send the email to yourself
      to: `${email}`,
      subject: `${subject}`,
      html: `${htmlFile}`
   };

   // Send the email
   return sendEmail(data)
      .then((data) => {
         return data;
      }).catch((error) => {
         console.log(error);
      });
};