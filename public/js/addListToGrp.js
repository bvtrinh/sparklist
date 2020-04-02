$(document).ready(function() {
  $(".addList").click(function(e) {
    const id = $(this).attr("id");

    $.ajax({
      url: "/wishlist/getlists",
      method: "POST",
      data: { groupID: id },
      dataType: "JSON",
      success: function(data) {
        $(".submit-list").attr("id", id);
        $("#wishlists").empty();
        $("#wishlists").append(' <option value="none" selected >None</option>');

        data.results.forEach(function(list) {
          if (list._id === data.currentList) {
            $("#wishlists").append(
              $("<option selected></option>")
                .attr("value", list._id)
                .text(list.name)
            );
          } else {
            $("#wishlists").append(
              $("<option></option>")
                .attr("value", list._id)
                .text(list.name)
            );
          }
        });
      }
    });

    $("#addList").on("click", ".submit-list", function(e) {
      e.preventDefault();
      const groupID = $(this).attr("id");

      const wishlistID = $("#wishlists").val();
      $.ajax({
        url: "/group/addlist",
        method: "POST",
        data: { groupID, wishlistID },
        dataType: "JSON",
        success: function(data) {
          if (data.status === 0) {
            $("#addList").modal("hide");
          }
        }
      });
    });
  });
});
