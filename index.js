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
 * @type {scrollConfig}
 */

const DEFAULTS = {
  horizontal: false,
  observeSize: true,
  observeViewport: true,
  viewportRootMargin: '7% 7%',

  scrollHandler(container, wrapper, x, y) {
    container.style.transform = `translate3d(${-x}px, ${-y}px, 0px)`;
  },

  scrollClear(container, wrapper, x, y) {
    container.style.transform = '';
  }

};
/*
 * Utilities for scroll controller
 */

/**
 * Utility for calculating the virtual scroll position, taking snap points into account.
 *
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
 * @param {scrollConfig} config
 * @return {function}
 */


function getEffect(config) {
  const _config = defaultTo(config, DEFAULTS);

  const root = _config.root;
  const body = _config.root === window ? window.document.body : _config.root;
  const container = _config.container;
  const wrapper = _config.wrapper;
  const horizontal = _config.horizontal;
  const scenesByElement = new WeakMap();
  /*
   * Prepare snap points data.
   */

  const snaps = (_config.snaps || []). // sort points by start position
  sort((a, b) => a.start > b.start ? 1 : -1) // map objects to arrays of [start, end]
  .map(snap => {
    const {
      start,
      duration,
      end
    } = snap;
    return [start, end == null ? start + duration : end];
  }); // calculate extra scroll if we have snaps

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
      } // if we got a wrapper element set its style


      Object.assign(wrapper.style, {
        position: 'fixed',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }); // get current scroll position (support window, element and window in IE)

      let x = root.scrollX || root.pageXOffset || root.scrollLeft || 0;
      let y = root.scrollY || root.pageYOffset || root.scrollTop || 0; // increment current scroll position by accumulated snap point durations

      if (horizontal) {
        x = snaps.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, x);
      } else {
        y = snaps.reduce((acc, [start, end]) => start < acc ? acc + (end - start) : acc, y);
      } // update scroll and progress to new calculated position


      _config.resetProgress({
        x,
        y
      }); // render current position


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
    const velocity = horizontal ? +vx.toFixed(4) : +vy.toFixed(4); // if nothing changed bail out

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
        } = scene; // get global scroll progress

        const t = horizontal ? scene.pauseDuringSnap ? _x : x : scene.pauseDuringSnap ? _y : y; // calculate scene's progress

        const progress = calcProgress(t, start, end, duration); // run effect

        scene.effect(scene, progress, velocity);
      }
    }); // cache last position


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

function getHandler({
  progress,
  root
}) {
  function handler() {
    // get current scroll position (support window, element and window in IE)
    progress.x = root.scrollX || root.pageXOffset || root.scrollLeft || 0;
    progress.y = root.scrollY || root.pageYOffset || root.scrollTop || 0;
  }

  let frameId;

  function on() {
    frameId = window.requestAnimationFrame(handler);
  }

  function off() {
    window.cancelAnimationFrame(frameId);
  }

  return {
    handler,
    on,
    off
  };
}

