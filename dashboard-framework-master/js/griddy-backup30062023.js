var workforceData;

$.fn.griddify = function (options) {
  var defaults = {
    display: "grid",
    // gridTemplateColumns:
    //   "59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px",
    gridTemplateColumns:
      "5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25% 5.25%",
    // gridTemplateRows:
    //   "59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px",
    backgroundColor: "",
    // gap: "17.5px",
    // gap: "1.85%",
    padding: "10px",
  };
  var settings = $.extend(true, {}, defaults, options);
  d3.csv("data/workforce.csv", function (errors, data) {
    workforceData = crossfilter(data);
  });
  return this.css({
    display: settings.display,
    gridTemplateColumns: settings.gridTemplateColumns,
    gridTemplateRows: settings.gridTemplateRows,
    backgroundColor: settings.backgroundColor,
    backgroundImage: settings.backgroundImage,
    color: settings.colors,
    gap: settings.gap,
    padding: settings.padding,
  });
};

$.fn.itemize = function (options) {
  var defaults = {
    backgroundColor: "",
    color: "white",
    textAlign: "center",
    padding: "25px 10px 10px",
    borderRadius: "10px",
  };
  var settings = $.extend(true, {}, defaults, options);
  var title = settings.title !== undefined ? settings.title : this[0].id;
  this.append("<div class='title'>" + title + "</div>");
  $.get("widgets/" + settings.widgetType + ".html", function (widgetHtml) {
    Object.entries(settings.data).forEach(([key, value]) => {
      widgetHtml = widgetHtml.replace(`[${key}]`, value);
    });
    $(settings.target).append(widgetHtml);
  });
  return this.addClass(settings.widgetType).css({
    background: settings.background,
    backgroundColor: settings.backgroundColor,
    backgroundImage: settings.backgroundImage,
    backgroundRepeat: "no-repeat",
    color: settings.colors,
    textAlign: settings.textAlign,
    padding: settings.padding,
    fontSize: settings.fontSize,
    gridArea: settings.gridArea,
    border: settings.border,
    borderRadius: settings.borderRadius,
  });
};

