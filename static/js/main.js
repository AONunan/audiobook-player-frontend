function playTrack(author, book, track, test) {
  // console.log("Track clicked.");
  // console.log("Author:", author);
  // console.log("Book:", book);
  // console.log("Track:", track);

  // console.log(test);

  let trackUri = "http://192.168.1.2/audiobooks/" + author + "/" + book + "/" + track
  let trackUriEncoded = encodeURI(trackUri);

  fetch("http://192.168.1.2:5200/set_current_track", {
    mode: 'no-cors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'author': author,
      'book': book,
      'track': track
    }),
  })

  let trackItems = document.getElementsByClassName("trackItem");
  let i = 0;
  for (i = 0; i < trackItems.length; i++) { trackItems[i].style.color = "white"; }

  document.getElementById(author + "/" + book + "/" + track).style.color = "red";

  // Update current playing display
  document.getElementById("currentlyPlayingAuthor").innerText = author;
  document.getElementById("currentlyPlayingBook").innerText = book;
  document.getElementById("currentlyPlayingTrack").innerText = track;

  // Update media player track
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

function expandCurrentlyPlayingSectionOfLibrary(author, book, track) {
  console.log("Author", author);
  console.log("Book", book);
  console.log("Track", track);

  document.getElementById(author + "_list").style.display = "block";
  document.getElementById(book + "_list").style.display = "block";
  document.getElementById(author + "/" + book + "/" + track).style.color = "red";
}