let pauseTimestamp = 0; // The timestamp of when the media player was paused by the user
let currentlyPlaying = {};
let library = {};

function setInitialValues(author, book, track, initialTimestamp, myLibrary) {
  // Set global values
  currentlyPlaying["author"] = author;
  currentlyPlaying["book"] = book;
  currentlyPlaying["track"] = track;
  library = myLibrary;

  // Expand library sections
  document.getElementById(`${author}_list`).style.display = "block";
  document.getElementById(`${author}/${book}_list`).style.display = "block";

  // Highlight current track in library
  document.getElementById(author).style.color = "white";
  document.getElementById(`${author}/${book}`).style.color = "white";
  document.getElementById(`${author}/${book}/${track}`).style.color = "white";

  // Set timestamp in media player
  document.getElementById("player").currentTime = initialTimestamp; // Rewind 10 seconds from saved time
  displayCurrentPlayingInfo();

  // Display percent played so far
  displayPercentage();
}

window.setInterval(function () {
  postCurrentTrackInfo();
  displayPercentage();

}, 10000); // Loop every 10 seconds

function playTrack(author, book, track) {
  // Update global values
  currentlyPlaying["author"] = author;
  currentlyPlaying["book"] = book;
  currentlyPlaying["track"] = track;

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
  document.getElementById(`${author}/${book}`).style.color = "white";
  document.getElementById(`${author}/${book}/${track}`).style.color = "white";

  // Update current playing display
  document.getElementById("footer").style.display = "block";
  displayCurrentPlayingInfo();
  displayPercentage();

  // Update play pause button
  document.getElementById("playPauseButton").innerHTML = "⏸️";

  // Update media player track
  let trackUri = `http://192.168.1.2/audiobooks/${author}/${book}/${track}`
  let trackUriEncoded = encodeURI(trackUri);

  let player = document.getElementById("player");
  player.src = trackUriEncoded;
  player.play();

}



function getCurrentTrackNumber() {
  let currentTrackNumber = -1; // Currently unknown

  let i = 0;
  let tracks = library[currentlyPlaying["author"]][currentlyPlaying["book"]]['tracks'];

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i]['track_filename'] === currentlyPlaying["track"]) {
      currentTrackNumber = tracks[i]['track_number'];
      break;
    }
  }

  return currentTrackNumber;
}

// API functions

function postCurrentTrackInfo() {
  let mediaPlayer = document.getElementById("player");
  let mediaPlayerTimestamp = Math.floor(mediaPlayer.currentTime);

  if (currentlyPlaying["timestamp"] === mediaPlayerTimestamp) {
    console.log("Timestamps the same, skipping");
  } else {

    currentlyPlaying["timestamp"] = Math.floor(mediaPlayer.currentTime);

    fetch("http://192.168.1.2:5200/set_current_track", {
      mode: 'no-cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentlyPlaying),
    })
  }
}

// UI functions

function showHideSection(id) {
  let section = document.getElementById(id);

  if (section.style.display === "none") {
    section.style.display = "block";
  } else {
    section.style.display = "none";
  }
}

function displayPercentage() {
  let mediaPlayer = document.getElementById("player")
  let currentTime = mediaPlayer.currentTime;

  // Get percent complete of current track

  let currentTrackLength = mediaPlayer.duration;
  let trackPercentComplete = Math.round(currentTime / currentTrackLength * 100);

  if (Number.isNaN(trackPercentComplete)) {
    trackPercentComplete = 0;
  }

  // Get total percentage complete of book

  let totalSecondsComplete = 0;
  let bookLengthSeconds = library[currentlyPlaying["author"]][currentlyPlaying["book"]]["book_length_seconds"];
  let i = 0;
  let tracks = library[currentlyPlaying["author"]][currentlyPlaying["book"]]['tracks'];
  
  for (i = 0; i < tracks.length; i++) {
    // Sum up all track lengths until we get to current track
    if (tracks[i]['track_filename'] === currentlyPlaying["track"]) {
      // Add the current track progress and break out of loop
      totalSecondsComplete += currentTime;
      break;
    } else {
      totalSecondsComplete += tracks[i]['track_length_seconds'];
    }
  }

  let bookPercentComplete = Math.round(totalSecondsComplete / bookLengthSeconds * 100);
  
  document.getElementById("trackPercentComplete").innerHTML = `Track progress: ${trackPercentComplete}%. Book progress: ${bookPercentComplete}%.`;
}

function openSidebar() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.pointerEvents = "none";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeSidebar() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.pointerEvents = "all";
}

function displayCurrentPlayingInfo() {
  document.getElementById("currentlyPlayingAuthor").innerText = currentlyPlaying["author"];
  document.getElementById("currentlyPlayingBook").innerText = currentlyPlaying["book"];
  document.getElementById("currentlyPlayingTrack").innerText = currentlyPlaying["track"];
}

// Media control functions

function mediaControls(action) {
  let mediaPlayer = document.getElementById("player");

  switch (action) {

    case "togglePlayPause":
      togglePlayPause();
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
      playPreviousTrack();
      break;

    case "nextTrack":
      playNextTrack();
      break;


    default:
      console.log("No matching actions found.");
  }

  displayPercentage();
}

function playPreviousTrack() {
  let mediaPlayer = document.getElementById("player");

  if (mediaPlayer.currentTime < 10) { // If under 10 seconds into track, switch to previous track
    let currentTrackNumber = getCurrentTrackNumber();

    if (currentTrackNumber > 0) { // Check if we're already on the first track
      let previousTrack = library[currentlyPlaying["author"]][currentlyPlaying["book"]]['tracks'][currentTrackNumber - 1]['track_filename'];
      playTrack(currentlyPlaying["author"], currentlyPlaying["book"], previousTrack);
    } else {
      console.log('Already on first track. Not changing.');
    }
  } else { // If 10 seconds or more into track, reset time to 0 but stay on same track
    mediaPlayer.currentTime = 0;
  }

}

function playNextTrack() {
  let currentTrackNumber = getCurrentTrackNumber();

  if (currentTrackNumber != library[currentlyPlaying["author"]][currentlyPlaying["book"]]['tracks'].length - 1) { // Check if we're already on the last track
    let nextTrack = library[currentlyPlaying["author"]][currentlyPlaying["book"]]['tracks'][currentTrackNumber + 1]['track_filename'];
    playTrack(currentlyPlaying["author"], currentlyPlaying["book"], nextTrack);
  } else {
    console.log('Already on last track. Not changing.');
  }


}

function togglePlayPause() {
  let mediaPlayer = document.getElementById("player");
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

}