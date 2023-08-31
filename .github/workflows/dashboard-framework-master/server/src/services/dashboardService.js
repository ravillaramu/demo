const Connection = require("../config/ClientConnection");
const shared = require("../Shared/sharedFunctions");
const axios = require("axios");
const https = require("https");

let filter = [];
let newHireFilter = [];
let attritionFilter = [];
const index = "global_emp_wholedata";
async function exit_count(year, month, days, data) {
  try {
    const connection = await Connection();
    const response = await connection.search({
      index: index,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              ...filter,
              ...newHireFilter,
              {
                range: {
                  lwd: {
                    gte: year + "-01-01T00:00:00",
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          reason_counts: {
            multi_terms: {
              terms: [
                {
                  field: "exit_type.keyword",
                },
                {
                  field: "reason.keyword",
                },
              ],
              size: 1000,
            },
          },
        },
      },
    });

    return {
      is_error: false,
      code: response.status,
      message: "",
      data: response.aggregations.reason_counts.buckets,
    };
  } catch (error) {
    console.log("error in exit_count", error.statusCode);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error,
      data: null,
    };
  }
}

async function SearchData(data, days) {
  try {
    let year = data.year;
    let month = data.month;
    filter = [];

    filter.push({ exists: { field: "gender" } });
    if (data?.bu?.length) {
      filter.push({ match: { bu: data.bu[0] } });
    }

    if (data?.region?.length) {
      filter.push({ match: { region: data.region[0] } });
    }
    if (data?.gender?.length) {
      filter.push({ match: { gender: data.gender[0] } });
    }
    if (data?.organizationUnit?.length) {
      filter.push({ match: { organization_unit: data.organizationUnit[0] } });
    }

    newHireFilter = [];

    if (data["newHires"]) {
      newHireFilter.push(
        { match: { emp_status: "Active" } },
        {
          range: {
            date_of_join: {
              gte: `${year}-01-01T00:00:00`,
              lte: `${year}-${month}-${days}T23:59:59`,
            },
          },
        }
      );
    }

    attritionFilter = [];

    if (data["Attrition"]) {
      attritionFilter.push(
        { match: { emp_status: "Inactive" } },
        {
          range: {
            lwd: {
              gte: `${year}-01-01T00:00:00`,
              lte: `${year}-${month}-${days}T23:59:59`,
            },
          },
        }
      );
    }
    const connection = await Connection();

    // const response = await connection.search({
    //   index: "global_emp_wholedata",
    //   body: {
    //     size: 10000, // Set the desired size to retrieve all records
    //     query: {
    //       bool: {
    //         must: [
    //           ...filter,
    //           !data["Attrition"] ? { match: { emp_status: "Active" } } : "",
    //           // ...newHireFilter,

    //           {
    //             range: {
    //               date_of_join: {
    //                 lte: `${year}-${month}-${days}T23:59:59`,
    //               },
    //             },
    //           },
    //           //...attritionFilter,
    //         ],
    //       },
    //     },
    //   },
    // });
    const headCount = await connection.count({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              { match: { emp_status: "Active" } },

              {
                range: {
                  date_of_join: {
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
            ],
          },
        },
      },
    });

    const newHires = await connection.count({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              { match: { emp_status: "Active" } },
              {
                range: {
                  date_of_join: {
                    gte: `${year}-01-01T00:00:00`,
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
            ],
          },
        },
      },
    });

    const attrition = await connection.count({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              {
                range: {
                  lwd: {
                    gte: `${year}-01-01T00:00:00`,
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
            ],
          },
        },
      },
    });

    let closing = headCount.count + newHires.count - attrition.count;
    let attritionPercent = (
      ((attrition.count * 12) / ((headCount.count + closing) / 2) / month) *
      100
    ).toFixed(2);

    const chartInfo = await getChartData(year, month, days);
    const tileInfo = {
      headcount: headCount.count,
      headcountFlag: true,
      newhires: newHires.count,
      newhiresFlag: true,
      attrition: attrition.count,
      attritionFlag: false,
      attritionPercentage: attritionPercent,
      attritionPercentageFlag: false,
    };
    let business_summary1 = [
      "Market Expansion: We plan to enter new territories and tap into untapped customer segments to drive growth and increase market share.",
      "Product Innovation: Our focus is on continuous product development, leveraging cutting-edge technology to deliver innovative solutions that meet evolving customer needs.",
      "Operational Efficiency: Streamlining processes and optimizing resource allocation to enhance productivity, reduce costs, and improve overall efficiency.",
      "Customer Experience Enhancement: Investing in personalized experiences, improving service quality, and leveraging customer feedback to build strong relationships and loyalty.",
      "Talent Development: Nurturing a culture of learning and development, attracting top talent, and fostering employee growth to fuel our long-term success.",
    ];

    ///call all the function
    let quaterlyAttrition_Count = await getAttritionCount(year);
    let headcountMovement = await getemployeeMovement(year, data);
    let globalHeadCount = await getRegionWiseCount(year, month, days, data);
    let monthlyHeadCountBU = await getMonthlyCountBUwise(data);
    let vdays = await shared.getNumberOfDays(year, month - 1);

    let AttritionCate = await exit_count(year, month, vdays, data);

    let vol = [];
    let InVol = [];
    AttritionCate.data.map((data) => {
      if (data.key[0] == "Voluntary") {
        vol.push({ key: data.key[1], count: data.doc_count });
      } else {
        InVol.push({ key: data.key[1], count: data.doc_count });
      }
    });
    let AttritionCategorisation = {
      voluntary: vol,
      Involuntary: InVol,
    };

    return {
      is_error: false,
      code: 200,
      message: "",
      // data: response.hits.hits,
      tileInfo,
      quaterlyAttrition_Count: quaterlyAttrition_Count.data,
      headcountMovement: headcountMovement.data,
      globalHeadCount: globalHeadCount.data,
      business_summary: business_summary1,
      monthlyHeadCountBU: monthlyHeadCountBU.data,
      AttritionCategorisation: AttritionCategorisation,
      ...chartInfo,
    };
  } catch (error) {
    console.log("error in SearchData", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error.body.error,
      data: null,
    };
  }
}

