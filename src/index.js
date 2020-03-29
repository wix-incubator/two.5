import { getEffect as getTiltEffect } from './effects/tilt-css.js';
import { getHandler as getHover } from './events/hover.js';
import { getHandler as getGyroscope } from './events/gyroscope';
import { clone, lerp } from './utilities.js';

const DEFAULTS = {
    mouseTarget: null,
    layersContainer: null,
    layers: null,
    gyroscopeSamples: 3,
    maxBeta: 15,
    maxGamma: 15
};

export default class Two5 {
    constructor (config = {}) {
        this.config = config;
        this.progress = {
            x: 0,
            y: 0
        };
        this.currentProgress = {
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
                config = clone({ el: layer }, layer.dataset);
            }
            else if (typeof layer == 'object' && layer) {
                config = clone(layer);
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

        if (this.config.animationActive) {
            this.lerp();
        }

        this.effects.forEach(
            effect => effect(
                this.config.animationActive
                    ? this.currentProgress
                    : this.progress
            )
        );
    }

    lerp () {
        this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.animationFriction);
        this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.animationFriction);
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
