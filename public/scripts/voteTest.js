$('document').ready(function() {

    $.getJSON('/testing', (data) => {
    console.dir(data);
    console.dir(data.event.title);
    $('div').text(data.event.title);
   });
});
