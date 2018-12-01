const Draw = (function(window, document, Hammer, paper) {
    /**
     * Prevent showing context menu (right mouse click)
     */
    document.addEventListener('contextmenu', event => event.preventDefault());

    let path;
    let lastActionName;
    let lastEvent;
    let lastPointersNumber;

    /**
     * Pen color
     */
    const penColorDefault = '#ffffff';
    let penColor = penColorDefault;

    /**
     * Pen width
     */
    const MIN_PEN_WIDTH = 2;
    const MAX_PEN_WIDTH = 20;
    const penWidthDefault = MIN_PEN_WIDTH;
    let penWidth = penWidthDefault;

    /**
     * Erase pen
     */
    const backgroundColor = '#000000';
    const eraseWidth = 50;

    /**
     * Setup paper
     */
    const canvas = document.getElementById('draw');
    paper.setup(canvas);
    const canvasBackground = new paper.Path.Rectangle({
        point: [0, 0],
        size: [paper.view.size.width, paper.view.size.height],
        strokeColor: '#000000',
        fillColor: '#000000',
        selected: false
    });

    /**
     * Increase pen width
     */
    function increasePen() {
        if (penWidth < MAX_PEN_WIDTH) {
            penWidth += 1;
            updateIndicator();
        }
    }

    /**
     * Decrease pen width
     */
    function decreasePen() {
        if (penWidth > MIN_PEN_WIDTH) {
            penWidth -= 1;
            updateIndicator();
        }
    }

    /**
     * Reset pen
     */
    function resetPen() {
        penColor = penColorDefault;
        penWidth = penWidthDefault;
        updateIndicator();
    }

    /**
     * Update text with pen width
     */
    function updateIndicator() {
        document.getElementsByClassName('c-menu__item--indicator').textContent = penWidth;
    }

    /**
     * Clear canvas
     */
    function clearScene() {
        paper.project.activeLayer.removeChildren();
    }

    /**
     * Set pen color
     * @param {*} element 
     */
    function pickColor(element) {
        penColor = element.dataset.color;
    }

    /**
     * Refresh download link to image
     */
    function refreshDownload() {
        const img = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        document.getElementById('download').setAttribute('href', img);
    }

    const menuDetector = new Hammer.Manager(document.querySelector('.c-menu__detector'));
    const menuToolbarDetector = new Hammer.Manager(document.querySelector('.c-menu__toolbar'));
    const swipe = new Hammer.Swipe();
    menuDetector.add(swipe);
    menuToolbarDetector.add(swipe);

    menuDetector.on('swipeup', function(event) {
        const toolbar = document.querySelector('.c-menu__toolbar');
        toolbar.classList.add('c-menu__toolbar--visible');
    });

    menuToolbarDetector.on('swipeup', function(event) {
        const toolbar = document.querySelector('.c-menu__toolbar');
        toolbar.classList.add('c-menu__toolbar--visible');
    });

    menuToolbarDetector.on('swipedown', function(event) {
        const toolbar = document.querySelector('.c-menu__toolbar');
        toolbar.classList.remove('c-menu__toolbar--visible');
    });

    /**
     * Start drawing on canvas
     * @param {*} event 
     */
    function startDraw(event) {
        lastActionName = 'draw';
        path = new paper.Path({
            segments: [{ x: event.center.x, y: event.center.y }],
            strokeColor: penColor,
            strokeWidth: penWidth,
            strokeCap: 'round',
            fullySelected: false
        });
    }

    /**
     * Draw on canvas
     * @param {*} event 
     */
    function draw(event) {
        path.add({ x: event.center.x, y: event.center.y });
    }

    /**
     * Stop drawing on canvas
     * @param {*} event 
     */
    function endDraw(event) {
        path.simplify(8);
        setTimeout(() => refreshDownload(), 1);
    }

    /**
     * Start erase
     * @param {*} event 
     */
    function startErase(event) {
        lastActionName = 'erase';
        path = new paper.Path({
            segments: [{ x: event.center.x, y: event.center.y }],
            strokeColor: backgroundColor,
            strokeWidth: eraseWidth,
            strokeCap: 'round',
            fullySelected: false
        });
    }

    /**
     * Erase on canvas
     * @param {*} Event 
     */
    function erase(event) {
        path.add({ x: event.center.x, y: event.center.y });
    }

    /**
     * End erase
     * @param {*} event 
     */
    function endErase(event) {}

    /**
     * Start draging
     * @param {*} event 
     */
    function startDrag(event) {
        lastActionName = 'drag';
        lastEvent = event;
    }

    /**
     * Handle drag event
     * @param {*} event
     */
    function drag(event) {
        const x = event.center.x - lastEvent.center.x;
        const y = event.center.y - lastEvent.center.y;
        paper.project.activeLayer.position.x = paper.project.activeLayer.position.x + x;
        paper.project.activeLayer.position.y = paper.project.activeLayer.position.y + y;
        lastEvent = event;
    }

    /**
     * Stop draging
     * @param {*} event 
     */
    function endDrag(event) {}

    const mc = new Hammer.Manager(canvas);

    const pan = new Hammer.Pan({ pointers: 1 });
    mc.add(pan);

    mc.on('hammer.input', function (event) {
        if (event.srcEvent.ctrlKey) {
            event.maxPointers = 3;
        } else if (event.srcEvent.shiftKey) {
            event.maxPointers = 2;
        }

        if (event.isFirst) {
            handleFirstEvent(event);
        } else if (event.isFinal) {
            handleFinalEvent(event);
        } else {
            handleEvent(event);
        }
    });

    function handleFirstEvent(event) {
        lastPointersNumber = event.maxPointers;
        switch (event.maxPointers) {
            case 1:
                startDraw(event);
                break;
            case 2:
                startErase(event);
                break;
            case 3:
                startDrag(event);
                break;
        }
    }

    function handleEvent(event) {
        if (lastPointersNumber !== event.maxPointers) {
            handleFinalEvent(event);
            handleFirstEvent(event);
            return;
        }

        switch (lastActionName) {
            case 'draw':
                draw(event);
                break;
            case 'erase':
                erase(event);
                break;
            case 'drag':
                drag(event);
                break;
        }
    }

    function handleFinalEvent(event) {
        switch (lastActionName) {
            case 'draw':
                endDraw(event);
                break;
            case 'erase':
                endErase(event);
                break;
            case 'drag':
                endDrag(event);
                break;
        }
    }

    return {
        increasePen,
        decreasePen,
        clearScene,
        resetPen,
        pickColor,
    }
})(window, document, Hammer, paper);