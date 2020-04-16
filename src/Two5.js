import { defaultTo, lerp } from './utilities.js';

const ticker = {
    pool: [],
    /**
     * Starts the animation loop.
     */
    start () {
        if ( ! ticker.animationFrame ) {
            const loop = (time) => {
                ticker.animationFrame = window.requestAnimationFrame(loop);
                ticker.tick(time);
            };

            ticker.animationFrame = window.requestAnimationFrame(loop);
        }
    },

    /**
     * Stops the animation loop.
     */
    stop () {
        window.cancelAnimationFrame(ticker.animationFrame);
        ticker.animationFrame = null;
    },

    /**
     * Invoke `.tick()` on all instances in the pool.
     *
     * @param {number} time animation frame time argument.
     */
    tick (time) {
        ticker.pool.forEach(instance => instance.tick(time));
    },

    /**
     * Add an instance to the pool.
     *
     * @param {Two5} instance
     */
    add (instance) {
        const index = ticker.pool.indexOf(instance);

        if ( ! ~ index ) {
            ticker.pool.push(instance);
            instance.ticking = true;
        }

        if ( ticker.pool.length ) {
            ticker.start();
        }
    },

    /**
     * Remove an instance from the pool.
     *
     * @param {Two5} instance
     */
    remove (instance) {
        const index = ticker.pool.indexOf(instance);

        if ( ~ index ) {
            ticker.pool.splice(index, 1);
            instance.ticking = false;
        }

        if ( ! ticker.pool.length ) {
            ticker.stop();
        }
    }
};

const DEFAULTS = {
    ticker,
    animationActive: false,
    animationFriction: 0.4
};

/**
 * Initialize a WebGL target with effects.
 *
 * @class Two5
 * @abstract
 * @param {two5Config} config
 */
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
        this.ticking = false;
        this.ticker = this.config.ticker;
    }

    /**
     * Setup events and effects, and starts animation loop.
     */
    on () {
        this.setupEvents();
        this.setupEffects();

        // start animating
        this.ticker.add(this);
    }

    /**
     * Removes events and stops animation loop.
     */
    off () {
        // stop animation
        this.ticker.remove(this);
        this.teardownEvents();
    }

    /**
     * Handle animation frame work.
     */
    tick () {
        // perform any registered measures
        this.measures.forEach(measure => measure(this.progress));

        // if animation is active interpolate to next point
        if (this.config.animationActive) {
            this.lerp();
        }

        // perform all registered effects
        this.effects.forEach(
            effect => effect(
                this.config.animationActive
                    ? this.currentProgress
                    : this.progress
            )
        );
    }

    /**
     * Calculate current progress.
     */
    lerp () {
        this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.animationFriction);
        this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.animationFriction);
    }

    setupEvents () {}

    teardownEvents () {}

    /**
     * Returns a list of effect functions for registering.
     *
     * @return {function[]} list of effects to perform
     */
    getEffects () {
        return [];
    }

    /**
     * Registers effects.
     */
    setupEffects () {
        this.effects.push(...this.getEffects());
    }

    /**
     * Clears registered effects and measures.
     */
    teardownEffects () {
        this.measures.length = 0;
        this.effects.length = 0;
    }
}

/**
 * @typedef {Object} two5Config
 * @property {boolean} animationActive whether to animate effect progress.
 * @property {number} animationFriction between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 */
