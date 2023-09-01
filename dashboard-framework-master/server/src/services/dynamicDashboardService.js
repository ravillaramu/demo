const Connection = require("../config/ClientConnection");
const shared = require("../Shared/sharedFunctions");

let result = [];
const index = 'global_emp_wholedata'

async function getDataforDashboard(data) {
  try {
    let query = await shared.frameDynamicQuery(data);
   
    let body = {
      size: 10000,
      query: {
        bool: {
          must: [
            {
              match: {
                emp_status: "Active",
              },
            },
            ...query.filters,
          ],
        },
      },
      aggs: { ...query.aggs },
    };

    const connection = await Connection();
    const response = await connection.search({
      index: index,
      body: body,
    });
 
    let result = await shared.frameResponse(data, response);

    return {
      is_error: false,
      code: 200, ////////add code
      message: "",
      data: result,
    };
  } catch (error) {
    console.log("error in get call", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error,
      data: null,
    };
  }
}

module.exports = { getDataforDashboard };
