const Connection = require("../config/snowflakeConnection");
const shared = require("../Shared/sharedFunctions");
const snowflake = require("snowflake-sdk");
const jwt = require("jsonwebtoken");

let resultFromDb;
let isUser = "";
async function isAuthorized(payload) {
  try {
    resultFromDb = await getUserDetails(payload);
    let jwtToken;
    console.log("resultFromDb -->", resultFromDb);
    isUser =
      (resultFromDb.is_error)|| resultFromDb.result.length === 0
        ? false
        : true;
    if (isUser) {
      jwtToken = await generateJwtToken(resultFromDb.result[0]);
    }

    return {
      is_error: resultFromDb.is_error,
      code: 200, ///change later
      isUser: isUser,
      token: jwtToken,
      message: resultFromDb.err,
    };
  } catch (error) {
    console.log("error in isAuthorized", error);
    return {
      is_error: error.is_error,
      code: 200, ///change later
      isUser: isUser,
      message: error.err,
    };
  }
}

async function getUserDetails(payload) {
  let sf_connection = await Connection();
  let query = `select * from HR_DASHBOARD_DB.HR_DASHBOARD_SCHEMA.USERS where NAME='${payload.username}' and PWD='${payload.password}'`;
  let res = {
    is_error: false,
    result: "",
    err: "",
  };
  
  return new Promise((resolve, reject) => {
    sf_connection.execute({
      sqlText: query,
      complete: function (err, stmt, rows) {
        if (err) {
          res.is_error = true;
          res.err = err;
          reject(res);
        } else {
          res.result = rows;
          resolve(res);
        }
      },
    });
  });
}

async function generateJwtToken(userData) {
  const { USERID, NAME,  ROLE } = userData;
  // JWT payload
  const payload = {
    userId: USERID,
    username: NAME,
    role: ROLE,
  };

  // Secret key used for signing the JWT
  const secretKey = process.env.KEY;
  // Generate the JWT
  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

 
  return token;
}

module.exports = { isAuthorized };
