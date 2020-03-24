import { getEffect as getTiltEffect } from './effects/tilt.js';
import { getHandler as getHover } from './events/hover.js';
import { getHandler as getGyroscope } from './events/gyroscope';
import { clone } from './utilities.js';

const DEFAULTS = {
    mouseTarget: null,
    layersContainer: null,
    layers: null,
    gyroscopeSamples: 3,
    maxBeta: 15,
    maxGamma: 15,
    perspectiveZ: 600,
    elevation: 10,
    transitionActive: false,
    transitionDuration: 200,
    transitionEasing: 'ease-out',
    perspectiveActive: false,
    perspectiveInvertX: false,
    perspectiveInvertY: false,
    perspectiveMax: 0,
    translationActive: true,
    translationInvertX: false,
    translationInvertY: false,
    translationMax: 50,
    rotationActive: false,
    rotationInvertX: false,
    rotationInvertY: false,
    rotationMax: 25,
    skewActive: false,
    skewInvertX: false,
    skewInvertY: false,
    skewMax: 25,
    scaleActive: false,
    scaleInvertX: false,
    scaleInvertY: false,
    scaleMax: 0.5
};

const LAYER_PROPS_WITH_DEFAULT = {
    perspectiveZ: null,
    elevation: null
};

export default class Two5 {
    constructor (config = {}) {
        this.config = clone(DEFAULTS, config);
        this.progress = {
            x: 0,
            y: 0
        };

        this.container = this.config.layersContainer || null;

        this.createLayers();

        this.effects = [];
    }

    createLayers () {
        const layersContainer = this.container || window.document.body;
        this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
        this.layers = this.layers.map(layer => {
            let config;

            if (layer instanceof Element) {
                config = clone(this.config, { el: layer, ...LAYER_PROPS_WITH_DEFAULT }, layer.dataset);
            }
            else if (typeof layer == 'object' && layer) {
                config = clone(this.config, LAYER_PROPS_WITH_DEFAULT, layer);
            }

            return config;
        }).filter(x => x);
    }

    on () {
        this.setupEvents();
        this.setupEffects();

        // start animating
        window.requestAnimationFrame(() => this.loop());
    }

    off () {
        window.cancelAnimationFrame(this.animationFrame);
        this.teardownEvents();
    }

    loop () {
        this.animationFrame = window.requestAnimationFrame(() => this.loop());

        this.effects.forEach(effect => effect(this.progress));
    }

    setupEvents () {
        const gyroscoeHandler = getGyroscope({
            samples: this.config.gyroscopeSamples,
            maxBeta: this.config.maxBeta,
            maxGamma: this.config.maxGamma,
            progress: this.progress
        });

        if (gyroscoeHandler) {
            this.tiltHandler = gyroscoeHandler;
        }
        else {
            /*
             * No deviceorientation support
             */
            this.tiltHandler = getHover({
                target: this.config.mouseTarget,
                progress: this.progress
            });
        }

        this.tiltHandler.on();
    }

    teardownEvents () {
        this.tiltHandler.off();
    }

    setupEffects () {
        const tilt = getTiltEffect(
            clone(
                this.config,
                { container: this.container, layers: this.layers }
            )
        );

        this.effects.push(tilt);
    }

    teardownEffects () {
        this.effects.length = 0;
    }
}