const ticker = {
  pool: new Set(),

  /**
   * Starts the animation loop.
   */
  start() {
    if (!ticker.animationFrame) {
      const loop = time => {
        ticker.animationFrame = window.requestAnimationFrame(loop);
        ticker.tick(time);
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
   *
   * @param {number} time animation frame time argument.
   */
  tick(time) {
    ticker.pool.forEach(instance => instance.tick(time));
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
 * @type {two5Config}
 */

const DEFAULTS$1 = {
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
    this.config = defaultTo(config, DEFAULTS$1);
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
    this.measures = [];
    this.effects = [];
    this.ticking = false;
    this.ticker = this.config.ticker;
    this.time = 0;
    this.dt = 1;
  }
  /**
   * Setup events and effects, and starts animation loop.
   */


  on() {
    this.setupEvents();
    this.setupEffects();

    if (this.config.velocityActive) {
      this.time = window.performance && window.performance.now ? window.performance.now() : Date.now();
    } // start animating


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
   *
   *
   */


  tick(time) {
    // choose the object we iterate on
    const progress = this.config.animationActive ? this.currentProgress : this.progress; // cache values for calculating deltas for velocity

    const {
      x,
      y
    } = progress; // perform any registered measures

    this.measures.forEach(measure => measure()); // if animation is active interpolate to next point

    if (this.config.animationActive) {
      this.lerp();
    }

    if (this.config.velocityActive) {
      this.dt = time - this.time;
      this.time = time;
      const dx = progress.x - x;
      const dy = progress.y - y;
      const factorX = dx < 0 ? -1 : 1;
      const factorY = dy < 0 ? -1 : 1;
      progress.vx = Math.min(this.config.velocityMax, Math.abs(dx / this.dt)) / this.config.velocityMax * factorX;
      progress.vy = Math.min(this.config.velocityMax, Math.abs(dy / this.dt)) / this.config.velocityMax * factorY;
    } // perform all registered effects


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
   * Clears registered effects and measures.
   */


  teardownEffects() {
    this.measures.length = 0;
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
 * @typedef {Object} two5Config
 * @property {boolean} [animationActive] whether to animate effect progress.
 * @property {number} [animationFriction] from 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {boolean} [velocityActive] whether to calculate velocity with progress.
 * @property {number} [velocityMax] max possible value for velocity. Velocity value will be normalized according to this number, so it is kept between 0 and 1. Defaults to 1.
 */

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

class Scroll extends Two5 {
  constructor(config = {}) {
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


  resetProgress({
    x,
    y
  }) {
    this.progress.x = x;
    this.progress.y = y;
    this.progress.vx = 0;
    this.progress.vy = 0;

    if (this.config.animationActive) {
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


  getEffects() {
    return [getEffect(this.config)];
  }
  /**
   * Register scroll position measuring.
   */


  setupEvents() {
    const config = {
      root: this.config.root,
      progress: this.progress
    };
    this.measures.push(getHandler(config).handler);
  }
  /**
   * Remove scroll measuring handler.
   */


  teardownEvents() {
    this.measures.length = 0;
  }

  teardownEffects() {
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
 * @property {Element} [viewport] an element to be used for observing intersection with viewport for disabling/enabling the scene.
 *
 * @typedef {object} scrollConfig
 * @property {boolean} [animationActive] whether to animate effect progress.
 * @property {number} [animationFriction] between 0 to 1, amount of friction effect in the animation. 1 being no movement and 0 as no friction. Defaults to 0.4.
 * @property {boolean} [velocityActive] whether to calculate velocity with progress.
 * @property {number} [velocityMax] max possible value for velocity. Velocity value will be normalized according to this number, so it is kept between 0 and 1. Defaults to 1.
 * @property {boolean} [observeSize] whether to observe size changes of `container`. Defaults to `true`.
 * @property {boolean} [observeViewport] whether to observe entry/exit of scenes into viewport for disabling/enabling them. Defaults to `true`.
 * @property {boolean} [viewportRootMargin] `rootMargin` option to be used for viewport observation. Defaults to `'7% 7%'`.
 * @property {Element|Window} [root] the scrollable element, defaults to window.
 * @property {Element} [wrapper] element to use as the fixed, viewport sized layer, that clips and holds the scroll content container. If not provided, no setup is done.
 * @property {Element|null} [container] element to use as the container for the scrolled content. If not provided assuming native scroll is desired.
 * @property {ScrollScene[]} scenes list of effect scenes to perform during scroll.
 * @property {SnapPoint[]} snaps list of scroll snap points.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollHandler] if using a container, this allows overriding the function used for scrolling the content. Defaults to setting `style.transform`.
 * @property {function(container: HTMLElement, wrapper: HTMLElement|undefined, x: number, y: number)} [scrollClear] if using a container, this allows overriding the function used for clearing content scrolling side-effects when effect is removed. Defaults to clearing `container.style.transform`.
 */

const DEFAULTS$2 = {
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
  // layer only
  translationActive: true,
  translationInvertX: false,
  translationInvertY: false,
  translationMaxX: 50,
  translationMaxY: 50,
  rotateActive: false,
  rotateInvert: false,
  rotateMax: 45,
  tiltActive: false,
  tiltInvertX: false,
  tiltInvertY: false,
  tiltMaxX: 25,
  tiltMaxY: 25,
  skewActive: false,
  skewInvertX: false,
  skewInvertY: false,
  skewMaxX: 25,
  skewMaxY: 25,
  scaleActive: false,
  scaleInvertX: false,
  scaleInvertY: false,
  scaleMaxX: 0.5,
  scaleMaxY: 0.5
};

function formatTransition({
  property,
  duration,
  easing
}) {
  return `${property} ${duration}ms ${easing}`;
}

function getEffect$1(config) {
  const _config = defaultTo(config, DEFAULTS$2);

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


  _config.layers.forEach(layer => {
    const layerStyle = {};

    if (!layer.allowPointer) {
      layerStyle['pointer-events'] = 'none';
    }

    if (layer.transitionActive) {
      layerStyle.transition = formatTransition({
        property: 'transform',
        duration: layer.transitionDuration,
        easing: layer.transitionEasing
      });
    } else {
      delete layerStyle.transition;
    }

    return Object.assign(layer.el.style, layerStyle);
  });

  return function tilt({
    x,
    y
  }) {
    const len = _config.layers.length;

    _config.layers.forEach((layer, index) => {
      const depth = layer.hasOwnProperty('depth') ? layer.depth : (index + 1) / len;
      const translateZVal = layer.hasOwnProperty('elevation') ? layer.elevation : _config.elevation * (index + 1);
      let translatePart = '';

      if (layer.translationActive) {
        const translateXVal = layer.translationActive === 'y' ? 0 : (layer.translationInvertX ? -1 : 1) * layer.translationMaxX * (2 * x - 1) * depth;
        const translateYVal = layer.translationActive === 'x' ? 0 : (layer.translationInvertY ? -1 : 1) * layer.translationMaxY * (2 * y - 1) * depth;
        translatePart = `translate3d(${translateXVal.toFixed(2)}px, ${translateYVal.toFixed(2)}px, ${translateZVal}px)`;
      } else {
        translatePart = `translateZ(${translateZVal}px)`;
      }

      let rotatePart = '';
      let rotateXVal = 0,
          rotateYVal = 0,
          rotateZVal = 0;

      if (layer.rotateActive) {
        const rotateInput = layer.rotateActive === 'x' ? x : y;
        rotateZVal = (layer.rotateInvert ? -1 : 1) * layer.rotateMax * (rotateInput * 2 - 1) * depth;
        rotatePart += ` rotateZ(${rotateZVal.toFixed(2)}deg)`;
      }

      if (layer.tiltActive) {
        rotateXVal = layer.tiltActive === 'x' ? 0 : (layer.tiltInvertY ? -1 : 1) * layer.tiltMaxY * (1 - y * 2) * depth;
        rotateYVal = layer.tiltActive === 'y' ? 0 : (layer.tiltInvertX ? -1 : 1) * layer.tiltMaxX * (x * 2 - 1) * depth;

        if (_config.invertRotation) {
          // see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Using_device_orientation_with_3D_transforms#Orientation_compensation
          rotatePart = ` rotateY(${rotateYVal.toFixed(2)}deg) rotateX(${rotateXVal.toFixed(2)}deg)${rotatePart}`;
        } else {
          rotatePart += ` rotateX(${rotateXVal.toFixed(2)}deg) rotateY(${rotateYVal.toFixed(2)}deg)`;
        }
      }

      let skewPart = '';

      if (layer.skewActive) {
        const skewXVal = layer.skewActive === 'y' ? 0 : (layer.skewInvertX ? -1 : 1) * layer.skewMaxX * (1 - x * 2) * depth;
        const skewYVal = layer.skewActive === 'x' ? 0 : (layer.skewInvertY ? -1 : 1) * layer.skewMaxY * (1 - y * 2) * depth;
        skewPart = ` skew(${skewXVal.toFixed(2)}deg, ${skewYVal.toFixed(2)}deg)`;
      }

      let scalePart = '';

      if (layer.scaleActive) {
        const scaleXInput = layer.scaleActive === 'yy' ? y : x;
        const scaleYInput = layer.scaleActive === 'xx' ? x : y;
        const scaleXVal = layer.scaleActive === 'y' ? 1 : 1 + (layer.scaleInvertX ? -1 : 1) * layer.scaleMaxX * (Math.abs(0.5 - scaleXInput) * 2) * depth;
        const scaleYVal = layer.scaleActive === 'x' ? 1 : 1 + (layer.scaleInvertY ? -1 : 1) * layer.scaleMaxY * (Math.abs(0.5 - scaleYInput) * 2) * depth;
        scalePart = ` scale(${scaleXVal.toFixed(2)}, ${scaleYVal.toFixed(2)})`;
      }

      let layerPerspectiveZ = '';

      if (layer.hasOwnProperty('perspectiveZ')) {
        layerPerspectiveZ = `perspective(${layer.perspectiveZ}px) `;
      } else if (!container) {
        layerPerspectiveZ = `perspective(${_config.perspectiveZ}px) `;
      }

      layer.el.style.transform = `${layerPerspectiveZ}${translatePart}${scalePart}${skewPart}${rotatePart}`;
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

      const perspX = _config.perspectiveActive === 'y' ? 0.5 : (_config.perspectiveInvertX ? 1 - x : x) * aX - bX;
      const perspY = _config.perspectiveActive === 'x' ? 0.5 : (_config.perspectiveInvertY ? 1 - y : y) * aY - bY;
      container.style.perspectiveOrigin = `${(perspX * 100).toFixed(2)}% ${(perspY * 100).toFixed(2)}%`;
    } else if (container) {
      container.style.perspectiveOrigin = '50% 50%';
    }
  };
}

function getHandler$1({
  target,
  progress
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
    } = event; // percentage of position progress

    const x = clamp(0, 1, (clientX - left) / width);
    const y = clamp(0, 1, (clientY - top) / height);
    progress.x = x;
    progress.y = y;
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
 * @type {gyroscopeConfig}
 */

const DEFAULTS$3 = {
  samples: 3,
  maxBeta: 15,
  maxGamma: 15
};
function getHandler$2({
  progress,
  samples = DEFAULTS$3.samples,
  maxBeta = DEFAULTS$3.maxBeta,
  maxGamma = DEFAULTS$3.maxGamma
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
    } // initial angles calibration


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
    } // get angles progress


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
    const layersContainer = this.container || window.document.body; // use config.layers or query elements from DOM

    this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
    this.layers = this.layers.map(layer => {
      let config; // if layer is an Element convert it to a TiltLayer object and augment it with data attributes

      if (layer instanceof Element) {
        config = Object.assign({
          el: layer
        }, layer.dataset);
      } else if (typeof layer == 'object' && layer) {
        config = layer;
      }

      return config; // discard garbage
    }).filter(x => x);
  }
  /**
   * Initializes and returns tilt effect.
   *
   * @return {[tilt]}
   */


  getEffects() {
    return [getEffect$1( // we invert rotation transform order in case of device orientation,
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
    // attempt usage of DeviceOrientation event
    const gyroscopeHandler = getHandler$2({
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
        progress: this.progress
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
