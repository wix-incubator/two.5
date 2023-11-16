/**
 * Clamps a value between limits.
 *
 * @param {number} min lower limit
 * @param {number} max upper limit
 * @param {number} value value to clamp
 * @return {number} clamped value
 *
 * @example
 * const x = clamp(0, 1, 1.5); // returns 1
 */
function clamp(min, max, value) {
  return Math.min(Math.max(min, value), max);
}

/**
 * Returns a new Object with the properties of the first argument
 * assigned to it, and the second argument as its prototype, so
 * its properties are served as defaults.
 *
 * @param {Object} obj properties to assign
 * @param {Object|null} defaults
 * @return {Object}
 */
function defaultTo(obj, defaults) {
  return Object.assign(Object.create(defaults), obj);
}

/**
 * Copies all given objects into a new Object.
 *
 * @param {...Object} objects
 * @return {Object}
 */
function clone(...objects) {
  return Object.assign({}, ...objects);
}

/**
 * Interpolate from a to b by the factor t.
 *
 * @param {number} a start point
 * @param {number} b end point
 * @param {number} t interpolation factor
 * @return {number}
 */
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

/**
 * Throttle a function to trigger once per animation frame.
 * Keeps the arguments from last call, even if that call gets ignored.
 *
 * @param {function} fn function to throttle
 * @return {(function(): void)}
 */
function frameThrottle(fn) {
  let throttled = false;
  return function () {
    if (!throttled) {
      throttled = true;
      window.requestAnimationFrame(() => {
        throttled = false;
        fn();
      });
    }
  };
}
function map(x, a, b, c, d) {
  return (x - a) * (d - c) / (b - a) + c;
}

/**
 * @private
 * @type {scrollConfig}
 */
const DEFAULTS$4 = {
  horizontal: false,
  observeSize: true,
  observeViewport: true,
  viewportRootMargin: '7% 7%',
  scrollHandler(container, wrapper, x, y) {
    container.style.transform = `translate3d(${-x}px, ${-y}px, 0px)`;
  },
  scrollClear(container /*, wrapper, x, y */) {
    container.style.transform = '';
  }
};

/*
 * Utilities for scroll controller
 */

/**
 * Utility for calculating the virtual scroll position, taking snap points into account.
 *
 * @private
 * @param {number} p real scroll position
 * @param {[number[]]} snaps list of snap point
 * @return {number} virtual scroll position
 */
function calcPosition(p, snaps) {
  let _p = p;
  let extra = 0;
  for (const [start, end] of snaps) {
    if (p < start) break;
    if (p >= end) {
      extra += end - start;
    } else {
      _p = start;
      break;
    }
  }
  return _p - extra;
}

/**
 * Utility for calculating effect progress.
 *
 * @private
 * @param {number} p current scroll position
 * @param {number} start start position
 * @param {number} end end position
 * @param {number} duration duration of effect in scroll pixels
 * @return {number} effect progress, between 0 and 1
 */
function calcProgress(p, start, end, duration) {
  let progress = 0;
  if (p >= start && p <= end) {
    progress = duration ? (p - start) / duration : 1;
  } else if (p > end) {
    progress = 1;
  }
  return progress;
}

/*
 * Scroll controller factory
 */
/**
 * Initialize and return a scroll controller.
 *
 * @private
 * @param {scrollConfig} config
 * @return {function}
 */
