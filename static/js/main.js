let timestampSentToAPI = 0; // To be compared against the timestamp of the media player. If different, will be sent to the API
let pauseTimestamp = 0; // The timestamp of when the media player was paused by the user



function setInitialValues(author, book, track, initialTimestamp) {
  // Expand library sections
  document.getElementById(author + "_list").style.display = "block";
  document.getElementById(author + "/" + book + "_list").style.display = "block";

  // Highlight current track in library
  document.getElementById(author).style.color = "red";
  document.getElementById(author + "/" + book).style.color = "red";
  document.getElementById(author + "/" + book + "/" + track).style.color = "red";

  // Set timestamp in media player
  document.getElementById("player").currentTime = initialTimestamp - 10; // Rewind 10 seconds from saved time
}

function playTrack(author, book, track, test) {
  // Revert all highlighting in library

  let i = 0;
  let labels = [];

  labels = document.getElementsByClassName("authorLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "white"; }

  labels = document.getElementsByClassName("bookLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "white"; }

  labels = document.getElementsByClassName("trackLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "rgb(180, 180, 180)";; }

  // Highlight currently playing track in library

  document.getElementById(author).style.color = "red";
  document.getElementById(author + "/" + book).style.color = "red";
  document.getElementById(author + "/" + book + "/" + track).style.color = "red";

  // Update current playing display
  document.getElementById("currentlyPlayingAuthor").innerText = author;
  document.getElementById("currentlyPlayingBook").innerText = book;
  document.getElementById("currentlyPlayingTrack").innerText = track;

  // Update play pause button
  document.getElementById("playPauseButton").innerHTML = "⏸️";

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
      mediaPlayer.currentTime -= 10;
      break;

    case "togglePlayPause":

      let playPauseButton = document.getElementById("playPauseButton");

      if (mediaPlayer.paused) {
        mediaPlayer.play();

        if (pauseTimestamp != 0) {
          let timeSinceLastPause = Date.now() / 1000 - pauseTimestamp; // Check how long it's been since the media player was paused
          let rewindAmount = 0;

          if (timeSinceLastPause > 20) {
            rewindAmount = 10; // Rewind by a maximum of 10 seconds
          } else {
            rewindAmount = timeSinceLastPause / 2;
          }

          console.log("Rewinding media player by:", rewindAmount, "seconds");
          mediaPlayer.currentTime -= rewindAmount;
        }
        playPauseButton.innerHTML = "⏸️";
        
      } else {
        mediaPlayer.pause();
        pauseTimestamp = Date.now() / 1000; // Log the time the media player was paused
        playPauseButton.innerHTML = "▶️";
      }

      break;

    case "fastForward":
      mediaPlayer.currentTime += 10;
      break;

    default:
      console.log("No matching actions found.");
  }
}


window.setInterval(function () {

  let mediaPlayer = document.getElementById("player");
  let mediaPlayerTimestamp = Math.floor(mediaPlayer.currentTime);

  if (timestampSentToAPI === mediaPlayerTimestamp) {
    console.log("Timestamps the same, skipping");
  } else {

    timestampSentToAPI = Math.floor(mediaPlayer.currentTime);

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
        'timestamp': timestampSentToAPI
      }),
    })
  }

}, 10000); // Loop every 10 seconds