$.fn.appendItem = function (options) {
  var defaults = {
    backgroundColor: "",
    color: "white",
    textAlign: "center",
    padding: "18px 18px 18px 18px",
    borderRadius: "10px",
  };
  var settings = $.extend(true, {}, defaults, options);
  var list = settings.gridArea.split("/");
  var numArray = [+list[0], +list[1], +list[2], +list[3]];
  var gridWidthDiff = numArray[3] - numArray[1];
  var gridHeightDiff = numArray[2] - numArray[0];
  var size;
  var title = settings.title !== undefined ? settings.title : settings.target;
  if (gridWidthDiff > gridHeightDiff) {
    if (settings.widgetType == "data-count") {
      size = gridHeightDiff * 4 + 6 + "px";
    } else {
      // size=((gridHeightDiff*3)+5)+'px;
      size = 20 + "px";
    }
  } else {
    if (settings.widgetType == "data-count") {
      size = gridWidthDiff * 4 + 6 + "px";
    } else {
      // size=((gridWidthDiff*3)+5)+'px';
      size = 20 + "px";
    }
  }
  this.append("<div id='" + settings.target.substring(1) + "' style='overflow: hidden'></div>");
  var elementHtml =
    "<div class='title " +
    settings.widgetType +
    "title" +
    "' style=font-size:" +
    size +
    ">" +
    title +
    "</div>";
  if (settings.widgetType == "bar-chart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.BarChart(settings.target);
    //var data = crossfilter(settings.val);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 65;
    let height = (gridArea[2] - gridArea[0]) * 65;
    var dimension = settings.cf.dimension(function (d) {
      return d[settings.dimension];
    });
    var group = dimension.group().reduceSum(function (d) {
      return Number(d[settings.group]) || 1;
      // return Number(d[settings.group]);
    });
    chart
      .width(width)
      .height(height)
      .margins({ top: 20, right: 10, bottom: 60, left: 40 })
      .dimension(dimension)
      .group(group)
      .x(d3.scaleOrdinal().domain(dimension))
      .ordinalColors(settings.colors)
      .xUnits(dc.units.ordinal)
      .brushOn(false)
      .centerBar(false)
      .gap(20)
      .on('renderlet', function (chart) {
        chart.selectAll('rect').on('click', function (d) {
          var dataVal = d.key;
          var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
          if (val && val.indexOf(dataVal) == -1) {
            val = [];
            val.push(dataVal);
          } else if (val && val.indexOf(dataVal) != -1) {
            val = val.filter((x) => x != dataVal);
          } else {
            val = [];
          }
          sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
          fetchChartData();
        });
      })
      .render();
  } else if (settings.widgetType == "line-chart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.LineChart(settings.target);
    // var data = crossfilter(settings.val);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 65;
    let height = (gridArea[2] - gridArea[0]) * 65;
    let dimension = settings.cf.dimension(function (d) {
      return d[settings.dimension];
    });
    let group = dimension.group().reduceSum(function (d) {
      return Number(d[settings.group]) || 1;
    });
    chart
      .width(width)
      .height(height)
      .margins({ top: 20, right: 10, bottom: 60, left: 40 })
      .dimension(dimension)
      .group(group)
      .curve(d3.curveCardinal.tension(0.5))
      .renderDataPoints({ radius: 5, fillOpacity: 0.8, strokeOpacity: 0.0 })
      .x(d3.scaleOrdinal().domain(dimension)) // Need the empty val to offset the first value
      .xUnits(dc.units.ordinal) // Tell Dc.js that we're using an ordinal x axis
      .y(d3.scaleLinear().domain([0, 10000]))
      .colors(d3.scaleOrdinal().range(settings.colors))
      .brushOn(false)
      .on("renderlet", function (chart) {
        chart.selectAll("rect").on("click", function (d) {
          console.log("click!", d);
        });
      });
    chart.yAxis().ticks(4);
    chart.render();
  } else if (settings.widgetType == "dc-pie-chart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.PieChart(settings.target);
    //var data = crossfilter(settings.val);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 60;
    let height = (gridArea[2] - gridArea[0]) * 60 - 50;
    let dimension = settings.cf.dimension(function (d) {
      return d[settings.dimension];
    });
    let group = dimension.group().reduceSum(function (d) {
      return Number(d[settings.group]) || 1;
    });
    var dimensionTop = dimension.top(Infinity);
    var CountArr = [];
    if (dimensionTop) {
      dimensionTop = dimensionTop.map((x) => x[settings.dimension]);
      CountArr = [...new Set(dimensionTop)];
      var count = CountArr.map((res) => {
        return {
          key: res,
          value: dimensionTop.filter(val => val == res).length
        }
      })
    }
    count = count.sort((a, b) => {
      return b.value - a.value;
    });
    var colors = settings.colors;
    if (settings.labelSpecificColors && settings.labelSpecificColors.length > 0) {
      let chartColors = [];
      count.forEach((label) => {
        if (label.key) {
          const clr = settings.labelSpecificColors.find((val) => val.key === label.key) || "#000";
          chartColors.push(clr.value);
        }
      })
      colors = chartColors;
    }
    chart
      .width(width)
      .height(height)
      .dimension(dimension)
      .group(group)
      .minAngleForLabel(360)
      .transitionDuration(2000)
      .colors(d3.scaleOrdinal().range(colors))
      .innerRadius(settings.innerRadius)
      .cx(settings.cx).cy(settings.cy)
      .legend(
        dc.legend()
          .itemHeight(settings.legend.itemHeight).x(settings.legend.itemX).y(settings.legend.itemY).gap(settings.legend.itemGap)
          .legendText(function (d) {
            return d.name + " (" + d.data + ")";
          })
          .horizontal(settings.legend.horizontal)
      )
      .on('renderlet', function (chart) {
        chart.selectAll('path').on('click', function (d) {
          var dataVal = d.data.key;
          var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
          if (val && val.indexOf(dataVal) == -1) {
            val = [];
            val.push(dataVal);
          } else if (val && val.indexOf(dataVal) != -1) {
            val = val.filter((x) => x != dataVal);
          } else {
            val = [];
          }
          sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
          fetchChartData();
        });
      })

    if (dimension.top(Infinity).length == 0) {
      $(settings.target).empty();
      $(settings.target).append(elementHtml);
      $(settings.target).append("<div class='no-result'>No result found!</div>");
    } else {
      chart.render();
    }
  } else if (settings.widgetType == "row-chart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.RowChart(settings.target);
    //let data = crossfilter(settings.val);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 70;
    let height = (gridArea[2] - gridArea[0]) * 65 - 30;
    let dimension = settings.cf.dimension(function (d) {
      return d[settings.dimension];
    });
    let group = dimension.group().reduceSum(function (d) {
      return Number(d[settings.group]) || 1;
      // return Number(d[settings.group]);
    });
    chart
      .width(width)
      .height(height)
      .dimension(dimension)
      .group(group)
      .colors(d3.scaleOrdinal().range(settings.colors))
      .transitionDuration(2000)
      .x(d3.scaleOrdinal().domain([0, 40]))
      .label(function (d) {
        return d.key + "  (" + d.value + ")";
      })
      .ordering(function (d) {
        return -d.value
      }).on('renderlet', function (chart) {
        chart.selectAll('rect').on('click', function (d) {
          var dataVal = d.key;
          var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
          if (val && val.indexOf(dataVal) == -1) {
            val = [];
            val.push(dataVal);
          } else if (val && val.indexOf(dataVal) != -1) {
            val = val.filter((x) => x != dataVal);
          } else {
            val = [];
          }
          sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
          fetchChartData();
        });
      })
      .elasticX(true)
    if (dimension.top(Infinity).length == 0) {
      $(settings.target).empty();
      $(settings.target).append(elementHtml);
      $(settings.target).append("<div class='no-result'>No result found!</div>");
    } else {
      chart.render();
    }
  } else if (settings.widgetType == "scatter-plot") {
    $(settings.target).append(elementHtml);
    let chart = new dc.ScatterPlot(settings.target);
    // let data = crossfilter(settings.chart.data);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 65 + 30;
    let height = (gridArea[2] - gridArea[0]) * 65 - 30;
    let dimension = settings.cf.dimension(function (d) {
      return d[settings.dimension];
    });
    let group = dimension.group();
    chart
      .width(width)
      .height(height)
      .x(d3.scaleLinear().domain([100, 400]))
      .brushOn(false)
      .symbolSize(8)
      .clipPadding(10)
      .dimension(dimension)
      .group(group)
      //.colors(d3.scaleOrdinal().range(settings.chart.colors))
      .render();
  } else if (settings.widgetType == "heat-map") {
    $(settings.target).append(elementHtml);
    let chart = new dc.HeatMap(settings.target);
    //let data = crossfilter(settings.chart.data);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 70;
    let height = (gridArea[2] - gridArea[0]) * 80;
    let dimension = settings.cf.dimension(function (d) {
      return [+d.revenue, +d.month];
    });
    let group = dimension.group().reduceCount();
    chart
      .width(width)
      .height(height)
      .dimension(dimension)
      .group(group)
      .keyAccessor(function (d) {
        return +d.key[0];
      })
      .valueAccessor(function (d) {
        return +d.key[1];
      })
      .colorAccessor(function (d) {
        return +d.value;
      })
      .calculateColorDomain();
    chart.render();
  } else if (settings.widgetType == "series-chart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.SeriesChart(settings.target);
    //var data = crossfilter(settings.chart.data);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 65;
    let height = (gridArea[2] - gridArea[0]) * 65;
    var runDimension = settings.cf.dimension(function (d) {
      return [+d.Expt, +d.Run];
    });
    var runGroup = runDimension.group().reduceSum(function (d) {
      return +d.Speed;
    });
    chart
      .width(width)
      .height(height)
      .chart(function (c) {
        return new dc.LineChart(c).curve(d3.curveCardinal);
      })
      .x(d3.scaleLinear().domain([0, 20]))
      .brushOn(false)
      .yAxisLabel("Measured Speed km/s")
      .xAxisLabel("Run")
      .clipPadding(10)
      .elasticY(true)
      .dimension(runDimension)
      .group(runGroup)
      .mouseZoomable(true)
      .seriesAccessor(function (d) {
        return "Expt: " + d.key[0];
      })
      .keyAccessor(function (d) {
        return +d.key[1];
      })
      .valueAccessor(function (d) {
        return +d.value - 500;
      })
      .legend(
        dc
          .legend()
          .x(350)
          .y(350)
          .itemHeight(13)
          .gap(5)
          .horizontal(1)
          .legendWidth(140)
          .itemWidth(70)
      );
    chart.yAxis().tickFormat(function (d) {
      return d3.format(",d")(d + 299500);
    });
    chart.margins().left += 40;
    dc.renderAll();
  } else if (settings.widgetType == "composite-chart") {
    $(settings.target).append(elementHtml);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/8bf37615-1704-43fc-a1e1-2fdfb53ee1bb";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var colorArr = ["#283A9b", "#03C5FA", "#8E00E5"]
        var dataToFilter = keyArr.map((chartKey, index) => {
          var dataVal = Object.values(resData[chartKey]);
          if (index == 0 && dataVal && dataVal.length > 0) {
            dataVal = dataVal.map((y) => {
              return {
                y: y,
                dataLabels: {
                  enabled: true,
                  y: -75,
                  style: {
                    color: "#8C98B2",
                    textOutline: 'transparent'
                  }
                }
              }
            });
          }

          return {
            name: chartKey,
            type: index == 0 ? 'column' : 'spline',
            data: dataVal,
            color: colorArr[index] || "#000",
            borderRadius: {
              radius: 15
            },
            pointWidth: 15,
            lineWidth: 3
          }
        })
        drawCompositeChart(settings, dataToFilter);
      })
    } else {
      const headCountData = [1200, 3000, 2000, 5000, 3000, 8000, 6000, 3500, 2000, 2000, 4000, 5000];
      const newHiresData = [1200, 3000, 2000, 5000, 3000, 8000, 6000, 3500, 2000, 2000, 4000, 5000];
      const attritionData = [120, 300, 200, 500, 300, 800, 600, 350, 200, 200, 40, 500];
      const mockData = [{
        name: 'Head Count',
        type: 'column',
        yAxis: 1,
        data: headCountData,
      }, {
        name: 'New Hires',
        type: 'spline',
        data: newHiresData
      }, {
        name: 'Attrition',
        type: 'spline',
        data: attritionData,
      }]
      var dataToFilter = [];
      var colorArr = settings.colors;
      if (settings.responseData[settings.datafield]) {
        var keyArr = Object.keys(settings.responseData[settings.datafield]);
        dataToFilter = keyArr.map((chartKey, index) => {
          var dataVal = Object.values(settings.responseData[settings.datafield][chartKey]);
          if (index == 0 && dataVal && dataVal.length > 0) {
            dataVal = dataVal.map((y) => {
              return {
                y: y,
                dataLabels: {
                  enabled: true,
                  y: -75,
                  style: {
                    color: "#8C98B2",
                    textOutline: 'transparent'
                  }
                }
              }
            });
          }
          return {
            name: chartKey,
            type: index == 0 ? 'column' : 'spline',
            data: dataVal,
            color: colorArr[index] || "#000",
            borderRadius: {
              radius: 15
            },
            pointWidth: 15,
            lineWidth: 3
          }
        })
      } else {
        dataToFilter = mockData;
      }
      drawCompositeChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "composite-stacked-bar-chart") {
    $(settings.target).append(elementHtml);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/8bf37615-1704-43fc-a1e1-2fdfb53ee1bb";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var colorArr = ["#283A9b", "#03C5FA", "#8E00E5"]
        var dataToFilter = keyArr.map((chartKey, index) => {
          var dataVal = Object.values(resData[chartKey]);
          return {
            name: chartKey,
            data: dataVal,
            color: colorArr[index] || "#000",
            stack: (index == 1) ? keyArr[0] : chartKey
          }
        })
        drawCompositeStackedColumnChart(settings, dataToFilter);
      })
    } else {
      const headCountData = [1200, 3000, 2000, 5000, 3000, 8000, 6000, 3500, 2000, 2000, 4000, 5000];
      const newHiresData = [1200, 3000, 2000, 5000, 3000, 8000, 6000, 3500, 2000, 2000, 4000, 5000];
      const attritionData = [120, 300, 200, 500, 300, 800, 600, 350, 200, 200, 40, 500];
      const mockData = [{
        name: 'Head Count',
        stack: 'Head Count',
        yAxis: 1,
        data: headCountData,
      }, {
        name: 'New Hires',
        stack: 'Attrition',
        data: newHiresData
      }, {
        name: 'Attrition',
        stack: 'Attrition',
        data: attritionData,
      }]
      var dataToFilter = [];
      var colorArr = settings.colors;
      if (settings.responseData[settings.datafield]) {
        var keyArr = Object.keys(settings.responseData[settings.datafield]);
        dataToFilter = keyArr.map((chartKey, index) => {
          var dataVal = Object.values(settings.responseData[settings.datafield][chartKey]);
          return {
            name: chartKey,
            data: dataVal,
            color: colorArr[index] || "#000",
            stack: (index == 1) ? keyArr[0] : chartKey
          }
        })
      } else {
        dataToFilter = mockData;
      }
      drawCompositeStackedColumnChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "doublespline") {
    $(settings.target).append(elementHtml);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/70be4f2b-1ba0-455e-b5c2-c06d73032411";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var dataToFilter = keyArr.map((chartKey) => {
          return {
            name: chartKey,
            type: 'spline',
            data: Object.values(resData[chartKey]),
            lineWidth: 3
          }
        })
        drawDoubleSplineChart(settings, dataToFilter);
      })
    } else {
      const newHiresData = [1200, 3000, 2000, 5000];
      const attritionData = [120, 300, 200, 500];
      const mockData = [{
        name: 'New Hires',
        type: 'spline',
        data: newHiresData
      }, {
        name: 'Attrition',
        type: 'spline',
        data: attritionData
      }];
      var dataToFilter = [];
      if (settings.responseData[settings.datafield]) {
        var keyArr = Object.keys(settings.responseData[settings.datafield]);
        dataToFilter = keyArr.map((chartKey) => {
          return {
            name: chartKey,
            type: 'spline',
            data: Object.values(settings.responseData[settings.datafield][chartKey]),
            lineWidth: 3
          }
        })
      } else {
        dataToFilter = mockData;
      }
      drawDoubleSplineChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "pie-chart") {
    $(settings.target).append(elementHtml);
    // let gridArea = settings.gridArea.split("/");
    // let width = (gridArea[3] - gridArea[1]) * 65;
    // let height = (gridArea[2] - gridArea[0]) * 65;
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/70be4f2b-1ba0-455e-b5c2-c06d73032411";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var dataToFilter = keyArr.map((chartKey) => {
          return {
            name: chartKey,
            type: 'spline',
            data: Object.values(resData[chartKey]),
            lineWidth: 3
          }
        })
        drawPieChart(settings, dataToFilter);
      })
    } else {
      let dataToFilter = [];
      if (settings.responseData[settings.datafield]) {
        dataToFilter = settings.responseData[settings.datafield].map((chartKey, index) => {
          return {
            name: chartKey.key,
            y: chartKey.value
          }
        })


        if (settings.labelSpecificColors && settings.labelSpecificColors.length > 0) {
          let chartColors = [];
          dataToFilter.map((label) => {
            const clr = settings.labelSpecificColors.find((val) => val.key === label.name) || { value: "#000" };
            chartColors.push(clr.value);
            label.color = clr.value;
            return label;
          })
          // colors = chartColors.reverse();
          settings.colors = chartColors;
        }
      } else {
        dataToFilter = [];
      }
      console.log(dataToFilter);
      drawPieChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "radius-pie") {
    $(settings.target).append(elementHtml);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/70be4f2b-1ba0-455e-b5c2-c06d73032411";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var dataToFilter = keyArr.map((chartKey) => {
          return {
            name: chartKey,
            type: 'spline',
            data: Object.values(resData[chartKey]),
            lineWidth: 3
          }
        })
        drawRadiusPieChart(settings, dataToFilter);
      })
    } else {
      var dataToFilter = [];
      // var dimension = settings.cf.dimension(function (d) {
      //   return d[settings.dimension];
      // });
      // var dimensionTop = dimension.top(Infinity);
      // var CountArr = [];
      // if (dimensionTop) {
      //   dimensionTop = dimensionTop.map((x) => x[settings.dimension]);
      //   CountArr = [...new Set(dimensionTop)];
      //   dataToFilter = CountArr.map((res) => {
      //     return {
      //       key: res,
      //       value: dimensionTop.filter(val => val == res).length
      //     }
      //   })
      // }
      if (settings.responseData[settings.datafield]) {
        dataToFilter = settings.responseData[settings.datafield];
      }

      let sortdataToFilter = dataToFilter.sort((a, b) => {
        return a.value - b.value;
      });
      dataToFilter = sortdataToFilter;
      // var colors = settings.colors;
      if (settings.labelSpecificColors && settings.labelSpecificColors.length > 0) {
        let chartColors = [];
        dataToFilter = dataToFilter.map((res, i) => {
          return {
            name: (res.key == null) ? "NULL" : res.key,
            y: res.value,
            z: res.value
          }
        })

        let filteredNotNullArr = dataToFilter.filter((val) => val.name !== "NULL");
        let NullField = dataToFilter.find((val) => val.name == "NULL");


        dataToFilter = filteredNotNullArr.map((resp, i) => {
          if (filteredNotNullArr.length == i + 1 && NullField) {
            resp.y = NullField.y + resp.y;
            resp.y = NullField.z + resp.z;
          }
          return resp;
        })

        dataToFilter.forEach((label) => {
          const clr = settings.labelSpecificColors.find((val) => val.key === label.name) || { value: "#000" };
          chartColors.push(clr.value);
        })
        colors = chartColors.reverse();
        settings.colors = chartColors;
        dataToFilter = dataToFilter.reverse();
      }
      drawRadiusPieChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "stacked-bar") {
    $(settings.target).append(elementHtml);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/70be4f2b-1ba0-455e-b5c2-c06d73032411";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var keyArr = Object.keys(resData);
        var colors = settings.colors;
        var dataToFilter = keyArr.map((chartKey, index) => {
          return {
            name: chartKey,
            data: Object.values(resData[chartKey]),
            color: colors[index] || "#000",
          }
        })
        drawstackedBarChart(settings, dataToFilter);
      })
    } else {
      var dataToFilter = [];
      if (settings.responseData[settings.datafield]) {
        var colors = settings.colors;
        dataToFilter = settings.responseData[settings.datafield].map((chartKey, index) => {
          return {
            name: chartKey.name,
            data: chartKey.data,
            color: colors[index] || "#000",
          }
        })


        if (settings.labelSpecificColors && settings.labelSpecificColors.length > 0) {
          let chartColors = [];
          dataToFilter.map((label) => {
            const clr = settings.labelSpecificColors.find((val) => val.key === label.name) || { value: "#000" };
            chartColors.push(clr.value);
            label.color = clr.value;
            return label;
          })
          // colors = chartColors.reverse();
          settings.colors = chartColors;
        }
      } else {
        dataToFilter = [{
          name: "",
          data: [0]
        }];
      }
      drawstackedBarChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "packed-bubble") {
    $(settings.target).append(elementHtml);
    if (settings.withFilter) {
      var filterDiv = document.createElement("div");
      // filterDiv.style("display", "flex")
      filterDiv.classList.add("flex");
      var filterFields = settings.FilterFields;
      var radioBtns = "";
      for (var i = 0; i < filterFields.length; i++) {
        if (radioBtns == "") {
          radioBtns = '<input type="radio" value="' + filterFields[i] + '" name="' + settings.id + 'RadioFilter">' + filterFields[i] + '  </input> <br>';
        } else {
          radioBtns = radioBtns + '<input type="radio" value="' + filterFields[i] + '" name="' + settings.id + 'RadioFilter">' + filterFields[i] + '  </input> <br>';
        }
      }
      filterDiv.innerHTML = radioBtns;
      $(settings.target).append(filterDiv);
      document.querySelector('input[name="' + settings.id + 'RadioFilter"]').checked = true;
      let allRadioBtns = document.querySelectorAll('input[name="' + settings.id + 'RadioFilter"]');
      // or '.your_radio_class_name'
      for (let i = 0; i < allRadioBtns.length; i++) {
        allRadioBtns[i].style.color = '#8C98B2';
        allRadioBtns[i].addEventListener("change", function () {
          let val = this.value; // this == the clicked radio,
          if (settings.dataFromIndividualAPI) {
            settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
            settings.url = "https://mocki.io/v1/bb055550-3c79-4a7a-b1e9-f9083e736833";
            let promise = APICall(settings);
            promise.then((val) => {
              var resData = val;
              var dataToFilter = [];
              var colorArr = settings.colors;
              dataToFilter = resData.map((chartKey, index) => {
                return {
                  name: chartKey[settings.dimension],
                  data: [{
                    name: chartKey[settings.dimension],
                    value: chartKey[settings.group]
                  }],
                  // showInLegend: false,
                  color: colorArr[index] || "#000",
                  marker: {
                    fillOpacity: 1
                  }
                }
              })
              drawPackedBubbleChart(settings, dataToFilter);
            })
          } else {
            var colorArr = settings.colors;
            var mockData = [{
              name: "IND",
              data: [{
                name: "IND",
                value: 109
              }],
              showInLegend: false,
              color: colorArr[0] || "#000",
              marker: {
                fillOpacity: 1
              }
            },
            {
              name: "USA",
              data: [{
                name: "USA",
                value: 90
              }],
              showInLegend: false,
              color: colorArr[1] || "#000",
              marker: {
                fillOpacity: 1
              }
            }
            ]
            var dataToFilter = [];
            var colorArr = settings.colors;
            if (settings.responseData[settings.datafield]) {
              var keyArr = Object.keys(settings.responseData[settings.datafield]);
              var selectedRadioValue = document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked') ? document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked').value : "";
              var colorArr = settings.colors;
              var isFieldExist = keyArr.indexOf(selectedRadioValue) != -1;
              var DataToProcess = [];
              if (selectedRadioValue && isFieldExist) {
                DataToProcess = settings.responseData[settings.datafield][selectedRadioValue];
              }
              dataToFilter = DataToProcess.map((chartKey, index) => {
                return {
                  name: chartKey[settings.dimension],
                  data: [{
                    name: chartKey[settings.dimension],
                    value: chartKey[settings.group]
                  }],
                  // showInLegend: false,
                  color: colorArr[index] || "#000",
                  marker: {
                    fillOpacity: 1
                  }
                }
              })
            } else {
              dataToFilter = mockData;
            }
            drawPackedBubbleChart(settings, dataToFilter);
          }
        });
      }
    }
    let chartDiv = document.createElement("div");
    chartDiv.setAttribute("id", settings.id);
    $(settings.target).append(chartDiv);
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/bb055550-3c79-4a7a-b1e9-f9083e736833";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var dataToFilter = [];
        var colorArr = settings.colors;
        dataToFilter = resData.map((chartKey, index) => {
          return {
            name: chartKey[settings.dimension],
            data: [{
              name: chartKey[settings.dimension],
              value: chartKey[settings.group]
            }],
            // showInLegend: false,
            color: colorArr[index] || "#000",
            marker: {
              fillOpacity: 1
            }
          }
        })
        drawPackedBubbleChart(settings, dataToFilter);
      })
    } else {
      var colorArr = settings.colors;
      var mockData = [{
        name: "IND",
        data: [{
          name: "IND",
          value: 109
        }],
        showInLegend: false,
        color: colorArr[0] || "#000",
        marker: {
          fillOpacity: 1
        }
      },
      {
        name: "USA",
        data: [{
          name: "USA",
          value: 90
        }],
        showInLegend: false,
        color: colorArr[1] || "#000",
        marker: {
          fillOpacity: 1
        }
      }
      ]
      var dataToFilter = [];
      var colorArr = settings.colors;
      if (settings.responseData[settings.datafield]) {
        var keyArr = Object.keys(settings.responseData[settings.datafield]);
        var selectedRadioValue = document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked') ? document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked').value : "";
        var colorArr = settings.colors;
        var isFieldExist = keyArr.indexOf(selectedRadioValue) != -1;
        var DataToProcess = [];
        if (selectedRadioValue && isFieldExist) {
          DataToProcess = settings.responseData[settings.datafield][selectedRadioValue];
        }
        dataToFilter = DataToProcess.map((chartKey, index) => {
          return {
            name: chartKey[settings.dimension],
            data: [{
              name: chartKey[settings.dimension],
              value: chartKey[settings.group]
            }],
            // showInLegend: false,
            color: colorArr[index] || "#000",
            marker: {
              fillOpacity: 1
            }
          }
        })
      } else {
        dataToFilter = mockData;
      }
      drawPackedBubbleChart(settings, dataToFilter);
    }
  } else if (settings.widgetType == "sunburstchart") {
    $(settings.target).append(elementHtml);
    let chart = new dc.SunburstChart(settings.target);
    // var data = crossfilter(settings.chart.data);
    let gridArea = settings.gridArea.split("/");
    let width = (gridArea[3] - gridArea[1]) * 65;
    let height = (gridArea[2] - gridArea[0]) * 65;
    // var dimension = data.dimension(function(d) {
    //    return d.key;
    // });
    // var group = dimension.group().reduceSum(function(d) {
    //    return d.value;
    // });
    var data = crossfilter(settings.data),
      runDimension = data.dimension(function (d) {
        return [d.Expt, d.Run];
      });
    var speedSumGroup = runDimension.group().reduceSum(function (d) {
      return d.Speed;
    });
    var runOnlyDimension = data.dimension(function (d) {
      return d.Run;
    });
    var runOnlySpeedGroup = runOnlyDimension.group().reduceSum(function (d) {
      return d.Speed;
    });
    var exptOnlyDimension = data.dimension(function (d) {
      return d.Expt;
    });
    var exptOnlySpeedGroup = exptOnlyDimension.group().reduceSum(function (d) {
      return d.Speed;
    });
    chart
      .width(width)
      .height(height)
      .innerRadius(100)
      .dimension(runDimension)
      .group(speedSumGroup)
      .legend(dc.legend())
      .render();
  } else if (settings.widgetType == "bubble") {
    $(settings.target).append(elementHtml);
    let chart = new dc.BubbleChart(settings.target);
    var mycrossfilter = crossfilter(settings.data);
    settings.data.forEach(function (x) {
      if (x.male == 1) {
        x.gender = "Male";
      } else {
        x.gender = "Female";
      }
      x.heightRange = (((Math.floor(x.height / 10)) + 1) * 10);
      x.weightRange = (((Math.floor(x.weight / 10)) + 1) * 10);
    });
    var genderDimension = mycrossfilter.dimension(function (data) {
      return [data.gender, data.heightRange, data.weightRange];
    });
    var genderGroup = genderDimension.group().reduceCount();
    chart.width(550)
      .height(400)
      .margins({ top: 10, right: 50, bottom: 30, left: 60 })
      .dimension(genderDimension)
      .group(genderGroup)
      .keyAccessor(function (p) {
        return p.key[1];
      })
      .valueAccessor(function (p) {
        return p.key[2];
      })
      .radiusValueAccessor(function (p) {
        return (Math.floor((p.value / 10)) + 1);
      })
      .x(d3.scaleLinear().domain([0, 240]))
      .y(d3.scaleLinear().domain([-40, 120]))
      .r(d3.scaleLinear().domain([0, 20]))
      .minRadiusWithLabel(1000)
      .yAxisPadding(100)
      .xAxisPadding(200)
      .maxBubbleRelativeSize(0.07)
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .renderLabel(true)
      .renderTitle(true)
      .title(function (p) {
        return p.key[0]
          + "\n"
          + "Height: " + p.key[1] + " cm\n"
          + "Weight: " + p.key[2] + " kg\n"
          + "Count: " + p.value;
      });
    chart.yAxis().tickFormat(function (s) {
      return s + " cm";
    });
    chart.xAxis().tickFormat(function (s) {
      return s + " kg";
    });
    chart.render();
  } else if (settings.widgetType == "data-count") {
    $.get("widgets/" + settings.widgetType + ".html", function (widgetHtml) {
      dataCount(
        settings,
        widgetHtml,
        gridHeightDiff,
        gridWidthDiff,
        elementHtml
      );
    });
  } else if (settings.widgetType == "global-chart") {
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.apiURL + constructQueryParam(settings.queryParams, settings);
      settings.url = "https://mocki.io/v1/ea66ea86-05b5-4b38-ad8c-2384c9eb90ac";
      let promise = APICall(settings);
      promise.then((val) => {
        var resData = val;
        var mapChartDiv = '<div class="global-chart-value-container">';
        if (resData) {
          // if (settings.headerField && resData[settings.headerField]) {
          //   var templateCode = "<div id='Global-count'><p id='Global-count-name'>Global</p><p id='Global-count-value'>" + resData[settings.headerField] + "</p><span class='side-bar-border'></span><span class='gradiant-border'></span></div>";
          //   mapChartDiv = mapChartDiv + templateCode;
          // }
          if (settings.dataField && resData[settings.dataField]) {
            var valueArr = resData[settings.dataField];
            valueArr.forEach((res) => {
              var templateCode = "<div id='" + res.key + "-count'><p id='" + res.key + "-count-name'>" + res.key + "</p><p id='" + res.key + "-count-value'>" + res.doc_count + "</p><span class='side-bar-border'></span><span class='gradiant-border'></span></div>";
              mapChartDiv = mapChartDiv + templateCode;
            })
          }
          elementHtml = elementHtml + mapChartDiv;
          elementHtml = elementHtml + "</div>";
          $(settings.target).append(elementHtml);
        }
      })
    } else {
      var resData = settings.responseData[settings.datafield];
      if (resData) {
        var mapChartDiv = '<div class="global-chart-value-container">';
        // if (settings.headerField && resData[settings.headerField]) {
        //   var templateCode = "<div id='Global-count' class='locationMarker'><p id='Global-count-name'>Global</p><p id='Global-count-value'>" + resData[settings.headerField] + "</p><span class='side-bar-border'></span><span class='gradiant-border'></span></div>";
        //   mapChartDiv = mapChartDiv + templateCode;
        // }
        if (settings.valuefield && resData[settings.valuefield]) {
          var valueArr = resData[settings.valuefield];
          valueArr.forEach((res) => {
            var templateCode = "<div class='locationMarker' id='" + res.key + "-count'><p id='" + res.key + "-count-name'>" + res.key + "</p><p id='" + res.key + "-count-value'>" + res.doc_count + "</p><span class='side-bar-border'></span><span class='gradiant-border'></span></div>";
            mapChartDiv = mapChartDiv + templateCode;
          })
        }
        elementHtml = elementHtml + mapChartDiv;
        elementHtml = elementHtml + "</div>";
        $(settings.target).append(elementHtml);
        let allMarkers = document.querySelectorAll('.locationMarker');
        for (let i = 0; i < allMarkers.length; i++) {
          var val = sessionStorage.getItem(settings.sessionKey);
          var idVal = allMarkers[i].id.replace('-count', '');
          if (val && JSON.stringify(val).indexOf(idVal) != -1) {
            allMarkers[i].classList.add("selectedFilterMap");
          } else {
            allMarkers[i].classList.remove('selectedFilterMap');
          }
          allMarkers[i].addEventListener('click', function (a) {
            var dataVal = allMarkers[i].id.replace('-count', '')
            var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
            if (val && dataVal == "Global") {
              val = [];
            } else if (val && dataVal != "Global" && val.indexOf(dataVal) == -1) {
              val = [];
              val.push(dataVal);
            } else if (val && dataVal != "Global" && val.indexOf(dataVal) != -1) {
              val = val.filter((x) => x != dataVal);
            } else {
              val = [];
            }
            sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
            fetchChartData();
          })
        }
      }
    }
  } else if (settings.widgetType == "titlebar") {
    $.get("widgets/" + settings.widgetType + ".html", function (widgetHtml) {
      elementHtml = elementHtml + widgetHtml;
      elementHtml = elementHtml + "</div>";
      $(settings.target).append(elementHtml);
    });
  } else if (settings.widgetType == "radar-area") {
    $(settings.target).append(elementHtml);
    const ctx = document.getElementById("radararea");
    var CalculatedData = [];
    settings.val.forEach((res, index, arr) => {
      if (CalculatedData.some(item => {
        if (item.key === res[settings.dimension]) {
          return true;
        } else {
          return false;
        }
      })) {
        CalculatedData = CalculatedData.map(x => {
          if (x.key == res[settings.dimension]) {
            x.value = x.value + (Number(res[settings.group]) || 1);
          }
          return x;
        })
      } else {
        CalculatedData.push({
          key: res[settings.dimension],
          value: Number(res[settings.group]) || 1
        })
      }
    });
    CalculatedData = CalculatedData.sort((a, b) => b.value - a.value);
    const labels = CalculatedData.map(y => y['key']);
    const plotData = CalculatedData.map(z => z['value']);
    setTimeout(() => {
      new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Dataset',
              data: plotData,
              backgroundColor: [
                "#8E00E5",
                "#0278E6",
                "#03C5FA",
                "#6154FC",
                "#FFCD6E",
                "#64F0DB",
                "#03C5FA",
                "#FF6E90",
                "#5EFF5A",
                "#F8A200"
              ],
            },
          ],
        },
        options: {
          borderColor: 'black',
          backgroundColor: 'red',
          borderDash: [10, 10],
          borderDashOffset: 0,
          borderWidth: 0,
          scales: {
            r: {
              display: false,
            },
            // scaleShowLine: false,
            // display: false
          },
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              fontColor: "#fff"
            },
            title: {
              display: false,
              text: 'Head Count - BU wise'
            }
          }
        },
      });
    }, 1000);
  } else if (settings.widgetType == "d3-bubble") {
    $(settings.target).append(elementHtml);
    if (settings.withFilter) {
      var filterDiv = document.createElement("div");
      // filterDiv.style("display", "flex")
      filterDiv.classList.add("flex");
      var filterFields = settings.FilterFields;
      var radioBtns = "";
      for (var i = 0; i < filterFields.length; i++) {
        if (radioBtns == "") {
          radioBtns = '<input type="radio" value="' + filterFields[i] + '" name="' + settings.target + 'RadioFilter">' + filterFields[i] + '  </input> <br>';
        } else {
          radioBtns = radioBtns + '<input type="radio" value="' + filterFields[i] + '" name="' + settings.target + 'RadioFilter">' + filterFields[i] + '  </input> <br>';
        }
      }
      filterDiv.innerHTML = radioBtns;
      $(settings.target).append(filterDiv);
      document.querySelector('input[name="' + settings.target + 'RadioFilter"]').checked = true;
    }
    var dataToFilter = [];
    if (settings.dataFromIndividualAPI) {
      settings.url = settings.url + constructQueryParam(settings.queryParams, settings);
      settings.apiURL = "https://mocki.io/v1/bb055550-3c79-4a7a-b1e9-f9083e736833";
      let promise = APICall(settings);
      promise.then((val) => {
        dataToFilter = val;
        drawD3RadarChart(dataToFilter, settings);
      })
    } else {
      dataToFilter = settings.val;
      drawD3RadarChart(dataToFilter, settings);
    }
  } else if (settings.widgetType == "list-view") {
    var widgetTemplate = "<div class='list-content'><ul>";
    var dataList = settings.responseData[settings.datafield];
    dataList.forEach((resData) => {
      widgetTemplate = widgetTemplate + "<li>" + resData + "</li>";
    })
    widgetTemplate = widgetTemplate + "</ul></div>";
    elementHtml = elementHtml + widgetTemplate;
    elementHtml = elementHtml + "</div>";
    $(settings.target).append(elementHtml);
  } else {
    $.get("widgets/" + settings.widgetType + ".html", function (widgetHtml) {
      Object.entries(settings.data).forEach(([key, value]) => {
        widgetHtml = widgetHtml.replace(`[${key}]`, value);
      });
      elementHtml = elementHtml + widgetHtml;
      elementHtml = elementHtml + "</div>";
      $(settings.target).append(elementHtml);
    });
  }
  $(settings.target).addClass(settings.widgetType).css({
    background: settings.background,
    backgroundColor: settings.backgroundColor,
    backgroundImage: settings.backgroundImage,
    backgroundRepeat: "no-repeat",
    color: settings.color,
    textAlign: settings.textAlign,
    padding: settings.padding,
    fontSize: settings.fontSize,
    gridArea: settings.gridArea,
    border: settings.border,
    borderRadius: settings.borderRadius,
  });
  return this;
};

