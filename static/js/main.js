let pauseTimestamp = 0; // The timestamp of when the media player was paused by the user
let currentlyPlaying = {};
let library = {};

document.addEventListener("keydown", function(event) {
  // console.log(event);

  switch (event.key) {

    case "ArrowLeft":
      mediaControls('previousTrack');
      break;

    case "j":
      mediaControls('rewind');
      break;

    case "k":
      mediaControls('togglePlayPause');
      break;

    case "l":
      mediaControls('fastForward');
      break;

    case "ArrowRight":
      mediaControls('nextTrack');
      break;

    default:
      console.log("No matching actions found.");
  }
});


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
  document.getElementById("player").currentTime = initialTimestamp;
  displayCurrentPlayingInfo();

  // Display percent played so far
  displayPercentage();
}

window.setInterval(function () {
  postCurrentTrackInfo();
  displayPercentage();

}, 5000); // Loop every 5 seconds

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

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);

  var hDisplay = h > 0 ? h + " hr " : "";
  var mDisplay = m + " min";
  return hDisplay + mDisplay;
}


function displayPercentage() {
  let mediaPlayer = document.getElementById("player");
  let currentTime = mediaPlayer.currentTime;

  // Get percent complete of current track

  let currentTrackLength = mediaPlayer.duration;
  let trackPercentCompleteUnrounded = currentTime / currentTrackLength * 100;
  let trackPercentComplete = Math.round(trackPercentCompleteUnrounded);

  if (Number.isNaN(trackPercentComplete)) {
    trackPercentComplete = 0;
  }

  document.getElementById("trackProgressBar").style.width = `${trackPercentCompleteUnrounded}%`;
  document.getElementById("trackProgressBarComplete").innerHTML = secondsToHms(currentTime);
  document.getElementById("trackProgressBarPercentage").innerHTML = `${trackPercentComplete}% of ${secondsToHms(currentTrackLength)}`;
  document.getElementById("trackProgressBarRemaining").innerHTML = `-${secondsToHms(currentTrackLength - currentTime)}`;
  
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
  
  document.getElementById("bookProgressBar").style.width = `${bookPercentComplete}%`;
  document.getElementById("bookProgressBarComplete").innerHTML = secondsToHms(totalSecondsComplete);
  document.getElementById("bookProgressBarPercentage").innerHTML = `${bookPercentComplete}% of ${secondsToHms(bookLengthSeconds)}`;
  document.getElementById("bookProgressBarRemaining").innerHTML = `-${secondsToHms(bookLengthSeconds - totalSecondsComplete)}`;
}

function openSidebar() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.pointerEvents = "none";
}

// Set the width of the sidebar to 0 and the left margin of the page content to 0
function closeSidebar() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.pointerEvents = "all";
}

function displayCurrentPlayingInfo() {
  document.getElementById("currentlyPlayingAuthor").innerText = currentlyPlaying["author"];
  document.getElementById("currentlyPlayingBook").innerText = library[currentlyPlaying["author"]][currentlyPlaying["book"]]['book_title'];
  document.getElementById("currentlyPlayingTrack").innerText = currentlyPlaying["track"];
}

// Media control functions

function mediaControls(action) {
  let mediaPlayer = document.getElementById("player");

  switch (action) {

    case "previousTrack":
      playPreviousTrack();
      break;

    case "rewind":
      mediaPlayer.currentTime -= 15; // Skip back 15 seconds
      break;

    case "togglePlayPause":
      togglePlayPause();
      break;

    case "fastForward":
      mediaPlayer.currentTime += 15; // Skip forward 15 seconds
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