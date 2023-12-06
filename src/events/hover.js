import { clamp, clone } from '../utilities.js';

export function getHandler ({target, progress, callback}) {
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
        // percentage of position progress
        const x = clamp(0, 1, (event.x - left) / width);
        const y = clamp(0, 1, (event.y - top) / height);

        progress.x = +x.toPrecision(4);
        progress.y = +y.toPrecision(4);
        progress.posX = event.x;
        progress.posY = event.y;
        progress.h = height;
        progress.w = width;

        callback();
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