function drawD3RadarChart(dataToFilter, settings) {
  var CalculatedData = [];
  dataToFilter.forEach((res, index, arr) => {
    if (CalculatedData.some(item => {
      if (item.key === res[settings.dimension]) {
        return true;
      } else {
        return false;
      }
    })) {
      CalculatedData = CalculatedData.map(x => {
        if (x.key == res[settings.dimension]) {
          x.value = x.value + (Number(res[settings.group]) || 1);
        }
        return x;
      })
    } else {
      CalculatedData.push({
        key: res[settings.dimension],
        value: Number(res[settings.group]) || 1
      })
    }
  });
  CalculatedData = CalculatedData.sort((a, b) => b.value - a.value);
  var colors = settings.colors;
  var data = CalculatedData.map((dataval, i) => {
    return {
      source: dataval.key, val: dataval.value, color: colors[i] || "#000", x: getRandom(0, 200), y: getRandom(10, 200)
    }
  })
  if (data && data.length > 0) {
    var svg = d3.select(settings.target).append("svg:svg");
    svg.attr("width", 500).attr("height", 450);
    svg.selectAll("circle")
      .data(data).enter()
      .append("circle")
      .attr("cx", function (d) { return d.x })
      .attr("cy", function (d) { return d.y })
      .attr("r", function (d) {
        return Math.sqrt(d.val) / Math.PI * 2.8
      })
      .attr("fill", function (d) {
        return d.color;
      });
    svg.selectAll("text")
      .data(data).enter()
      .append("text")
      .attr("x", function (d) { return d.x + (Math.sqrt(d.val) / Math.PI) })
      .attr("y", function (d) { return d.y + 4 })
      .text(function (d) { return d.val + "-" + d.source })
      .style("font-family", "arial")
      .style("font-size", "10px");
  }
}

