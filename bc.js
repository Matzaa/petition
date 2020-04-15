const bcrypt = require("bcryptjs");
const { promisify } = require("util");
let { genSalt, hash, compare } = bcrypt;

genSalt = promisify(genSalt);
hash = promisify(hash); // takes 2 args:
compare = promisify(compare); //takes 2 args: a plain text and a hash compare value

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw, salt));

//////////// EXAMPLE OF FUNCTIONALITIES FROM IN CLASS YOU DO NOT NEED THIS IN YOUR APP ////////
///////////////////////////////////////////////////////////////////////////////////////////////
// genSalt()
//     .then((salt) => {
//         console.log(salt);
//         return hash("superSafePassword", salt);
//     })
//     .then((hashedPassword) => {
//         console.log("hashed and salted PW", hashedPassword);
//         return compare("superSafePassword", hashedPassword);
//     })
//     .then((matchValueOfCompare) => {
//         console.log("matchvalueofcompare", matchValueOfCompare);
//     });