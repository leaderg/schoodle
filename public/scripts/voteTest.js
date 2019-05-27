$('document').ready(function() {

const viewingUserId = $('#viewingUser').attr('class');
const eventSerialID = $('#eventSerial').attr('class');

buildPage();

//Helper functions
function voteGrid(inputObj) {
 for (let person of inputObj.participants) {
    let $namecard = $('<div>', {class: 'namecard'}).text(person.name);
    let $optionsRow = $('<div>', {class: 'optionsRow'});
    optionBox(person, inputObj, $optionsRow);
    $('<div/>', {
      id: `${person.id}`
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
        text: `${option.date} at ${option.start_time}`,
        class: `optionbutton ${option.id} ${option.date} ${option.start_time}`
      })
      .data('optionId', option.id)
      .data('optionDate', option.date)
      .data('optionTime', option.start_time)
      .appendTo(element);
    }
  }
}

function makeGreen(data) {
  const options = data.options;
  options.forEach(option => {
    let elementselector = `div#${option.users_id} div.optionsRow button.${option.date}.${option.start_time}`
    $(elementselector).data('chosen', true).css("background-color", "green");
  });
}
//{id: 7, users_id: "1", events_id: "1", date: "2019-05-11", start_time: "3am"}

function buildPage() {
$.post('/refresh', {
  'eventSerial': `${eventSerialID}`
}, (data) => {
  console.dir(data);
  $('div.title').text(data.event.title);
  $('div.description').text(data.event.description);
  $('div.location').text(data.event.location);
  voteGrid(data)
  makeGreen(data);

  $('.optionbutton').click(function(event) {
    let participant = $(this).parent().parent().attr('id');
    if ((viewingUserId === participant) && (participant !== data.event.users_id) ) {
      console.log(`Clicked`);
      if ($(this).data('chosen') === true) {
        $.post('/optionremove',{
          'users_id': participant,
          'events_id': data.event.events_id,
          'date': $(this).data('optionDate'),
          'start_time': $(this).data('optionTime')
        },
        function() {
          $('.voteBox').empty()
          buildPage();
        })
      } else {
        $.post('/optionchoice',{
          'users_id': participant,
          'events_id': data.event.events_id,
          'date': $(this).data('optionDate'),
          'start_time': $(this).data('optionTime')
        },
        function() {
          $('.voteBox').empty()
          buildPage();
        })
      };
    }
  })
});
}

});
