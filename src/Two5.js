import { defaultTo, lerp } from './utilities.js';

/**
 * @typedef {Ticker}
 * @property {Set} pool
 * @property {number} animationFrame
 */
export const ticker = {
    pool: new Set(),
    /**
     * Starts the animation loop.
     */
    start () {
        if ( ! ticker.animationFrame ) {
            const loop = () => {
                ticker.animationFrame = window.requestAnimationFrame(loop);
                ticker.tick();
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
     */
    tick () {
        for (let instance of ticker.pool) {
            instance.tick();
        }
    },

    /**
     * Add an instance to the pool.
     *
     * @param {Two5} instance
     */
    add (instance) {
        ticker.pool.add(instance);
        instance.ticking = true;

        if ( ticker.pool.size ) {
            ticker.start();
        }
    },

    /**
     * Remove an instance from the pool.
     *
     * @param {Two5} instance
     */
    remove (instance) {
        if ( ticker.pool.delete(instance) ) {
            instance.ticking = false;
        }

        if ( ! ticker.pool.size ) {
            ticker.stop();
        }
    }
};

/**
 * @private
 * @type {two5Config}
 */
const DEFAULTS = {
    ticker,
    animationActive: false,
    animationFriction: 0.4,
    velocityActive: false,
    velocityMax: 1
};

/**
 * Initialize a WebGL target with effects.
 *
 * @class Two5
 * @abstract
 * @param {two5Config} config
 */
export class Two5 {
    constructor (config = {}) {
        this.config = defaultTo(config, DEFAULTS);
        this.progress = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
        };
        this.currentProgress = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
        };

        this.triggers = [];
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
        // choose the object we iterate on
        const progress = this.config.animationActive ? this.currentProgress : this.progress;
        // cache values for calculating deltas for velocity
        const {x, y} = progress;

        // if animation is active interpolate to next point
        if (this.config.animationActive) {
            this.lerp();
        }

        if (this.config.velocityActive) {
            const dx = progress.x - x;
            const dy = progress.y - y;
            const factorX = dx < 0 ? -1 : 1;
            const factorY = dy < 0 ? -1 : 1;
            progress.vx = Math.min(this.config.velocityMax, Math.abs(dx)) / this.config.velocityMax * factorX;
            progress.vy = Math.min(this.config.velocityMax, Math.abs(dy)) / this.config.velocityMax * factorY;
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
     * Clears registered effects and triggers.
     */
    teardownEffects () {
        this.triggers.length = 0;
        this.effects.length = 0;
    }

    /**
     * Stop all events and effects, and remove all DOM side effects.
     */
    destroy () {
        this.off();
        this.teardownEffects();
    }
}
