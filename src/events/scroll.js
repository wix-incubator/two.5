export function getHandler () {
    function handler (progress) {
        progress.x = window.scrollX || window.pageXOffset;
        progress.y = window.scrollY || window.pageYOffset;
    }

    let frameId;

    function on () {
        frameId = window.requestAnimationFrame(handler);
    }

    function off () {
        window.cancelAnimationFrame(frameId);
    }

    return {
        handler,
        on,
        off
    };
}
