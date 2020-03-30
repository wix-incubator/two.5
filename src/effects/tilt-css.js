function formatTransition ({property, duration, easing}) {
    return `${property} ${duration}ms ${easing}`;
}

function setProperty (scope, name, v) {
    scope.style.setProperty(name, v);
}

const SETTERS = {
    depth (scope, v) {
        setProperty(scope, '--depth', v);
    },
    perspectiveZ (scope, v) {
        setProperty(scope, '--pz', `${v}px`);
    },
    perspectiveActive (scope, v, config) {
        const px = config.container ? 0 : +(v && v !== 'y');
        const py = config.container ? 0 : +(v && v !== 'x');
        setProperty(scope, '--px-on', px);
        setProperty(scope, '--py-on', py);
    },
    perspectiveInvertX (scope, v) {
        setProperty(scope, '--px-dir', v);
    },
    perspectiveInvertY (scope, v) {
        setProperty(scope, '--py-dir', v);
    },
    perspectiveMax (scope, v) {
        setProperty(scope, '--p-max', v);
    },
    translationActive (scope, v) {
        const tx = +(v && v !== 'y');
        const ty = +(v && v !== 'x');
        setProperty(scope, '--tx-on', tx);
        setProperty(scope, '--ty-on', ty);
    },
    translationInvertX (scope, v) {
        setProperty(scope, '--tx-dir', v);
    },
    translationInvertY (scope, v) {
        setProperty(scope, '--ty-dir', v);
    },
    translationMax (scope, v) {
        setProperty(scope, '--t-max', `${v}px`);
    },
    rotationActive (scope, v, con) {
        const rx = +(v && v !== 'y');
        const ry = +(v && v !== 'x');
        setProperty(scope, '--rx-on', rx);
        setProperty(scope, '--ry-on', ry);
    },
    rotationInvertX (scope, v) {
        setProperty(scope, '--rx-dir', v);
    },
    rotationInvertY (scope, v) {
        setProperty(scope, '--ry-dir', v);
    },
    rotationMax (scope, v) {
        setProperty(scope, '--r-max', `${v}deg`);
    },
    skewActive (scope, v) {
        const skx = +(v && v !== 'y');
        const sky = +(v && v !== 'x');
        setProperty(scope, '--skx-on', skx);
        setProperty(scope, '--sky-on', sky);
    },
    skewInvertX (scope, v) {
        setProperty(scope, '--skx-dir', v);
    },
    skewInvertY (scope, v) {
        setProperty(scope, '--sky-dir', v);
    },
    skewMax (scope, v) {
        setProperty(scope, '--sk-max', `${v}deg`);
    },
    scaleActive (scope, v) {
        const sx = +(v && v !== 'y');
        const sy = +(v && v !== 'x');
        setProperty(scope, '--sx-on', sx);
        setProperty(scope, '--sy-on', sy);
    },
    scaleInvertX (scope, v) {
        setProperty(scope, '--sx-dir', v);
    },
    scaleInvertY (scope, v) {
        setProperty(scope, '--sy-dir', v);
    },
    scaleMax (scope, v) {
        setProperty(scope, '--s-max', v);
    }
};

export function getEffect (config) {
    const container = config.container;
    const scope = container || window.document.documentElement;
    const layers = config.layers;

    /*
     * Setup container/global config
     */
    Object.keys(config).forEach(key => {
        const setter = SETTERS[key];

        if (setter) {
            setter(scope, config[key], config);
        }
    });

    /*
     * Setup perspective transition if required.
     */
    if (container && config.transitionActive && config.perspectiveActive) {
        container.style.transition = formatTransition({
            property: 'perspective-origin',
            duration: config.transitionDuration,
            easing: config.transitionEasing
        });
    }
    else if (container) {
        container.style.transition = '';
    }

    /*
     * Setup layers config
     */
    const len = layers.length;

    layers.forEach((layer, index) => {
        if (!layer.allowPointer) {
            layer.el.dataset.tiltNoPointer = '';
        }

        if (layer.transitionActive) {
            layer.el.style.transition = formatTransition({
                property: 'transform',
                duration: layer.transitionDuration,
                easing: layer.transitionEasing
            });
        }
        else {
            layer.el.transition = '';
        }

        Object.keys(layer).forEach(key => {
            const setter = SETTERS[key];

            if (setter) {
                setter(layer.el, layer[key], layer);
            }
        });

        if (!Object.prototype.hasOwnProperty.call(layer, 'depth')) {
            SETTERS.depth(layer.el, (index + 1) / len);
        }

        if (config.elevation && !Object.prototype.hasOwnProperty.call(layer, 'elevation')) {
            setProperty(layer.el, '--tz', `${config.elevation * (index + 1)}px`);
        }
        else if (Object.prototype.hasOwnProperty.call(layer, 'elevation')) {
            setProperty(layer.el, '--tz', `${layer.elevation}px`);
        }
    });

    return function tilt ({x, y}) {
        // const style = window.document.documentElement.style;
        const style = scope.style;

        style.setProperty('--x', x);
        style.setProperty('--y', y);
        style.setProperty('--x-scale', Math.abs(0.5 - x));
        style.setProperty('--y-scale', Math.abs(0.5 - y));
    }
}
