/* ══════════════════════════════════════════════════════════════
   Zuno — voice-controlled music assistant (v6; moved out of the v5 template)
   Logic unchanged: Web Speech API → POST /zuno/process_audio/ → Zeno extension.
   ══════════════════════════════════════════════════════════════ */
const micBtn = document.getElementById('micBtn');
const micContainer = document.getElementById('micContainer');
const statusText = document.getElementById('statusText');
const transcriptionText = document.getElementById('transcriptionText');
const resultsContainer = document.getElementById('resultsContainer');
const songList = document.getElementById('songList');
const resultsTitle = document.getElementById('resultsTitle');
const toast = document.getElementById('toast');

// Zuno Music Player DOM Elements
const zunoMusicPlayer = document.getElementById('zuno-music-player');
const zunoTrackTitle = document.getElementById('zuno-track-title');
const zunoArtistName = document.getElementById('zuno-artist-name');
const zunoAlbumArt = document.getElementById('zuno-album-art');
const zunoVolumeBars = document.getElementById('zuno-volume-bars');
const zunoCurrentTime = document.getElementById('zuno-current-time');
const zunoRemainingTime = document.getElementById('zuno-remaining-time');
const zunoProgressFill = document.getElementById('zuno-progress-fill');

const zunoBtnPrev = document.getElementById('zuno-btn-prev');
const zunoBtnSkipBack = document.getElementById('zuno-btn-skip-back');
const zunoBtnPlayPause = document.getElementById('zuno-btn-play-pause');
const zunoBtnSkipForward = document.getElementById('zuno-btn-skip-forward');
const zunoBtnNext = document.getElementById('zuno-btn-next');
const zunoBtnRadar = document.getElementById('zuno-btn-radar');

const EXTENSION_ID = "egobkkfkdjagkggbpfkadhfknjeofjab";
let isListening = false;
let musicStatusInterval = null;

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    showToast("Speech Recognition API not supported in this browser.");
    micBtn.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isListening = true;
        micContainer.classList.add('listening');
        statusText.innerText = "Listening...";
        transcriptionText.innerText = "";
        resultsContainer.style.display = 'none';
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim();

        if (!transcript) {
            statusText.innerText = "Tap to speak";
            transcriptionText.innerText = "";
            return;
        }

        transcriptionText.innerText = `"${transcript}"`;
        statusText.innerText = "Processing...";

        // Send to backend
        processAudio(transcript);
    };

    recognition.onerror = function(event) {
        isListening = false;
        micContainer.classList.remove('listening');

        if (event.error === 'no-speech' || event.error === 'aborted') {
            statusText.innerText = "Tap to speak";
            transcriptionText.innerText = "";
        } else {
            statusText.innerText = "Error capturing audio.";
            showToast(`Error: ${event.error}`);
        }
    };

    recognition.onend = function() {
        isListening = false;
        micContainer.classList.remove('listening');
        if (statusText.innerText === "Listening...") {
            statusText.innerText = "Tap to speak";
        }
    };

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
}

let currentPlatform = 'yt_music';

document.querySelectorAll('.platform-link').forEach(link => {
    link.addEventListener('click', (e) => {
        document.querySelectorAll('.platform-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        currentPlatform = link.getAttribute('data-platform');
    });
});

async function processAudio(text) {
    try {
        const response = await fetch('/zuno/process_audio/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, platform: currentPlatform })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Unknown error occurred');
        }

        statusText.innerText = "Done!";

        if (data.intent === 'play_song' || data.status === 'play_extension') {
            showToast(data.message || "Playing song...");
            zunoMusicPlayer.style.display = 'flex';
            resultsContainer.style.display = 'none';

            if (data.url) {
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    try {
                        chrome.runtime.sendMessage(EXTENSION_ID, { action: "play_music", url: data.url }, response => {
                            if (chrome.runtime.lastError || !response || !response.success) {
                                window.location.href = data.url;
                            } else {
                                setTimeout(startPollingMusicStatus, 1500);
                            }
                        });
                    } catch (e) {
                        window.location.href = data.url;
                    }
                } else {
                    window.location.href = data.url;
                }
            }
        } else if (data.intent === 'search_artist') {
            zunoMusicPlayer.style.display = 'none';
            displayResults(data.query, data.results);
        }

                } catch (error) {
        console.error('Error:', error);

        let friendlyMsg = "I couldn't quite connect. Please try again.";
        if (error.message.includes("No text provided") || error.message.includes("Failed to parse")) {
            friendlyMsg = "I didn't quite catch that. Try speaking a bit louder or more clearly.";
        } else if (error.message.includes("All models failed")) {
            friendlyMsg = "The AI routing engine is currently experiencing high load. Retrying in a moment should work.";
        } else if (error.message.includes("API Key") || error.message.includes("log in")) {
            friendlyMsg = error.message;
        }

        statusText.innerText = "Failed.";
        showErrorCard(friendlyMsg);
        showToast(friendlyMsg);
    }
}

