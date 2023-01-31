import { getEffect as getScrollController } from './effects/scroll-controller.js';
import { defaultTo, frameThrottle, lerp } from './utilities.js';
import { ticker } from './Two5.js';

/**
 * @private
 * @type {two5Config}
 */
const DEFAULTS = {
    ticker,
    transitionActive: false,
    transitionFriction: 0.4,
    velocityActive: false,
    velocityMax: 1
};

/**
 * @class Scroll
 * @param {scrollConfig} config
 *
 * @example
 * import { Scroll } from 'two.5';
 *
 * const scroll = new Scroll({
 *     container: document.querySelector('main'),
 *     wrapper: document.querySelector('body > div'),
 *     scenes: [...]
 * });
 * scroll.start();
 */
export default class Scroll {
    constructor (config = {}) {
        this.config = defaultTo(config, DEFAULTS);

        this.progress = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            vx: 0,
            vy: 0
        };
        this.currentProgress = {
            x: 0,
            y: 0,
            prevX: 0,
            prevY: 0,
            vx: 0,
            vy: 0
        };

        this.effects = [];
        this.ticking = false;
        this.ticker = this.config.ticker;
        this.config.root = this.config.root || window;
        this.config.resetProgress = this.config.resetProgress || this.resetProgress.bind(this);

        this._measure = this.config.measure || (() => {
            const root = this.config.root
            // get current scroll position from window or element
            this.progress.x = root.scrollX || root.scrollLeft || 0;
            this.progress.y = root.scrollY || root.scrollTop || 0;
        });

        this._trigger = frameThrottle(() => {
            this._measure?.();
            this.tick()
        });
    }

    /**
     * Setup event and effects, and starts animation loop.
     */
    start () {
        this.setupEvent();
        this.setupEffects();

        // start animating
        this.ticker.add(this);
    }

    /**
     * Removes event and stops animation loop.
     */
    pause () {
        // stop animation
        this.ticker.remove(this);
        this.removeEvent();
    }

    /**
     * Reset progress in the DOM and inner state to given x and y.
     *
     * @param {Object} progress
     * @param {number} progress.x
     * @param {number} progress.y
     */
    resetProgress ({x, y}) {
        this.progress.x = x;
        this.progress.y = y;
        this.progress.prevX = x;
        this.progress.prevY = y;
        this.progress.vx = 0;
        this.progress.vy = 0;

        if ( this.config.transitionActive ) {
            this.currentProgress.x = x;
            this.currentProgress.y = y;
            this.currentProgress.prevX = x;
            this.currentProgress.prevY = y;
            this.currentProgress.vx = 0;
            this.currentProgress.vy = 0;
        }

        this.config.root.scrollTo(x, y);
    }

    /**
     * Handle animation frame work.
     */
    tick () {
        // choose the object we iterate on
        const progress = this.config.transitionActive ? this.currentProgress : this.progress;

        // if transition is active interpolate to next point
        if (this.config.transitionActive) {
            this.lerp();
        }

        if (this.config.velocityActive) {
            const dx = progress.x - progress.prevX;
            const dy = progress.y - progress.prevY;
            const factorX = dx < 0 ? -1 : 1;
            const factorY = dy < 0 ? -1 : 1;
            progress.vx = Math.min(this.config.velocityMax, Math.abs(dx)) / this.config.velocityMax * factorX;
            progress.vy = Math.min(this.config.velocityMax, Math.abs(dy)) / this.config.velocityMax * factorY;
        }

        const progress_ = this.config.transitionActive
            ? this.currentProgress
            : this.progress

        // update effects
        for (let effect of this.effects) {
            effect(progress_);
        }

        progress_.prevX = progress.x;
        progress_.prevY = progress.y;
    }

    /**
     * Calculate current progress.
     */
    lerp () {
        this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.transitionFriction);
        this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.transitionFriction);
    }

    /**
     * Stop the event and effects, and remove all DOM side-effects.
     */
    destroy () {
        this.pause();
        this.removeEffects();
    }

    /**
     * Register to scroll for triggering update.
     */
    setupEvent () {
        this.config.root.addEventListener('scroll', this._trigger);
    }

    /**
     * Remove scroll handler.
     */
    removeEvent () {
        this.config.root.removeEventListener('scroll', this._trigger);
    }

    /**
     * Reset registered effect.
     */
    setupEffects () {
        this.removeEffects();
        this.effects = [getScrollController(this.config)];
    }

    /**
     * Remove registered effects.
     */
    removeEffects () {
        for (let effect of this.effects) {
            effect.destroy && effect.destroy();
        }
        this.effects.length = 0;
    }
}

/**
 * @typedef {Object} SnapPoint
 * @property {number} start scroll position in pixels where virtual scroll starts snapping.
 * @property {number} [duration] duration in pixels for virtual scroll snapping. Defaults to end - start.
 * @property {number} [end] scroll position in pixels where virtual scroll starts snapping. Defaults to start + duration.
 *
 * @typedef {Object} ScrollScene
 * @property {number} start scroll position in pixels where effect starts.
 * @property {number} [duration] duration of effect in pixels. Defaults to end - start.
 * @property {number} [end] scroll position in pixels where effect ends. Defaults to start + duration.
 * @property {function} effect the effect to perform.
 * @property {boolean} [pauseDuringSnap] whether to pause the effect during snap points, effectively ignoring scroll during duration of scroll snapping.
 * @property {boolean} [disabled] whether to perform updates on the scene. Defaults to false.
 * @property {Element} [viewport] an element to be used for observing intersection with viewport for disabling/enabling the scene.
 *
 * @typedef {object} scrollConfig
 * @property {boolean} [transitionActive] whether to animate effect progress.
 * @property {number} [transitionFriction] between 0 to 1, amount of friction effect in the transition. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {boolean} [velocityActive] whether to calculate velocity with progress.
 * @property {number} [velocityMax] max possible value for velocity. Velocity value will be normalized according to this number, so it is kept between 0 and 1. Defaults to 1.
 * @property {boolean} [observeSize] whether to observe size changes of `container`. Defaults to `true`.
 * @property {boolean} [observeViewport] whether to observe entry/exit of scenes into viewport for disabling/enabling them. Defaults to `true`.
 * @property {boolean} [viewportRootMargin] `rootMargin` option to be used for viewport observation. Defaults to `'7% 7%'`.
 * @property {Element|Window} [root] the scrollable element, defaults to window.
 * @property {Element} [wrapper] element to use as the fixed, viewport sized layer, that clips and holds the scroll content container. If not provided, no setup is done.
 * @property {Element|null} [container] element to use as the container for the scrolled content. If not provided assuming native scroll is desired.
 * @property {ScrollScene[]} scenes list of effect scenes to perform during scroll.
 * @property {SnapPoint[]} [snaps] list of scroll snap points.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollHandler] if using a container, this allows overriding the function used for scrolling the content. Defaults to setting `style.transform`.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollClear] if using a container, this allows overriding the function used for clearing content scrolling side-effects when effect is removed. Defaults to clearing `container.style.transform`.
 */
