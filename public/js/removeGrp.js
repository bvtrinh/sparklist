$(document).ready(function() {
  $(".leaveGrp").click(function(e) {
    var id = $(this).attr("id");
    console.log(id);

    $.ajax({
      url: "/group/groupinfo",
      method: "POST",
      data: { id: id },
      dataType: "JSON",
      success: function(data) {
        $("#delID").html(data.id);
        $("#delName").html(data.name);
        $("#delEmail").html(data.email);
      }
    });
  });

  $("#leaveModal").on("click", "#final-del", function(e) {
    e.preventDefault();
    var id = $("#delID").html();

    $.ajax({
      url: "/group/leavegrp/" + id,
      method: "POST",
      success: function(data) {
        $("#leaveModal").modal("hide");
        console.log(data);
        location.reload(true);
      }
    });
  });
});