function displayResults(query, results) {
    resultsContainer.style.display = 'block';
    resultsTitle.innerText = `Search Results for "${query}"`;

    songList.innerHTML = '';

    if (!results || results.length === 0) {
        songList.innerHTML = '<li class="song-item"><div class="song-title">No results found.</div></li>';
        return;
    }

    results.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'song-title';
        titleDiv.innerText = song.title;

        const artistDiv = document.createElement('div');
        artistDiv.className = 'song-artist';
        artistDiv.innerText = song.artists;

        li.appendChild(titleDiv);
        li.appendChild(artistDiv);
        songList.appendChild(li);
    });
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateMusicCardUI(data) {
    zunoTrackTitle.textContent = data.title || "Say play [song]";
    zunoArtistName.textContent = data.artist || "to start playing";

    if (data.albumArt) {
        zunoAlbumArt.style.backgroundImage = `url(${data.albumArt})`;
        zunoAlbumArt.style.backgroundSize = "cover";
        zunoAlbumArt.style.backgroundPosition = "center";
    } else {
        zunoAlbumArt.style.backgroundImage = "linear-gradient(135deg, #5b7247, #353b30)";
    }

    const iconPlay = zunoBtnPlayPause.querySelector(".icon-play");
    const iconPause = zunoBtnPlayPause.querySelector(".icon-pause");

    if (data.paused) {
        iconPlay.classList.remove("hidden");
        iconPause.classList.add("hidden");
        zunoVolumeBars.classList.add("paused");
    } else {
        iconPlay.classList.add("hidden");
        iconPause.classList.remove("hidden");
        zunoVolumeBars.classList.remove("paused");
    }

    const curTime = data.currentTime || 0;
    const durTime = data.duration || 0;
    zunoCurrentTime.textContent = formatTime(curTime);
    zunoRemainingTime.textContent = durTime > 0 ? `-${formatTime(durTime - curTime)}` : "-0:00";

    if (durTime > 0) {
        zunoProgressFill.style.width = `${(curTime / durTime) * 100}%`;
    } else {
        zunoProgressFill.style.width = "0%";
    }
}

function startPollingMusicStatus() {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;
    if (musicStatusInterval) clearInterval(musicStatusInterval);

    zunoMusicPlayer.style.display = "flex";

    pollMusicStatus();
    musicStatusInterval = setInterval(pollMusicStatus, 1000);
}

function stopPollingMusicStatus() {
    if (musicStatusInterval) {
        clearInterval(musicStatusInterval);
        musicStatusInterval = null;
    }
}

function pollMusicStatus() {
    try {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "get_music_status" }, (response) => {
            if (chrome.runtime.lastError) {
                return;
            }
            if (response && response.success && response.data) {
                updateMusicCardUI(response.data);
            }
        });
    } catch (e) {
        // Ignore
    }
}

// Initialize control listeners
if (typeof chrome !== 'undefined' && chrome.runtime) {
    zunoBtnPrev.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "previous" });
    });
    zunoBtnSkipBack.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "skip_backward" });
    });
    zunoBtnPlayPause.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "toggle_play" });
    });
    zunoBtnSkipForward.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "skip_forward" });
    });
    zunoBtnNext.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "next" });
    });
    zunoBtnRadar.addEventListener("click", () => {
        chrome.runtime.sendMessage(EXTENSION_ID, { action: "control_music", command: "focus_tab" });
    });

    // Check status if tab query contains music pages already
    chrome.runtime.sendMessage(EXTENSION_ID, { action: "get_music_status" }, (response) => {
        if (response && response.success) {
            startPollingMusicStatus();
        }
    });
} else {
    zunoBtnRadar.style.display = 'none';
}

const errorCard = document.getElementById('errorCard');
const errorCardTitle = document.getElementById('errorCardTitle');
const errorCardBody = document.getElementById('errorCardBody');

        function showErrorCard(message) {
    // Detect login-required errors
    const isLoginError = message.includes('log in') || message.includes('Login');
    const isKeyError = message.includes('API Key') || message.includes('Groq');

    if (isLoginError || isKeyError) {
        if (isLoginError) {
            errorCardTitle.innerHTML = 'Login Required';
            errorCardBody.innerHTML = 'Please log in to your Heros account and configure your API keys to use this feature.';
        } else {
            errorCardTitle.innerHTML = 'Groq API Key Missing';
            errorCardBody.innerHTML =
                'To use Zuno, please configure your Groq API key in your Heros profile:' +
                '<ol>' +
                '<li>Log in to your <strong>Heros</strong> account.</li>' +
                '<li>Navigate to <strong>Account / API Keys</strong>.</li>' +
                '<li>Add your <strong>Groq API Key</strong> and save.</li>' +
                '</ol>';
        }
        errorCard.style.display = 'block';
    } else {
        errorCardTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Oops, something went wrong';
        errorCardBody.innerHTML = message;
        errorCard.style.display = 'block';
    }
}

function showToast(message) {
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
