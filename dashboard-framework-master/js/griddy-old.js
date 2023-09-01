$.fn.griddify = function(options) {
   var defaults = {
      display: "grid",
      gridTemplateColumns: "59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px",
      gridTemplateRows: "59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px 59px",
      backgroundColor: "",
      gap: "17.5px",
      padding: "10px",
   };
   var settings = $.extend( true, {}, defaults, options );
   return this.css({
      display: settings.display,
      gridTemplateColumns: settings.gridTemplateColumns,
      gridTemplateRows: settings.gridTemplateRows,
      backgroundColor: settings.backgroundColor,
      backgroundImage: settings.backgroundImage,
      color: settings.color,
      gap: settings.gap,
      padding: settings.padding
   }); 
};

$.fn.itemize = function(options) {
   var defaults = {
      backgroundColor: "",
      color: "white",
      textAlign: "center",
      padding: "25px 10px 10px",
      borderRadius: "10px"
   };
   

   var settings = $.extend( true, {}, defaults, options );
   var title = settings.title !== undefined ? settings.title : this[0].id;
   this.append("<div class='title'>"+title+"</div>");
   $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
      Object.entries(settings.data).forEach(([key, value]) => {
         widgetHtml = widgetHtml.replace(`[${key}]`,value);
      });
      $(settings.target).append(widgetHtml);
   });

   return this.addClass(settings.widgetType).css({
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
      borderRadius: settings.borderRadius
   })
};

