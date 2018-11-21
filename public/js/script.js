document.addEventListener('contextmenu', event => event.preventDefault());

const Draw = (function(window, document, Hammer, paper) {

    const penColorDefault = '#ffffff';
    let penColor = penColorDefault;

    const MIN_PEN_WIDTH = 2;
    const MAX_PEN_WIDTH = 14;
    const penWidthDefault = 2;
    let penWidth = penWidthDefault;

    const canvas = document.getElementById('draw');

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

    const mc = new Hammer.Manager(canvas);


    return {
        increasePen,
        decreasePen,
    }
})(window, document, Hammer, paper);