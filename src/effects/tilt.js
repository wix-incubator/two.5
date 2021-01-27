import { defaultTo } from '../utilities';

/**
 * @private
 */
const DEFAULTS = {
    // config only
    perspectiveActive: false,
    perspectiveInvertX: false,
    perspectiveInvertY: false,
    perspectiveMaxX: 0,
    perspectiveMaxY: 0,
    invertRotation: false, // used for orientation compensation when using deviceorientation event, reference see below

    // layer and config
    perspectiveZ: 600, //todo: split to layer and container config
    elevation: 10,  // todo: why in line 102 we check for config.hasOwnProperty(elevation)?
    transitionDuration: 200, // todo: split to layer and container config
    transitionActive: false, //todo: split to layer and container config
    transitionEasing: 'ease-out', //todo: split to layer and container config

    // layer only
    translationActive: true,
    translationInvertX: false,
    translationInvertY: false,
    translationMaxX: 50,
    translationMaxY: 50,
    rotateActive: false,
    rotateInvert: false,
    rotateMax: 45,
    tiltActive: false,
    tiltInvertX: false,
    tiltInvertY: false,
    tiltMaxX: 25,
    tiltMaxY: 25,
    skewActive: false,
    skewInvertX: false,
    skewInvertY: false,
    skewMaxX: 25,
    skewMaxY: 25,
    scaleActive: false,
    scaleInvertX: false,
    scaleInvertY: false,
    scaleMaxX: 0.5,
    scaleMaxY: 0.5
};

function formatTransition ({property, duration, easing}) {
    return `${property} ${duration}ms ${easing}`;
}