$.fn.appendItem = function(options) {
   var defaults = {
      backgroundColor: "",
      color: "white",
      textAlign: "center",
      padding: "18px 18px 18px 18px",
      borderRadius: "10px"
   };
   var settings = $.extend( true, {}, defaults, options );
   var list = settings.gridArea.split("/")
   var numArray=[+list[0],+list[1],+list[2],+list[3]]
   var gridWidthDiff=numArray[3]-numArray[1]
   var gridHeightDiff=numArray[2]-numArray[0]
   var size

   var title = settings.title !== undefined ? settings.title : settings.target;
   if(gridWidthDiff>gridHeightDiff){
      if(settings.widgetType == "data-count") {
         size=((gridHeightDiff*4)+6)+'px';
      }else{
         // size=((gridHeightDiff*3)+5)+'px;
         size=20+'px';
      }
   }else{
      if(settings.widgetType == "data-count") {
         size=((gridWidthDiff*4)+6)+'px';
      }else{
         // size=((gridWidthDiff*3)+5)+'px';
         size=20+'px';
      }
   }
   
   
   this.append("<div id='" + settings.target.substring(1) +"'></div>");
   var elementHtml = "<div class='title "+settings.widgetType+"title"+"' style=font-size:"+size+">"+title+"</div>"
   
   if(settings.widgetType == "bar-chart") {
      $(settings.target).append(elementHtml);
      var chart = new dc.BarChart(settings.target);
      var data = crossfilter(settings.chart.data);
      var width = gridWidthDiff * 59;
      var height = gridHeightDiff * 59;

      var dimension = data.dimension(function(d) {
         return d.month;
      });
      var group = dimension.group().reduceSum(function(d) {
         return d.revenue;
      })

      chart
         .width(width)
         .height(height)
         .margins({top: 20, right: 10, bottom: 60, left: 40})
         .dimension(dimension)
         .group(group)
         .x(d3.scaleOrdinal().domain(dimension))
         .ordinalColors(settings.chart.colors)
         .xUnits(dc.units.ordinal)
         .brushOn(false)
         .centerBar(false)
         .gap(20)
         .render();
   }
   else if(settings.widgetType == "line-chart") {
      $(settings.target).append(elementHtml);
      var chart = new dc.LineChart(settings.target);
      var data = crossfilter(settings.chart.data);
      var width = (gridWidthDiff) * 59;
      var height = (gridHeightDiff) * 59;

      var dimension = data.dimension(function(d) {
         return d.month;
      });
      var group = dimension.group().reduceSum(function(d) {
         return d.revenue;
      })

      chart
         .width(width)
         .height(height)
         .margins({top: 20, right: 10, bottom: 60, left: 40})
         .dimension(dimension)
         .group(group)
         .curve(d3.curveCardinal.tension(0.5))
         .renderDataPoints({radius: 5, fillOpacity: 0.8, strokeOpacity: 0.0})
         .x(d3.scaleOrdinal().domain(dimension)) // Need the empty val to offset the first value
         .xUnits(dc.units.ordinal) // Tell Dc.js that we're using an ordinal x axis
         .y(d3.scaleLinear().domain([50, 4000]))
         .colors(d3.scaleOrdinal().range(settings.chart.colors))
         .brushOn(false)
         .on('renderlet', function(chart) {
            chart.selectAll('rect').on('click', function(d) {
            });
         });
      chart.yAxis().ticks(4);
      chart.render();
   }
   else if(settings.widgetType == "pie-chart") {
      $(settings.target).append(elementHtml);
      var chart = new dc.PieChart(settings.target);
      var data = crossfilter(settings.chart.data);
      var width = gridWidthDiff* 59;
      var height = (gridHeightDiff* 59) - 30;

      var dimension = data.dimension(function(d) {
         return d.key;
      });
      var group = dimension.group().reduceSum(function(d) {
         return d.value;
      });
      
      chart
         .width(width)
         .height(height)
         .dimension(dimension)
         .group(group)
         // .cy(gridHeightDiff*(18+(4*gridHeightDiff))-3*gridHeightDiff+1.5)
         // .cy((32.5*gridHeightDiff)-15.5)
         .transitionDuration(2000)
         .colors(d3.scaleOrdinal().range(settings.chart.colors))
         .innerRadius(30)
         // .radius(50)
         .legend(dc.legend()
         .itemHeight(20)
         .legendText(function(d) {
            return d.name + ' (' + d.data + ')';
         }))
         .render();
   }
   else if(settings.widgetType == "bubble-chart") {
      console.log(settings.widgetType);
      $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
         elementHtml = elementHtml + widgetHtml;
         elementHtml = elementHtml + "</div>";
         $(settings.target).append(elementHtml);
         var chart = new dc.PieChart(settings.target);
         var data = crossfilter(settings.chart.data);
         var width = gridWidthDiff* 50;
         var height = (gridHeightDiff* 50) - 30;

         var dimension = data.dimension(function(d) {
            return d.key;
         });
         var group = dimension.group().reduceSum(function(d) {
            return d.value;
         });
         
         chart
            .width(width)
            .height(height)
            .dimension(dimension)
            .group(group)
            // .cy(gridHeightDiff*(18+(4*gridHeightDiff))-3*gridHeightDiff+1.5)
            // .cy((32.5*gridHeightDiff)-15.5)
            .transitionDuration(2000)
            .colors(d3.scaleOrdinal().range(settings.chart.colors))
            .innerRadius(10)
            .radius(50)
            .legend(dc.legend()
            .itemHeight(20)
            .legendText(function(d) {
               return d.name + ' (' + d.data + ')';
            }))
            .render();
      });
      // $(settings.target).append(elementHtml);
      
   }
   else if(settings.widgetType == "data-count") {
      $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
         dataCount(settings,widgetHtml,gridHeightDiff,gridWidthDiff,elementHtml)
         
      });
   }
   else if(settings.widgetType == "global-chart"){
      console.log(settings.widgetType);
      $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
         elementHtml = elementHtml + widgetHtml;
         elementHtml = elementHtml + "</div>";
         $(settings.target).append(elementHtml);
      });
      
   }
   else if(settings.widgetType == "titlebar"){
      $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
         elementHtml = elementHtml + widgetHtml;
         elementHtml = elementHtml + "</div>";
         $(settings.target).append(elementHtml);
      });
   }
   else{
         $.get("widgets/"+settings.widgetType+".html", function (widgetHtml) {
         Object.entries(settings.data).forEach(([key, value]) => {
               widgetHtml = widgetHtml.replace(`[${key}]`,value);
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
      borderRadius: settings.borderRadius
   });

   return this;
};



function dataCount(settings,widgetHtml,gridHeightDiff,gridWidthDiff,elementHtml) {
   Object.entries(settings.data).forEach(([key, value]) => {
      let num
      if(value>-1 && key=='percentage'){
         num="+"+numberConfiguration(value)
         widgetHtml = widgetHtml.replace("$image", "./images/Polygon 1.svg");
         widgetHtml = widgetHtml.replace("$3", "up");
      }else if(value<0 && key=='percentage'){
         num="-"+numberConfiguration(value)
         widgetHtml = widgetHtml.replace("$image", "./images/Polygon 4.svg");
         widgetHtml = widgetHtml.replace("$3", "down");
      }else{
         num=numberConfiguration(value)
      }
      settings.target=="#orders-shipped"?widgetHtml = widgetHtml.replace("$4", "%"):
      (widgetHtml = widgetHtml.replace("$4", "")) 
      widgetHtml = widgetHtml.replace("$1Data", settings.target.substring(1));
      widgetHtml = widgetHtml.replace("$2", settings.target.substring(1));
      widgetHtml = widgetHtml.replace("$2Data", settings.target.substring(1));
      widgetHtml = widgetHtml.replace(`[${key}]`, num);
   });
   elementHtml = elementHtml + widgetHtml;
   elementHtml = elementHtml + "</div>";
   $(settings.target).append(elementHtml);
   if(gridWidthDiff>gridHeightDiff){
      document.querySelector("."+settings.target.substring(1) +'filter-count').style.fontSize = ((gridHeightDiff*7)+18)+'px';
      document.querySelector("."+settings.target.substring(1) +'up').style.fontSize = ((gridHeightDiff*3)+6)+'px';
      document.querySelector("."+settings.target.substring(1) +'up').style.padding = (gridHeightDiff*3)+'px';
      document.querySelector("."+settings.target.substring(1) +'upIndicator').style.width = (gridHeightDiff*3+9)+'px';
      document.querySelector("." + settings.target.substring(1) + "upIndicator").style.padding = gridHeightDiff * 3 + "px";
   }else{
      document.querySelector("."+settings.target.substring(1) +'filter-count').style.fontSize = ((gridWidthDiff*7)+11)+'px';
      document.querySelector("."+settings.target.substring(1) +'up').style.fontSize = ((gridWidthDiff*2)+6)+'px';
      document.querySelector("."+settings.target.substring(1) +'up').style.padding = (gridWidthDiff*2)+'px';
      document.querySelector("."+settings.target.substring(1) +'upIndicator').style.width = (gridWidthDiff*2+8)+'px';
      document.querySelector("." + settings.target.substring(1) + "upIndicator").style.padding = gridWidthDiff * 2 + "px";
   }
};

function numberConfiguration (labelValue) {
   return Math.abs(Number(labelValue)) >= 1.0e+9// Nine Zeroes for Billions
   ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
   : Math.abs(Number(labelValue)) >= 1.0e+6 // Six Zeroes for Millions
   ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
   : Math.abs(Number(labelValue)) >= 1.0e+3 // Three Zeroes for Thousands
   ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"
   : Math.abs(Number(labelValue));
}