
const Draw = (function(window, document, Hammer, paper) {
    /**
     * Prevent showing context menu (right mouse click)
     */
    document.addEventListener('contextmenu', event => event.preventDefault());

    let path;
    let lastActionName;

    /**
     * Pen color
     */
    const penColorDefault = '#ffffff';
    let penColor = penColorDefault;

    /**
     * Pen width
     */
    const MIN_PEN_WIDTH = 2;
    const MAX_PEN_WIDTH = 14;
    const penWidthDefault = 2;
    let penWidth = penWidthDefault;

    /**
     * Setup paper
     */
    const canvas = document.getElementById('draw');
    paper.setup(canvas);

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
     * Update text with pen width
     */
    function updateIndicator() {
        document.querySelector('.c-menu__item--indicator').textContent = penWidth;
    }

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
    }

    const mc = new Hammer.Manager(canvas);

    const pan = new Hammer.Pan({ pointers: 3 });
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
        switch (event.maxPointers) {
            case 1:
                startDraw(event);
                break;
            case 2:
                // start erase
                break;
            case 3:
                // start drag
                break;
        }
    }

    function handleEvent(event) {
        switch (lastActionName) {
            case 'draw':
                draw(event);
                break;
            case 'erase':
                // handle erase
                break;
            case 'drag':
                // handle drag
                break;
        }
    }

    function handleFinalEvent(event) {
        switch (lastActionName) {
            case 'draw':
                endDraw(event);
                break;
            case 'erase':
                // handle erase end
                break;
            case 'drag':
                // handle drag end
                break;
        }
    }

    return {
        increasePen,
        decreasePen,
    }
})(window, document, Hammer, paper);