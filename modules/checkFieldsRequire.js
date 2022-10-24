// check for empty fields
// NOTE: importing:
// const { checkFieldsRequest, checkFields } = require("../modules/checkFieldsRequire");

function checkFieldsRequest(reqbody, fields) {
    let valid = true;
  
    for (let field of fields) {
      if (!reqbody[field]) {
        valid = false;
      }
    }
  
    return valid;
  };


// example
// if (!checkFieldsRequest(req.body, ["username", "password"])) {
//   res.json({
//     result: false,
//     msg: "missing or empty fields",
//   });
//   return;
// }


function checkFields(fields) {
    let valid = true;

    for (let field of fields) {
        if (!field) {
            valid = false;
        }
    }

    return valid;
};

// example
// if (!checkFieldsRequest(["username", "password"])) {
//   res.json({
//     result: false,
//     msg: "missing or empty fields",
//   });
//  return;
// }

module.exports = { checkFieldsRequest, checkFields };