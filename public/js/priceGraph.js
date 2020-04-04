$(document).ready(function() {
  const id = $("#itemID").val();

  $.ajax({
    url: "/item/priceHistory",
    method: "POST",
    data: { itemID: id },
    dataType: "JSON",
    success: function(data) {
      graph(data);
    }
  });
});

var itemInfo;

function graph(data) {
  itemInfo = data.results;
  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawBasic);
}

function prepData(graphData) {
  var allData = [];
  for (var i = 0; i < graphData.length; i++) {
    var date = new Date(graphData[i].date);
    allData.push([date, graphData[i].price]);
  }
  return allData;
}

function dataMinMax(graphData) {
  var prices = [];
  for (var i = 0; i < graphData.length; i++) {
    prices[i] = graphData[i].price;
  }

  var min = Math.ceil(Math.min.apply(null, prices)) - 5;
  var max = Math.ceil(Math.max.apply(null, prices)) + 5;

  return { min: min, max: max };
}

function drawBasic() {
  price_hist = itemInfo.price_hist;
  graphData = prepData(price_hist);

  var data = new google.visualization.DataTable();
  data.addColumn("datetime", "Date");
  data.addColumn("number", "Price");
  data.addRows(graphData);

  // Create DateFormat with a timezone offset of -4
  var dateFormat = new google.visualization.DateFormat({
      pattern: "MMM-dd", 
      timeZone: -7
    });
  dateFormat.format(data, 0);

  // format numbers in second column to 5 decimals
  var priceFormat = new google.visualization.NumberFormat({
    prefix: '$'
  });

  priceFormat.format(data, 1);

  var winMinMax = dataMinMax(price_hist);

  var options = {
    hAxis: {
      format: "MMM-dd"
    },
    vAxis: {
      format: "currency",
      gridlines: {
        count: 10
      },
      viewWindowMode: "explicit",
      viewWindow: {
        max: winMinMax.max,
        min: winMinMax.min
      }
    },
    legend: {
      position: "none"
    },
    series: {
      0: {
        type: "steppedArea",
        areaOpacity: 0
      }
    }
  };

  var chart = new google.visualization.SteppedAreaChart(
    document.getElementById("chart_div")
  );

  chart.draw(data, options);
}