function drawPackedBubbleChart(settings, seriesData) {
  Highcharts.chart(settings.id, {
    chart: {
      type: 'packedbubble',
      backgroundColor: settings.backgroundColor,
      height: settings.height,
    },
    title: {
      text: settings.titleText,
      align: settings.titleAlign,
      style: {
        color: settings.titleColor,
      }
    },
    tooltip: {
      useHTML: settings.tooltipUseHTML,
      pointFormat: settings.tooltipFormat
    },
    plotOptions: {
      packedbubble: {
        minSize: settings.bubbleMinSize,
        maxSize: settings.bubbleMaxSize,
        zMin: settings.bubbleZmin,
        zMax: settings.bubbleZmax,
        layoutAlgorithm: {
          splitSeries: settings.splitSeries,
          gravitationalConstant: settings.gravitationalConstant
        },
        dataLabels: {
          enabled: settings.dataLabelsEnabled,
          formatter: function () {
            return "<p style='text-align:center; color: #000; font-weight: 900; font-size: 11px; margin: 0;'>" + this.point.options.value + "</p>";
            // return this.point.options.value ;
          },
          useHTML: settings.dataLabelsUseHTML,
          filter: {
            property: settings.dataLabelsProperty,
            operator: settings.dataLabelsOperator,
            value: settings.dataLabelsValue
          },
          style: {
            color: settings.dataLabelsColor,
            textOutline: settings.dataLabelsTextOutLine,
            fontWeight: settings.dataLabelsFontWeight,
            fontSize: settings.dataLabelsFontSize
          }
        },
        events: {
          legendItemClick: function (e) {
            if (settings.disableLegendClick) {
              e.preventDefault();
            }
          }
        }
      }
    },
    legend: {
      layout: settings.legendLayout,
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      floating: settings.legendFloating,
      itemStyle: { color: settings.legendItemColor },
      itemHoverStyle: {
        color: settings.legendItemHoverColor
      },
      backgroundColor: settings.legendBackgroundColor,
      width: settings.legendWidth,
      itemWidth: settings.legendItemWidth
    },
    series: seriesData
  });
}

