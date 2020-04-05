import { getEffect as getScrollController } from './effects/scroll-controller.js';
import { getHandler as getScroll } from './events/scroll.js';
import { clone } from './utilities.js';
import Two5 from './Two5.js';

export default class Scroll extends Two5 {
    constructor (config = {}) {
        super(config);

        this.container = this.config.container || null;
        this.scenes = this.config.scenes || [];
    }

    getEffects () {
        return [getScrollController(
            clone(
                this.config,
                { container: this.container, scenes: this.scenes }
            )
        )];
    }

    setupEvents () {
        this.measures.push(getScroll().handler);
    }

    teardownEvents () {
        this.measures.length = 0;
    }
}
