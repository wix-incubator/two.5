import { defaultTo } from '../utilities';

const DEFAULTS = {
    horizontal: false,
    scrollHandler (container, x, y) {
        container.style.transform = `translate3d(${-x.toFixed(2)}px, ${-y.toFixed(2)}px, 0px)`;
    }
};

function calcPosition (p, pins) {
    let _p = p;
    let extra = 0;
    for (const [start, end] of pins) {
        if (p < start) break;
        if (p >= end) {
            extra += end - start;
        }
        else {
            _p = start;
            break;
        }
    }
    return _p - extra;
}

function calcProgress (p, start, end, duration) {
    let progress = 0;

    if (p >= start && p <= end) {
        progress = duration ? (p - start) / duration : 1;
    }
    else if (p > end) {
        progress = 1;
    }

    return progress;
}

export function getEffect (config) {
    const _config = defaultTo(config, DEFAULTS);
    const container = _config.container;
    const horizontal = _config.horizontal;

    // prepare pins data
    const pins = (_config.pins || [])
        .sort((a, b) => a.start > b.start ? 1 : -1)
        .map(pin => {
            const {start, duration, end} = pin;
            return [start, (end == null ? start + duration : end)];
        });

    // calculate extra scroll if we have pins
    const extraScroll = pins.reduce((acc, pin) => acc + (pin[1] - pin[0]), 0);

    let lastX, lastY;

    // prepare scenes data
    _config.scenes.forEach(scene => {
        if (scene.end == null) {
            scene.end = scene.start + scene.duration;
        }
        else if (scene.duration == null) {
            scene.duration = scene.end - scene.start;
        }
    });

    if (container) {
        /*
         * Setup Smooth Scroll technique
         */
        const totalHeight = container.offsetHeight + (horizontal ? 0 : extraScroll);
        const totalWidth = container.offsetWidth + (horizontal ? extraScroll : 0);

        if (horizontal) {
            window.document.body.style.width = `${totalWidth}px`;
        }
        else {
            window.document.body.style.height = `${totalHeight}px`;
        }

        if (_config.wrapper) {
            // if we got a wrapper element set its style
            Object.assign(_config.wrapper.style, {
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden'
            });

            // get current scroll position
            let x = window.scrollX || window.pageXOffset;
            let y = window.scrollY || window.pageYOffset;

            // increment current scroll position by accumulated pin duration
            if (horizontal) {
                x = pins.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, x);
            }
            else {
                y = pins.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, y);
            }

            // update scroll and progress to new calculated position
            _config.resetProgress({x, y});

            // render current position
            controller({x, y});
        }
    }

    function controller ({x, y}) {
        if (x === lastX && y === lastY) return;

        let _x = x, _y = y;

        if (pins.length) {
            if (horizontal) {
                _x = calcPosition(x, pins);
                _y = 0;
            }
            else {
                _y = calcPosition(y, pins);
                _x = 0;
            }
        }

        if (container) {
            _config.scrollHandler(container, _x, _y);
        }

        _config.scenes.forEach(scene => {
            if (!scene.disabled) {
                const {start, end, duration} = scene;
                const t = horizontal
                    ? scene.pauseDuringPin ? _x : x
                    : scene.pauseDuringPin ? _y : y;

                const progress = calcProgress(t, start, end, duration);

                scene.effect(scene, progress);
            }
        });

        lastX = x;
        lastY = y;
    }

    return controller;
}
