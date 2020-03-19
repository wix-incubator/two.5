import { clamp } from '../utilities.js';

export function getHandler ({target, rect}) {
    const {width, height, left, top} = rect;

    return function handler (event) {
        const {clientX, clientY} = event;

        // percentage of position progress
        const x = clamp(0, 1, (clientX - left) / width);
        const y = clamp(0, 1, (clientY - top) / height);

        target.x = x;
        target.y = y;
    };
}
