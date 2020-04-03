$(document).ready(function() {
  $.ajax({
    url: "/item/max-price",
    method: "GET",
    success: function(data) {
      slider(data.max_price + 1);
    }
  });

  function slider(max_price) {
    var min = parseInt($("#min-price").val());
    var max = parseInt($("#max-price").val());
    $("#slider-range").slider({
      range: true,
      min: 0,
      max: max_price,
      values: [min, max],
      slide: function(event, ui) {
        $("#min-price").val(ui.values[0]);
        $("#max-price").val(ui.values[1]);
      }
    });
    // Initial values
    $("#slider-range").slider("values", 0, $("#min-price").val());
    $("#slider-range").slider("values", 1, $("#max-price").val());

    $("#min-price").change(function() {
      var max = $("#max-price").val();
      var min = $("#min-price").val();
      if (min > max) {
        $("#min-price").val(max);
      }
      $("#slider-range").slider("values", 0, $("#min-price").val());
    });

    $("#max-price").change(function() {
      var max = $("#max-price").val();
      var min = $("#min-price").val();
      if (max < min) {
        $("#max-price").val(min);
      }
      $("#slider-range").slider("values", 1, $("#max-price").val());
    });
  }
});
