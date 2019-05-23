$(() => {
  $.ajax({
    method: "GET",
    url: "/api/users"
  }).done((users) => {
    for(user of users) {
      $("<div>").text(user.name).appendTo($("body"));
    }

  });
  $('.date').datepicker({
  multidate: true,
  format: 'yyyy-mm-dd'
  });
});

