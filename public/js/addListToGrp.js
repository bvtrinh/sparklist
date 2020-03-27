$(document).ready(function() {
  $("#addListToGrp").click(function(e) {
    const email = $("#useremail").val();

    $.ajax({
      url: "/wishlist/getlists",
      method: "POST",
      data: { email: email },
      dataType: "JSON",
      success: function(data) {
        console.log(data);
      }
    });
  });
});
