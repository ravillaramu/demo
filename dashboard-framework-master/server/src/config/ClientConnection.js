const axios = require("axios");
const https = require("https");

// Create a new instance of the axios client
const { Client } = require("@elastic/elasticsearch");
const fs = require("fs");
const path = require("path");

let connect = null;

async function Connection() {
  if (connect) {
    return connect;
  } else {
    try {
      connect = new Client({
        node: "https://localhost:9200",
        auth: {
          username: process.env.ES_USERNAME,
          password: process.env.ES_PWD,
          
        },
        tls: {
          ca: fs.readFileSync(path.resolve(__dirname, "../assets/http_ca.crt")),
          rejectUnauthorized: false,
        },
      });

      return connect;
    } catch (e) {
      console.log("Error while connecting", e);
    }
  }
}

module.exports = Connection;
