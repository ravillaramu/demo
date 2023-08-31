const snowflake = require("snowflake-sdk");
let connect = null;

async function snowflakeConnection() {
  if (connect) {
    return connect;
  } else {
    try {

        connect = snowflake.createConnection({
            account:process.env.SF_ACCOUNT,
            username: process.env.SF_USERNAME,
            password: process.env.SF_PWD,
            database: process.env.SF_DB,
            schema: process.env.SF_SCHEMA,
            warehouse: process.env.SF_WAREHOUSE,
          });

          connect.connect(
            function (err, conn) {
                if (err) {
                    console.error('Unable to connect: ' + err.message);
                }
                else {
                    console.log('Successfully connected to Snowflake.');
                    connection_ID = conn.getId();
                }
            }
        );

       return connect
    } catch (e) {
      console.log("Error while connecting", e);
    }
  }
}

module.exports = snowflakeConnection;
