// IMPORTING:
// const { testPassword } = require("../modules/passwordValidityCheck");

// password must be 6 to 20 characters-long, cannot contain whitespace, and have at least:
// -one lower case
// -one upper case
// -one digit

// if password is VALID, returns true
function testPassword(password) {
    if (password.includes(" ")) return false;

    const pattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{6,20}$/;
    return pattern.test(password);
};


module.exports = { testPassword };
