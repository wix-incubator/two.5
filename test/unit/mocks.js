const eventListeners = {
    scroll: new Set()
};

const _window = {
    eventListeners,
    scrollX: 0,
    scrollY: 0,
    document: {
        body: {
            style: {
                transform: ''
            }
        }
    },
    scrollTo(x, y) {
        _window.scrollX = x;
        _window.scrollY = y;

        eventListeners.scroll.forEach(listener => listener());
    },
    animationFrameHandlers: [],
    requestAnimationFrame(fn) {
        _window.animationFrameHandlers.push(fn);
    },
    executeAnimationFrame(prevTime) {
        const time = prevTime + 1;

        if ( _window.intersectionEntries.length ) {
            _window.intersections.forEach(fn => fn(_window.intersectionEntries));
            _window.intersectionEntries.length = 0;
        }

        const handlers = _window.animationFrameHandlers.slice();
        _window.animationFrameHandlers.length = 0;
        handlers.forEach(fn => fn(time));
    },
    intersections: [],
    intersectionEntries: [],
    IntersectionObserver: function (fn) {
        window.intersections.push(fn);

        return {
            observe() {},
            disconnect() {}
        };
    },
    addEventListener(eventName, listener) {
        eventListeners[eventName].add(listener);
    },
    removeEventListener(eventName, listener) {
        eventListeners[eventName].delete(listener);
    }
};

global.window = _window;