function getSubtitle(settings, series) {
  var total = 0;
  for (var i = 0; i < series.length; i++) {
    total += series[i].y;
  }
  if (settings.showInfoInMiddle) {
    return `<span style="font-size: 12px;  text-align: center; color: #8C98B2; width: 100%; display: inline-block;">
                ${settings.infoTextContent}
            </span>
              <br>
              <span style="font-size: 28px">
                    <p style="width: 100%; text-align: center; margin-top: 5px; color: #fff"> <b> ${total}</b> </p>
              </span>`;
  } else {
    return '';
  }
}

function drawDoubleSplineChart(settings, seriesData) {
  Highcharts.chart('doubleSpline', {
    chart: {
      zoomType: settings.ZoomType,
      backgroundColor: settings.backgroundColor,
      style: {
        fontFamily: 'Inter'
      }
    },
    title: {
      text: settings.title,
      align: 'left',
      y: 8,
      style: {
        color: '#FFFFFF',
        fontSize: '20px',
      }
    },
    xAxis: [{
      categories: settings.xAxisCategories,
      gridLineDashStyle: settings.xAxisGridLineDashStyle,
      gridLineWidth: settings.xAxisGridLineWidth,
      gridLineColor: settings.xAxisGridLineColor,
      crosshair: settings.xAxisCrosshair,
      labels: {
        style: {
          color: settings.xAxisLabelsColor,
          fontSize: settings.xAxisLabelsFontSize
        }
      }
    }],
    yAxis: [{ // Primary yAxis
      labels: {
        format: settings.yAxisLabelsFormat,
        style: {
          color: settings.yAxisLabelsColor,
          fontSize: settings.yAxisLabelsFontSize
        }
      },
      gridLineDashStyle: settings.yAxisGridLineDashStyle,
      gridLineWidth: settings.yAxisGridLineWidth,
      gridLineColor: settings.yAxisGridLineColor,
      title: {
        text: '',
        style: {
          color: '#8C98B2',
          fill: '#A2ADD3',
          fontSize: '10px'
        }
      },
      tickInterval: settings.yAxisTickInterval
    }, { // Secondary yAxis
      title: {
        text: '',
        style: {
          color: '#8C98B2',
          fill: '#A2ADD3',
          fontSize: '10px'
        }
      },
      labels: {
        format: '{value}',
        style: {
          color: Highcharts.getOptions().colors[0]
        },
        tickInterval: 50
      },
      opposite: true
    }],
    tooltip: {
      shared: true
    },
    plotOptions: {
      series: {
        dataLabels: {
          enabled: settings.dataLabelsEnabled,
          style: {
            color: settings.dataLabelsColor,
            textOutline: settings.dataLabelsTextOutLine
          }
        }
      },
      spline: {
        events: {
          legendItemClick: function (e) {
            if (settings.disableLegendClick) {
              e.preventDefault();
            }
          }
        }
      }
    },
    legend: {
      layout: settings.legendLayout,
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      floating: settings.legendFloating,
      itemStyle: {
        color: settings.legendItemColor
      },
      itemHoverStyle: {
        color: settings.legendItemHoverColor
      },
      backgroundColor: settings.legendBackgroundColor
    },
    series: seriesData
  });
}

