$('document').ready(function() {

$.getJSON('/testing', (data) => {
  console.dir(data);
  console.dir(data.event.title);
  $('div.title').text(data.event.title);
  $('div.description').text(data.event.description);
  $('div.location').text(data.event.location);
  voteGrid(data)
});




function voteGrid(inputObj) {
  //create a row for each user

  for (let person of inputObj.participants) {
    let $namecard = $('<div>', {class: 'namecard'}).text(person.name);
    let $optionsRow = $('<div>', {class: 'optionsRow'});
    optionBox(person, inputObj, $optionsRow);
    $('<div/>', {
      class: `user-${person.id}`,
    })
    .append($namecard)
    .append($optionsRow)
    .appendTo('.voteBox');
  }
}

function optionBox(targetUser, data, element) {
  let organizerID = data.event.users_id
  for (let option of data.options) {
    if (option.users_id === organizerID) {
      $('<button>', {
        text: `${option.date} at ${option.start_time}`
      })
      .appendTo(element);
    }
  }
}


});