function getEffect$1(config) {
  const _config = defaultTo(config, DEFAULTS$4);
  const root = _config.root;
  const body = _config.root === window ? window.document.body : _config.root;
  const container = _config.container;
  const wrapper = _config.wrapper;
  const horizontal = _config.horizontal;
  const scenesByElement = new WeakMap();

  /*
   * Prepare snap points data.
   */
  const snaps = (_config.snaps || []
  // sort points by start position
  ).sort((a, b) => a.start > b.start ? 1 : -1)
  // map objects to arrays of [start, end]
  .map(snap => {
    const {
      start,
      duration,
      end
    } = snap;
    return [start, end == null ? start + duration : end];
  });

  // calculate extra scroll if we have snaps
  const extraScroll = snaps.reduce((acc, snap) => acc + (snap[1] - snap[0]), 0);
  let lastX, lastY;
  let resizeObserver, viewportObserver;

  /*
   * Prepare scenes data.
   */
  _config.scenes.forEach(scene => {
    if (scene.end == null) {
      scene.end = scene.start + scene.duration;
    } else if (scene.duration == null) {
      scene.duration = scene.end - scene.start;
    }
  });

  /*
   * Setup Smooth Scroll technique
   */
  if (container) {
    function setSize() {
      // calculate total scroll height/width
      // set width/height on the body element
      if (horizontal) {
        const totalWidth = container.offsetWidth + container.offsetLeft + (horizontal ? extraScroll : 0);
        body.style.width = `${totalWidth}px`;
      } else {
        const totalHeight = container.offsetHeight + container.offsetTop + (horizontal ? 0 : extraScroll);
        body.style.height = `${totalHeight}px`;
      }
    }
    setSize();
    if (_config.observeSize && window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(setSize);
      resizeObserver.observe(container, {
        box: 'border-box'
      });
    }

    /*
     * Setup wrapper element and reset progress.
     */
    if (wrapper) {
      if (!wrapper.contains(container)) {
        console.error('When defined, the wrapper element %o must be a parent of the container element %o', wrapper, container);
        throw new Error('Wrapper element is not a parent of container element');
      }

      // if we got a wrapper element set its style
      Object.assign(wrapper.style, {
        position: 'fixed',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      });

      // get current scroll position (support window, element and window in IE)
      let x = root.scrollX || root.pageXOffset || root.scrollLeft || 0;
      let y = root.scrollY || root.pageYOffset || root.scrollTop || 0;

      // increment current scroll position by accumulated snap point durations
      if (horizontal) {
        x = snaps.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, x);
      } else {
        y = snaps.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, y);
      }

      // update scroll and progress to new calculated position
      _config.resetProgress({
        x,
        y
      });

      // render current position
      controller({
        x,
        y,
        vx: 0,
        vy: 0
      });
    }
  }

  /*
   * Observe entry and exit of scenes into view
   */
  if (_config.observeViewport && window.IntersectionObserver) {
    viewportObserver = new window.IntersectionObserver(function (intersections) {
      intersections.forEach(intersection => {
        (scenesByElement.get(intersection.target) || []).forEach(scene => {
          scene.disabled = !intersection.isIntersecting;
        });
      });
    }, {
      root: wrapper || null,
      rootMargin: _config.viewportRootMargin,
      threshold: 0
    });
    _config.scenes.forEach(scene => {
      if (scene.viewport) {
        let scenesArray = scenesByElement.get(scene.viewport);
        if (!scenesArray) {
          scenesArray = [];
          scenesByElement.set(scene.viewport, scenesArray);
          viewportObserver.observe(scene.viewport);
        }
        scenesArray.push(scene);
      }
    });
  }

  /**
   * Scroll scenes controller.
   * Takes progress object and orchestrates scenes.
   *
   * @private
   * @param {Object} progress
   * @param {number} progress.x
   * @param {number} progress.y
   * @param {number} progress.vx
   * @param {number} progress.vy
   */
  function controller({
    x,
    y,
    vx,
    vy
  }) {
    x = +x.toFixed(1);
    y = +y.toFixed(1);
    const velocity = horizontal ? +vx.toFixed(4) : +vy.toFixed(4);

    // if nothing changed bail out
    if (x === lastX && y === lastY) return;
    let _x = x,
      _y = y;
    if (snaps.length) {
      // we have snap points so calculate virtual position
      if (horizontal) {
        _x = calcPosition(x, snaps);
        _y = 0;
      } else {
        _y = calcPosition(y, snaps);
        _x = 0;
      }
    }
    if (container) {
      // handle content scrolling
      _config.scrollHandler(container, wrapper, _x, _y);
    }

    /*
     * Perform scene progression.
     */
    _config.scenes.forEach(scene => {
      // if active
      if (!scene.disabled) {
        const {
          start,
          end,
          duration
        } = scene;
        // get global scroll progress
        const t = horizontal ? scene.pauseDuringSnap ? _x : x : scene.pauseDuringSnap ? _y : y;

        // calculate scene's progress
        const progress = calcProgress(t, start, end, duration);

        // run effect
        scene.effect(scene, progress, velocity);
      }
    });

    // cache last position
    lastX = x;
    lastY = y;
  }
  controller.destroy = function () {
    if (container) {
      if (horizontal) {
        body.style.width = '';
      } else {
        body.style.height = '';
      }
      if (wrapper) {
        Object.assign(wrapper.style, {
          position: '',
          width: '',
          height: '',
          overflow: ''
        });
      }
      _config.scrollClear(container);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    }
    if (viewportObserver) {
      viewportObserver.disconnect();
      controller.viewportObserver = viewportObserver = null;
    }
  };
  controller.viewportObserver = viewportObserver;
  return controller;
}

/**
 * @typedef {Ticker}
 * @property {Set} pool
 * @property {number} animationFrame
 */