function drawPieChart(settings, seriesData) {

  Highcharts.chart(settings.id, {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie',
      backgroundColor: settings.backgroundColor,
      style: {
        fontFamily: settings.fontFamily
      }
    },
    title: {
      text: settings.titleText,
      align: settings.titleAlign,
      y: settings.titleY,
      style: {
        color: settings.titleColor,
        fontSize: settings.titleFontSize,
      }
    },
    legend: {
      layout: settings.legendLayout,
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      floating: settings.legendFloating,
      y: settings.legendY,
      itemStyle: {
        color: settings.legendItemColor
      },
      itemHoverStyle: {
        color: settings.legendItemHoverColor
      },
      backgroundColor: settings.legendBackgroundColor
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        borderColor: "transparent",
        dataLabels: {
          enabled: false
        },
        showInLegend: true,
        innerSize: settings.innerRadius + "%"
      }
    },
    series: [{
      name: 'data',
      data: seriesData
    }]
  });

}

function drawRadiusPieChart(settings, seriesData) {
  Highcharts.chart(settings.id, {
    chart: {
      type: 'variablepie',
      backgroundColor: settings.backgroundColor,
      style: {
        fontFamily: settings.fontFamily
      }
    },
    title: {
      text: settings.title,
      align: settings.titleAlign,
      y: settings.titleY,
      style: {
        color: settings.titleColor,
        fontSize: settings.titleFontSize,
      }
    },
    subtitle: {
      useHTML: settings.subtitleUseHTML,
      text: getSubtitle(settings, seriesData),
      floating: settings.subtitleFloating,
      verticalAlign: settings.subtitleVerticalAlign,
      y: settings.subtitleY
    },
    tooltip: {
      headerFormat: settings.tooltipHeaderFormat,
      pointFormat: settings.tooltipPointFormat
    },
    legend: {
      enabled: settings.legendEnabled,
      y: settings.legendY,
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      layout: settings.legendLayout,
      backgroundColor: settings.legendsBackgroundColor,
      labelFormatter: function () {
        return this.name + ' (' + this.y + ')';
      },
      width: settings.legendWidth,
      itemWidth: settings.legendItemWidth,
      itemStyle: { color: settings.legendItemColor },
      itemHoverStyle: {
        color: settings.legendIemHoverColor
      },
      padding: settings.legendPadding,
    },
    plotOptions: {
      variablepie: {
        allowPointSelect: settings.variablepiePointSelect,
        borderColor: settings.variablepieBorderColor,
        cursor: settings.variablepieCusrsor,
        dataLabels: {
          enabled: settings.variablepieDataLabels,
        }
      },
      series: {
        cursor: settings.disableLegendClick ? 'no-drop' : 'pointer',
        point: {
          events: {
            click: function () {
              var dataVal = this.name;
              var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
              if (val && val.indexOf(dataVal) == -1) {
                val = [];
                val.push(dataVal);
              } else if (val && val.indexOf(dataVal) != -1) {
                val = val.filter((x) => x != dataVal);
              } else {
                val = [];
              }
              sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
              fetchChartData();
            },
            legendItemClick: function (e) {
              if (settings.disableLegendClick) {
                e.preventDefault();
              }
            }
          }
        }
      }
    },
    series: [{
      minPointSize: settings.seriesMinPointSize,
      innerSize: (settings.seriesInnerSize || 0) + '%',
      zMin: settings.seriesZmin,
      name: settings.seriesName,
      borderRadius: settings.seriesBorderRadius,
      data: seriesData,
      showInLegend: settings.seriesInLegend,
      colors: settings.colors
    }]
  });
}

