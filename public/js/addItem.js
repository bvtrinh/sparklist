$(document).ready(() => {
  $("#item_url").change(() => {
    const url = $("#item_url").val();

    $.ajax({
      url: "/item/process",
      dataType: "JSON",
      data: url,
      success: data => {
        console.log(data);
      }
    });
  });
});
