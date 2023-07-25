const sidebarArray = [document.getElementById('original'), document.getElementById('twod'), document.getElementById('newCalamities')];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var sidebarAnimating = false;
var checkingForUpdates = false;

sidebarArray[0].addEventListener('click', (e) => {
    sidebarExpand(sidebarArray[0], e);
});

sidebarArray[1].addEventListener('click', (e) => {
    sidebarExpand(sidebarArray[1], e);
});

sidebarArray[2].addEventListener('click', (e) => {
    sidebarExpand(sidebarArray[2], e);
});

async function sidebarExpand(sidebarType, e) {
    if (sidebarAnimating) return;
    e.preventDefault();
    if (sidebarType.classList.contains('open')) return;

    sidebarAnimating = true;

    for (let element of sidebarArray) {
        if (element === sidebarType) continue;
        if (!element.classList.contains('open')) continue;

        let childDiv = element.getElementsByClassName('childDiv')[0];
        let label = element.getElementsByClassName('sidebar_label')[0];

        viewportToSidebar(element, label, childDiv);
    }

    let childDiv = sidebarType.getElementsByClassName('childDiv')[0];
    let label = sidebarType.getElementsByClassName('sidebar_label')[0];

    sidebarToViewport(sidebarType, label, childDiv);
}

async function sidebarToViewport(sidebarType, sidebarLabel, childDiv) {
    sidebarType.classList.add('open');
    sidebarLabel.classList.add('hide');

    sidebarType.addEventListener('transitionend', async function eventHandle() {
        childDiv.classList.remove('hide');
        sidebarAnimating = false;
        await CheckForUpdates(sidebarType);
        sidebarType.removeEventListener('transitionend', eventHandle);
    });
}

async function viewportToSidebar(sidebarType, sidebarLabel, childDiv) {
    sidebarType.classList.remove('open');
    sidebarLabel.classList.remove('hide');
    childDiv.classList.add('hide');
}

const playButtons = document.getElementsByClassName('playButton');

for (let button of playButtons) {
    button.addEventListener('click', async () => {
        let gameName = getGameNameFromSidebarID(button.parentElement.parentElement);

        if (gameName === null) return;

        let success = await window.api.LaunchGame(gameName);

        if (!success) {
            CheckForUpdates(button.parentElement.parentElement);
        }
    });
}

async function CheckForUpdates(sidebarType) {
    setPlayButton(false);
    
    let cyberDashVer = getGameNameFromSidebarID(sidebarType);

    if (cyberDashVer === null) return;

    let success = await window.api.CheckForUpdates(cyberDashVer);

    setPlayButton(true);
}

document.addEventListener('DOMContentLoaded', async() => {
    const sidebars = document.getElementsByClassName('sidebar');

    for (let sidebar of sidebars) {
        if (!sidebar.classList.contains('open')) continue;

        await CheckForUpdates(sidebar);
        break;
    }
});

function setPlayButton(enable) {
    let playButton;

    for (let button of playButtons) {
        if (button.parentElement.classList.contains('hide')) continue;

        playButton = button;
        break;
    }


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

// function playButtonCheckAnimation() {
//     playButton.innerText = "Checking For Updates";

//     let loadingInterval = window.setInterval(function() {
//         if (playButton.innerText === "Launch Game") {
//             playButton.innerText.replace(".", "");
//             clearInterval(loadingInterval);
//             return;
//         }

//         if (playButton.innerText.includes("...")) {
//             playButton.innerText = playButton.innerText.slice(0, -3);
//         }
//         else {
//             playButton.innerText += ".";
//         }
//     }, 1000);
// };

window.api.OnGetDownloadState((event, message) => {
    for (let button of playButtons) {
        if (button.parentElement.classList.contains('hide')) continue;

        button.innerText = message;
        break;
    }
});

function getGameNameFromSidebarID(sidebarType) {
    switch (sidebarType.id) {
        case 'original':
            return 'CyberDash2D';
        case 'twod':
            return 'CyberDash1';
        case 'newCalamities':
            return 'CyberDashNC';
        default:
            return null;
    }
}