export function getEffect (config) {
    const _config = defaultTo(config, DEFAULTS);
    const container = _config.container;
    const perspectiveZ = _config.perspectiveZ;

    _config.layers = _config.layers.map(layer => defaultTo(layer, _config));

    /*
     * Init effect
     * also set transition if required.
     */
    if (container) {
        const containerStyle = {
            perspective: `${perspectiveZ}px`
        };

        if (_config.transitionActive && _config.perspectiveActive) {
            containerStyle.transition = formatTransition({
                property: 'perspective-origin',
                duration: _config.transitionDuration,
                easing: _config.transitionEasing
            });
        }

        Object.assign(container.style, containerStyle);
    }

    /*
     * Setup layers styling
     */
    _config.layers.forEach(layer => {
        const layerStyle = {};

        if (!layer.allowPointer) {
            layerStyle['pointer-events'] = 'none';
        }

        if (layer.transitionActive) {
            layerStyle.transition = formatTransition({
                property: 'transform',
                duration: layer.transitionDuration,
                easing: layer.transitionEasing
            });
        }
        else {
            delete layerStyle.transition;
        }

        return Object.assign(layer.el.style, layerStyle);
    });

    return function tilt ({x, y}) {
        const len = _config.layers.length;

        _config.layers.forEach((layer, index) => {
            const depth = layer.hasOwnProperty('depth') ? layer.depth : (index + 1) / len;

            const translateZVal =  layer.hasOwnProperty('elevation') ? layer.elevation : _config.elevation * (index + 1);

            let translatePart = '';
            if (layer.translationActive) {
                const translateXVal = layer.translationActive === 'y'
                    ? 0
                    : (layer.translationInvertX ? -1 : 1) * layer.translationMaxX * (2 * x - 1) * depth;
                const translateYVal = layer.translationActive === 'x'
                    ? 0
                    : (layer.translationInvertY ? -1 : 1) * layer.translationMaxY * (2 * y - 1) * depth;

                translatePart = `translate3d(${translateXVal.toFixed(2)}px, ${translateYVal.toFixed(2)}px, ${translateZVal}px)`;
            }
            else {
                translatePart = `translateZ(${translateZVal}px)`;
            }

            let rotatePart = '';
            let rotateXVal = 0,
                rotateYVal = 0,
                rotateZVal = 0;

            if (layer.rotateActive) {
                const rotateInput = layer.rotateActive === 'x' ? x : y;

                rotateZVal = (layer.rotateInvert ? -1 : 1) * layer.rotateMax * (rotateInput * 2 - 1) * depth;

                rotatePart += ` rotateZ(${rotateZVal.toFixed(2)}deg)`;
            }

            if (layer.tiltActive) {
                rotateXVal = layer.tiltActive === 'x'
                    ? 0
                    : (layer.tiltInvertY ? -1 : 1) * layer.tiltMaxY * (1 - y * 2) * depth;
                rotateYVal = layer.tiltActive === 'y'
                    ? 0
                    : (layer.tiltInvertX ? -1 : 1) * layer.tiltMaxX * (x * 2 - 1) * depth;

                if (_config.invertRotation) {
                    // see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms#Orientation_compensation
                    rotatePart = ` rotateY(${rotateYVal.toFixed(2)}deg) rotateX(${rotateXVal.toFixed(2)}deg)${rotatePart}`;
                }
                else {
                    rotatePart += ` rotateX(${rotateXVal.toFixed(2)}deg) rotateY(${rotateYVal.toFixed(2)}deg)`;
                }
            }

            let skewPart = '';
            if (layer.skewActive) {
                const skewXVal = layer.skewActive === 'y'
                    ? 0
                    : (layer.skewInvertX ? -1 : 1) * layer.skewMaxX * (1 - x * 2) * depth;
                const skewYVal = layer.skewActive === 'x'
                    ? 0
                    : (layer.skewInvertY ? -1 : 1) * layer.skewMaxY * (1 - y * 2) * depth;

                skewPart = ` skew(${skewXVal.toFixed(2)}deg, ${skewYVal.toFixed(2)}deg)`;
            }

            let scalePart = '';
            if (layer.scaleActive) {
                const scaleXInput = layer.scaleActive === 'yy' ? y : x;
                const scaleYInput = layer.scaleActive === 'xx' ? x : y;
                const scaleXVal = layer.scaleActive === 'y'
                    ? 1
                    : 1 + (layer.scaleInvertX ? -1 : 1) * layer.scaleMaxX * (Math.abs(0.5 - scaleXInput) * 2) * depth;
                const scaleYVal = layer.scaleActive === 'x'
                    ? 1
                    : 1 + (layer.scaleInvertY ? -1 : 1) * layer.scaleMaxY * (Math.abs(0.5 - scaleYInput) * 2) * depth;

                scalePart = ` scale(${scaleXVal.toFixed(2)}, ${scaleYVal.toFixed(2)})`;
            }

            let layerPerspectiveZ = '';

            if (layer.hasOwnProperty('perspectiveZ')) {
                layerPerspectiveZ = `perspective(${layer.perspectiveZ}px) `;
            }
            else if (!container) {
                layerPerspectiveZ = `perspective(${_config.perspectiveZ}px) `;
            }

            layer.el.style.transform = `${layerPerspectiveZ}${translatePart}${scalePart}${skewPart}${rotatePart}`;
        });

        if (_config.perspectiveActive) {
            let aX = 1, bX = 0, aY = 1, bY = 0;

            if (_config.perspectiveMaxX) {
                aX = 1 + 2 * _config.perspectiveMaxX;
                bX = _config.perspectiveMaxX;
            }

            if (_config.perspectiveMaxY) {
                aY = 1 + 2 * _config.perspectiveMaxY;
                bY = _config.perspectiveMaxY;
            }

            const perspX = _config.perspectiveActive === 'y'
                ? 0.5
                : (_config.perspectiveInvertX ? (1 - x) : x) * aX - bX;
            const perspY = _config.perspectiveActive === 'x'
                ? 0.5
                : (_config.perspectiveInvertY ? (1 - y) : y) * aY - bY;

            container.style.perspectiveOrigin = `${(perspX * 100).toFixed(2)}% ${(perspY * 100).toFixed(2)}%`;
        }
        else if (container) {
            container.style.perspectiveOrigin = '50% 50%';
        }
    };
}
