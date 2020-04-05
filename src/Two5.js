import { defaultTo, lerp } from './utilities.js';

const DEFAULTS = {
    animationActive: false,
    animationFriction: 0.4
};

export default class Two5 {
    constructor (config = {}) {
        this.config = defaultTo(config, DEFAULTS);
        this.progress = {
            x: 0,
            y: 0
        };
        this.currentProgress = {
            x: 0,
            y: 0
        };

        this.measures = [];
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

        this.measures.forEach(measure => measure(this.progress));

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

    setupEvents () {}

    teardownEvents () {}

    getEffects () {
        return [];
    }

    setupEffects () {
        this.effects.push(...this.getEffects());
    }

    teardownEffects () {
        this.measures.length = 0;
        this.effects.length = 0;
    }
}
