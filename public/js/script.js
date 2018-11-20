var penColorDefault = '#ffffff';
var penColor = penColorDefault;
var MIN_PEN_WIDTH = 2;
var MAX_PEN_WIDTH = 14;
var penWidthDefault = 2;
var penWidth = penWidthDefault;

document.addEventListener('contextmenu', event => event.preventDefault());

function increasePen() {
    if (penWidth < MAX_PEN_WIDTH) {
        penWidth += 1;
        updateIndicator();
    }
}

function decreasePen() {
    if (penWidth > MIN_PEN_WIDTH) {
        penWidth -= 1;
        updateIndicator();
    }
}

function updateIndicator() {
    document.querySelector('.c-menu__item--indicator').textContent = penWidth;
}