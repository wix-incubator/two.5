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

        if ( this.config.animationActive) {
            this.currentProgress.x = x;
            this.currentProgress.y = y;
        }

        window.scrollTo(x, y);
    }

    /**
     * Initializes and returns scroll controller.
     *
     * @return {[controller]}
     */
    getEffects () {
        return [getScrollController(this.config)];
    }

    /**
     * Register scroll position measuring.
     */
    setupEvents () {
        this.measures.push(getScroll().handler);
    }

    /**
     * Remove scroll measuring handler.
     */
    teardownEvents () {
        this.measures.length = 0;
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
 * @property {boolean} animationActive whether to animate effect progress.
 * @property {number} animationFriction between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {Element} [wrapper] element to use as the fixed, viewport sized layer, that clips and holds the scroll content container. If not provided, no setup is done.
 * @property {Element|null} [container] element to use as the container for the scrolled content. If not provided assuming native scroll is desired.
 * @property {ScrollScene[]} scenes list of effect scenes to perform during scroll.
 * @property {SnapPoint[]} snaps list of scroll snap points.
 * @property {function} [scrollHandler] if using a container, this allows overriding the function used for scrolling the content. Defaults to setting `style.transform`.
 */
