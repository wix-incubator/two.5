import { getEffect as getTiltEffect } from './effects/tilt.js';
import { getHandler as getHover } from './events/hover.js';
import { getHandler as getGyroscope } from './events/gyroscope.js';
import { clone } from './utilities.js';
import { Two5 } from './Two5.js';

/**
 * @class Tilt
 * @extends Two5
 * @param {tiltConfig} config
 *
 * @example
 * import { Tilt } from 'two.5';
 *
 * const tilt = new Tilt();
 * tilt.on();
 */
export default class Tilt extends Two5 {
    constructor (config = {}) {
        super(config);

        this.container = this.config.layersContainer || null;

        this.createLayers();
    }

    /**
     * Creates config of layers to be animated during the effect.
     */
    createLayers () {
        // container defaults to document.body
        const layersContainer = this.container || window.document.body;
        // use config.layers or query elements from DOM
        this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
        this.layers = this.layers.map(layer => {
            let config;

            // if layer is an Element convert it to a TiltLayer object and augment it with data attributes
            if (layer instanceof Element) {
                config = Object.assign({ el: layer }, layer.dataset);
            }
            else if (typeof layer == 'object' && layer) {
                config = layer;
            }

            return config;
            // discard garbage
        }).filter(x => x);
    }

    /**
     * Initializes and returns tilt effect.
     *
     * @return {[function]}
     */
    getEffects () {
        return [getTiltEffect(
            // we invert rotation transform order in case of device orientation,
            // see: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms#Orientation_compensation
            clone(
                { invertRotation: !!this.usingGyroscope },
                this.config,
                { container: this.container, layers: this.layers }
            )
        )];
    }

    /**
     * Setup event handler for tilt effect.
     * First attempts to setup handler for DeviceOrientation event.
     * If feature detection fails, handler is set on MouseOver event.
     */
    setupEvents () {
        // attempt usage of DeviceOrientation event
        const gyroscopeHandler = getGyroscope({
            progress: this.progress,
            samples: this.config.gyroscopeSamples,
            maxBeta: this.config.maxBeta,
            maxGamma: this.config.maxGamma
        });

        if (gyroscopeHandler) {
            this.usingGyroscope = true;
            this.tiltHandler = gyroscopeHandler;
        }
        else {
            /*
             * No deviceorientation support
             * Use mouseover event.
             */
            this.tiltHandler = getHover({
                target: this.config.mouseTarget,
                progress: this.progress
            });
        }

        this.tiltHandler.on();
    }

    /**
     * Removes registered event handler.
     */
    teardownEvents () {
        this.tiltHandler.off();
    }
}

/**
 * @typedef {Object} TiltLayer
 * @property {Element} el element to perform effect on.
 * @property {number} [depth] factor between 0 and 1 multiplying all effect values.
 * @property {number} [perspectiveZ]
 * @property {number} [elevation]
 * @property {boolean} [transitionActive]
 * @property {number} [transitionDuration]
 * @property {number} [transitionEasing]
 * @property {boolean} [perspectiveActive]
 * @property {boolean} [perspectiveInvertX]
 * @property {boolean} [perspectiveInvertY]
 * @property {number} [perspectiveMaxX]
 * @property {number} [perspectiveMaxY]
 * @property {boolean} [translationActive]
 * @property {boolean} [translationInvertX]
 * @property {boolean} [translationInvertY]
 * @property {number} [translationMaxX]
 * @property {number} [translationMaxY]
 * @property {boolean} [rotateActive]
 * @property {boolean} [rotateInvert]
 * @property {number} [rotateMax]
 * @property {boolean} [tiltActive]
 * @property {boolean} [tiltInvertX]
 * @property {boolean} [tiltInvertY]
 * @property {number} [tiltMaxX]
 * @property {number} [tiltMaxY]
 * @property {boolean} [skewActive]
 * @property {boolean} [skewInvertX]
 * @property {boolean} [skewInvertY]
 * @property {number} [skewMaxX]
 * @property {number} [skewMaxY]
 * @property {boolean} [scaleActive]
 * @property {boolean} [scaleInvertX]
 * @property {boolean} [scaleInvertY]
 * @property {number} [scaleMaxX]
 * @property {number} [scaleMaxY]
 *
 * @typedef {Object} tiltConfig
 * @property {boolean} [animationActive] whether to animate effect progress.
 * @property {number} [animationFriction] between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {number} [maxBeta]
 * @property {number} [maxGamma]
 * @property {number} [gyroscopeSamples]
 * @property {Element} [mouseTarget]
 * @property {Element} [layersContainer]
 * @property {Element[]|TiltLayer[]} layers
 */

/** @typedef {Object} gyroscopeConfig
 * @property {number} [maxBeta]
 * @property {number} [maxGamma]
 * @property {number} [samples]
 * @property {number} progress
 */
