const _window = {
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
    }
};

global.window = _window;
