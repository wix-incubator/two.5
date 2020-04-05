import { defaultTo } from '../utilities';

const DEFAULTS = {
    horizontal: false
};

export function getEffect (config) {
    const _config = defaultTo(config, DEFAULTS);
    const container = _config.container;
    const horizontal = _config.horizontal;

    let totalHeight, totalWidth;

    if (container) {
        /*
         * Setup Smooth Scroll technique
         */
        totalHeight = container.offsetHeight;
        totalWidth = container.offsetWidth;

        window.document.body.style.height = `${totalHeight}px`;
        window.document.body.style.width = `${totalWidth}px`;
    }
    else {
        totalHeight = window.innerHeight;
        totalWidth = window.innerWidth;
    }

    _config.scenes = _config.scenes.map(scene => {
        const conf = defaultTo(scene, _config);

        if (conf.end == null) {
            conf.end = conf.start + conf.duration;
        }
        else if (conf.duration == null) {
            conf.duration = conf.end - conf.start;
        }

        return conf;
    });

    return function controller ({x, y}) {
        if (container) {
            container.style.transform = `translate3d(${-x}px, ${-y}px, 0px)`;
        }

        _config.scenes.forEach(scene => {
            if (!scene.disabled) {
                const {start, end, duration} = scene;
                let progress = 0;

                if (horizontal) {
                    if (x >= start && x <= end) {
                        progress = duration ? (x - start) / duration : 1;
                    }
                    else if (x > end) {
                        progress = 1;
                    }
                }
                else {
                    if (y >= start && y <= end) {
                        progress = duration ? (y - start) / duration : 1;
                    }
                    else if (y > end) {
                        progress = 1;
                    }
                }

                scene.effect(scene, progress);
            }
        });
    };
}
