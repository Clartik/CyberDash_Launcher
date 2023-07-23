const sidebarArray = [document.getElementById('original'), document.getElementById('twod'), document.getElementById('newCalamities')];

sidebarArray[0].addEventListener('click', () => {
    sidebarExpand(sidebarArray[0]);
});

sidebarArray[1].addEventListener('click', () => {
    sidebarExpand(sidebarArray[1]);
});

sidebarArray[2].addEventListener('click', () => {
    sidebarExpand(sidebarArray[2]);
});

function sidebarExpand(sidebarType) {
    if (sidebarType.classList.contains('viewport')) return;

    sidebarType.classList.remove('sidebar');
    sidebarType.classList.add('viewport');

    for (let element of sidebarArray) {
        if (element === sidebarType) continue;

        if (element.classList.contains('viewport')) {
            element.classList.remove('viewport');
            element.classList.add('sidebar');

            element.getElementsByClassName('sidebar_label')[0].classList.remove('hide');
        }
    }

    sidebarType.getElementsByClassName('sidebar_label')[0].classList.add('hide');
}