const ticker = {
  pool: new Set(),
  /**
   * Starts the animation loop.
   */
  start() {
    if (!ticker.animationFrame) {
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
  stop() {
    window.cancelAnimationFrame(ticker.animationFrame);
    ticker.animationFrame = null;
  },
  /**
   * Invoke `.tick()` on all instances in the pool.
   */
  tick() {
    for (let instance of ticker.pool) {
      instance.tick();
    }
  },
  /**
   * Add an instance to the pool.
   *
   * @param {Two5} instance
   */
  add(instance) {
    ticker.pool.add(instance);
    instance.ticking = true;
    if (ticker.pool.size) {
      ticker.start();
    }
  },
  /**
   * Remove an instance from the pool.
   *
   * @param {Two5} instance
   */
  remove(instance) {
    if (ticker.pool.delete(instance)) {
      instance.ticking = false;
    }
    if (!ticker.pool.size) {
      ticker.stop();
    }
  }
};

/**
 * @private
 * @type {two5Config}
 */
const DEFAULTS$3 = {
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
class Two5 {
  constructor(config = {}) {
    this.config = defaultTo(config, DEFAULTS$3);
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
  on() {
    this.setupEvents();
    this.setupEffects();

    // start animating
    this.ticker.add(this);
  }

  /**
   * Removes events and stops animation loop.
   */
  off() {
    // stop animation
    this.ticker.remove(this);
    this.teardownEvents();
  }

  /**
   * Handle animation frame work.
   */
  tick() {
    // choose the object we iterate on
    const progress = this.config.animationActive ? this.currentProgress : this.progress;
    // cache values for calculating deltas for velocity
    const {
      x,
      y
    } = progress;

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
    this.effects.forEach(effect => effect(this.config.animationActive ? this.currentProgress : this.progress));
  }

  /**
   * Calculate current progress.
   */
  lerp() {
    this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.animationFriction);
    this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.animationFriction);
  }
  setupEvents() {}
  teardownEvents() {}

  /**
   * Returns a list of effect functions for registering.
   *
   * @return {function[]} list of effects to perform
   */
  getEffects() {
    return [];
  }

  /**
   * Registers effects.
   */
  setupEffects() {
    this.effects.push(...this.getEffects());
  }

  /**
   * Clears registered effects and triggers.
   */
  teardownEffects() {
    this.triggers.length = 0;
    this.effects.length = 0;
  }

  /**
   * Stop all events and effects, and remove all DOM side effects.
   */
  destroy() {
    this.off();
    this.teardownEffects();
  }
}

/**
 * @private
 * @type {two5Config}
 */
const DEFAULTS$2 = {
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
class Scroll {
  constructor(config = {}) {
    this.config = defaultTo(config, DEFAULTS$2);
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
      const root = this.config.root;
      // get current scroll position from window or element
      this.progress.x = root.scrollX || root.scrollLeft || 0;
      this.progress.y = root.scrollY || root.scrollTop || 0;
    });
    this._trigger = frameThrottle(() => {
      this._measure?.();
      this.tick();
    });
  }

  /**
   * Setup event and effects, and starts animation loop.
   */
  start() {
    this.setupEvent();
    this.setupEffects();

    // start animating
    this.ticker.add(this);
  }

  /**
   * Removes event and stops animation loop.
   */
  pause() {
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
  resetProgress({
    x,
    y
  }) {
    this.progress.x = x;
    this.progress.y = y;
    this.progress.prevX = x;
    this.progress.prevY = y;
    this.progress.vx = 0;
    this.progress.vy = 0;
    if (this.config.transitionActive) {
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
  tick() {
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
    const progress_ = this.config.transitionActive ? this.currentProgress : this.progress;

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
  lerp() {
    this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.transitionFriction);
    this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.transitionFriction);
  }

  /**
   * Stop the event and effects, and remove all DOM side-effects.
   */
  destroy() {
    this.pause();
    this.removeEffects();
  }

  /**
   * Register to scroll for triggering update.
   */
  setupEvent() {
    this.config.root.addEventListener('scroll', this._trigger);
  }

  /**
   * Remove scroll handler.
   */
  removeEvent() {
    this.config.root.removeEventListener('scroll', this._trigger);
  }

  /**
   * Reset registered effect.
   */
  setupEffects() {
    this.removeEffects();
    this.effects = [getEffect$1(this.config)];
  }

  /**
   * Remove registered effects.
   */
  removeEffects() {
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

/**
 * @private
 */
const DEFAULTS$1 = {
  // config only
  perspectiveActive: false,
  perspectiveInvertX: false,
  perspectiveInvertY: false,
  perspectiveMaxX: 0,
  perspectiveMaxY: 0,
  invertRotation: false,
  // used for orientation compensation when using deviceorientation event, reference see below

  // layer and config
  perspectiveZ: 600,
  //todo: split to layer and container config
  elevation: 10,
  // todo: why in line 102 we check for config.hasOwnProperty(elevation)?
  transitionDuration: 200,
  // todo: split to layer and container config
  transitionActive: false,
  //todo: split to layer and container config
  transitionEasing: 'ease-out',
  //todo: split to layer and container config
  centerToLayer: false,
  // layer only
  translationActive: true,
  translationEasing: 'linear',
  translationInvertX: false,
  translationInvertY: false,
  translationMaxX: 50,
  translationMaxY: 50,
  rotateActive: false,
  rotateEasing: 'linear',
  rotateInvert: false,
  rotateMax: 45,
  tiltActive: false,
  tiltEasing: 'linear',
  tiltInvertX: false,
  tiltInvertY: false,
  tiltMaxX: 25,
  tiltMaxY: 25,
  skewActive: false,
  skewEasing: 'linear',
  skewInvertX: false,
  skewInvertY: false,
  skewMaxX: 25,
  skewMaxY: 25,
  scaleActive: false,
  scaleEasing: 'linear',
  scaleInvertX: false,
  scaleInvertY: false,
  scaleMaxX: 0.5,
  scaleMaxY: 0.5,
  blurActive: false,
  blurEasing: 'linear',
  blurInvert: false,
  blurMax: 20,
  opacityActive: false,
  opacityEasing: 'linear',
  opacityInvert: false,
  opacityMin: 0.3,
  pointLightActive: false,
  pointLightEasing: 'linear',
  pointLightInvert: false,
  pointLightZ: 20,
  clipActive: false,
  clipEasing: 'linear',
  clipDirection: 'left'
};
function formatTransition({
  property,
  duration,
  easing
}) {
  return `${property} ${duration}ms ${easing}`;
}
function generatePointLightSource({
  id,
  width = 300,
  height = 200,
  z = 20,
  x = 0,
  y = 0
}) {
  return `<svg id="light-canvas-${id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
        <defs>
            <filter id="point-light-${id}">
                <feDiffuseLighting in="SourceGraphic" result="light" lighting-color="white" x="0" y="0" width="100%" height="100%">
                    <fePointLight id="point-light-source-${id}" x="${x}" y="${y}" z="${z}" />
                </feDiffuseLighting>
                <feComposite
                        in="SourceGraphic"
                        in2="light"
                        operator="arithmetic"
                        k1="1"
                        k2="0"
                        k3="0"
                        k4="0" />
            </filter>
        </defs>
    </svg>`;
}
const clipPathDirections = {
  left(x, y) {
    return `polygon(0% 0%, ${x * 100}% 0%, ${x * 100}% 100%, 0% 100%)`;
  },
  right(x, y) {
    return `polygon(100% 0%, ${x * 100}% 0%, ${x * 100}% 100%, 100% 100%)`;
  },
  top(x, y) {
    return `polygon(0% 0%, 0% ${y * 100}%, 100% ${y * 100}%, 100% 0%)`;
  },
  bottom(x, y) {
    return `polygon(0% 100%, 0% ${y * 100}%, 100% ${y * 100}%, 100% 100%)`;
  },
  rect(x, y, easing) {
    const py = ease(easing, Math.abs(y - 0.5) * 2);
    const px = ease(easing, Math.abs(x - 0.5) * 2);
    const r = Math.hypot(px, py);
    return `inset(${r * 100}%)`;
  }
};
function getClipPath(direction, x, y, easing) {
  return `${clipPathDirections[direction](x, y, easing)}`;
}
const EASINGS = {
  linear: x => x,
  quad: x => x * x * Math.sign(x),
  cubic: x => x * x * x,
  quart: x => x * x * x * x * Math.sign(x),
  quint: x => x * x * x * x * x,
  sine: x => 1 - Math.cos(x * Math.PI / 2),
  expo: x => x === 0 ? 0 : Math.pow(2, 10 * Math.abs(x) - 10) * Math.sign(x),
  circ: x => (1 - Math.sqrt(1 - Math.pow(x, 2))) * Math.sign(x)
};
function ease(easing, t) {
  return EASINGS[easing](t);
}
function getEffect(config) {
  const _config = defaultTo(config, DEFAULTS$1);
  const container = _config.container;
  const perspectiveZ = _config.perspectiveZ;
  _config.layers = _config.layers.map(layer => defaultTo(layer, _config));

  /*
   * Init effect
   * also set transition if required.
   */
  if (container) {
    const containerStyle = {
      perspective: `${perspectiveZ}px`
    };
    if (_config.transitionActive && _config.perspectiveActive) {
      containerStyle.transition = formatTransition({
        property: 'perspective-origin',
        duration: _config.transitionDuration,
        easing: _config.transitionEasing
      });
    }
    Object.assign(container.style, containerStyle);
  }

  /*
   * Setup layers styling
   */
  _config.layers.forEach((layer, index) => {
    const layerStyle = {};
    if (!layer.allowPointer) {
      layerStyle['pointer-events'] = 'none';
    }
    if (layer.transitionActive) {
      layerStyle.transition = `${formatTransition({
        property: 'all',
        duration: layer.transitionDuration,
        easing: layer.transitionEasing
      })}`;
    } else {
      delete layerStyle.transition;
    }
    Object.assign(layer.el.style, layerStyle);

    /* Set up filters */
    const filterElement = document.querySelector(`#light-canvas-${index}`);
    if (filterElement) {
      layer.pointLightElement = filterElement;
    }
  });
  return function tilt({
    x: x_,
    y: y_,
    h,
    w
  }) {
    const len = _config.layers.length;
    _config.layers.forEach((layer, index) => {
      const depth = layer.hasOwnProperty('depth') ? layer.depth : (index + 1) / len;
      const translateZVal = layer.hasOwnProperty('elevation') ? layer.elevation : _config.elevation * (index + 1);
      let x = x_,
        y = y_;
      if (layer.centerToLayer) {
        x = x_ + 0.5 - (layer.rect.left + layer.rect.width / 2) / w;
        y = y_ + 0.5 - (layer.rect.top + layer.rect.height / 2) / h;
      }
      let translatePart = '';
      if (layer.translationActive) {
        const tx = ease(layer.translationEasing, 2 * x - 1);
        const ty = ease(layer.translationEasing, 2 * y - 1);
        const translateXVal = layer.translationActive === 'y' ? 0 : (layer.translationInvertX ? -1 : 1) * layer.translationMaxX * tx * depth;
        const translateYVal = layer.translationActive === 'x' ? 0 : (layer.translationInvertY ? -1 : 1) * layer.translationMaxY * ty * depth;
        translatePart = `translate3d(${translateXVal.toFixed(2)}px, ${translateYVal.toFixed(2)}px, ${translateZVal}px)`;
      } else {
        translatePart = `translateZ(${translateZVal}px)`;
      }
      let rotatePart = '';
      let rotateXVal = 0,
        rotateYVal = 0,
        rotateZVal = 0;
      if (layer.rotateActive) {
        const rx = x * 2 - 1;
        const ry = y * 2 - 1;
        const px = ease(layer.rotateEasing, rx);
        const py = ease(layer.rotateEasing, ry);
        const rotateInput = layer.rotateActive === 'x' ? px * layer.rotateMax * depth : layer.rotateActive === 'y' ? py * layer.rotateMax * depth : Math.atan2(ry, rx) * 180 / Math.PI;
        rotateZVal = (layer.rotateInvert ? -1 : 1) * rotateInput;
        rotatePart += ` rotateZ(${rotateZVal.toFixed(2)}deg)`;
      }
      if (layer.tiltActive) {
        const tx = ease(layer.tiltEasing, x * 2 - 1);
        const ty = ease(layer.tiltEasing, 1 - y * 2);
        rotateXVal = layer.tiltActive === 'x' ? 0 : (layer.tiltInvertY ? -1 : 1) * layer.tiltMaxY * ty * depth;
        rotateYVal = layer.tiltActive === 'y' ? 0 : (layer.tiltInvertX ? -1 : 1) * layer.tiltMaxX * tx * depth;
        if (_config.invertRotation) {
          // see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms#Orientation_compensation
          rotatePart = ` rotateY(${rotateYVal.toFixed(2)}deg) rotateX(${rotateXVal.toFixed(2)}deg)${rotatePart}`;
        } else {
          rotatePart += ` rotateX(${rotateXVal.toFixed(2)}deg) rotateY(${rotateYVal.toFixed(2)}deg)`;
        }
      }
      let skewPart = '';
      if (layer.skewActive) {
        const sx = ease(layer.skewEasing, 1 - x * 2);
        const sy = ease(layer.skewEasing, 1 - y * 2);
        const skewXVal = layer.skewActive === 'y' ? 0 : (layer.skewInvertX ? -1 : 1) * layer.skewMaxX * sx * depth;
        const skewYVal = layer.skewActive === 'x' ? 0 : (layer.skewInvertY ? -1 : 1) * layer.skewMaxY * sy * depth;
        skewPart = ` skew(${skewXVal.toFixed(2)}deg, ${skewYVal.toFixed(2)}deg)`;
      }
      let scalePart = '';
      if (layer.scaleActive) {
        const scaleXInput = layer.scaleActive === 'yy' ? y : x;
        const scaleYInput = layer.scaleActive === 'xx' ? x : y;
        const scaleXVal = layer.scaleActive === 'sync' ? 1 + layer.scaleMaxX * (layer.scaleInvertX ? ease(layer.scaleActive, 1 - Math.hypot((0.5 - x) * 2, (0.5 - y) * 2)) : ease(layer.scaleEasing, Math.hypot((0.5 - x) * 2, (0.5 - y) * 2))) * depth : layer.scaleActive === 'y' ? 1 : 1 + layer.scaleMaxX * (layer.scaleInvertX ? ease(layer.scaleEasing, 1 - Math.abs(0.5 - scaleXInput) * 2) : ease(layer.scaleEasing, Math.abs(0.5 - scaleXInput) * 2)) * depth;
        const scaleYVal = layer.scaleActive === 'sync' ? 1 + layer.scaleMaxY * (layer.scaleInvertY ? ease(layer.scaleEasing, 1 - Math.hypot((0.5 - x) * 2, (0.5 - y) * 2)) : ease(layer.scaleEasing, Math.hypot((0.5 - x) * 2, (0.5 - y) * 2))) * depth : layer.scaleActive === 'x' ? 1 : 1 + layer.scaleMaxY * (layer.scaleInvertY ? ease(layer.scaleEasing, 1 - Math.abs(0.5 - scaleYInput) * 2) : ease(layer.scaleEasing, Math.abs(0.5 - scaleYInput) * 2)) * depth;
        scalePart = ` scale(${scaleXVal.toFixed(2)}, ${scaleYVal.toFixed(2)})`;
      }
      let layerPerspectiveZ = '';
      if (layer.hasOwnProperty('perspectiveZ')) {
        layerPerspectiveZ = `perspective(${layer.perspectiveZ}px) `;
      } else if (!container) {
        layerPerspectiveZ = `perspective(${_config.perspectiveZ}px) `;
      }
      layer.el.style.transform = `${layerPerspectiveZ}${translatePart}${scalePart}${skewPart}${rotatePart}`;
      let layerBlurPart = '';
      if (layer.blurActive) {
        const py = Math.abs(y - 0.5) * 2;
        const px = Math.abs(x - 0.5) * 2;
        const bx = ease(layer.blurEasing, px);
        const by = ease(layer.blurEasing, py);
        const p = layer.blurActive === 'y' ? by : layer.blurActive === 'x' ? bx : Math.hypot(bx, by);
        const blurVal = layer.blurInvert ? 1 - p : p;
        layerBlurPart = `blur(${Math.round(blurVal * layer.blurMax) * depth}px)`;
      }
      let layerPointLightPart = '';
      if (layer.pointLightActive) {
        const plx = ease(layer.pointLightEasing, x);
        const ply = ease(layer.pointLightEasing, y);
        const py = layer.pointLightActive === 'x' ? 0.5 : layer.pointLightInvert ? 1 - ply : ply;
        const px = layer.pointLightActive === 'y' ? 0.5 : layer.pointLightInvert ? 1 - plx : plx;
        layerPointLightPart = ` url(#point-light-${index})`;
        const width = layer.el.offsetWidth;
        const height = layer.el.offsetHeight;
        if (!layer.pointLightElement) {
          const pointLightElement = generatePointLightSource({
            id: index,
            z: layer.pointLightZ,
            width,
            height
          });
          layer.el.insertAdjacentHTML('beforebegin', pointLightElement);
          layer.pointLightElement = layer.el.previousElementSibling;
          layer.el.style.willChange = 'filter';
        }
        const pointLightSource = layer.pointLightElement.querySelector(`#point-light-source-${index}`);
        pointLightSource.setAttribute('x', Math.round(px * width));
        pointLightSource.setAttribute('y', Math.round(py * height));
        pointLightSource.setAttribute('z', layer.pointLightZ);
      }
      layer.el.style.filter = `${layerBlurPart}${layerPointLightPart}`;
      if (layer.opacityActive) {
        const py = Math.abs(y - 0.5) * 2;
        const px = Math.abs(x - 0.5) * 2;
        const ox = ease(layer.opacityEasing, px);
        const oy = ease(layer.opacityEasing, py);
        const p = layer.opacityActive === 'y' ? oy : layer.opacityActive === 'x' ? ox : Math.hypot(ox, oy);
        const opacityVal = layer.opacityInvert ? 1 - p : p;
        layer.el.style.opacity = map(opacityVal, 0, 1, layer.opacityMin * depth, 1);
      } else {
        layer.el.style.opacity = 1;
      }
      if (layer.clipActive) {
        layer.el.style.clipPath = getClipPath(layer.clipDirection, x, y, layer.clipEasing);
      } else {
        layer.el.style.clipPath = 'none';
      }
    });
    if (_config.perspectiveActive) {
      let aX = 1,
        bX = 0,
        aY = 1,
        bY = 0;
      if (_config.perspectiveMaxX) {
        aX = 1 + 2 * _config.perspectiveMaxX;
        bX = _config.perspectiveMaxX;
      }
      if (_config.perspectiveMaxY) {
        aY = 1 + 2 * _config.perspectiveMaxY;
        bY = _config.perspectiveMaxY;
      }
      const perspX = _config.perspectiveActive === 'y' ? 0.5 : (_config.perspectiveInvertX ? 1 - x_ : x_) * aX - bX;
      const perspY = _config.perspectiveActive === 'x' ? 0.5 : (_config.perspectiveInvertY ? 1 - y_ : y_) * aY - bY;
      container.style.perspectiveOrigin = `${(perspX * 100).toFixed(2)}% ${(perspY * 100).toFixed(2)}%`;
    } else if (container) {
      container.style.perspectiveOrigin = '50% 50%';
    }
  };
}

function getHandler$1({
  target,
  progress,
  callback
}) {
  let rect;
  if (target && target !== window) {
    rect = clone(target.getBoundingClientRect().toJSON());
  } else {
    target = window;
    rect = {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  const {
    width,
    height,
    left,
    top
  } = rect;
  function handler(event) {
    const {
      clientX,
      clientY
    } = event;

    // percentage of position progress
    const x = clamp(0, 1, (clientX - left) / width);
    const y = clamp(0, 1, (clientY - top) / height);
    progress.x = +x.toPrecision(4);
    progress.y = +y.toPrecision(4);
    progress.h = height;
    progress.w = width;
    callback();
  }
  function on(config) {
    target.addEventListener('mousemove', handler, config || false);
  }
  function off(config) {
    target.removeEventListener('mousemove', handler, config || false);
  }
  return {
    on,
    off,
    handler
  };
}

/**
 * @private
 * @type {gyroscopeConfig}
 */
const DEFAULTS = {
  samples: 3,
  maxBeta: 15,
  maxGamma: 15
};
function getHandler({
  progress,
  samples = DEFAULTS.samples,
  maxBeta = DEFAULTS.maxBeta,
  maxGamma = DEFAULTS.maxGamma
}) {
  const hasSupport = window.DeviceOrientationEvent && 'ontouchstart' in window.document.body;
  if (!hasSupport) {
    return null;
  }
  const totalAngleX = maxGamma * 2;
  const totalAngleY = maxBeta * 2;
  let lastGammaZero, lastBetaZero, gammaZero, betaZero;
  function handler(event) {
    if (event.gamma === null || event.beta === null) {
      return;
    }

    // initial angles calibration
    if (samples > 0) {
      lastGammaZero = gammaZero;
      lastBetaZero = betaZero;
      if (gammaZero == null) {
        gammaZero = event.gamma;
        betaZero = event.beta;
      } else {
        gammaZero = (event.gamma + lastGammaZero) / 2;
        betaZero = (event.beta + lastBetaZero) / 2;
      }
      samples -= 1;
    }

    // get angles progress
    const x = clamp(0, 1, (event.gamma - gammaZero + maxGamma) / totalAngleX);
    const y = clamp(0, 1, (event.beta - betaZero + maxBeta) / totalAngleY);
    progress.x = x;
    progress.y = y;
  }
  function on(config) {
    window.addEventListener('deviceorientation', handler, config || false);
  }
  function off(config) {
    window.removeEventListener('deviceorientation', handler, config || false);
  }
  return {
    on,
    off,
    handler
  };
}

/**
 * @class Tilt
 * @extends Two5
 * @param {tiltConfig} config
 *
 * @example
 * import { Tilt } from 'two.5';
 *
 * const tilt = new Tilt();
 * tilt.on();
 */
class Tilt extends Two5 {
  constructor(config = {}) {
    super(config);
    this.container = this.config.layersContainer || null;
    this.createLayers();
  }

  /**
   * Creates config of layers to be animated during the effect.
   */
  createLayers() {
    // container defaults to document.body
    const layersContainer = this.container || window.document.body;
    // use config.layers or query elements from DOM
    this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
    this.layers = this.layers.map(layer => {
      let config;

      // if layer is an Element convert it to a TiltLayer object and augment it with data attributes
      if (layer instanceof Element) {
        config = Object.assign({
          el: layer
        }, layer.dataset);
      } else if (typeof layer == 'object' && layer) {
        config = layer;
      }
      return config;
      // discard garbage
    }).filter(x => x);
  }

  /**
   * Initializes and returns tilt effect.
   *
   * @return {[function]}
   */
  getEffects() {
    return [getEffect(
    // we invert rotation transform order in case of device orientation,
    // see: https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms#Orientation_compensation
    clone({
      invertRotation: !!this.usingGyroscope
    }, this.config, {
      container: this.container,
      layers: this.layers
    }))];
  }

  /**
   * Setup event handler for tilt effect.
   * First attempts to setup handler for DeviceOrientation event.
   * If feature detection fails, handler is set on MouseOver event.
   */
  setupEvents() {
    const tick = () => this.tick();
    // attempt usage of DeviceOrientation event
    const gyroscopeHandler = getHandler({
      progress: this.progress,
      samples: this.config.gyroscopeSamples,
      maxBeta: this.config.maxBeta,
      maxGamma: this.config.maxGamma
    });
    if (gyroscopeHandler) {
      this.usingGyroscope = true;
      this.tiltHandler = gyroscopeHandler;
    } else {
      /*
       * No deviceorientation support
       * Use mouseover event.
       */
      this.tiltHandler = getHandler$1({
        target: this.config.mouseTarget,
        progress: this.progress,
        callback: () => requestAnimationFrame(tick)
      });
    }
    this.tiltHandler.on();
  }

  /**
   * Removes registered event handler.
   */
  teardownEvents() {
    this.tiltHandler.off();
  }
  on() {
    this.setupEvents();
    this.setupEffects();
  }

  /**
   * Removes events and stops animation loop.
   */
  off() {
    this.teardownEvents();
  }
}

/**
 * @typedef {Object} TiltLayer
 * @property {Element} el element to perform effect on.
 * @property {number} [depth] factor between 0 and 1 multiplying all effect values.
 * @property {number} [perspectiveZ]
 * @property {number} [elevation]
 * @property {boolean} [transitionActive]
 * @property {number} [transitionDuration]
 * @property {number} [transitionEasing]
 * @property {boolean} [perspectiveActive]
 * @property {boolean} [perspectiveInvertX]
 * @property {boolean} [perspectiveInvertY]
 * @property {number} [perspectiveMaxX]
 * @property {number} [perspectiveMaxY]
 * @property {boolean} [translationActive]
 * @property {boolean} [translationInvertX]
 * @property {boolean} [translationInvertY]
 * @property {number} [translationMaxX]
 * @property {number} [translationMaxY]
 * @property {boolean} [rotateActive]
 * @property {boolean} [rotateInvert]
 * @property {number} [rotateMax]
 * @property {boolean} [tiltActive]
 * @property {boolean} [tiltInvertX]
 * @property {boolean} [tiltInvertY]
 * @property {number} [tiltMaxX]
 * @property {number} [tiltMaxY]
 * @property {boolean} [skewActive]
 * @property {boolean} [skewInvertX]
 * @property {boolean} [skewInvertY]
 * @property {number} [skewMaxX]
 * @property {number} [skewMaxY]
 * @property {boolean} [scaleActive]
 * @property {boolean} [scaleInvertX]
 * @property {boolean} [scaleInvertY]
 * @property {number} [scaleMaxX]
 * @property {number} [scaleMaxY]
 *
 * @typedef {Object} tiltConfig
 * @property {boolean} [animationActive] whether to animate effect progress.
 * @property {number} [animationFriction] between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {number} [maxBeta]
 * @property {number} [maxGamma]
 * @property {number} [gyroscopeSamples]
 * @property {Element} [mouseTarget]
 * @property {Element} [layersContainer]
 * @property {Element[]|TiltLayer[]} layers
 */

/** @typedef {Object} gyroscopeConfig
 * @property {number} [maxBeta]
 * @property {number} [maxGamma]
 * @property {number} [samples]
 * @property {number} progress
 */

export { Scroll, Tilt };
