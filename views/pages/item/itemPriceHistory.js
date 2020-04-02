// // $(document).ready(function() {
// //     const id = $("#itemID").val();

// //     $.ajax({
// //       url: "/item/priceHistory",
// //       method: "POST",
// //       data: { itemID: id },
// //       dataType: "JSON",
// //       success: function(data) {graph(data)}
// //       });
// //     });
  
//     var itemInfo;

//     function graph(data)
//     {
//       itemInfo = data.results;
//       // console.log(data)
//       google.charts.load('current', {'packages':['corechart']});
//       google.charts.setOnLoadCallback(drawBasic);
//     }
    
//     function drawBasic() {


//       console.log(itemInfo);
//       console.log(itemInfo.price_hist[0].price);
//       console.log(typeof itemInfo.price_hist[0].date);

//       price_hist = itemInfo.price_hist;
      
//       var data = new google.visualization.DataTable();
//       data.addColumn('number', 'X');
//       data.addColumn('number', 'Price');

//       data.addRows([[1,5], [1, 1],[4,7] ,[7, 4]
//       ]);

//       var options = {
//       hAxis: {
//       title: 'Date'
//       },
//       vAxis: {
//       title: 'Price'
//     }
//       };

//     var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

//     chart.draw(data, options);
//     }