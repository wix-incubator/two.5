export function getHandler ({progress, root}) {
    function handler () {
        // get current scroll position (support window, element and window in IE)
        progress.x = root.scrollX || root.pageXOffset || root.scrollLeft || 0;
        progress.y = root.scrollY || root.pageYOffset || root.scrollTop || 0;
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