function drawCompositeChart(settings, seriesData) {
  Highcharts.chart(settings.id, {
    chart: {
      zoomType: 'xy',
      backgroundColor: 'rgba(0,0,0,0)',
      style: {
        fontFamily: 'Inter'
      }
    },
    title: {
      text: settings.title,
      align: 'left',
      y: 8,
      style: {
        color: '#FFFFFF',
      }
    },
    xAxis: [{
      categories: settings.xAxisCategories,
      crosshair: true,
      labels: {
        style: {
          color: '#8C98B2'
        }
      }
    }],
    yAxis: [{ // Primary yAxis
      labels: {
        format: '{value}',
        style: {
          color: '#8C98B2',
          fill: '#A2ADD3',
          fontSize: '10px'
        }
      },
      title: {
        text: 'New Hires',
        style: {
          color: '#8C98B2',
          fill: '#A2ADD3',
          fontSize: '10px'
        }
      },
      gridLineWidth: 1,
      gridLineColor: '#9a9c9b',
      gridLineDashStyle: 'shortdash',
    }, { // Secondary yAxis
      title: {
        text: 'Attrition',
        style: {
          color: '#8C98B2',
          fill: '#A2ADD3',
          fontSize: '10px'
        }
      },
      opposite: true
    }],
    tooltip: {
      shared: true
    },
    legend: {
      align: 'bottom',
      x: 80,
      verticalAlign: 'bottom',
      y: 25,
      floating: false,
      itemStyle: { color: '#8C98B2' },
      itemHoverStyle: {
        color: '#fff'
      },
      backgroundColor: 'rgba(0,0,0,0)'
    },
    plotOptions: {
      series: {
        stacking: 'normal',
        borderWidth: 0,
        point: {
          events: {
            legendItemClick: function (e) {
              if (settings.disableLegendClick) {
                e.preventDefault();
              }
            }
          }
        }
      }
    },
    series: seriesData
  });
}

function drawCompositeStackedColumnChart(settings, seriesData) {
  Highcharts.chart(settings.id, {

    chart: {
      type: "column",
      backgroundColor: settings.backgroundColor,
      style: {
        fontFamily: settings.fontFamily
      }
    },
    title: {
      text: settings.title,
      align: settings.titleAlign,
      y: settings.titleY,
      style: {
        color: settings.titleColor,
      }
    },

    xAxis: {
      categories: settings.xAxisCategories,
      labels: {
        style: {
          color: settings.xAxisLabelsColor
        }
      }
    },

    yAxis: {
      allowDecimals: settings.yAxisAllowDecimals,
      min: settings.yAxisMin,
      title: {
        text: settings.yAxisTitleText
      },
      labels: {
        style: {
          color: settings.yAxisLabelsColor
        }
      },
      stackLabels: {
        enabled: settings.yAxisStackLabelsEnabled,
        style: {
          color: settings.yAxisStackLabelsColor,
          textOutline: settings.yAxisStackLabelsTextoutline
        }
      }
    },
    tooltip: {
      format: settings.tooltipFormat
    },
    legend: {
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      x: settings.legendX,
      y: settings.legendY,
      floating: settings.legendFloating,
      itemStyle: { color: settings.legendItemColor },
      itemHoverStyle: {
        color: settings.legendItemHoverColor
      },
      backgroundColor: settings.legendBackgroundColor
    },

    plotOptions: {
      column: {
        stacking: 'normal',
        borderWidth: 0

      }
    },

    series: seriesData
  });
}

