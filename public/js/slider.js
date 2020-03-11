$(document).ready(function() {
  $("#slider-range").slider({
    range: true,
    min: 0,
    max: 500,
    values: [0, 500],
    slide: function(event, ui) {
      $("#min-price").val(ui.values[0]);
      $("#max-price").val(ui.values[1]);
    }
  });

  // Initial values
  $("#min-price").val($("#slider-range").slider("values", 0));
  $("#max-price").val($("#slider-range").slider("values", 1));

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
});