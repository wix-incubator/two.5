import { getEffect as getTiltEffect } from './effects/tilt.js';
import { getHandler as getHover } from './events/hover.js';
// import * as getGyroscope from './events/gyroscope';
import { clone } from './utilities.js';

const DEFAULTS = {
    mouseTarget: null,
    layersContainer: null,
    samples: 10,
    maxBeta: 30,
    maxGamma: 30,
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
        if (this.config.mouseTarget) {
            this.tiltTarget = this.config.mouseTarget;
            this.rect = clone(this.tiltTarget.getBoundingClientRect().toJSON());
        }
        else {
            this.tiltTarget = window;
            this.rect = {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        this.hoverHandler = getHover({
            target: this.progress,
            rect: this.rect
        });

        this.tiltTarget.addEventListener('mousemove', this.hoverHandler);
    }

    teardownEvents () {
        this.tiltTarget.removeEventListener('mousemove', this.hoverHandler);
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
}
