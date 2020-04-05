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

    _config.scenes = _config.scenes.map(layer => {
        const conf = defaultTo(layer, _config);

        if (conf.end == null) {
            conf.end = conf.start + conf.duration;
        }
        else if (conf.duration == null) {
            conf.duration = conf.end - conf.start;
        }

        return conf;
    });

    return function controller ({x, y}) {
        const posX = x * totalHeight;
        const posY = y * totalWidth;

        if (container) {
            container.style.transform = `translate3d(${-x * totalWidth}px, ${-y * totalHeight}px, 0px)`;
        }

        _config.scenes.forEach(scene => {
            if (scene.enabled) {
                const {start, end, duration}  = scene;
                let progress = 0;

                if (horizontal) {
                    if (posX >= start && posX <= end) {
                        progress = duration ? (posX - start) / duration : 1;
                    }
                    else if (posX > end) {
                        progress = 1;
                    }
                }
                else {
                    if (posY >= start && posY <= end) {
                        progress = duration ? (posY - start) / duration : 1;
                    }
                    else if (posY > end) {
                        progress = 1;
                    }
                }

                scene.effects.forEach(effect => effect(progress));
            }
        });
    };
}