function drawstackedBarChart(settings, seriesData) {
  Highcharts.chart(settings.id, {
    chart: {
      type: 'bar',
      backgroundColor: settings.backgroundColor,
      style: {
        fontFamily: settings.fontFamily
      }
    },
    title: {
      text: settings.title,
      align: settings.titleAlign,
      y: settings.titleY,
      style: {
        color: settings.titleColor,
      }
    },
    legend: {
      enabled: settings.legendEnabled,
      reversed: settings.legendReversed,
      align: settings.legendAlign,
      verticalAlign: settings.legendVerticalAlign,
      layout: settings.legendLayout,
      itemStyle: { color: settings.legendItemColor },
      itemHoverStyle: {
        color: settings.legendItemHoverColor
      },
      backgroundColor: settings.legendBackgroundColor,
    },
    xAxis: {
      categories: settings.xAxisCategories,
      lineWidth: settings.xAxisGridLineWidth,
      lineColor: settings.xAxisLineColor,
      gridLineWidth: settings.xAxisGridLineWidth,
      gridLineColor: settings.xAxisGridLineColor,
      minorGridLineWidth: settings.xAxisMinorGridLineWidth,
      labels: {
        style: {
          color: settings.xAxisLabelsColor,
          fontSize: settings.xAxisLabelsFontSize
        }
      }
    },
    yAxis: {
      min: settings.yAxisMin,
      gridLineWidth: settings.yAxisGridLineWidth,
      gridLineColor: settings.yAxisGridLineColor,
      labels: {
        style: {
          color: settings.yAxisLabelsColor,
          fontSize: settings.yAxisLabelsFontSize
        }
      },
      title: {
        text: settings.yAxisTitleText
      },
      stackLabels: {
        enabled: settings.yAxisStackLabelsEnabled,
        style: {
          color: settings.yAxisStackLabelsColor,
          textOutline: settings.yAxisStackLabelsTextoutline
        }
      }
    },
    plotOptions: {
      series: {
        cursor: 'pointer',
        stacking: settings.seriesStacking,
        borderWidth: 0,
        pointWidth: settings.seriesPointWidth,
        pointPadding: settings.seriesPointPadding,
        dataLabels: {
          enabled: settings.seriesDataLabelsEnabled,
          style: {
            color: settings.dataLabelsColor,
            textOutline: settings.dataLabelsTextOutLine,
          }
        },
        point: {
          events: {
            click: function () {
              if (settings.applyCrossFilter) {
                var dataVal = this.series.name;
                var val = sessionStorage.getItem(settings.sessionKey) ? JSON.parse(sessionStorage.getItem(settings.sessionKey)) : [];
                if (val && val.indexOf(dataVal) == -1) {
                  val = [];
                  val.push(dataVal);
                } else if (val && val.indexOf(dataVal) != -1) {
                  val = val.filter((x) => x != dataVal);
                } else {
                  val = [];
                }
                sessionStorage.setItem(settings.sessionKey, JSON.stringify(val));
                fetchChartData();
              }
            },
          }
        }
      }
    },
    series: seriesData
  });

}

function constructQueryParam(queryParamVals, settings) {
  var queryParam = "";
  queryParamVals.forEach((val => {
    var tempVal = "";
    if (val.valueFrom === "id") {
      tempVal = document.getElementById(val.field) ? document.getElementById(val.field).value : "";
    } else if (val.valueFrom === "name") {
      tempVal = document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked') ? document.querySelector('input[name="' + settings.id + 'RadioFilter"]:checked').value : "";
    }
    if (tempVal && queryParam == "") {
      queryParam = queryParam + "?" + val.field + "=" + tempVal;
    } else if (tempVal && queryParam != "") {
      queryParam = queryParam + "&" + val.field + "=" + tempVal;
    }
  }));
  return queryParam;
}

function APICall(requestInfo) {
  if (requestInfo.type == "GET") {
    return new Promise((resolve, reject) => {
      $.get(requestInfo.url, function (responseVal) {
        return resolve(responseVal.data);
      });
    })
  }
}


function dataCount(settings, widgetHtml, gridHeightDiff, gridWidthDiff, elementHtml) {
  Object.entries(settings.data).forEach(([key, value]) => {
    let num;
    if (value > -1 && key == "percentage") {
      num = "+" + numberConfiguration(value);
      widgetHtml = widgetHtml.replace("$image", "./images/Polygon 1.svg");
      widgetHtml = widgetHtml.replace("$3", "up");
    } else if (value < 0 && key == "percentage") {
      num = "-" + numberConfiguration(value);
      widgetHtml = widgetHtml.replace("$image", "./images/Polygon 4.svg");
      widgetHtml = widgetHtml.replace("$3", "down");
    } else {
      num = numberConfiguration(value);
    }
    var RecordCount = settings.responseData[settings.datafield];
    // settings.target == "#orders-shipped"
    //   ? (widgetHtml = widgetHtml.replace("$4", "%"))
    //   : (widgetHtml = widgetHtml.replace("$4", ""));
    (widgetHtml = widgetHtml.replace("$4", ""));
    widgetHtml = widgetHtml.replace("$1Data", settings.target.substring(1));
    widgetHtml = widgetHtml.replace("$2", settings.target.substring(1));
    widgetHtml = widgetHtml.replace("$2Data", settings.target.substring(1));
    widgetHtml = widgetHtml.replace(`[${key}]`, RecordCount[settings.valueField]);
  });
  elementHtml = elementHtml + widgetHtml;
  elementHtml = elementHtml + "</div>";
  $(settings.target).append(elementHtml);
  if (gridWidthDiff > gridHeightDiff) {
    document.querySelector(
      "." + settings.target.substring(1) + "filter-count"
    ).style.fontSize = gridHeightDiff * 7 + 18 + "px";
    if (document.querySelector(
      "." + settings.target.substring(1) + "up"
    )) {
      document.querySelector(
        "." + settings.target.substring(1) + "up"
      ).style.fontSize = gridHeightDiff * 3 + 6 + "px";
      document.querySelector(
        "." + settings.target.substring(1) + "up"
      ).style.padding = gridHeightDiff * 3 + "px";
    }
    document.querySelector(
      "." + settings.target.substring(1) + "upIndicator"
    ).style.width = gridHeightDiff * 3 + 9 + "px";
    document.querySelector(
      "." + settings.target.substring(1) + "upIndicator"
    ).style.padding = gridHeightDiff * 3 + "px";
  } else {
    document.querySelector(
      "." + settings.target.substring(1) + "filter-count"
    ).style.fontSize = gridWidthDiff * 7 + 11 + "px";
    if (document.querySelector(
      "." + settings.target.substring(1) + "up"
    )) {
      document.querySelector(
        "." + settings.target.substring(1) + "up"
      ).style.fontSize = gridWidthDiff * 2 + 6 + "px";
      document.querySelector(
        "." + settings.target.substring(1) + "up"
      ).style.padding = gridWidthDiff * 2 + "px";
    }
    document.querySelector(
      "." + settings.target.substring(1) + "upIndicator"
    ).style.width = gridWidthDiff * 2 + 8 + "px";
    document.querySelector(
      "." + settings.target.substring(1) + "upIndicator"
    ).style.padding = gridWidthDiff * 2 + "px";
  }
  var val = sessionStorage.getItem(settings.sessionKey) || "false";
  if (val == "true") {
    document.getElementById(settings.id).classList.add("selectedFilter");
  } else if (val == "false") {
    document.getElementById(settings.id).classList.remove('selectedFilter');
  }
  // document.getElementById(settings.id).addEventListener('click', function (EVENT) {
  //   if (settings.sessionKey) {
  //     var val = sessionStorage.getItem(settings.sessionKey) || "false";
  //     if (val == "true") {
  //       val = "false";
  //       document.getElementById(settings.id).classList.remove("selectedFilter");
  //     } else if (val == "false") {
  //       val = "true";
  //       document.getElementById(settings.id).classList.add('selectedFilter');
  //     }
  //     sessionStorage.setItem(settings.sessionKey, val);
  //   }
  //   fetchChartData();
  // })
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}


function numberConfiguration(labelValue) {
  return Math.abs(Number(labelValue)) >= 1.0e9 // Nine Zeroes for Billions
    ? (Math.abs(Number(labelValue)) / 1.0e9).toFixed(2) + "B"
    : Math.abs(Number(labelValue)) >= 1.0e6 // Six Zeroes for Millions
      ? (Math.abs(Number(labelValue)) / 1.0e6).toFixed(2) + "M"
      : Math.abs(Number(labelValue)) >= 1.0e3 // Three Zeroes for Thousands
        ? (Math.abs(Number(labelValue)) / 1.0e3).toFixed(2) + "K"
        : Math.abs(Number(labelValue));
}
