function setInitialValues(author, book, track, initialTimestamp) {
  // Expand library sections
  document.getElementById(author + "_list").style.display = "block";
  document.getElementById(book + "_list").style.display = "block";

  // Highlight current track in library
  document.getElementById(author).style.color = "red";
  document.getElementById(author + "/" + book).style.color = "red";
  document.getElementById(author + "/" + book + "/" + track).style.color = "red";

  // Set timestamp in media player
  document.getElementById("player").currentTime = initialTimestamp;
}

function playTrack(author, book, track, test) {
  // POST to API to set current track
  fetch("http://192.168.1.2:5200/set_current_track", {
    mode: 'no-cors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'author': author,
      'book': book,
      'track': track,
      'timestamp': 0
    }),
  })

  // Revert all highlighting in library

  let i = 0;
  let labels = [];

  labels = document.getElementsByClassName("authorLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "white"; }

  labels = document.getElementsByClassName("bookLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "white"; }

  labels = document.getElementsByClassName("trackLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "white"; }

  // Highlight currently playing track in library

  document.getElementById(author).style.color = "red";
  document.getElementById(author + "/" + book).style.color = "red";
  document.getElementById(author + "/" + book + "/" + track).style.color = "red";

  // Update current playing display
  document.getElementById("currentlyPlayingAuthor").innerText = author;
  document.getElementById("currentlyPlayingBook").innerText = book;
  document.getElementById("currentlyPlayingTrack").innerText = track;

  // Update media player track
  let trackUri = "http://192.168.1.2/audiobooks/" + author + "/" + book + "/" + track
  let trackUriEncoded = encodeURI(trackUri);

  let player = document.getElementById("player");
  player.src = trackUriEncoded;
  player.play();
}

function showHideSection(id) {
  let section = document.getElementById(id);

  if (section.style.display === "none") {
    section.style.display = "block";
  } else {
    section.style.display = "none";
  }
}


function mediaControls(action) {
  let mediaPlayer = document.getElementById("player");

  switch (action) {
    case "rewind":
      mediaPlayer.currentTime -= 5;
      break;

    case "togglePlayPause":
      if (mediaPlayer.paused) {
        mediaPlayer.play();
      } else {
        mediaPlayer.pause();
      }
      break;

    case "fastForward":
      mediaPlayer.currentTime += 5;
      break;

    default:
      console.log("No matching actions found.");
  }
}

let globalTimestamp = 0;

window.setInterval(function () {

  let mediaPlayer = document.getElementById("player");
  let mediaPlayerTimestamp = Math.floor(mediaPlayer.currentTime);

  if (globalTimestamp === mediaPlayerTimestamp) {
    console.log("Timestamps the same, skipping");
  } else {

    globalTimestamp = Math.floor(mediaPlayer.currentTime);

    let author = document.getElementById("currentlyPlayingAuthor").innerHTML;
    let book = document.getElementById("currentlyPlayingBook").innerHTML;
    let track = document.getElementById("currentlyPlayingTrack").innerHTML;

    fetch("http://192.168.1.2:5200/set_current_track", {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'author': author,
        'book': book,
        'track': track,
        'timestamp': globalTimestamp
      }),
    })
  }

}, 10000); // Loop every 10 seconds


