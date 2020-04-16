export function getHandler () {
    function handler (progress) {
        progress.x = +(window.scrollX || window.pageXOffset).toFixed(1);
        progress.y = +(window.scrollY || window.pageYOffset).toFixed(1);
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