async function getAttritionCount(year) {
  try {
    let res = {
      Voluntary: {},
      Involuntary: {},
    };

    let months = [
      "01-01",
      "03-31",
      "04-01",
      "06-30",
      "07-01",
      "09-30",
      "10-01",
      "12-31",
    ];

    let quater;
    for (let j = 0; j < 2; j++) {
      ////to get two types of exittype data
      quater = 1;
      for (let i = 0; i < months.length; i += 2) {
        ///to get each quater data
        let quaterResult = await shared.quaterattritionCount(
          year + "-" + months[i],
          year + "-" + months[i + 1],
          j == 0 ? "Voluntary" : "Involuntary",
          filter,
          newHireFilter
        );

        if (j == 0) {
          /// push response to res object
          res.Voluntary["Q" + quater] = quaterResult;
        } else {
          res.Involuntary["Q" + quater] = quaterResult;
        }
        quater++;
      }
    }

    return {
      is_error: false,
      code: 200,
      message: "",
      data: res,
    };
  } catch (error) {
    console.log("error in getAttritionCount", error);
    return {
      is_error: true,
      code: 400,
      message: error,
      data: "",
    };
  }
}

async function getemployeeMovement(year, data) {
  try {
    const connection = await Connection();
    const wholedate = await connection.count({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              data["Attrition"]
                ? { match: { emp_status: "InActive" } }
                : { match: { emp_status: "Active" } },

              ...attritionFilter,
              {
                range: {
                  date_of_join: {
                    lte: `${year - 1}-12-31T23:59:59`,
                  },
                },
              },
            ],
          },
        },
      },
    });

    const newHireCount = await connection.search({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              { match: { emp_status: "Active" } },
              ...attritionFilter,
              {
                range: {
                  date_of_join: {
                    gte: `${year}-01-01T00:00:00`,
                    lte: `${year}-12-31T23:59:59`,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          attrition_by_month: {
            date_histogram: {
              field: "date_of_join",
              calendar_interval: "month",
              format: "yyyy-MM",
            },
          },
        },
      },
    });

    const attritionCount = await connection.search({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              ...newHireFilter,
              {
                range: {
                  lwd: {
                    gte: `${year}-01-01T00:00:00`,
                    lte: `${year}-12-31T23:59:59`,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          attrition_by_month: {
            date_histogram: {
              field: "lwd",
              calendar_interval: "month",
              format: "yyyy-MM",
            },
          },
        },
      },
    });

    let attritionData = await shared.formatResult(attritionCount);
    let overallheadCount = [];
    let newHiredata = await shared.formatResult(newHireCount);
    overallheadCount.push(Number(wholedate.count) + Number(newHiredata[0]));
    //console.log("overallheadCount",overallheadCount)
    for (let i = 1; i < 12; i++) {
      overallheadCount.push(
        Number(overallheadCount[i - 1]) + Number(newHiredata[i])
      );
    }

    for (let i = 0; i < 12; i++) {
      overallheadCount[i] = overallheadCount[i] - newHiredata[i];
    }

    let response = {
      NewHires: await shared.formatResult(newHireCount),
      HeadCount: overallheadCount,
      Attrition: attritionData,
    };

    return {
      is_error: false,
      code: 200,
      message: "",
      data: response,
    };
  } catch (error) {
    console.log("error in getemployeeMovement", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error,
      data: null,
    };
  }
}
async function getRegionWiseCount(year, month, days, data) {
  try {
    const connection = await Connection();
    const response = await connection.search({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              data["Attrition"]
                ? { match: { emp_status: "InActive" } }
                : { match: { emp_status: "Active" } },
              ...newHireFilter,
              {
                range: {
                  date_of_join: {
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
              ...attritionFilter,
            ],
          },
        },
        aggs: {
          work_location_count: {
            terms: {
              field: "region.keyword",
              size: 10,
            },
          },
        },
      },
    });
    let RegionWiseData = response.aggregations.work_location_count.buckets;
    let result_obj = {
      //Global: globalCount,
      RegionWiseData: RegionWiseData,
    };

    return {
      is_error: false,
      code: response.status,
      message: "",
      data: result_obj,
    };
  } catch (error) {
    console.log("error in getRegionWiseCount", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error.body.error,
      data: null,
    };
  }
}

