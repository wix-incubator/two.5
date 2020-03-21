import { getEffect as getTiltEffect } from './effects/tilt.js';
import { getHandler as getHover } from './events/hover.js';
import { getHandler as getGyroscope } from './events/gyroscope';
import { clone } from './utilities.js';

const DEFAULTS = {
    mouseTarget: null,
    layersContainer: null,
    gyroscopeSamples: 3,
    maxBeta: 15,
    maxGamma: 15,
    scenePerspective: 600,
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

export default class Two5 {
    constructor (config = {}) {
        this.config = clone(DEFAULTS, config);
        this.progress = {
            x: 0,
            y: 0
        };

        let layersContainer;

        if (this.config.layersContainer) {
            layersContainer = this.config.layersContainer;
            this.container = layersContainer;
        }
        else {
            layersContainer = window.document.body;
            this.container = null;
        }

        this.layers = [...layersContainer.querySelectorAll('[data-tilt-layer]')].map(el => ({el}));
        this.effects = [];
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
        const tilt = getTiltEffect({
            container: this.container,
            layers: this.layers,
            scenePerspective: this.config.scenePerspective,
            elevation: this.config.elevation,
            transition: {
                active: this.config.transitionActive,
                duration: this.config.transitionDuration,
                easing: this.config.transitionEasing
            },
            perspective: {
                active: this.config.perspectiveActive,
                invertX: this.config.perspectiveInvertX,
                invertY: this.config.perspectiveInvertY,
                max: this.config.perspectiveMax
            },
            translation: {
                active: this.config.translationActive,
                invertX: this.config.translationInvertX,
                invertY: this.config.translationInvertY,
                max: this.config.translationMax
            },
            rotation: {
                active: this.config.rotationActive,
                invertX: this.config.rotationInvertX,
                invertY: this.config.rotationInvertY,
                max: this.config.rotationMax
            },
            skewing: {
                active: this.config.skewActive,
                invertX: this.config.skewInvertX,
                invertY: this.config.skewInvertY,
                max: this.config.skewMax
            },
            scaling: {
                active: this.config.scaleActive,
                invertX: this.config.scaleInvertX,
                invertY: this.config.scaleInvertY,
                max: this.config.scaleMax
            }
        });

        this.effects.push(tilt);
    }

    teardownEffects () {
        this.effects.length = 0;
    }
}
