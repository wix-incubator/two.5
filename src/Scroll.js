import { getEffect as getScrollController } from './effects/scroll-controller.js';
import { getHandler as getScroll } from './events/scroll.js';
import Two5 from './Two5.js';

export default class Scroll extends Two5 {
    constructor (config = {}) {
        super(config);

        this.config.resetProgress = this.config.resetProgress || this.resetProgress.bind(this);
    }

    resetProgress ({x, y}) {
        this.progress.x = x;
        this.progress.y = y;

        if ( this.config.animationActive) {
            this.currentProgress.x = x;
            this.currentProgress.y = y;
        }

        window.scrollTo(x, y);
    }

    getEffects () {
        return [getScrollController(this.config)];
    }

    setupEvents () {
        this.measures.push(getScroll().handler);
    }

    teardownEvents () {
        this.measures.length = 0;
    }
}
