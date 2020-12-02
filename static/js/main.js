let timestampSentToAPI = 0; // To be compared against the timestamp of the media player. If different, will be sent to the API
let pauseTimestamp = 0; // The timestamp of when the media player was paused by the user
let currentlyPlayingAuthor = "";
let currentlyPlayingBook = "";
let currentlyPlayingTrack = "";

function setInitialValues(author, book, track, initialTimestamp) {
  // Set global values
  currentlyPlayingAuthor = author;
  currentlyPlayingBook = book;
  currentlyPlayingTrack = track;

  // Expand library sections
  document.getElementById(author + "_list").style.display = "block";
  document.getElementById(author + "/" + book + "_list").style.display = "block";

  // Highlight current track in library
  document.getElementById(author).style.color = "white";
  document.getElementById(author + "/" + book).style.color = "white";
  document.getElementById(author + "/" + book + "/" + track).style.color = "white";

  // Set timestamp in media player
  document.getElementById("player").currentTime = initialTimestamp; // Rewind 10 seconds from saved time
}

function playTrack(author, book, track) {
  // Revert all highlighting in library

  let i = 0;
  let labels = [];

  labels = document.getElementsByClassName("authorLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "rgb(180, 180, 180)"; }

  labels = document.getElementsByClassName("bookLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "rgb(180, 180, 180)"; }

  labels = document.getElementsByClassName("trackLabel");
  for (i = 0; i < labels.length; i++) { labels[i].style.color = "rgb(180, 180, 180)"; }

  // Highlight currently playing track in library

  document.getElementById(author).style.color = "white";
  document.getElementById(author + "/" + book).style.color = "white";
  document.getElementById(author + "/" + book + "/" + track).style.color = "white";

  // Update current playing display
  document.getElementById("footer").style.display = "block";
  document.getElementById("currentlyPlayingAuthor").innerText = author;
  document.getElementById("currentlyPlayingBook").innerText = book;
  document.getElementById("currentlyPlayingTrack").innerText = track;

  // Update global values
  currentlyPlayingAuthor = author;
  currentlyPlayingBook = book;
  currentlyPlayingTrack = track;

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


function mediaControls(action, library) {
  let mediaPlayer = document.getElementById("player");
  let currentTrackNumber = -1;

  switch (action) {

    case "togglePlayPause":

      let playPauseButton = document.getElementById("playPauseButton");

      if (mediaPlayer.paused) {
        mediaPlayer.play();

        let timeSinceLastPause = Date.now() / 1000 - pauseTimestamp; // Check how long it's been since the media player was paused
        let rewindAmount = 0;

        if (timeSinceLastPause > 20) {
          rewindAmount = 20; // Rewind by a maximum of 20 seconds
        } else {
          rewindAmount = timeSinceLastPause;
        }

        console.log("Rewinding media player by:", rewindAmount, "seconds");
        mediaPlayer.currentTime -= rewindAmount;
        playPauseButton.innerHTML = "⏸️";

      } else {
        mediaPlayer.pause();
        pauseTimestamp = Date.now() / 1000; // Log the time the media player was paused
        playPauseButton.innerHTML = "▶️";
      }

      break;

    case "stop":
      mediaPlayer.pause();
      document.getElementById("playPauseButton").innerHTML = "▶️";

      document.getElementById("footer").style.display = "none";
      break;


    case "rewind":
      mediaPlayer.currentTime -= 15; // Skip back 15 seconds
      break;

    case "fastForward":
      mediaPlayer.currentTime += 15; // Skip forward 15 seconds
      break;


    case "rewind10Percent":
      mediaPlayer.currentTime -= (mediaPlayer.duration / 10);
      break;

    case "fastForward10Percent":
      mediaPlayer.currentTime += (mediaPlayer.duration / 10);
      break;


    case "previousTrack":
      if (mediaPlayer.currentTime < 10) { // If under 10 seconds into track, switch to previous track
        currentTrackNumber = getCurrentTrackNumber(library);

        if (currentTrackNumber > 0) { // Check if we're already on the first track
          let previousTrack = library[currentlyPlayingAuthor][currentlyPlayingBook]['tracks'][currentTrackNumber - 1]['track_filename'];
          playTrack(currentlyPlayingAuthor, currentlyPlayingBook, previousTrack);
        } else {
          console.log('Already on first track. Not changing.');
        }
      } else { // If 10 seconds or more into track, reset time to 0 but stay on same track
        mediaPlayer.currentTime = 0;
      }

      break;

    case "nextTrack":
      currentTrackNumber = getCurrentTrackNumber(library);

      if (currentTrackNumber != library[currentlyPlayingAuthor][currentlyPlayingBook]['tracks'].length - 1) { // Check if we're already on the last track
        let nextTrack = library[currentlyPlayingAuthor][currentlyPlayingBook]['tracks'][currentTrackNumber + 1]['track_filename'];
        playTrack(currentlyPlayingAuthor, currentlyPlayingBook, nextTrack);
      } else {
        console.log('Already on last track. Not changing.');
      }

      break;

    default:
      console.log("No matching actions found.");
  }
}

function getCurrentTrackNumber(library) {
  let currentTrackNumber = -1; // Currently unknown

  let i = 0;
  let tracks = library[currentlyPlayingAuthor][currentlyPlayingBook]['tracks'];

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i]['track_filename'] === currentlyPlayingTrack) {
      currentTrackNumber = tracks[i]['track_number'];
      break;
    }
  }

  return currentTrackNumber;

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


function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.pointerEvents = "none";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.pointerEvents = "all";
}