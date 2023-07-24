const sidebarArray = [document.getElementById('original'), document.getElementById('twod'), document.getElementById('newCalamities')];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    e.preventDefault();
    if (sidebarType.classList.contains('open')) return;

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

    sidebarType.addEventListener('transitionend', function eventHandle() {
        childDiv.classList.remove('hide');
        console.log('a');
        sidebarType.removeEventListener('transitionend', eventHandle);
    });
}

async function viewportToSidebar(sidebarType, sidebarLabel, childDiv) {
    sidebarType.classList.remove('open');
    sidebarLabel.classList.remove('hide');
    childDiv.classList.add('hide');
}