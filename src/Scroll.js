import { getEffect as getScrollController } from './effects/scroll-controller.js';
import { getHandler as getScroll } from './events/scroll.js';
import Two5 from './Two5.js';

/**
 * @class Scroll
 * @extends Two5
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
 * scroll.on();
 */
export default class Scroll extends Two5 {
    constructor (config = {}) {
        super(config);

        this.config.root = this.config.root || window;
        this.config.resetProgress = this.config.resetProgress || this.resetProgress.bind(this);
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
        this.progress.vx = 0;
        this.progress.vy = 0;

        if ( this.config.animationActive) {
            this.currentProgress.x = x;
            this.currentProgress.y = y;
            this.currentProgress.vx = 0;
            this.currentProgress.vy = 0;
        }

        this.config.root.scrollTo(x, y);
    }

    /**
     * Initializes and returns scroll controller.
     *
     * @return {function[]}
     */
    getEffects () {
        return [getScrollController(this.config)];
    }

    /**
     * Register scroll position measuring.
     */
    setupEvents () {
        const config = {
            root: this.config.root,
            progress: this.progress
        };
        this.measures.push(getScroll(config).handler);
    }

    /**
     * Remove scroll measuring handler.
     */
    teardownEvents () {
        this.measures.length = 0;
    }

    teardownEffects () {
        this.effects.forEach(effect => effect.destroy && effect.destroy());

        super.teardownEffects();
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
 *
 * @typedef {object} scrollConfig
 * @property {boolean} [animationActive] whether to animate effect progress.
 * @property {number} [animationFriction] between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {boolean} [velocityActive] whether to calculate velocity with progress.
 * @property {number} [velocityMax] max possible value for velocity. Velocity value will be normalized according to this number, so it is kept between 0 and 1. Defaults to 1.
 * @property {boolean} [observeSize] whether to observe size changes of `container`. Defaults to `true`.
 * @property {Element|Window} [root] the scrollable element, defaults to window.
 * @property {Element} [wrapper] element to use as the fixed, viewport sized layer, that clips and holds the scroll content container. If not provided, no setup is done.
 * @property {Element|null} [container] element to use as the container for the scrolled content. If not provided assuming native scroll is desired.
 * @property {ScrollScene[]} scenes list of effect scenes to perform during scroll.
 * @property {SnapPoint[]} snaps list of scroll snap points.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollHandler] if using a container, this allows overriding the function used for scrolling the content. Defaults to setting `style.transform`.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollClear] if using a container, this allows overriding the function used for clearing content scrolling side-effects when effect is removed. Defaults to clearing `container.style.transform`.
 */
