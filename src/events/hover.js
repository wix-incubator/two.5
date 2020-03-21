import { clamp, clone } from '../utilities.js';

export function getHandler ({target, progress}) {
    let rect;

    if (target && target !== window) {
        rect = clone(target.getBoundingClientRect().toJSON());
    }
    else {
        target = window;
        rect = {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    const {width, height, left, top} = rect;

    function handler (event) {
        const {clientX, clientY} = event;

        // percentage of position progress
        const x = clamp(0, 1, (clientX - left) / width);
        const y = clamp(0, 1, (clientY - top) / height);

        progress.x = x;
        progress.y = y;
    }

    function on (config) {
        target.addEventListener('mousemove', handler, config || false);
    }

    function off (config) {
        target.removeEventListener('mousemove', handler, config || false);
    }

    return {
        on,
        off,
        handler
    };
}
