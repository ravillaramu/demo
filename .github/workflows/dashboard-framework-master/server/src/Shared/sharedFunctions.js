const months = [
  "2022-01",
  "2022-02",
  "2022-03",
  "2022-04",
  "2022-05",
  "2022-06",
  "2022-07",
  "2022-08",
  "2022-09",
  "2022-10",
  "2022-11",
  "2022-12",
];

const Connection = require("../config/ClientConnection");
async function getNumberOfDays(year, month) {
  ///0-jan 1-feb 2-mar
  const date = new Date(year, month, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const numberOfDays = Math.round((nextMonth - date) / (24 * 60 * 60 * 1000));

  return numberOfDays;
}

async function formatResult(res) {
  const data = res.aggregations.attrition_by_month.buckets;
  const result = [];

  months.forEach((month) => {
    const entry = data.find((item) => item.key_as_string === month);
    //console.log(entry)
    const docCount = entry ? entry.doc_count : 0;
    result.push(docCount);
  });
  return result;
}

async function quaterattritionCount(start, end, type, filter, newHireFilter) {
  try {
   
    
    const connection = await Connection();
    const response = await connection.count({
      index: "global_emp_wholedata",
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              { match: { "exit_type.keyword": type } },

              {
                range: {
                  lwd: {
                    gte: `${start}T00:00:00`,
                    lt: `${end}T23:59:59`,
                  },
                },
              },
              ...newHireFilter,
            ],
          },
        },
      },
    });

    return response.count;
  } catch (error) {
    console.log(
      "error in quaterattritionCount",
      error.body.error.root_cause[0].reason
    );

    throw new Error(error.body.error.root_cause[0].reason);
  }
}

async function frameDynamicQuery(data) {
  let filters = [];
  let aggs = [];

  let filter_fields = data.filters.map((obj) => obj.field);
  let aggs_fields = data.requestFields.map((obj) => obj.field);

  let isEqual = await arraysAreEqual(filter_fields, aggs_fields);
  filters.push({ exists: { field: "gender" } });
  if (data.hasOwnProperty("filters")) {
    if (data.filters.length === 0) {
      aggs = await formAggsQuery(data);
    } else {
      filters = data.filters.map((obj) => {
        if (obj.field == "date_of_join") {
        
          return {
            range: {
              [obj.field]: {
                lte: obj.value,
              },
            },
          };
        } else {
          return { match: { [obj.field]: obj.value[0] } };
        }
      });
      if (!isEqual) {
        aggs = await formAggsQuery(data);
      }
    }
  }

  return { filters, aggs };
}
async function arraysAreEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }

  return array1.every((element) => array2.includes(element));
}

async function formAggsQuery(data) {
  
  let aggs = data.requestFields.reduce((acc, obj) => {
    acc[obj.reponseKey] = {
      terms: {
        field: `${obj.Field}.keyword`,
      },
    };
    return acc;
  }, {});

  return aggs;
}
async function frameResponse(input, result) {
  try {
    let response = {};

    for (const key in result.aggregations) {
      let modified_agg_res = result.aggregations[key];
      delete modified_agg_res.doc_count_error_upper_bound;
      delete modified_agg_res.sum_other_doc_count;

      // Rename buckets to value
      modified_agg_res.value = modified_agg_res.buckets;
      delete modified_agg_res.buckets;

      //rename doc_count to value
      const modifiedBuckets = modified_agg_res.value.map((bucket) => {
        return {
          key: bucket.key,
          value: bucket.doc_count,
        };
      });
      response[key] = modifiedBuckets;
    }


    //  else {
    //   let count = result.hits.total.value;
    //   response = input.filters.reduce((acc, obj) => {
    //     console.log(obj.field);
    //     if (obj.field != "date_of_join") {
    //       acc[obj.field] = [
    //         {
    //           key: obj.value[0],
    //           value: count,
    //         },
    //       ];
    //     }
    //     return acc;
    //   }, {});
    //   console.log("response in else-->", response);
    // }

    return response;
  } catch (e) {
    console.log("error in frameResponse", e);
    return false; /////change this later
  }
}

//To generating secret key for jwt
const crypto = require("crypto");

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("base64");
};

module.exports = {
  getNumberOfDays,
  formatResult,
  quaterattritionCount,
  frameDynamicQuery,
  frameResponse,
};