async function getMonthlyCountBUwise(data) {
  try {
    let response_data = [];
    let year = data.year;
    let month = data.month ? data.month : "12";

    const connection = await Connection();
    for (let i = 1; i <= 12; i++) {
      month = i > 9 ? i : "0" + i;
      let days = await shared.getNumberOfDays(year, i - 1);
      let response = await connection.search({
        index: index,
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    date_of_join: {
                      lte: `${year}-${month}-${days}T23:59:59`,
                    },
                  },
                },
                {
                  match: {
                    emp_status: "Active",
                  },
                },
                ...filter,
                ...newHireFilter,
              ],
            },
          },
          aggs: {
            bu_counts: {
              terms: {
                field: "bu.keyword",
                size: 100,
              },
            },
          },
          size: 0,
        },
      });

      let responseForEachMonth = response.aggregations.bu_counts.buckets;
      response_data.push(responseForEachMonth);
    }
    let maxlength = Math.max(...response_data.map((val) => val.length));
    let maxArray = response_data.find((arr) => arr.length == maxlength);
    const response = [];

    for (let i = 0; i < maxlength; i++) {
      const name = maxArray[i].key;
      const data = [];

      for (let j of response_data) {
        const item = j.find((item) => item.key === name);

        if (item) {
          data.push(item.doc_count);
        } else {
          data.push(0);
        }
      }

      response.push({ name, data });
    }

    return {
      is_error: false,
      code: response.status,
      message: "",
      data: response,
    };
  } catch (error) {
    console.log("error in getMonthlyCountBUwise", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error,
      data: null,
    };
  }
}

async function getChartData(year, month, days) {
  try {
    const connection = await Connection();
    let response = await connection.search({
      index: index,
      body: {
        query: {
          bool: {
            must: [
              ...filter,
              {
                match: {
                  emp_status: "Active",
                },
              },
              {
                range: {
                  date_of_join: {
                    lte: `${year}-${month}-${days}T23:59:59`,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          bu: {
            terms: {
              field: "bu.keyword",
            },
          },
          Gender: {
            terms: {
              field: "gender.keyword",
            },
          },
          organizationUnit: {
            terms: {
              field: "organization_unit.keyword",
            },
          },
        },
      },
    });

    let bu = response.aggregations.bu.buckets.map((obj) => {
      return { key: obj.key, value: obj.doc_count };
    });
    let gender = response.aggregations.Gender.buckets.map((obj) => {
      return { key: obj.key, value: obj.doc_count };
    });
    let org_unit = response.aggregations.organizationUnit.buckets.map((obj) => {
      return { key: obj.key, value: obj.doc_count };
    });

    return {
      bu: bu,
      Gender: gender,
      organizationUnit: org_unit,
    };
  } catch (error) {
    console.log("error in getMonthlyCountBUwise", error);
    return {
      is_error: true,
      code: error.statusCode ? error.statusCode : 500,
      message: error,
      data: null,
    };
  }
}

module.exports = {
  exit_count,
  SearchData,
  getAttritionCount,
  getemployeeMovement,
  getRegionWiseCount,
};
