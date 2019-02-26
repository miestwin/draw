const Draw = (function(window, document, Hammer, paper, io) {
    /**
     * Prevent showing context menu (right mouse click)
     */
    document.addEventListener('contextmenu', event => event.preventDefault());

    let path;
    let lastPathIndex;
    let lastActionName;
    let lastEvent;
    let lastPointersNumber;
    let hiddenPaths = [];

    // const layerIndex = 0;
    // const layerName = 'drawLayer';

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

    const socketActive = window.location.pathname === '/' ? false : true;
    const socket = io({ transports: ['websocket'], query: { room: window.location.pathname }});

    socket.on('init-board', function(data) {
        data.forEach((path, index) => {
            paper.project.activeLayer.insertChild(index, paper.importJSON(path['json_string']));
        });
    });

    socket.on('start-draw', function(index, path) {
        console.log('STAT DRAW FROM SOCKET: ', index, path);
        try {
            paper.project.activeLayer.insertChild(index, paper.importJSON(path));
        } catch (e) {
            console.log('ERROR OCCURRED WHILE START DRAW: ', e);
        }
        paper.view.update();
    });

    socket.on('update-draw', function(index, point) {
        const lastPath = paper.project.activeLayer.children[index];
        if (lastPath === undefined) {
            console.log(`ERROR with draw from socket. Path ${lastPathIndex} doesn't exist.`);
        }
        lastPath.add({ x: point[0], y: point[1] });
        paper.view.update();
    });

    socket.on('end-draw', function() {

    });

    socket.on('undo', function(index) {
        // undo();
    });

    socket.on('redo', function(index) {
        // redo();
        // check from where action start
    });

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
        const indicator = document.getElementById('toolbar-indicator');
        indicator.textContent = penWidth;
        indicator.style.color = penColor;
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
        updateIndicator();
    }

    /**
     * Refresh download link to image
     */
    function refreshDownload() {
        const img = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        document.getElementById('download').setAttribute('href', img);
    }

    window.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
            undo();
        } else if (event.ctrlKey && event.key === 'y') {
            redo();
        }
    });

    /**
     * Undo changes
     */
    function undo() {
        if (paper.project.activeLayer.children.length < 1) {
            return;
        }
        const children = paper.project.activeLayer.children.pop();
        children.visible = false;
        hiddenPaths.push(children);
    }

    /**
     * Redo changes
     */
    function redo() {
        if (hiddenPaths.length < 1) {
            return;
        }
        const children = hiddenPaths.pop();
        children.visible = true;
        paper.project.activeLayer.children.push(children);
    }

    const menuDetector = new Hammer.Manager(document.querySelector('.c-menu__detector'));
    const menuToolbarDetector = new Hammer.Manager(document.querySelector('.c-menu__c-toolbar'));
    const swipe = new Hammer.Swipe();
    menuDetector.add(swipe);
    menuToolbarDetector.add(swipe);

    menuDetector.on('swipeup', function(event) {
        const toolbar = document.querySelector('.c-menu__c-toolbar');
        toolbar.classList.add('c-menu__c-toolbar--visible');
    });

    menuToolbarDetector.on('swipeup', function(event) {
        const toolbar = document.querySelector('.c-menu__c-toolbar');
        toolbar.classList.add('c-menu__c-toolbar--visible');
    });

    menuToolbarDetector.on('swipedown', function(event) {
        const toolbar = document.querySelector('.c-menu__c-toolbar');
        toolbar.classList.remove('c-menu__c-toolbar--visible');
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

        if (socketActive) {
            lastPathIndex = -1;
            socket.emit('start-draw', path.exportJSON(), function(index) {
                const item = paper.project.activeLayer.insertChild(index, path);
                lastPathIndex = index;
                console.log('START DRAW SCOKET: ', item);
            });
        } else {
            const item = paper.project.activeLayer.addChild(path);
            lastPathIndex = item.index;
            console.log('START DRAW NON-SOCKET: ', item);
        }
    }

    /**
     * Draw on canvas
     * @param {*} event 
     */
    function draw(event) {
        const lastPath = paper.project.layers[layerIndex].children[lastPathIndex];
        if (lastPath === undefined) {
            console.log(`ERROR with draw. Path ${lastPathIndex} doesn't exist.`);
        }
        lastPath.add({ x: event.center.x, y: event.center.y });

        if (socketActive) {
            socket.emit('update-draw', lastPathIndex, [event.center.x, event.center.y]);
        }
    }

    /**
     * Stop drawing on canvas
     * @param {*} event 
     */
    function endDraw(event) {
        path.simplify(8);
        setTimeout(() => refreshDownload(), 1);
        console.log(path);
        console.log(paper);
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
            event.maxPointers = 5;
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
                hiddenPaths = [];
                startDraw(event);
                break;
            case 2:
                hiddenPaths = [];
                startErase(event);
                break;
            case 5:
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
        undo,
        redo
    }
})(window, document, Hammer, paper, io);