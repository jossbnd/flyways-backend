// IMPORTING:
// const { testUsername } = require("../modules/usernameValidityCheck");

// use https://regexr.com/ if you have to modify it

// const username1 = "chiri"    // returns true (valid)
// const username2 = "chiri 48"     // returns false (invalid because of white space)
// const username3 = "chiri_48"    // returns true
// const username4 = ""   // returns false

// if username is VALID, returns true (meaning no special characters, and is 5-16 characters long)
//  "-" and "_" are accepted as normal characters
function testUsername(username) {
    // const pattern = /^(?=.{5,16}$)(?:[a-zA-Z_-\d]+(?:(?:\.|-|_)[a-zA-Z\d])*)+$/;
    const pattern = /^(?=.{5,16}$)[a-zA-Z0-9_-]*$/
    return pattern.test(username);
};

// example
// if (testUsername(req.body.username)) {
//     res.send("valid username");
//   } else if (!testUsername(req.body.username)) {
//     res.send("invalid username, contains special characters or is too long/too short")
//   }

module.exports = { testUsername };
