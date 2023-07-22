const playButton = document.getElementById('playButton');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setPlayButton(enable) {
    if (enable) {
        if (playButton.classList.contains('animGrow')) return;

        playButton.classList.add('animGrow');
        playButton.disabled = false;
    }
    else {
        if (!playButton.classList.contains('animGrow')) return;

        playButton.classList.remove('animGrow');
        playButton.disabled = true;
    }
}

function playButtonCheckAnimation() {
    playButton.innerText = "Checking For Updates";

    let loadingInterval = window.setInterval(function() {
        if (playButton.innerText === "Launch Game") {
            playButton.innerText.replace(".", "");
            clearInterval(loadingInterval);
            return;
        }

        if (playButton.innerText.includes("...")) {
            playButton.innerText = playButton.innerText.slice(0, -3);
        }
        else {
            playButton.innerText += ".";
        }
    }, 1000);
};

async function CheckForUpdates() {
    setPlayButton(false);
    playButtonCheckAnimation();
    
    await window.api.CheckForUpdates('CyberDash1');

    setPlayButton(true);
    playButton.innerText = "Launch Game";   
}

document.addEventListener('DOMContentLoaded', async() => {
    await CheckForUpdates();
});

playButton.onclick = async () => {
    console.log("Launching game!");
    window.api.LaunchGame('CyberDash1');
}