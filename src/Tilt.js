import { getEffect as getTiltEffect } from './effects/tilt.js';
import { getHandler as getHover } from './events/hover.js';
import { getHandler as getGyroscope } from './events/gyroscope.js';
import { clone } from './utilities.js';
import Two5 from './Two5.js';

export default class Tilt extends Two5 {
    constructor (config = {}) {
        super(config);

        this.container = this.config.layersContainer || null;

        this.createLayers();
    }

    createLayers () {
        const layersContainer = this.container || window.document.body;
        this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
        this.layers = this.layers.map(layer => {
            let config;

            if (layer instanceof Element) {
                config = Object.assign({ el: layer }, layer.dataset);
            }
            else if (typeof layer == 'object' && layer) {
                config = layer;
            }

            return config;
        }).filter(x => x);
    }

    getEffects () {
        return [getTiltEffect(
            clone(
                { invertRotation: !!this.usingGyroscope },
                this.config,
                { container: this.container, layers: this.layers }
            )
        )];
    }

    setupEvents () {
        const gyroscoeHandler = getGyroscope({
            progress: this.progress,
            samples: this.config.gyroscopeSamples,
            maxBeta: this.config.maxBeta,
            maxGamma: this.config.maxGamma
        });

        if (gyroscoeHandler) {
            this.usingGyroscope = true;
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
}
