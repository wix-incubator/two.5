(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

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

    scrollHandler(container, x, y) {
      container.style.transform = `translate3d(${-x}px, ${-y}px, 0px)`;
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
      // calculate total scroll height/width
      const totalHeight = container.offsetHeight + (horizontal ? 0 : extraScroll);
      const totalWidth = container.offsetWidth + (horizontal ? extraScroll : 0); // set width/height on the body element

      if (horizontal) {
        body.style.width = `${totalWidth}px`;
      } else {
        body.style.height = `${totalHeight}px`;
      }
      /*
       * Setup wrapper element and reset progress.
       */


      if (wrapper) {
        if (!wrapper.contains(container)) {
          console.error('When defined, the wrapper element %o must be a parent of the container element %o', wrapper, container);
          throw "Wrapper element is not a parent of container element";
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
      const velocity = horizontal ? +vx.toFixed(3) : +vy.toFixed(3); // if nothing changed bail out

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
        _config.scrollHandler(container, _x, _y);
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

  }

  /**
   * @function alphaMask
   * @returns {alphaMaskEffect}
   * @example alphaMask()
   */
  function alphaMask () {
    /**
     * @typedef {Object} alphaMaskEffect
     * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} mask
     * @property {boolean} disabled
     * @property {boolean} isLuminance
     *
     * @description Multiplies `alpha` value with values read from `mask` media source.
     *
     *  @example
     * const img = new Image();
     * img.src = 'picture.png';
     * effect.mask = img;
     * effect.disabled = true;
     */
    return {
      vertex: {
        attribute: {
          a_alphaMaskTexCoord: 'vec2'
        },
        main: `
    v_alphaMaskTexCoord = a_alphaMaskTexCoord;`
      },
      fragment: {
        uniform: {
          u_alphaMaskEnabled: 'bool',
          u_alphaMaskIsLuminance: 'bool',
          u_mask: 'sampler2D'
        },
        main: `
    if (u_alphaMaskEnabled) {
        vec4 alphaMaskPixel = texture2D(u_mask, v_alphaMaskTexCoord);

        if (u_alphaMaskIsLuminance) {
            alpha *= dot(lumcoeff, alphaMaskPixel.rgb) * alphaMaskPixel.a;
        }
        else {
            alpha *= alphaMaskPixel.a;
        }
    }`
      },

      get disabled() {
        return !this.uniforms[0].data[0];
      },

      set disabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      get mask() {
        return this.textures[0].data;
      },

      set mask(img) {
        this.textures[0].data = img;
      },

      get isLuminance() {
        return !!this.uniforms[2].data[0];
      },

      set isLuminance(toggle) {
        this.uniforms[2].data[0] = +toggle;
        this.textures[0].format = toggle ? 'RGBA' : 'ALPHA';
      },

      varying: {
        v_alphaMaskTexCoord: 'vec2'
      },
      uniforms: [{
        name: 'u_alphaMaskEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_mask',
        type: 'i',
        data: [1]
      }, {
        name: 'u_alphaMaskIsLuminance',
        type: 'i',
        data: [0]
      }],
      attributes: [{
        name: 'a_alphaMaskTexCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      }],
      textures: [{
        format: 'ALPHA'
      }]
    };
  }

  /**
   * @function brightnessContrast
   * @returns {brightnessContrastEffect}
   * @example brightnessContrast()
   */
  function brightnessContrast () {
    /**
     * @typedef {Object} brightnessContrastEffect
     * @property {number} brightness
     * @property {number} contrast
     * @property {boolean} brightnessDisabled
     * @property {boolean} contrastDisabled
     *
     * @example
     * effect.brightness = 1.5;
     * effect.contrast = 0.9;
     * effect.contrastDisabled = true;
     */
    return {
      fragment: {
        uniform: {
          u_brEnabled: 'bool',
          u_ctEnabled: 'bool',
          u_contrast: 'float',
          u_brightness: 'float'
        },
        constant: 'const vec3 half3 = vec3(0.5);',
        main: `
    if (u_brEnabled) {
        color *= u_brightness;
    }

    if (u_ctEnabled) {
        color = (color - half3) * u_contrast + half3;
    }

    color = clamp(color, 0.0, 1.0);`
      },

      get brightness() {
        return this.uniforms[2].data[0];
      },

      set brightness(value) {
        this.uniforms[2].data[0] = parseFloat(Math.max(0, value));
      },

      get contrast() {
        return this.uniforms[3].data[0];
      },

      set contrast(value) {
        this.uniforms[3].data[0] = parseFloat(Math.max(0, value));
      },

      get brightnessDisabled() {
        return !this.uniforms[0].data[0];
      },

      set brightnessDisabled(toggle) {
        this.uniforms[0].data[0] = +!toggle;
      },

      get contrastDisabled() {
        return !this.uniforms[1].data[0];
      },

      set contrastDisabled(toggle) {
        this.uniforms[1].data[0] = +!toggle;
      },

      uniforms: [{
        name: 'u_brEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_ctEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_brightness',
        type: 'f',
        data: [1.0]
      }, {
        name: 'u_contrast',
        type: 'f',
        data: [1.0]
      }]
    };
  }

  /**
   * @function hueSaturation
   * @returns {hueSaturationEffect}
   * @example hueSaturation()
   */
  function hueSaturation () {
    /**
     * @typedef {Object} hueSaturationEffect
     * @property {number} hue
     * @property {number} saturation
     * @property {boolean} hueDisabled
     * @property {boolean} saturationDisabled
     *
     * @example
     * effect.hue = 45;
     * effect.saturation = 0.8;
     */
    return {
      vertex: {
        uniform: {
          u_hue: 'float',
          u_saturation: 'float'
        },
        // for implementation see: https://www.w3.org/TR/SVG11/filters.html#feColorMatrixElement
        constant: `
const mat3 lummat = mat3(
    lumcoeff,
    lumcoeff,
    lumcoeff
);
const mat3 cosmat = mat3(
    vec3(0.787, -0.715, -0.072),
    vec3(-0.213, 0.285, -0.072),
    vec3(-0.213, -0.715, 0.928)
);
const mat3 sinmat = mat3(
    vec3(-0.213, -0.715, 0.928),
    vec3(0.143, 0.140, -0.283),
    vec3(-0.787, 0.715, 0.072)
);
const mat3 satmat = mat3(
    vec3(0.787, -0.715, -0.072),
    vec3(-0.213, 0.285, -0.072),
    vec3(-0.213, -0.715, 0.928)
);`,
        main: `
    float angle = (u_hue / 180.0) * 3.14159265358979323846264;
    v_hueRotation = lummat + cos(angle) * cosmat + sin(angle) * sinmat;
    v_saturation = lummat + satmat * u_saturation;`
      },
      fragment: {
        uniform: {
          u_hueEnabled: 'bool',
          u_satEnabled: 'bool',
          u_hue: 'float',
          u_saturation: 'float'
        },
        main: `
    if (u_hueEnabled) {
        color = vec3(
            dot(color, v_hueRotation[0]),
            dot(color, v_hueRotation[1]),
            dot(color, v_hueRotation[2])
        );
    }

    if (u_satEnabled) {
        color = vec3(
            dot(color, v_saturation[0]),
            dot(color, v_saturation[1]),
            dot(color, v_saturation[2])
        );
    }
    
    color = clamp(color, 0.0, 1.0);`
      },
      varying: {
        v_hueRotation: 'mat3',
        v_saturation: 'mat3'
      },

      get hue() {
        return this.uniforms[2].data[0];
      },

      set hue(h) {
        this.uniforms[2].data[0] = parseFloat(h);
      },

      get saturation() {
        return this.uniforms[3].data[0];
      },

      set saturation(s) {
        this.uniforms[3].data[0] = parseFloat(Math.max(0, s));
      },

      get hueDisabled() {
        return !this.uniforms[0].data[0];
      },

      set hueDisabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      get saturationDisabled() {
        return !this.uniforms[1].data[0];
      },

      set saturationDisabled(b) {
        this.uniforms[1].data[0] = +!b;
      },

      uniforms: [{
        name: 'u_hueEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_satEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_hue',
        type: 'f',
        data: [0.0]
      }, {
        name: 'u_saturation',
        type: 'f',
        data: [1.0]
      }]
    };
  }

  /**
   * @function duotone
   * @returns {duotoneEffect}
   * @example duotone()
   */
  function duotone () {
    /**
     * @typedef {Object} duotoneEffect
     * @property {number[]} light Array of 4 numbers, normalized (0.0 - 1.0)
     * @property {number[]} dark Array of 4 numbers, normalized (0.0 - 1.0)
     * @property {boolean} disabled
     *
     * @example
     * effect.light = [1.0, 1.0, 0.8];
     * effect.dark = [0.2, 0.6, 0.33];
     */
    return {
      fragment: {
        uniform: {
          u_duotoneEnabled: 'bool',
          u_light: 'vec4',
          u_dark: 'vec4'
        },
        main: `
    if (u_duotoneEnabled) {
        vec3 gray = vec3(dot(lumcoeff, color));
        color = mix(u_dark.rgb, u_light.rgb, gray);
    }`
      },

      get light() {
        return this.uniforms[1].data.slice(0);
      },

      set light(l) {
        l.forEach((c, i) => {
          if (!Number.isNaN(c)) {
            this.uniforms[1].data[i] = c;
          }
        });
      },

      get dark() {
        return this.uniforms[2].data.slice(0);
      },

      set dark(d) {
        d.forEach((c, i) => {
          if (!Number.isNaN(c)) {
            this.uniforms[2].data[i] = c;
          }
        });
      },

      get disabled() {
        return !this.uniforms[0].data[0];
      },

      set disabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      uniforms: [{
        name: 'u_duotoneEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_light',
        type: 'f',
        data: [0.9882352941, 0.7333333333, 0.05098039216, 1]
      }, {
        name: 'u_dark',
        type: 'f',
        data: [0.7411764706, 0.0431372549, 0.568627451, 1]
      }]
    };
  }

  /**
   * @function displacement
   * @param {'CLAMP'|'DISCARD'|'WRAP'} [wrap='CLAMP'] wrapping method to use
   * @returns {displacementEffect}
   * @example displacement()
   */
  function displacement (wrap = 'CLAMP') {
    const WRAP_MAP = {
      CLAMP: `dispVec = clamp(dispVec, 0.0, 1.0);`,
      DISCARD: `if (dispVec.x < 0.0 || dispVec.x > 1.0 || dispVec.y > 1.0 || dispVec.y < 0.0) {
            discard;
        }`,
      WRAP: `dispVec = mod(dispVec, 1.0);`
    };
    /**
     * @typedef {Object} displacementEffect
     * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} map
     * @property {{x: number?, y: number?}} scale
     * @property {boolean} disabled
     *
     * @example
     * const img = new Image();
     * img.src = 'disp.jpg';
     * effect.map = img;
     * effect.scale = {x: 0.4};
     */

    return {
      vertex: {
        attribute: {
          a_displacementMapTexCoord: 'vec2'
        },
        main: `
    v_displacementMapTexCoord = a_displacementMapTexCoord;`
      },
      fragment: {
        uniform: {
          u_displacementEnabled: 'bool',
          u_dispMap: 'sampler2D',
          u_dispScale: 'vec2'
        },
        source: `
    if (u_displacementEnabled) {
        vec3 dispMap = texture2D(u_dispMap, v_displacementMapTexCoord).rgb - 0.5;
        vec2 dispVec = vec2(sourceCoord.x + u_dispScale.x * dispMap.r, sourceCoord.y + u_dispScale.y * dispMap.g);
        ${WRAP_MAP[wrap]}
        sourceCoord = dispVec;
    }`
      },

      get disabled() {
        return !this.uniforms[0].data[0];
      },

      set disabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      get scale() {
        const [x, y] = this.uniforms[2].data;
        return {
          x,
          y
        };
      },

      set scale({
        x,
        y
      }) {
        if (typeof x !== 'undefined') this.uniforms[2].data[0] = x;
        if (typeof y !== 'undefined') this.uniforms[2].data[1] = y;
      },

      get map() {
        return this.textures[0].data;
      },

      set map(img) {
        this.textures[0].data = img;
      },

      varying: {
        v_displacementMapTexCoord: 'vec2'
      },
      uniforms: [{
        name: 'u_displacementEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_dispMap',
        type: 'i',
        data: [1]
      }, {
        name: 'u_dispScale',
        type: 'f',
        data: [0.0, 0.0]
      }],
      attributes: [{
        name: 'a_displacementMapTexCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      }],
      textures: [{
        format: 'RGB'
      }]
    };
  }

  /*!
   * GLSL textureless classic 3D noise "cnoise",
   * with an RSL-style periodic variant "pnoise".
   * Author:  Stefan Gustavson (stefan.gustavson@liu.se)
   * Version: 2011-10-11
   *
   * Many thanks to Ian McEwan of Ashima Arts for the
   * ideas for permutation and gradient selection.
   *
   * Copyright (c) 2011 Stefan Gustavson. All rights reserved.
   * Distributed under the MIT license. See LICENSE file.
   * https://github.com/ashima/webgl-noise
   */

  /**
   * Implementation of a 3D classic Perlin noise. Exposes a `noise(vec3 P)` function for use inside fragment shaders.
   */
  var perlinNoise = `
vec3 mod289 (vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289 (vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute (vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt (vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade (vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float noise (vec3 P) {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
}`;

  /*!
   * Description : Array and textureless GLSL 2D/3D/4D simplex
   *               noise functions.
   *      Author : Ian McEwan, Ashima Arts.
   *  Maintainer : stegu
   *     Lastmod : 20110822 (ijm)
   *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
   *               Distributed under the MIT License. See LICENSE file.
   *               https://github.com/ashima/webgl-noise
   *               https://github.com/stegu/webgl-noise
   */

  /**
   * Implementation of a 3D Simplex noise. Exposes a `noise(vec3 v)` function for use inside fragment shaders.
   */
  var simplex = `
vec3 mod289 (vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289 (vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute (vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt (vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float noise (vec3 v) { 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
}`;

  /**
   * @function turbulence
   * @param {string} noise 3D noise implementation to use
   * @returns {turbulenceEffect}
   *
   * @example turbulence(noise)
   */
  function turbulence (noise) {
    /**
     * @typedef {Object} turbulenceEffect
     * @property {{x: number?, y: number?}} frequency
     * @property {number} octaves
     * @property {boolean} isFractal
     *
     * @description Generates a turbulence/fractal noise value stored into `turbulenceValue`.
     * Depends on a `noise(vec3 P)` function to be declared. Currently it's possible to simply use it after {@link perlinNoiseEffect}.
     *
     * @example
     * effect.frequency = {x: 0.0065};
     * effect.octaves = 4;
     * effect.isFractal = true;
     */
    return {
      fragment: {
        uniform: {
          u_turbulenceEnabled: 'bool',
          u_turbulenceFrequency: 'vec2',
          u_turbulenceOctaves: 'int',
          u_isFractal: 'bool',
          u_time: 'float'
        },
        constant: `
${noise}

const int MAX_OCTAVES = 9;

float turbulence (vec3 seed, vec2 frequency, int numOctaves, bool isFractal) {
    float sum = 0.0;
    vec3 position = vec3(0.0);
    position.x = seed.x * frequency.x;
    position.y = seed.y * frequency.y;
    position.z = seed.z;
    float ratio = 1.0;

    for (int octave = 0; octave <= MAX_OCTAVES; octave++) {
        if (octave > numOctaves) {
            break;
        }

        if (isFractal) {
            sum += noise(position) / ratio;
        }
        else {
            sum += abs(noise(position)) / ratio;
        }
        position.x *= 2.0;
        position.y *= 2.0;
        ratio *= 2.0;
    }
    
    if (isFractal) {
        sum = (sum + 1.0) / 2.0;
    }
    
    return clamp(sum, 0.0, 1.0);
}`,
        main: `
    vec3 turbulenceSeed = vec3(gl_FragCoord.xy, u_time * 0.0001);
    float turbulenceValue = turbulence(turbulenceSeed, u_turbulenceFrequency, u_turbulenceOctaves, u_isFractal);`
      },

      get frequency() {
        const [x, y] = this.uniforms[0].data;
        return {
          x,
          y
        };
      },

      set frequency({
        x,
        y
      }) {
        if (typeof x !== 'undefined') this.uniforms[0].data[0] = x;
        if (typeof y !== 'undefined') this.uniforms[0].data[1] = y;
      },

      get octaves() {
        return this.uniforms[1].data[0];
      },

      set octaves(value) {
        this.uniforms[1].data[0] = Math.max(0, parseInt(value));
      },

      get isFractal() {
        return !!this.uniforms[2].data[0];
      },

      set isFractal(toggle) {
        this.uniforms[2].data[0] = +toggle;
      },

      get time() {
        return this.uniforms[3].data[0];
      },

      set time(value) {
        this.uniforms[3].data[0] = Math.max(0, parseFloat(value));
      },

      uniforms: [{
        name: 'u_turbulenceFrequency',
        type: 'f',
        data: [0.0, 0.0]
      }, {
        name: 'u_turbulenceOctaves',
        type: 'i',
        data: [1]
      }, {
        name: 'u_isFractal',
        type: 'i',
        data: [0]
      }, {
        name: 'u_time',
        type: 'f',
        data: [0.0]
      }]
    };
  }

  /**
   * @function fadeTransition
   * @returns {fadeTransitionEffect}
   * @example fadeTransition()
   */
  function fade () {
    /**
     * @typedef {Object} fadeTransitionEffect
     * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} to media source to transition into
     * @property {number} progress number between 0.0 and 1.0
     * @property {boolean} disabled
     *
     * @example
     * effect.to = document.querySelector('#video-to');
     * effect.progress = 0.5;
     */
    return {
      vertex: {
        attribute: {
          a_transitionToTexCoord: 'vec2'
        },
        main: `
    v_transitionToTexCoord = a_transitionToTexCoord;`
      },
      fragment: {
        uniform: {
          u_transitionEnabled: 'bool',
          u_transitionProgress: 'float',
          u_transitionTo: 'sampler2D'
        },
        main: `
    if (u_transitionEnabled) {
        vec4 targetPixel = texture2D(u_transitionTo, v_transitionToTexCoord);
        color = mix(color, targetPixel.rgb, u_transitionProgress);
        alpha = mix(alpha, targetPixel.a, u_transitionProgress);
    }`
      },

      get disabled() {
        return !this.uniforms[0].data[0];
      },

      set disabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      get progress() {
        return this.uniforms[2].data[0];
      },

      set progress(p) {
        this.uniforms[2].data[0] = p;
      },

      get to() {
        return this.textures[0].data;
      },

      set to(media) {
        this.textures[0].data = media;
      },

      varying: {
        v_transitionToTexCoord: 'vec2'
      },
      uniforms: [{
        name: 'u_transitionEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_transitionTo',
        type: 'i',
        data: [1]
      }, {
        name: 'u_transitionProgress',
        type: 'f',
        data: [0]
      }],
      attributes: [{
        name: 'a_transitionToTexCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      }],
      textures: [{
        format: 'RGBA',
        update: true
      }]
    };
  }

  /**
   * @function displacementTransition
   * @returns {displacementTransitionEffect}
   * @example displacementTransition()
   */
  function displacementTransition () {
    /**
     * @typedef {Object} displacementTransitionEffect
     * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} to media source to transition into
     * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} map displacement map to use
     * @property {number} progress number between 0.0 and 1.0
     * @property {{x: number?, y: number?}} sourceScale
     * @property {{x: number?, y: number?}} toScale
     * @property {boolean} disabled
     *
     * @example
     * const img = new Image();
     * img.src = 'disp.jpg';
     * effect.map = img;
     * effect.to = document.querySelector('#video-to');
     * effect.sourceScale = {x: 0.4};
     * effect.toScale = {x: 0.8};
     */
    return {
      vertex: {
        attribute: {
          a_transitionToTexCoord: 'vec2',
          a_transitionDispMapTexCoord: 'vec2'
        },
        main: `
    v_transitionToTexCoord = a_transitionToTexCoord;
    v_transitionDispMapTexCoord = a_transitionDispMapTexCoord;`
      },
      fragment: {
        uniform: {
          u_transitionEnabled: 'bool',
          u_transitionTo: 'sampler2D',
          u_transitionDispMap: 'sampler2D',
          u_transitionProgress: 'float',
          u_sourceDispScale: 'vec2',
          u_toDispScale: 'vec2'
        },
        source: `
    vec3 transDispMap = vec3(1.0);
    vec2 transDispVec = vec2(0.0);

    if (u_transitionEnabled) {
        // read the displacement texture once and create the displacement map
        transDispMap = texture2D(u_transitionDispMap, v_transitionDispMapTexCoord).rgb - 0.5;

        // prepare the source coordinates for sampling
        transDispVec = vec2(u_sourceDispScale.x * transDispMap.r, u_sourceDispScale.y * transDispMap.g);
        sourceCoord = clamp(sourceCoord + transDispVec * u_transitionProgress, 0.0, 1.0);
    }`,
        main: `
    if (u_transitionEnabled) {
        // prepare the target coordinates for sampling
        transDispVec = vec2(u_toDispScale.x * transDispMap.r, u_toDispScale.y * transDispMap.g);
        vec2 targetCoord = clamp(v_transitionToTexCoord + transDispVec * (1.0 - u_transitionProgress), 0.0, 1.0);

        // sample the target
        vec4 targetPixel = texture2D(u_transitionTo, targetCoord);

        // mix the results of source and target
        color = mix(color, targetPixel.rgb, u_transitionProgress);
        alpha = mix(alpha, targetPixel.a, u_transitionProgress);
    }`
      },

      get disabled() {
        return !this.uniforms[0].data[0];
      },

      set disabled(b) {
        this.uniforms[0].data[0] = +!b;
      },

      get progress() {
        return this.uniforms[3].data[0];
      },

      set progress(p) {
        this.uniforms[3].data[0] = p;
      },

      get sourceScale() {
        const [x, y] = this.uniforms[4].data;
        return {
          x,
          y
        };
      },

      set sourceScale({
        x,
        y
      }) {
        if (typeof x !== 'undefined') this.uniforms[4].data[0] = x;
        if (typeof y !== 'undefined') this.uniforms[4].data[1] = y;
      },

      get toScale() {
        const [x, y] = this.uniforms[5].data;
        return {
          x,
          y
        };
      },

      set toScale({
        x,
        y
      }) {
        if (typeof x !== 'undefined') this.uniforms[5].data[0] = x;
        if (typeof y !== 'undefined') this.uniforms[5].data[1] = y;
      },

      get to() {
        return this.textures[0].data;
      },

      set to(media) {
        this.textures[0].data = media;
      },

      get map() {
        return this.textures[1].data;
      },

      set map(img) {
        this.textures[1].data = img;
      },

      varying: {
        v_transitionToTexCoord: 'vec2',
        v_transitionDispMapTexCoord: 'vec2'
      },
      uniforms: [{
        name: 'u_transitionEnabled',
        type: 'i',
        data: [1]
      }, {
        name: 'u_transitionTo',
        type: 'i',
        data: [1]
      }, {
        name: 'u_transitionDispMap',
        type: 'i',
        data: [2]
      }, {
        name: 'u_transitionProgress',
        type: 'f',
        data: [0]
      }, {
        name: 'u_sourceDispScale',
        type: 'f',
        data: [0.0, 0.0]
      }, {
        name: 'u_toDispScale',
        type: 'f',
        data: [0.0, 0.0]
      }],
      attributes: [{
        name: 'a_transitionToTexCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      }, {
        name: 'a_transitionDispMapTexCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      }],
      textures: [{
        format: 'RGBA',
        update: true
      }, {
        format: 'RGB'
      }]
    };
  }

  var core = {
    init,
    draw,
    destroy,
    resize,
    getWebGLContext,
    createTexture
  };

  const vertexSimpleTemplate = ({
    uniform = '',
    attribute = '',
    varying = '',
    constant = '',
    main = ''
  }) => `
precision highp float;
${uniform}
${attribute}
attribute vec2 a_position;
${varying}

const vec3 lumcoeff = vec3(0.2125, 0.7154, 0.0721);
${constant}
void main() {
    ${main}
    gl_Position = vec4(a_position.xy, 0.0, 1.0);
}`;

  const vertexMediaTemplate = ({
    uniform = '',
    attribute = '',
    varying = '',
    constant = '',
    main = ''
  }) => `
precision highp float;
${uniform}
${attribute}
attribute vec2 a_texCoord;
attribute vec2 a_position;
${varying}
varying vec2 v_texCoord;

const vec3 lumcoeff = vec3(0.2125, 0.7154, 0.0721);
${constant}
void main() {
    v_texCoord = a_texCoord;
    ${main}
    gl_Position = vec4(a_position.xy, 0.0, 1.0);
}`;

  const fragmentSimpleTemplate = ({
    uniform = '',
    varying = '',
    constant = '',
    main = '',
    source = ''
  }) => `
precision highp float;
${varying}
${uniform}

const vec3 lumcoeff = vec3(0.2125, 0.7154, 0.0721);
${constant}
void main() {
    ${source}
    vec3 color = vec3(0.0);
    float alpha = 1.0;
    ${main}
    gl_FragColor = vec4(color, 1.0) * alpha;
}`;

  const fragmentMediaTemplate = ({
    uniform = '',
    varying = '',
    constant = '',
    main = '',
    source = ''
  }) => `
precision highp float;
${varying}
varying vec2 v_texCoord;
${uniform}
uniform sampler2D u_source;

const vec3 lumcoeff = vec3(0.2125, 0.7154, 0.0721);
${constant}
void main() {
    vec2 sourceCoord = v_texCoord;
    ${source}
    vec4 pixel = texture2D(u_source, sourceCoord);
    vec3 color = pixel.rgb;
    float alpha = pixel.a;
    ${main}
    gl_FragColor = vec4(color, 1.0) * alpha;
}`;

  const TEXTURE_WRAP = {
    stretch: 'CLAMP_TO_EDGE',
    repeat: 'REPEAT',
    mirror: 'MIRRORED_REPEAT'
  };
  /**
   * Initialize a compiled WebGLProgram for the given canvas and effects.
   *
   * @private
   * @param {Object} config
   * @param {WebGLRenderingContext} config.gl
   * @param {Object[]} config.effects
   * @param {{width: number, heignt: number}} [config.dimensions]
   * @param {boolean} [config.noSource]
   * @return {{gl: WebGLRenderingContext, data: kamposSceneData, [dimensions]: {width: number, height: number}}}
   */

  function init({
    gl,
    effects,
    dimensions,
    noSource
  }) {
    const programData = _initProgram(gl, effects, noSource);

    return {
      gl,
      data: programData,
      dimensions: dimensions || {}
    };
  }

  let WEBGL_CONTEXT_SUPPORTED = false;
  /**
   * Get a webgl context for the given canvas element.
   *
   * Will return `null` if can not get a context.
   *
   * @private
   * @param {HTMLCanvasElement} canvas
   * @return {WebGLRenderingContext|null}
   */

  function getWebGLContext(canvas) {
    let context;
    const config = {
      preserveDrawingBuffer: false,
      // should improve performance - https://stackoverflow.com/questions/27746091/preservedrawingbuffer-false-is-it-worth-the-effort
      antialias: false,
      // should improve performance
      depth: false,
      // turn off for explicitness - and in some cases perf boost
      stencil: false // turn off for explicitness - and in some cases perf boost

    };
    context = canvas.getContext('webgl', config);

    if (context) {
      WEBGL_CONTEXT_SUPPORTED = true;
    } else if (!WEBGL_CONTEXT_SUPPORTED) {
      context = canvas.getContext('experimental-webgl', config);
    } else {
      return null;
    }

    return context;
  }
  /**
   * Resize the target canvas.
   *
   * @private
   * @param {WebGLRenderingContext} gl
   * @param {{width: number, height: number}} [dimensions]
   * @return {boolean}
   */


  function resize(gl, dimensions) {
    const canvas = gl.canvas;
    const realToCSSPixels = 1; //window.devicePixelRatio;

    const {
      width,
      height
    } = dimensions || {};
    let displayWidth, displayHeight;

    if (width && height) {
      displayWidth = width;
      displayHeight = height;
    } else {
      // Lookup the size the browser is displaying the canvas.
      displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
      displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);
    } // Check if the canvas is not the same size.


    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      // Make the canvas the same size
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
  /**
   * Draw a given scene
   *
   * @private
   * @param {WebGLRenderingContext} gl
   * @param {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} media
   * @param {kamposSceneData} data
   * @param {{width: number, height: number}} dimensions
   */


  function draw(gl, media, data, dimensions) {
    const {
      program,
      source,
      attributes,
      uniforms,
      textures
    } = data;

    if (media && source && source.texture) {
      // bind the source texture
      gl.bindTexture(gl.TEXTURE_2D, source.texture); // read source data into texture

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, media);
    } // Tell it to use our program (pair of shaders)


    gl.useProgram(program); // set attribute buffers with data

    _enableVertexAttributes(gl, attributes); // set uniforms with data


    _setUniforms(gl, uniforms);

    let startTex = gl.TEXTURE0;

    if (source) {
      gl.activeTexture(startTex);
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      startTex = gl.TEXTURE1;
    }

    if (textures) {
      for (let i = 0; i < textures.length; i++) {
        gl.activeTexture(startTex + i);
        const tex = textures[i];
        gl.bindTexture(gl.TEXTURE_2D, tex.texture);

        if (tex.update) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl[tex.format], gl[tex.format], gl.UNSIGNED_BYTE, tex.data);
        }
      }
    } // Draw the rectangles


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  /**
   * Free all resources attached to a specific webgl context.
   *
   * @private
   * @param {WebGLRenderingContext} gl
   * @param {kamposSceneData} data
   */


  function destroy(gl, data) {
    const {
      program,
      vertexShader,
      fragmentShader,
      source,
      attributes
    } = data; // delete buffers

    (attributes || []).forEach(attr => gl.deleteBuffer(attr.buffer)); // delete texture

    if (source && source.texture) gl.deleteTexture(source.texture); // delete program

    gl.deleteProgram(program); // delete shaders

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  function _initProgram(gl, effects, noSource = false) {
    const source = noSource ? null : {
      texture: createTexture(gl).texture,
      buffer: null
    };

    if (source) {
      // flip Y axis for source texture
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    }

    const data = _mergeEffectsData(effects, noSource);

    const vertexSrc = _stringifyShaderSrc(data.vertex, noSource ? vertexSimpleTemplate : vertexMediaTemplate);

    const fragmentSrc = _stringifyShaderSrc(data.fragment, noSource ? fragmentSimpleTemplate : fragmentMediaTemplate); // compile the GLSL program


    const {
      program,
      vertexShader,
      fragmentShader,
      error,
      type
    } = _getWebGLProgram(gl, vertexSrc, fragmentSrc);

    if (error) {
      throw new Error(`${type} error:: ${error}\n${fragmentSrc}`);
    } // setup the vertex data


    const attributes = _initVertexAttributes(gl, program, data.attributes); // setup uniforms


    const uniforms = _initUniforms(gl, program, data.uniforms);

    return {
      program,
      vertexShader,
      fragmentShader,
      source,
      attributes,
      uniforms,
      textures: data.textures
    };
  }

  function _mergeEffectsData(effects, noSource = false) {
    return effects.reduce((result, config) => {
      const {
        attributes = [],
        uniforms = [],
        textures = [],
        varying = {}
      } = config;

      const merge = shader => Object.keys(config[shader] || {}).forEach(key => {
        if (key === 'constant' || key === 'main' || key === 'source') {
          result[shader][key] += config[shader][key] + '\n';
        } else {
          result[shader][key] = { ...result[shader][key],
            ...config[shader][key]
          };
        }
      });

      merge('vertex');
      merge('fragment');
      attributes.forEach(attribute => {
        const found = result.attributes.some((attr, n) => {
          if (attr.name === attribute.name) {
            Object.assign(attr, attribute);
            return true;
          }
        });

        if (!found) {
          result.attributes.push(attribute);
        }
      });
      result.uniforms.push(...uniforms);
      result.textures.push(...textures);
      Object.assign(result.vertex.varying, varying);
      Object.assign(result.fragment.varying, varying);
      return result;
    }, getEffectDefaults(noSource));
  }

  function getEffectDefaults(noSource) {
    /*
     * Default uniforms
     */
    const uniforms = noSource ? [] : [{
      name: 'u_source',
      type: 'i',
      data: [0]
    }];
    /*
     * Default attributes
     */

    const attributes = [{
      name: 'a_position',
      data: new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
      size: 2,
      type: 'FLOAT'
    }];

    if (!noSource) {
      attributes.push({
        name: 'a_texCoord',
        data: new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
        size: 2,
        type: 'FLOAT'
      });
    }

    return {
      vertex: {
        uniform: {},
        attribute: {},
        varying: {},
        constant: '',
        main: ''
      },
      fragment: {
        uniform: {},
        varying: {},
        constant: '',
        main: '',
        source: ''
      },
      attributes,
      uniforms,

      /*
       * Default textures
       */
      textures: []
    };
  }

  function _stringifyShaderSrc(data, template) {
    const templateData = Object.entries(data).reduce((result, [key, value]) => {
      if (['uniform', 'attribute', 'varying'].includes(key)) {
        result[key] = Object.entries(value).reduce((str, [name, type]) => str + `${key} ${type} ${name};\n`, '');
      } else {
        result[key] = value;
      }

      return result;
    }, {});
    return template(templateData);
  }

  function _getWebGLProgram(gl, vertexSrc, fragmentSrc) {
    const vertexShader = _createShader(gl, gl.VERTEX_SHADER, vertexSrc);

    const fragmentShader = _createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

    if (vertexShader.error) {
      return vertexShader;
    }

    if (fragmentShader.error) {
      return fragmentShader;
    }

    return _createProgram(gl, vertexShader, fragmentShader);
  }

  function _createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
      return {
        program,
        vertexShader,
        fragmentShader
      };
    }

    const exception = {
      error: gl.getProgramInfoLog(program),
      type: 'program'
    };
    gl.deleteProgram(program);
    return exception;
  }

  function _createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (success) {
      return shader;
    }

    const exception = {
      error: gl.getShaderInfoLog(shader),
      type: type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'
    };
    gl.deleteShader(shader);
    return exception;
  }
  /**
   * Create a WebGLTexture object.
   *
   * @private
   * @param {WebGLRenderingContext} gl
   * @param {Object} [config]
   * @param {number} config.width
   * @param {number} config.height
   * @param {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} config.data
   * @param {string} config.format
   * @param {Object} config.wrap
   * @return {{texture: WebGLTexture, width: number, height: number}}
   */


  function createTexture(gl, {
    width = 1,
    height = 1,
    data = null,
    format = 'RGBA',
    wrap = 'stretch'
  } = {}) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture); // Set the parameters so we can render any size image

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[_getTextureWrap(wrap.x || wrap)]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[_getTextureWrap(wrap.y || wrap)]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    if (data) {
      // Upload the image into the texture
      gl.texImage2D(gl.TEXTURE_2D, 0, gl[format], gl[format], gl.UNSIGNED_BYTE, data);
    } else {
      // Create empty texture
      gl.texImage2D(gl.TEXTURE_2D, 0, gl[format], width, height, 0, gl[format], gl.UNSIGNED_BYTE, null);
    }

    return {
      texture,
      width,
      height,
      format
    };
  }

  function _createBuffer(gl, program, name, data) {
    const location = gl.getAttribLocation(program, name);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return {
      location,
      buffer
    };
  }

  function _initVertexAttributes(gl, program, data) {
    return (data || []).map(attr => {
      const {
        location,
        buffer
      } = _createBuffer(gl, program, attr.name, attr.data);

      return {
        name: attr.name,
        location,
        buffer,
        type: attr.type,
        size: attr.size
      };
    });
  }

  function _initUniforms(gl, program, uniforms) {
    return (uniforms || []).map(uniform => {
      const location = gl.getUniformLocation(program, uniform.name);
      return {
        location,
        size: uniform.size || uniform.data.length,
        type: uniform.type,
        data: uniform.data
      };
    });
  }

  function _setUniforms(gl, uniformData) {
    (uniformData || []).forEach(uniform => {
      let {
        size,
        type,
        location,
        data
      } = uniform;

      if (type === 'i') {
        data = new Int32Array(data);
      }

      gl[`uniform${size}${type}v`](location, data);
    });
  }

  function _enableVertexAttributes(gl, attributes) {
    (attributes || []).forEach(attrib => {
      const {
        location,
        buffer,
        size,
        type
      } = attrib;
      gl.enableVertexAttribArray(location);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(location, size, gl[type], false, 0, 0);
    });
  }

  function _getTextureWrap(key) {
    return TEXTURE_WRAP[key] || TEXTURE_WRAP['stretch'];
  }
  /**
   * @private
   * @typedef {Object} kamposSceneData
   * @property {WebGLProgram} program
   * @property {WebGLShader} vertexShader
   * @property {WebGLShader} fragmentShader
   * @property {kamposTarget} source
   * @property {kamposAttribute[]} attributes
   *
   * @typedef {Object} kamposTarget
   * @property {WebGLTexture} texture
   * @property {WebGLFramebuffer|null} buffer
   * @property {number} [width]
   * @property {number} [height]
   *
   * @typedef {Object} kamposAttribute
   * @property {string} name
   * @property {GLint} location
   * @property {WebGLBuffer} buffer
   * @property {string} type
     @property {number} size
   */

  /**
   * Initialize a WebGL target with effects.
   *
   * @class Kampos
   * @param {kamposConfig} config
   * @example
   * import { Kampos, effects} from 'kampos';
   *
   * const target = document.querySelector('#canvas');
   * const hueSat = effects.hueSaturation();
   * const kampos = new Kampos({target, effects: [hueSat]});
   */

  class Kampos {
    /**
     * @constructor
     */
    constructor(config) {
      if (!config || !config.target) {
        throw new Error('A target canvas was not provided');
      }

      if (Kampos.preventContextCreation) throw new Error('Context creation is prevented');

      this._contextCreationError = function () {
        Kampos.preventContextCreation = true;

        if (config && config.onContextCreationError) {
          config.onContextCreationError.call(this, config);
        }
      };

      config.target.addEventListener('webglcontextcreationerror', this._contextCreationError, false);
      const success = this.init(config);
      if (!success) throw new Error('Could not create context');

      this._restoreContext = e => {
        e && e.preventDefault();
        this.config.target.removeEventListener('webglcontextrestored', this._restoreContext, true);
        const success = this.init();
        if (!success) return false;

        if (this._source) {
          this.setSource(this._source);
        }

        delete this._source;

        if (config && config.onContextRestored) {
          config.onContextRestored.call(this, config);
        }

        return true;
      };

      this._loseContext = e => {
        e.preventDefault();

        if (this.gl && this.gl.isContextLost()) {
          this.lostContext = true;
          this.config.target.addEventListener('webglcontextrestored', this._restoreContext, true);
          this.destroy(true);

          if (config && config.onContextLost) {
            config.onContextLost.call(this, config);
          }
        }
      };

      this.config.target.addEventListener('webglcontextlost', this._loseContext, true);
    }
    /**
     * Initializes a Kampos instance.
     * This is called inside the constructor,
     * but can be called again after effects have changed
     * or after {@link Kampos#destroy}.
     *
     * @param {kamposConfig} [config] defaults to `this.config`
     * @return {boolean} success whether initializing of the context and program were successful
     */


    init(config) {
      config = config || this.config;
      let {
        target,
        effects,
        ticker,
        noSource
      } = config;
      if (Kampos.preventContextCreation) return false;
      this.lostContext = false;
      let gl = core.getWebGLContext(target);
      if (!gl) return false;

      if (gl.isContextLost()) {
        const success = this.restoreContext();
        if (!success) return false; // get new context from the fresh clone

        gl = core.getWebGLContext(this.config.target);
        if (!gl) return false;
      }

      const {
        data
      } = core.init({
        gl,
        effects,
        dimensions: this.dimensions,
        noSource
      });
      this.gl = gl;
      this.data = data; // cache for restoring context

      this.config = config;

      if (ticker) {
        this.ticker = ticker;
        ticker.add(this);
      }

      return true;
    }
    /**
     * Set the source config.
     *
     * @param {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap|kamposSource} source
     * @example
     * const media = document.querySelector('#video');
     * kampos.setSource(media);
     */


    setSource(source) {
      if (!source) return;

      if (this.lostContext) {
        const success = this.restoreContext();
        if (!success) return;
      }

      let media, width, height;

      if (Object.prototype.toString.call(source) === '[object Object]') {
        ({
          media,
          width,
          height
        } = source);
      } else {
        media = source;
      }

      if (width && height) {
        this.dimensions = {
          width,
          height
        };
      } // resize the target canvas if needed


      core.resize(this.gl, this.dimensions);

      this._createTextures();

      this.media = media;
    }
    /**
     * Draw current scene.
     */


    draw() {
      if (this.lostContext) {
        const success = this.restoreContext();
        if (!success) return;
      }

      const cb = this.config.beforeDraw;
      if (cb && cb() === false) return;
      core.draw(this.gl, this.media, this.data, this.dimensions);
    }
    /**
     * Starts the animation loop.
     *
     * If a {@link Ticker} is used, this instance will be added to that {@link Ticker}.
     *
     * @param {function} beforeDraw function to run before each draw call
     */


    play(beforeDraw) {
      this.config.beforeDraw = beforeDraw;

      if (this.ticker) {
        if (this.animationFrameId) {
          this.stop();
        }

        if (!this.playing) {
          this.playing = true;
          this.ticker.add(this);
        }
      } else if (!this.animationFrameId) {
        const loop = () => {
          this.animationFrameId = window.requestAnimationFrame(loop);
          this.draw();
        };

        this.animationFrameId = window.requestAnimationFrame(loop);
      }
    }
    /**
     * Stops the animation loop.
     *
     * If a {@link Ticker} is used, this instance will be removed from that {@link Ticker}.
     */


    stop() {
      if (this.animationFrameId) {
        window.cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      if (this.playing) {
        this.playing = false;
        this.ticker.remove(this);
      }
    }
    /**
     * Stops the animation loop and frees all resources.
     *
     * @param {boolean} keepState for internal use.
     */


    destroy(keepState) {
      this.stop();

      if (this.gl && this.data) {
        core.destroy(this.gl, this.data);
      }

      if (keepState) {
        const dims = this.dimensions || {};
        this._source = this._source || {
          media: this.media,
          width: dims.width,
          height: dims.height
        };
      } else {
        this.config.target.removeEventListener('webglcontextlost', this._loseContext, true);
        this.config.target.removeEventListener('webglcontextcreationerror', this._contextCreationError, false);
        this.config = null;
        this.dimensions = null;
      }

      this.gl = null;
      this.data = null;
      this.media = null;
    }
    /**
     * Restore a lost WebGL context fot the given target.
     * This will replace canvas DOM element with a fresh clone.
     *
     * @return {boolean} success whether forcing a context restore was successful
     */


    restoreContext() {
      if (Kampos.preventContextCreation) return false;
      const canvas = this.config.target;
      const clone = this.config.target.cloneNode(true);
      const parent = canvas.parentNode;

      if (parent) {
        parent.replaceChild(clone, canvas);
      }

      this.config.target = clone;
      canvas.removeEventListener('webglcontextlost', this._loseContext, true);
      canvas.removeEventListener('webglcontextrestored', this._restoreContext, true);
      canvas.removeEventListener('webglcontextcreationerror', this._contextCreationError, false);
      clone.addEventListener('webglcontextlost', this._loseContext, true);
      clone.addEventListener('webglcontextcreationerror', this._contextCreationError, false);

      if (this.lostContext) {
        return this._restoreContext();
      }

      return true;
    }

    _createTextures() {
      this.data && this.data.textures.forEach((texture, i) => {
        const data = this.data.textures[i];
        data.texture = core.createTexture(this.gl, {
          width: this.dimensions.width,
          height: this.dimensions.height,
          format: texture.format,
          data: texture.data,
          wrap: texture.wrap
        }).texture;
        data.format = texture.format;
        data.update = texture.update;
      });
    }

  }
  /**
   * @typedef {Object} kamposConfig
   * @property {HTMLCanvasElement} target
   * @property {effectConfig[]} effects
   * @property {Ticker} [ticker]
   * @property {boolean} [noSource]
   * @property {function} [beforeDraw] function to run before each draw call. If it returns `false` {@link kampos#draw} will not be called.
   * @property {function} [onContextLost]
   * @property {function} [onContextRestored]
   * @property {function} [onContextCreationError]
   */

  /**
   * @typedef {Object} kamposSource
   * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} media
   * @property {number} width
   * @property {number} height
   */

  /**
   * @typedef {Object} effectConfig
   * @property {shaderConfig} vertex
   * @property {shaderConfig} fragment
   * @property {Attribute[]} attributes
   * @property {Uniform[]} uniforms
   * @property {Object} varying
   * @property {textureConfig[]} textures
   */

  /**
   * @typedef {Object} shaderConfig
   * @property {string} [main]
   * @property {string} [source]
   * @property {string} [constant]
   * @property {Object} [uniform] mapping variable name to type
   * @property {Object} [attribute] mapping variable name to type
   */

  /**
   * @typedef {Object} textureConfig
   * @property {string} format
   * @property {ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} [data]
   * @property {boolean} [update] defaults to `false`
   * @property {string|{x: string, y: string}} [wrap] with values `'stretch'|'repeat'|'mirror'`, defaults to `'stretch'`
   */

  /**
   * @typedef {Object} Attribute
   * @property {string} name
   * @property {number} size
   * @property {string} type
   * @property {ArrayBufferView} data
   */

  /**
   * @typedef {Object} Uniform
   * @property {string} name
   * @property {number} [size] defaults to `data.length`
   * @property {string} type
   * @property {Array} data
   */

  /**
   * Initialize a ticker instance for batching animation of multiple {@link Kampos} instances.
   *
   * @class Ticker
   */
  class Ticker {
    constructor() {
      this.pool = [];
    }
    /**
     * Starts the animation loop.
     */


    start() {
      if (!this.animationFrameId) {
        const loop = () => {
          this.animationFrameId = window.requestAnimationFrame(loop);
          this.draw();
        };

        this.animationFrameId = window.requestAnimationFrame(loop);
      }
    }
    /**
     * Stops the animation loop.
     */


    stop() {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    /**
     * Invoke `.draw()` on all instances in the pool.
     */


    draw() {
      this.pool.forEach(instance => instance.draw());
    }
    /**
     * Add an instance to the pool.
     *
     * @param {Kampos} instance
     */


    add(instance) {
      const index = this.pool.indexOf(instance);

      if (!~index) {
        this.pool.push(instance);
        instance.playing = true;
      }
    }
    /**
     * Remove an instance form the pool.
     *
     * @param {Kampos} instance
     */


    remove(instance) {
      const index = this.pool.indexOf(instance);

      if (~index) {
        this.pool.splice(index, 1);
        instance.playing = false;
      }
    }

  }

  var kampos = {
    effects: {
      alphaMask,
      brightnessContrast,
      hueSaturation,
      duotone,
      displacement,
      turbulence
    },
    transitions: {
      fade,
      displacement: displacementTransition
    },
    noise: {
      perlinNoise,
      simplex
    },
    Kampos,
    Ticker
  };

  /**
   * dat-gui JavaScript Controller Library
   * http://code.google.com/p/dat-gui
   *
   * Copyright 2011 Data Arts Team, Google Creative Lab
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   */
  function ___$insertStyle(css) {
    if (!css) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
  }

  function colorToString(color, forceCSSHex) {
    var colorFormat = color.__state.conversionName.toString();

    var r = Math.round(color.r);
    var g = Math.round(color.g);
    var b = Math.round(color.b);
    var a = color.a;
    var h = Math.round(color.h);
    var s = color.s.toFixed(1);
    var v = color.v.toFixed(1);

    if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
      var str = color.hex.toString(16);

      while (str.length < 6) {
        str = '0' + str;
      }

      return '#' + str;
    } else if (colorFormat === 'CSS_RGB') {
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else if (colorFormat === 'CSS_RGBA') {
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    } else if (colorFormat === 'HEX') {
      return '0x' + color.hex.toString(16);
    } else if (colorFormat === 'RGB_ARRAY') {
      return '[' + r + ',' + g + ',' + b + ']';
    } else if (colorFormat === 'RGBA_ARRAY') {
      return '[' + r + ',' + g + ',' + b + ',' + a + ']';
    } else if (colorFormat === 'RGB_OBJ') {
      return '{r:' + r + ',g:' + g + ',b:' + b + '}';
    } else if (colorFormat === 'RGBA_OBJ') {
      return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
    } else if (colorFormat === 'HSV_OBJ') {
      return '{h:' + h + ',s:' + s + ',v:' + v + '}';
    } else if (colorFormat === 'HSVA_OBJ') {
      return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
    }

    return 'unknown format';
  }

  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;
  var Common = {
    BREAK: {},
    extend: function extend(target) {
      this.each(ARR_SLICE.call(arguments, 1), function (obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function (key) {
          if (!this.isUndefined(obj[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    defaults: function defaults(target) {
      this.each(ARR_SLICE.call(arguments, 1), function (obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function (key) {
          if (this.isUndefined(target[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    compose: function compose() {
      var toCall = ARR_SLICE.call(arguments);
      return function () {
        var args = ARR_SLICE.call(arguments);

        for (var i = toCall.length - 1; i >= 0; i--) {
          args = [toCall[i].apply(this, args)];
        }

        return args[0];
      };
    },
    each: function each(obj, itr, scope) {
      if (!obj) {
        return;
      }

      if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
        obj.forEach(itr, scope);
      } else if (obj.length === obj.length + 0) {
        var key = void 0;
        var l = void 0;

        for (key = 0, l = obj.length; key < l; key++) {
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
            return;
          }
        }
      } else {
        for (var _key in obj) {
          if (itr.call(scope, obj[_key], _key) === this.BREAK) {
            return;
          }
        }
      }
    },
    defer: function defer(fnc) {
      setTimeout(fnc, 0);
    },
    debounce: function debounce(func, threshold, callImmediately) {
      var timeout = void 0;
      return function () {
        var obj = this;
        var args = arguments;

        function delayed() {
          timeout = null;
          if (!callImmediately) func.apply(obj, args);
        }

        var callNow = callImmediately || !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(delayed, threshold);

        if (callNow) {
          func.apply(obj, args);
        }
      };
    },
    toArray: function toArray(obj) {
      if (obj.toArray) return obj.toArray();
      return ARR_SLICE.call(obj);
    },
    isUndefined: function isUndefined(obj) {
      return obj === undefined;
    },
    isNull: function isNull(obj) {
      return obj === null;
    },
    isNaN: function (_isNaN) {
      function isNaN(_x) {
        return _isNaN.apply(this, arguments);
      }

      isNaN.toString = function () {
        return _isNaN.toString();
      };

      return isNaN;
    }(function (obj) {
      return isNaN(obj);
    }),
    isArray: Array.isArray || function (obj) {
      return obj.constructor === Array;
    },
    isObject: function isObject(obj) {
      return obj === Object(obj);
    },
    isNumber: function isNumber(obj) {
      return obj === obj + 0;
    },
    isString: function isString(obj) {
      return obj === obj + '';
    },
    isBoolean: function isBoolean(obj) {
      return obj === false || obj === true;
    },
    isFunction: function isFunction(obj) {
      return obj instanceof Function;
    }
  };
  var INTERPRETATIONS = [{
    litmus: Common.isString,
    conversions: {
      THREE_CHAR_HEX: {
        read: function read(original) {
          var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);

          if (test === null) {
            return false;
          }

          return {
            space: 'HEX',
            hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
          };
        },
        write: colorToString
      },
      SIX_CHAR_HEX: {
        read: function read(original) {
          var test = original.match(/^#([A-F0-9]{6})$/i);

          if (test === null) {
            return false;
          }

          return {
            space: 'HEX',
            hex: parseInt('0x' + test[1].toString(), 0)
          };
        },
        write: colorToString
      },
      CSS_RGB: {
        read: function read(original) {
          var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

          if (test === null) {
            return false;
          }

          return {
            space: 'RGB',
            r: parseFloat(test[1]),
            g: parseFloat(test[2]),
            b: parseFloat(test[3])
          };
        },
        write: colorToString
      },
      CSS_RGBA: {
        read: function read(original) {
          var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

          if (test === null) {
            return false;
          }

          return {
            space: 'RGB',
            r: parseFloat(test[1]),
            g: parseFloat(test[2]),
            b: parseFloat(test[3]),
            a: parseFloat(test[4])
          };
        },
        write: colorToString
      }
    }
  }, {
    litmus: Common.isNumber,
    conversions: {
      HEX: {
        read: function read(original) {
          return {
            space: 'HEX',
            hex: original,
            conversionName: 'HEX'
          };
        },
        write: function write(color) {
          return color.hex;
        }
      }
    }
  }, {
    litmus: Common.isArray,
    conversions: {
      RGB_ARRAY: {
        read: function read(original) {
          if (original.length !== 3) {
            return false;
          }

          return {
            space: 'RGB',
            r: original[0],
            g: original[1],
            b: original[2]
          };
        },
        write: function write(color) {
          return [color.r, color.g, color.b];
        }
      },
      RGBA_ARRAY: {
        read: function read(original) {
          if (original.length !== 4) return false;
          return {
            space: 'RGB',
            r: original[0],
            g: original[1],
            b: original[2],
            a: original[3]
          };
        },
        write: function write(color) {
          return [color.r, color.g, color.b, color.a];
        }
      }
    }
  }, {
    litmus: Common.isObject,
    conversions: {
      RGBA_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
            return {
              space: 'RGB',
              r: original.r,
              g: original.g,
              b: original.b,
              a: original.a
            };
          }

          return false;
        },
        write: function write(color) {
          return {
            r: color.r,
            g: color.g,
            b: color.b,
            a: color.a
          };
        }
      },
      RGB_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
            return {
              space: 'RGB',
              r: original.r,
              g: original.g,
              b: original.b
            };
          }

          return false;
        },
        write: function write(color) {
          return {
            r: color.r,
            g: color.g,
            b: color.b
          };
        }
      },
      HSVA_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
            return {
              space: 'HSV',
              h: original.h,
              s: original.s,
              v: original.v,
              a: original.a
            };
          }

          return false;
        },
        write: function write(color) {
          return {
            h: color.h,
            s: color.s,
            v: color.v,
            a: color.a
          };
        }
      },
      HSV_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
            return {
              space: 'HSV',
              h: original.h,
              s: original.s,
              v: original.v
            };
          }

          return false;
        },
        write: function write(color) {
          return {
            h: color.h,
            s: color.s,
            v: color.v
          };
        }
      }
    }
  }];
  var result = void 0;
  var toReturn = void 0;

  var interpret = function interpret() {
    toReturn = false;
    var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
    Common.each(INTERPRETATIONS, function (family) {
      if (family.litmus(original)) {
        Common.each(family.conversions, function (conversion, conversionName) {
          result = conversion.read(original);

          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return Common.BREAK;
          }
        });
        return Common.BREAK;
      }
    });
    return toReturn;
  };

  var tmpComponent = void 0;
  var ColorMath = {
    hsv_to_rgb: function hsv_to_rgb(h, s, v) {
      var hi = Math.floor(h / 60) % 6;
      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - f * s);
      var t = v * (1.0 - (1.0 - f) * s);
      var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };
    },
    rgb_to_hsv: function rgb_to_hsv(r, g, b) {
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var delta = max - min;
      var h = void 0;
      var s = void 0;

      if (max !== 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }

      if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }

      h /= 6;

      if (h < 0) {
        h += 1;
      }

      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },
    rgb_to_hex: function rgb_to_hex(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },
    component_from_hex: function component_from_hex(hex, componentIndex) {
      return hex >> componentIndex * 8 & 0xFF;
    },
    hex_with_component: function hex_with_component(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
    }
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var get = function get(object, property, receiver) {
    if (object === null) object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  };

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Color = function () {
    function Color() {
      classCallCheck(this, Color);
      this.__state = interpret.apply(this, arguments);

      if (this.__state === false) {
        throw new Error('Failed to interpret color arguments');
      }

      this.__state.a = this.__state.a || 1;
    }

    createClass(Color, [{
      key: 'toString',
      value: function toString() {
        return colorToString(this);
      }
    }, {
      key: 'toHexString',
      value: function toHexString() {
        return colorToString(this, true);
      }
    }, {
      key: 'toOriginal',
      value: function toOriginal() {
        return this.__state.conversion.write(this);
      }
    }]);
    return Color;
  }();

  function defineRGBComponent(target, component, componentHexIndex) {
    Object.defineProperty(target, component, {
      get: function get$$1() {
        if (this.__state.space === 'RGB') {
          return this.__state[component];
        }

        Color.recalculateRGB(this, component, componentHexIndex);
        return this.__state[component];
      },
      set: function set$$1(v) {
        if (this.__state.space !== 'RGB') {
          Color.recalculateRGB(this, component, componentHexIndex);
          this.__state.space = 'RGB';
        }

        this.__state[component] = v;
      }
    });
  }

  function defineHSVComponent(target, component) {
    Object.defineProperty(target, component, {
      get: function get$$1() {
        if (this.__state.space === 'HSV') {
          return this.__state[component];
        }

        Color.recalculateHSV(this);
        return this.__state[component];
      },
      set: function set$$1(v) {
        if (this.__state.space !== 'HSV') {
          Color.recalculateHSV(this);
          this.__state.space = 'HSV';
        }

        this.__state[component] = v;
      }
    });
  }

  Color.recalculateRGB = function (color, component, componentHexIndex) {
    if (color.__state.space === 'HEX') {
      color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
    } else if (color.__state.space === 'HSV') {
      Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
    } else {
      throw new Error('Corrupted color state');
    }
  };

  Color.recalculateHSV = function (color) {
    var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
    Common.extend(color.__state, {
      s: result.s,
      v: result.v
    });

    if (!Common.isNaN(result.h)) {
      color.__state.h = result.h;
    } else if (Common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }
  };

  Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
  defineRGBComponent(Color.prototype, 'r', 2);
  defineRGBComponent(Color.prototype, 'g', 1);
  defineRGBComponent(Color.prototype, 'b', 0);
  defineHSVComponent(Color.prototype, 'h');
  defineHSVComponent(Color.prototype, 's');
  defineHSVComponent(Color.prototype, 'v');
  Object.defineProperty(Color.prototype, 'a', {
    get: function get$$1() {
      return this.__state.a;
    },
    set: function set$$1(v) {
      this.__state.a = v;
    }
  });
  Object.defineProperty(Color.prototype, 'hex', {
    get: function get$$1() {
      if (this.__state.space !== 'HEX') {
        this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
        this.__state.space = 'HEX';
      }

      return this.__state.hex;
    },
    set: function set$$1(v) {
      this.__state.space = 'HEX';
      this.__state.hex = v;
    }
  });

  var Controller = function () {
    function Controller(object, property) {
      classCallCheck(this, Controller);
      this.initialValue = object[property];
      this.domElement = document.createElement('div');
      this.object = object;
      this.property = property;
      this.__onChange = undefined;
      this.__onFinishChange = undefined;
    }

    createClass(Controller, [{
      key: 'onChange',
      value: function onChange(fnc) {
        this.__onChange = fnc;
        return this;
      }
    }, {
      key: 'onFinishChange',
      value: function onFinishChange(fnc) {
        this.__onFinishChange = fnc;
        return this;
      }
    }, {
      key: 'setValue',
      value: function setValue(newValue) {
        this.object[this.property] = newValue;

        if (this.__onChange) {
          this.__onChange.call(this, newValue);
        }

        this.updateDisplay();
        return this;
      }
    }, {
      key: 'getValue',
      value: function getValue() {
        return this.object[this.property];
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        return this;
      }
    }, {
      key: 'isModified',
      value: function isModified() {
        return this.initialValue !== this.getValue();
      }
    }]);
    return Controller;
  }();

  var EVENT_MAP = {
    HTMLEvents: ['change'],
    MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
    KeyboardEvents: ['keydown']
  };
  var EVENT_MAP_INV = {};
  Common.each(EVENT_MAP, function (v, k) {
    Common.each(v, function (e) {
      EVENT_MAP_INV[e] = k;
    });
  });
  var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

  function cssValueToPixels(val) {
    if (val === '0' || Common.isUndefined(val)) {
      return 0;
    }

    var match = val.match(CSS_VALUE_PIXELS);

    if (!Common.isNull(match)) {
      return parseFloat(match[1]);
    }

    return 0;
  }

  var dom = {
    makeSelectable: function makeSelectable(elem, selectable) {
      if (elem === undefined || elem.style === undefined) return;
      elem.onselectstart = selectable ? function () {
        return false;
      } : function () {};
      elem.style.MozUserSelect = selectable ? 'auto' : 'none';
      elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
      elem.unselectable = selectable ? 'on' : 'off';
    },
    makeFullscreen: function makeFullscreen(elem, hor, vert) {
      var vertical = vert;
      var horizontal = hor;

      if (Common.isUndefined(horizontal)) {
        horizontal = true;
      }

      if (Common.isUndefined(vertical)) {
        vertical = true;
      }

      elem.style.position = 'absolute';

      if (horizontal) {
        elem.style.left = 0;
        elem.style.right = 0;
      }

      if (vertical) {
        elem.style.top = 0;
        elem.style.bottom = 0;
      }
    },
    fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
      var params = pars || {};
      var className = EVENT_MAP_INV[eventType];

      if (!className) {
        throw new Error('Event type ' + eventType + ' not supported.');
      }

      var evt = document.createEvent(className);

      switch (className) {
        case 'MouseEvents':
          {
            var clientX = params.x || params.clientX || 0;
            var clientY = params.y || params.clientY || 0;
            evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0, 0, clientX, clientY, false, false, false, false, 0, null);
            break;
          }

        case 'KeyboardEvents':
          {
            var init = evt.initKeyboardEvent || evt.initKeyEvent;
            Common.defaults(params, {
              cancelable: true,
              ctrlKey: false,
              altKey: false,
              shiftKey: false,
              metaKey: false,
              keyCode: undefined,
              charCode: undefined
            });
            init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
            break;
          }

        default:
          {
            evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
            break;
          }
      }

      Common.defaults(evt, aux);
      elem.dispatchEvent(evt);
    },
    bind: function bind(elem, event, func, newBool) {
      var bool = newBool || false;

      if (elem.addEventListener) {
        elem.addEventListener(event, func, bool);
      } else if (elem.attachEvent) {
        elem.attachEvent('on' + event, func);
      }

      return dom;
    },
    unbind: function unbind(elem, event, func, newBool) {
      var bool = newBool || false;

      if (elem.removeEventListener) {
        elem.removeEventListener(event, func, bool);
      } else if (elem.detachEvent) {
        elem.detachEvent('on' + event, func);
      }

      return dom;
    },
    addClass: function addClass(elem, className) {
      if (elem.className === undefined) {
        elem.className = className;
      } else if (elem.className !== className) {
        var classes = elem.className.split(/ +/);

        if (classes.indexOf(className) === -1) {
          classes.push(className);
          elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
        }
      }

      return dom;
    },
    removeClass: function removeClass(elem, className) {
      if (className) {
        if (elem.className === className) {
          elem.removeAttribute('class');
        } else {
          var classes = elem.className.split(/ +/);
          var index = classes.indexOf(className);

          if (index !== -1) {
            classes.splice(index, 1);
            elem.className = classes.join(' ');
          }
        }
      } else {
        elem.className = undefined;
      }

      return dom;
    },
    hasClass: function hasClass(elem, className) {
      return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
    },
    getWidth: function getWidth(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
    },
    getHeight: function getHeight(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
    },
    getOffset: function getOffset(el) {
      var elem = el;
      var offset = {
        left: 0,
        top: 0
      };

      if (elem.offsetParent) {
        do {
          offset.left += elem.offsetLeft;
          offset.top += elem.offsetTop;
          elem = elem.offsetParent;
        } while (elem);
      }

      return offset;
    },
    isActive: function isActive(elem) {
      return elem === document.activeElement && (elem.type || elem.href);
    }
  };

  var BooleanController = function (_Controller) {
    inherits(BooleanController, _Controller);

    function BooleanController(object, property) {
      classCallCheck(this, BooleanController);

      var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));

      var _this = _this2;
      _this2.__prev = _this2.getValue();
      _this2.__checkbox = document.createElement('input');

      _this2.__checkbox.setAttribute('type', 'checkbox');

      function onChange() {
        _this.setValue(!_this.__prev);
      }

      dom.bind(_this2.__checkbox, 'change', onChange, false);

      _this2.domElement.appendChild(_this2.__checkbox);

      _this2.updateDisplay();

      return _this2;
    }

    createClass(BooleanController, [{
      key: 'setValue',
      value: function setValue(v) {
        var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);

        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }

        this.__prev = this.getValue();
        return toReturn;
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (this.getValue() === true) {
          this.__checkbox.setAttribute('checked', 'checked');

          this.__checkbox.checked = true;
          this.__prev = true;
        } else {
          this.__checkbox.checked = false;
          this.__prev = false;
        }

        return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return BooleanController;
  }(Controller);

  var OptionController = function (_Controller) {
    inherits(OptionController, _Controller);

    function OptionController(object, property, opts) {
      classCallCheck(this, OptionController);

      var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));

      var options = opts;
      var _this = _this2;
      _this2.__select = document.createElement('select');

      if (Common.isArray(options)) {
        var map = {};
        Common.each(options, function (element) {
          map[element] = element;
        });
        options = map;
      }

      Common.each(options, function (value, key) {
        var opt = document.createElement('option');
        opt.innerHTML = key;
        opt.setAttribute('value', value);

        _this.__select.appendChild(opt);
      });

      _this2.updateDisplay();

      dom.bind(_this2.__select, 'change', function () {
        var desiredValue = this.options[this.selectedIndex].value;

        _this.setValue(desiredValue);
      });

      _this2.domElement.appendChild(_this2.__select);

      return _this2;
    }

    createClass(OptionController, [{
      key: 'setValue',
      value: function setValue(v) {
        var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);

        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }

        return toReturn;
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (dom.isActive(this.__select)) return this;
        this.__select.value = this.getValue();
        return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return OptionController;
  }(Controller);

  var StringController = function (_Controller) {
    inherits(StringController, _Controller);

    function StringController(object, property) {
      classCallCheck(this, StringController);

      var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));

      var _this = _this2;

      function onChange() {
        _this.setValue(_this.__input.value);
      }

      function onBlur() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }

      _this2.__input = document.createElement('input');

      _this2.__input.setAttribute('type', 'text');

      dom.bind(_this2.__input, 'keyup', onChange);
      dom.bind(_this2.__input, 'change', onChange);
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          this.blur();
        }
      });

      _this2.updateDisplay();

      _this2.domElement.appendChild(_this2.__input);

      return _this2;
    }

    createClass(StringController, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (!dom.isActive(this.__input)) {
          this.__input.value = this.getValue();
        }

        return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return StringController;
  }(Controller);

  function numDecimals(x) {
    var _x = x.toString();

    if (_x.indexOf('.') > -1) {
      return _x.length - _x.indexOf('.') - 1;
    }

    return 0;
  }

  var NumberController = function (_Controller) {
    inherits(NumberController, _Controller);

    function NumberController(object, property, params) {
      classCallCheck(this, NumberController);

      var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));

      var _params = params || {};

      _this.__min = _params.min;
      _this.__max = _params.max;
      _this.__step = _params.step;

      if (Common.isUndefined(_this.__step)) {
        if (_this.initialValue === 0) {
          _this.__impliedStep = 1;
        } else {
          _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
        }
      } else {
        _this.__impliedStep = _this.__step;
      }

      _this.__precision = numDecimals(_this.__impliedStep);
      return _this;
    }

    createClass(NumberController, [{
      key: 'setValue',
      value: function setValue(v) {
        var _v = v;

        if (this.__min !== undefined && _v < this.__min) {
          _v = this.__min;
        } else if (this.__max !== undefined && _v > this.__max) {
          _v = this.__max;
        }

        if (this.__step !== undefined && _v % this.__step !== 0) {
          _v = Math.round(_v / this.__step) * this.__step;
        }

        return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
      }
    }, {
      key: 'min',
      value: function min(minValue) {
        this.__min = minValue;
        return this;
      }
    }, {
      key: 'max',
      value: function max(maxValue) {
        this.__max = maxValue;
        return this;
      }
    }, {
      key: 'step',
      value: function step(stepValue) {
        this.__step = stepValue;
        this.__impliedStep = stepValue;
        this.__precision = numDecimals(stepValue);
        return this;
      }
    }]);
    return NumberController;
  }(Controller);

  function roundToDecimal(value, decimals) {
    var tenTo = Math.pow(10, decimals);
    return Math.round(value * tenTo) / tenTo;
  }

  var NumberControllerBox = function (_NumberController) {
    inherits(NumberControllerBox, _NumberController);

    function NumberControllerBox(object, property, params) {
      classCallCheck(this, NumberControllerBox);

      var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));

      _this2.__truncationSuspended = false;
      var _this = _this2;
      var prevY = void 0;

      function onChange() {
        var attempted = parseFloat(_this.__input.value);

        if (!Common.isNaN(attempted)) {
          _this.setValue(attempted);
        }
      }

      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }

      function onBlur() {
        onFinish();
      }

      function onMouseDrag(e) {
        var diff = prevY - e.clientY;

        _this.setValue(_this.getValue() + diff * _this.__impliedStep);

        prevY = e.clientY;
      }

      function onMouseUp() {
        dom.unbind(window, 'mousemove', onMouseDrag);
        dom.unbind(window, 'mouseup', onMouseUp);
        onFinish();
      }

      function onMouseDown(e) {
        dom.bind(window, 'mousemove', onMouseDrag);
        dom.bind(window, 'mouseup', onMouseUp);
        prevY = e.clientY;
      }

      _this2.__input = document.createElement('input');

      _this2.__input.setAttribute('type', 'text');

      dom.bind(_this2.__input, 'change', onChange);
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__input, 'mousedown', onMouseDown);
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          _this.__truncationSuspended = true;
          this.blur();
          _this.__truncationSuspended = false;
          onFinish();
        }
      });

      _this2.updateDisplay();

      _this2.domElement.appendChild(_this2.__input);

      return _this2;
    }

    createClass(NumberControllerBox, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
        return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return NumberControllerBox;
  }(NumberController);

  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }

  var NumberControllerSlider = function (_NumberController) {
    inherits(NumberControllerSlider, _NumberController);

    function NumberControllerSlider(object, property, min, max, step) {
      classCallCheck(this, NumberControllerSlider);

      var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, {
        min: min,
        max: max,
        step: step
      }));

      var _this = _this2;
      _this2.__background = document.createElement('div');
      _this2.__foreground = document.createElement('div');
      dom.bind(_this2.__background, 'mousedown', onMouseDown);
      dom.bind(_this2.__background, 'touchstart', onTouchStart);
      dom.addClass(_this2.__background, 'slider');
      dom.addClass(_this2.__foreground, 'slider-fg');

      function onMouseDown(e) {
        document.activeElement.blur();
        dom.bind(window, 'mousemove', onMouseDrag);
        dom.bind(window, 'mouseup', onMouseUp);
        onMouseDrag(e);
      }

      function onMouseDrag(e) {
        e.preventDefault();

        var bgRect = _this.__background.getBoundingClientRect();

        _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));

        return false;
      }

      function onMouseUp() {
        dom.unbind(window, 'mousemove', onMouseDrag);
        dom.unbind(window, 'mouseup', onMouseUp);

        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }

      function onTouchStart(e) {
        if (e.touches.length !== 1) {
          return;
        }

        dom.bind(window, 'touchmove', onTouchMove);
        dom.bind(window, 'touchend', onTouchEnd);
        onTouchMove(e);
      }

      function onTouchMove(e) {
        var clientX = e.touches[0].clientX;

        var bgRect = _this.__background.getBoundingClientRect();

        _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      }

      function onTouchEnd() {
        dom.unbind(window, 'touchmove', onTouchMove);
        dom.unbind(window, 'touchend', onTouchEnd);

        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }

      _this2.updateDisplay();

      _this2.__background.appendChild(_this2.__foreground);

      _this2.domElement.appendChild(_this2.__background);

      return _this2;
    }

    createClass(NumberControllerSlider, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        var pct = (this.getValue() - this.__min) / (this.__max - this.__min);

        this.__foreground.style.width = pct * 100 + '%';
        return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return NumberControllerSlider;
  }(NumberController);

  var FunctionController = function (_Controller) {
    inherits(FunctionController, _Controller);

    function FunctionController(object, property, text) {
      classCallCheck(this, FunctionController);

      var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));

      var _this = _this2;
      _this2.__button = document.createElement('div');
      _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
      dom.bind(_this2.__button, 'click', function (e) {
        e.preventDefault();

        _this.fire();

        return false;
      });
      dom.addClass(_this2.__button, 'button');

      _this2.domElement.appendChild(_this2.__button);

      return _this2;
    }

    createClass(FunctionController, [{
      key: 'fire',
      value: function fire() {
        if (this.__onChange) {
          this.__onChange.call(this);
        }

        this.getValue().call(this.object);

        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
      }
    }]);
    return FunctionController;
  }(Controller);

  var ColorController = function (_Controller) {
    inherits(ColorController, _Controller);

    function ColorController(object, property) {
      classCallCheck(this, ColorController);

      var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));

      _this2.__color = new Color(_this2.getValue());
      _this2.__temp = new Color(0);
      var _this = _this2;
      _this2.domElement = document.createElement('div');
      dom.makeSelectable(_this2.domElement, false);
      _this2.__selector = document.createElement('div');
      _this2.__selector.className = 'selector';
      _this2.__saturation_field = document.createElement('div');
      _this2.__saturation_field.className = 'saturation-field';
      _this2.__field_knob = document.createElement('div');
      _this2.__field_knob.className = 'field-knob';
      _this2.__field_knob_border = '2px solid ';
      _this2.__hue_knob = document.createElement('div');
      _this2.__hue_knob.className = 'hue-knob';
      _this2.__hue_field = document.createElement('div');
      _this2.__hue_field.className = 'hue-field';
      _this2.__input = document.createElement('input');
      _this2.__input.type = 'text';
      _this2.__input_textShadow = '0 1px 1px ';
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          onBlur.call(this);
        }
      });
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__selector, 'mousedown', function () {
        dom.addClass(this, 'drag').bind(window, 'mouseup', function () {
          dom.removeClass(_this.__selector, 'drag');
        });
      });
      dom.bind(_this2.__selector, 'touchstart', function () {
        dom.addClass(this, 'drag').bind(window, 'touchend', function () {
          dom.removeClass(_this.__selector, 'drag');
        });
      });
      var valueField = document.createElement('div');
      Common.extend(_this2.__selector.style, {
        width: '122px',
        height: '102px',
        padding: '3px',
        backgroundColor: '#222',
        boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
      });
      Common.extend(_this2.__field_knob.style, {
        position: 'absolute',
        width: '12px',
        height: '12px',
        border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
        boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
        borderRadius: '12px',
        zIndex: 1
      });
      Common.extend(_this2.__hue_knob.style, {
        position: 'absolute',
        width: '15px',
        height: '2px',
        borderRight: '4px solid #fff',
        zIndex: 1
      });
      Common.extend(_this2.__saturation_field.style, {
        width: '100px',
        height: '100px',
        border: '1px solid #555',
        marginRight: '3px',
        display: 'inline-block',
        cursor: 'pointer'
      });
      Common.extend(valueField.style, {
        width: '100%',
        height: '100%',
        background: 'none'
      });
      linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
      Common.extend(_this2.__hue_field.style, {
        width: '15px',
        height: '100px',
        border: '1px solid #555',
        cursor: 'ns-resize',
        position: 'absolute',
        top: '3px',
        right: '3px'
      });
      hueGradient(_this2.__hue_field);
      Common.extend(_this2.__input.style, {
        outline: 'none',
        textAlign: 'center',
        color: '#fff',
        border: 0,
        fontWeight: 'bold',
        textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
      });
      dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
      dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
      dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
      dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
      dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
      dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);

      function fieldDown(e) {
        setSV(e);
        dom.bind(window, 'mousemove', setSV);
        dom.bind(window, 'touchmove', setSV);
        dom.bind(window, 'mouseup', fieldUpSV);
        dom.bind(window, 'touchend', fieldUpSV);
      }

      function fieldDownH(e) {
        setH(e);
        dom.bind(window, 'mousemove', setH);
        dom.bind(window, 'touchmove', setH);
        dom.bind(window, 'mouseup', fieldUpH);
        dom.bind(window, 'touchend', fieldUpH);
      }

      function fieldUpSV() {
        dom.unbind(window, 'mousemove', setSV);
        dom.unbind(window, 'touchmove', setSV);
        dom.unbind(window, 'mouseup', fieldUpSV);
        dom.unbind(window, 'touchend', fieldUpSV);
        onFinish();
      }

      function fieldUpH() {
        dom.unbind(window, 'mousemove', setH);
        dom.unbind(window, 'touchmove', setH);
        dom.unbind(window, 'mouseup', fieldUpH);
        dom.unbind(window, 'touchend', fieldUpH);
        onFinish();
      }

      function onBlur() {
        var i = interpret(this.value);

        if (i !== false) {
          _this.__color.__state = i;

          _this.setValue(_this.__color.toOriginal());
        } else {
          this.value = _this.__color.toString();
        }
      }

      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.__color.toOriginal());
        }
      }

      _this2.__saturation_field.appendChild(valueField);

      _this2.__selector.appendChild(_this2.__field_knob);

      _this2.__selector.appendChild(_this2.__saturation_field);

      _this2.__selector.appendChild(_this2.__hue_field);

      _this2.__hue_field.appendChild(_this2.__hue_knob);

      _this2.domElement.appendChild(_this2.__input);

      _this2.domElement.appendChild(_this2.__selector);

      _this2.updateDisplay();

      function setSV(e) {
        if (e.type.indexOf('touch') === -1) {
          e.preventDefault();
        }

        var fieldRect = _this.__saturation_field.getBoundingClientRect();

        var _ref = e.touches && e.touches[0] || e,
            clientX = _ref.clientX,
            clientY = _ref.clientY;

        var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
        var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

        if (v > 1) {
          v = 1;
        } else if (v < 0) {
          v = 0;
        }

        if (s > 1) {
          s = 1;
        } else if (s < 0) {
          s = 0;
        }

        _this.__color.v = v;
        _this.__color.s = s;

        _this.setValue(_this.__color.toOriginal());

        return false;
      }

      function setH(e) {
        if (e.type.indexOf('touch') === -1) {
          e.preventDefault();
        }

        var fieldRect = _this.__hue_field.getBoundingClientRect();

        var _ref2 = e.touches && e.touches[0] || e,
            clientY = _ref2.clientY;

        var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

        if (h > 1) {
          h = 1;
        } else if (h < 0) {
          h = 0;
        }

        _this.__color.h = h * 360;

        _this.setValue(_this.__color.toOriginal());

        return false;
      }

      return _this2;
    }

    createClass(ColorController, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        var i = interpret(this.getValue());

        if (i !== false) {
          var mismatch = false;
          Common.each(Color.COMPONENTS, function (component) {
            if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
              mismatch = true;
              return {};
            }
          }, this);

          if (mismatch) {
            Common.extend(this.__color.__state, i);
          }
        }

        Common.extend(this.__temp.__state, this.__color.__state);
        this.__temp.a = 1;
        var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;

        var _flip = 255 - flip;

        Common.extend(this.__field_knob.style, {
          marginLeft: 100 * this.__color.s - 7 + 'px',
          marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
          backgroundColor: this.__temp.toHexString(),
          border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
        });
        this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
        this.__temp.s = 1;
        this.__temp.v = 1;
        linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
        this.__input.value = this.__color.toString();
        Common.extend(this.__input.style, {
          backgroundColor: this.__color.toHexString(),
          color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
          textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
        });
      }
    }]);
    return ColorController;
  }(Controller);

  var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

  function linearGradient(elem, x, a, b) {
    elem.style.background = '';
    Common.each(vendors, function (vendor) {
      elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
    });
  }

  function hueGradient(elem) {
    elem.style.background = '';
    elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
    elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  }

  var css = {
    load: function load(url, indoc) {
      var doc = indoc || document;
      var link = doc.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      doc.getElementsByTagName('head')[0].appendChild(link);
    },
    inject: function inject(cssContent, indoc) {
      var doc = indoc || document;
      var injected = document.createElement('style');
      injected.type = 'text/css';
      injected.innerHTML = cssContent;
      var head = doc.getElementsByTagName('head')[0];

      try {
        head.appendChild(injected);
      } catch (e) {}
    }
  };
  var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

  var ControllerFactory = function ControllerFactory(object, property) {
    var initialValue = object[property];

    if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
      return new OptionController(object, property, arguments[2]);
    }

    if (Common.isNumber(initialValue)) {
      if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
        if (Common.isNumber(arguments[4])) {
          return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
        }

        return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
      }

      if (Common.isNumber(arguments[4])) {
        return new NumberControllerBox(object, property, {
          min: arguments[2],
          max: arguments[3],
          step: arguments[4]
        });
      }

      return new NumberControllerBox(object, property, {
        min: arguments[2],
        max: arguments[3]
      });
    }

    if (Common.isString(initialValue)) {
      return new StringController(object, property);
    }

    if (Common.isFunction(initialValue)) {
      return new FunctionController(object, property, '');
    }

    if (Common.isBoolean(initialValue)) {
      return new BooleanController(object, property);
    }

    return null;
  };

  function requestAnimationFrame(callback) {
    setTimeout(callback, 1000 / 60);
  }

  var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

  var CenteredDiv = function () {
    function CenteredDiv() {
      classCallCheck(this, CenteredDiv);
      this.backgroundElement = document.createElement('div');
      Common.extend(this.backgroundElement.style, {
        backgroundColor: 'rgba(0,0,0,0.8)',
        top: 0,
        left: 0,
        display: 'none',
        zIndex: '1000',
        opacity: 0,
        WebkitTransition: 'opacity 0.2s linear',
        transition: 'opacity 0.2s linear'
      });
      dom.makeFullscreen(this.backgroundElement);
      this.backgroundElement.style.position = 'fixed';
      this.domElement = document.createElement('div');
      Common.extend(this.domElement.style, {
        position: 'fixed',
        display: 'none',
        zIndex: '1001',
        opacity: 0,
        WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
        transition: 'transform 0.2s ease-out, opacity 0.2s linear'
      });
      document.body.appendChild(this.backgroundElement);
      document.body.appendChild(this.domElement);

      var _this = this;

      dom.bind(this.backgroundElement, 'click', function () {
        _this.hide();
      });
    }

    createClass(CenteredDiv, [{
      key: 'show',
      value: function show() {
        var _this = this;

        this.backgroundElement.style.display = 'block';
        this.domElement.style.display = 'block';
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = 'scale(1.1)';
        this.layout();
        Common.defer(function () {
          _this.backgroundElement.style.opacity = 1;
          _this.domElement.style.opacity = 1;
          _this.domElement.style.webkitTransform = 'scale(1)';
        });
      }
    }, {
      key: 'hide',
      value: function hide() {
        var _this = this;

        var hide = function hide() {
          _this.domElement.style.display = 'none';
          _this.backgroundElement.style.display = 'none';
          dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
          dom.unbind(_this.domElement, 'transitionend', hide);
          dom.unbind(_this.domElement, 'oTransitionEnd', hide);
        };

        dom.bind(this.domElement, 'webkitTransitionEnd', hide);
        dom.bind(this.domElement, 'transitionend', hide);
        dom.bind(this.domElement, 'oTransitionEnd', hide);
        this.backgroundElement.style.opacity = 0;
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = 'scale(1.1)';
      }
    }, {
      key: 'layout',
      value: function layout() {
        this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
        this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
      }
    }]);
    return CenteredDiv;
  }();

  var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

  css.inject(styleSheet);
  var CSS_NAMESPACE = 'dg';
  var HIDE_KEY_CODE = 72;
  var CLOSE_BUTTON_HEIGHT = 20;
  var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

  var SUPPORTS_LOCAL_STORAGE = function () {
    try {
      return !!window.localStorage;
    } catch (e) {
      return false;
    }
  }();

  var SAVE_DIALOGUE = void 0;
  var autoPlaceVirgin = true;
  var autoPlaceContainer = void 0;
  var hide = false;
  var hideableGuis = [];

  var GUI = function GUI(pars) {
    var _this = this;

    var params = pars || {};
    this.domElement = document.createElement('div');
    this.__ul = document.createElement('ul');
    this.domElement.appendChild(this.__ul);
    dom.addClass(this.domElement, CSS_NAMESPACE);
    this.__folders = {};
    this.__controllers = [];
    this.__rememberedObjects = [];
    this.__rememberedObjectIndecesToControllers = [];
    this.__listening = [];
    params = Common.defaults(params, {
      closeOnTop: false,
      autoPlace: true,
      width: GUI.DEFAULT_WIDTH
    });
    params = Common.defaults(params, {
      resizable: params.autoPlace,
      hideable: params.autoPlace
    });

    if (!Common.isUndefined(params.load)) {
      if (params.preset) {
        params.load.preset = params.preset;
      }
    } else {
      params.load = {
        preset: DEFAULT_DEFAULT_PRESET_NAME
      };
    }

    if (Common.isUndefined(params.parent) && params.hideable) {
      hideableGuis.push(this);
    }

    params.resizable = Common.isUndefined(params.parent) && params.resizable;

    if (params.autoPlace && Common.isUndefined(params.scrollable)) {
      params.scrollable = true;
    }

    var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
    var saveToLocalStorage = void 0;
    var titleRow = void 0;
    Object.defineProperties(this, {
      parent: {
        get: function get$$1() {
          return params.parent;
        }
      },
      scrollable: {
        get: function get$$1() {
          return params.scrollable;
        }
      },
      autoPlace: {
        get: function get$$1() {
          return params.autoPlace;
        }
      },
      closeOnTop: {
        get: function get$$1() {
          return params.closeOnTop;
        }
      },
      preset: {
        get: function get$$1() {
          if (_this.parent) {
            return _this.getRoot().preset;
          }

          return params.load.preset;
        },
        set: function set$$1(v) {
          if (_this.parent) {
            _this.getRoot().preset = v;
          } else {
            params.load.preset = v;
          }

          setPresetSelectIndex(this);

          _this.revert();
        }
      },
      width: {
        get: function get$$1() {
          return params.width;
        },
        set: function set$$1(v) {
          params.width = v;
          setWidth(_this, v);
        }
      },
      name: {
        get: function get$$1() {
          return params.name;
        },
        set: function set$$1(v) {
          params.name = v;

          if (titleRow) {
            titleRow.innerHTML = params.name;
          }
        }
      },
      closed: {
        get: function get$$1() {
          return params.closed;
        },
        set: function set$$1(v) {
          params.closed = v;

          if (params.closed) {
            dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
          } else {
            dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
          }

          this.onResize();

          if (_this.__closeButton) {
            _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
          }
        }
      },
      load: {
        get: function get$$1() {
          return params.load;
        }
      },
      useLocalStorage: {
        get: function get$$1() {
          return useLocalStorage;
        },
        set: function set$$1(bool) {
          if (SUPPORTS_LOCAL_STORAGE) {
            useLocalStorage = bool;

            if (bool) {
              dom.bind(window, 'unload', saveToLocalStorage);
            } else {
              dom.unbind(window, 'unload', saveToLocalStorage);
            }

            localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
          }
        }
      }
    });

    if (Common.isUndefined(params.parent)) {
      this.closed = params.closed || false;
      dom.addClass(this.domElement, GUI.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);

      if (SUPPORTS_LOCAL_STORAGE) {
        if (useLocalStorage) {
          _this.useLocalStorage = true;
          var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

          if (savedGui) {
            params.load = JSON.parse(savedGui);
          }
        }
      }

      this.__closeButton = document.createElement('div');
      this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);

      if (params.closeOnTop) {
        dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
        this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
      } else {
        dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
        this.domElement.appendChild(this.__closeButton);
      }

      dom.bind(this.__closeButton, 'click', function () {
        _this.closed = !_this.closed;
      });
    } else {
      if (params.closed === undefined) {
        params.closed = true;
      }

      var titleRowName = document.createTextNode(params.name);
      dom.addClass(titleRowName, 'controller-name');
      titleRow = addRow(_this, titleRowName);

      var onClickTitle = function onClickTitle(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };

      dom.addClass(this.__ul, GUI.CLASS_CLOSED);
      dom.addClass(titleRow, 'title');
      dom.bind(titleRow, 'click', onClickTitle);

      if (!params.closed) {
        this.closed = false;
      }
    }

    if (params.autoPlace) {
      if (Common.isUndefined(params.parent)) {
        if (autoPlaceVirgin) {
          autoPlaceContainer = document.createElement('div');
          dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
          dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(autoPlaceContainer);
          autoPlaceVirgin = false;
        }

        autoPlaceContainer.appendChild(this.domElement);
        dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
      }

      if (!this.parent) {
        setWidth(_this, params.width);
      }
    }

    this.__resizeHandler = function () {
      _this.onResizeDebounced();
    };

    dom.bind(window, 'resize', this.__resizeHandler);
    dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
    dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
    dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
    this.onResize();

    if (params.resizable) {
      addResizeHandle(this);
    }

    saveToLocalStorage = function saveToLocalStorage() {
      if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
        localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
      }
    };

    this.saveToLocalStorageIfPossible = saveToLocalStorage;

    function resetWidth() {
      var root = _this.getRoot();

      root.width += 1;
      Common.defer(function () {
        root.width -= 1;
      });
    }

    if (!params.parent) {
      resetWidth();
    }
  };

  GUI.toggleHide = function () {
    hide = !hide;
    Common.each(hideableGuis, function (gui) {
      gui.domElement.style.display = hide ? 'none' : '';
    });
  };

  GUI.CLASS_AUTO_PLACE = 'a';
  GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
  GUI.CLASS_MAIN = 'main';
  GUI.CLASS_CONTROLLER_ROW = 'cr';
  GUI.CLASS_TOO_TALL = 'taller-than-window';
  GUI.CLASS_CLOSED = 'closed';
  GUI.CLASS_CLOSE_BUTTON = 'close-button';
  GUI.CLASS_CLOSE_TOP = 'close-top';
  GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
  GUI.CLASS_DRAG = 'drag';
  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = 'Close Controls';
  GUI.TEXT_OPEN = 'Open Controls';

  GUI._keydownHandler = function (e) {
    if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }
  };

  dom.bind(window, 'keydown', GUI._keydownHandler, false);
  Common.extend(GUI.prototype, {
    add: function add(object, property) {
      return _add(this, object, property, {
        factoryArgs: Array.prototype.slice.call(arguments, 2)
      });
    },
    addColor: function addColor(object, property) {
      return _add(this, object, property, {
        color: true
      });
    },
    remove: function remove(controller) {
      this.__ul.removeChild(controller.__li);

      this.__controllers.splice(this.__controllers.indexOf(controller), 1);

      var _this = this;

      Common.defer(function () {
        _this.onResize();
      });
    },
    destroy: function destroy() {
      if (this.parent) {
        throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
      }

      if (this.autoPlace) {
        autoPlaceContainer.removeChild(this.domElement);
      }

      var _this = this;

      Common.each(this.__folders, function (subfolder) {
        _this.removeFolder(subfolder);
      });
      dom.unbind(window, 'keydown', GUI._keydownHandler, false);
      removeListeners(this);
    },
    addFolder: function addFolder(name) {
      if (this.__folders[name] !== undefined) {
        throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
      }

      var newGuiParams = {
        name: name,
        parent: this
      };
      newGuiParams.autoPlace = this.autoPlace;

      if (this.load && this.load.folders && this.load.folders[name]) {
        newGuiParams.closed = this.load.folders[name].closed;
        newGuiParams.load = this.load.folders[name];
      }

      var gui = new GUI(newGuiParams);
      this.__folders[name] = gui;
      var li = addRow(this, gui.domElement);
      dom.addClass(li, 'folder');
      return gui;
    },
    removeFolder: function removeFolder(folder) {
      this.__ul.removeChild(folder.domElement.parentElement);

      delete this.__folders[folder.name];

      if (this.load && this.load.folders && this.load.folders[folder.name]) {
        delete this.load.folders[folder.name];
      }

      removeListeners(folder);

      var _this = this;

      Common.each(folder.__folders, function (subfolder) {
        folder.removeFolder(subfolder);
      });
      Common.defer(function () {
        _this.onResize();
      });
    },
    open: function open() {
      this.closed = false;
    },
    close: function close() {
      this.closed = true;
    },
    hide: function hide() {
      this.domElement.style.display = 'none';
    },
    show: function show() {
      this.domElement.style.display = '';
    },
    onResize: function onResize() {
      var root = this.getRoot();

      if (root.scrollable) {
        var top = dom.getOffset(root.__ul).top;
        var h = 0;
        Common.each(root.__ul.childNodes, function (node) {
          if (!(root.autoPlace && node === root.__save_row)) {
            h += dom.getHeight(node);
          }
        });

        if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
          dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
        } else {
          dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = 'auto';
        }
      }

      if (root.__resize_handle) {
        Common.defer(function () {
          root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
        });
      }

      if (root.__closeButton) {
        root.__closeButton.style.width = root.width + 'px';
      }
    },
    onResizeDebounced: Common.debounce(function () {
      this.onResize();
    }, 50),
    remember: function remember() {
      if (Common.isUndefined(SAVE_DIALOGUE)) {
        SAVE_DIALOGUE = new CenteredDiv();
        SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
      }

      if (this.parent) {
        throw new Error('You can only call remember on a top level GUI.');
      }

      var _this = this;

      Common.each(Array.prototype.slice.call(arguments), function (object) {
        if (_this.__rememberedObjects.length === 0) {
          addSaveMenu(_this);
        }

        if (_this.__rememberedObjects.indexOf(object) === -1) {
          _this.__rememberedObjects.push(object);
        }
      });

      if (this.autoPlace) {
        setWidth(this, this.width);
      }
    },
    getRoot: function getRoot() {
      var gui = this;

      while (gui.parent) {
        gui = gui.parent;
      }

      return gui;
    },
    getSaveObject: function getSaveObject() {
      var toReturn = this.load;
      toReturn.closed = this.closed;

      if (this.__rememberedObjects.length > 0) {
        toReturn.preset = this.preset;

        if (!toReturn.remembered) {
          toReturn.remembered = {};
        }

        toReturn.remembered[this.preset] = getCurrentPreset(this);
      }

      toReturn.folders = {};
      Common.each(this.__folders, function (element, key) {
        toReturn.folders[key] = element.getSaveObject();
      });
      return toReturn;
    },
    save: function save() {
      if (!this.load.remembered) {
        this.load.remembered = {};
      }

      this.load.remembered[this.preset] = getCurrentPreset(this);
      markPresetModified(this, false);
      this.saveToLocalStorageIfPossible();
    },
    saveAs: function saveAs(presetName) {
      if (!this.load.remembered) {
        this.load.remembered = {};
        this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
      }

      this.load.remembered[presetName] = getCurrentPreset(this);
      this.preset = presetName;
      addPresetOption(this, presetName, true);
      this.saveToLocalStorageIfPossible();
    },
    revert: function revert(gui) {
      Common.each(this.__controllers, function (controller) {
        if (!this.getRoot().load.remembered) {
          controller.setValue(controller.initialValue);
        } else {
          recallSavedValue(gui || this.getRoot(), controller);
        }

        if (controller.__onFinishChange) {
          controller.__onFinishChange.call(controller, controller.getValue());
        }
      }, this);
      Common.each(this.__folders, function (folder) {
        folder.revert(folder);
      });

      if (!gui) {
        markPresetModified(this.getRoot(), false);
      }
    },
    listen: function listen(controller) {
      var init = this.__listening.length === 0;

      this.__listening.push(controller);

      if (init) {
        updateDisplays(this.__listening);
      }
    },
    updateDisplay: function updateDisplay() {
      Common.each(this.__controllers, function (controller) {
        controller.updateDisplay();
      });
      Common.each(this.__folders, function (folder) {
        folder.updateDisplay();
      });
    }
  });

  function addRow(gui, newDom, liBefore) {
    var li = document.createElement('li');

    if (newDom) {
      li.appendChild(newDom);
    }

    if (liBefore) {
      gui.__ul.insertBefore(li, liBefore);
    } else {
      gui.__ul.appendChild(li);
    }

    gui.onResize();
    return li;
  }

  function removeListeners(gui) {
    dom.unbind(window, 'resize', gui.__resizeHandler);

    if (gui.saveToLocalStorageIfPossible) {
      dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
    }
  }

  function markPresetModified(gui, modified) {
    var opt = gui.__preset_select[gui.__preset_select.selectedIndex];

    if (modified) {
      opt.innerHTML = opt.value + '*';
    } else {
      opt.innerHTML = opt.value;
    }
  }

  function augmentController(gui, li, controller) {
    controller.__li = li;
    controller.__gui = gui;
    Common.extend(controller, {
      options: function options(_options) {
        if (arguments.length > 1) {
          var nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui, controller.object, controller.property, {
            before: nextSibling,
            factoryArgs: [Common.toArray(arguments)]
          });
        }

        if (Common.isArray(_options) || Common.isObject(_options)) {
          var _nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui, controller.object, controller.property, {
            before: _nextSibling,
            factoryArgs: [_options]
          });
        }
      },
      name: function name(_name) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
        return controller;
      },
      listen: function listen() {
        controller.__gui.listen(controller);

        return controller;
      },
      remove: function remove() {
        controller.__gui.remove(controller);

        return controller;
      }
    });

    if (controller instanceof NumberControllerSlider) {
      var box = new NumberControllerBox(controller.object, controller.property, {
        min: controller.__min,
        max: controller.__max,
        step: controller.__step
      });
      Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
        var pc = controller[method];
        var pb = box[method];

        controller[method] = box[method] = function () {
          var args = Array.prototype.slice.call(arguments);
          pb.apply(box, args);
          return pc.apply(controller, args);
        };
      });
      dom.addClass(li, 'has-slider');
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
    } else if (controller instanceof NumberControllerBox) {
      var r = function r(returned) {
        if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
          var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
          var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
          controller.remove();

          var newController = _add(gui, controller.object, controller.property, {
            before: controller.__li.nextElementSibling,
            factoryArgs: [controller.__min, controller.__max, controller.__step]
          });

          newController.name(oldName);
          if (wasListening) newController.listen();
          return newController;
        }

        return returned;
      };

      controller.min = Common.compose(r, controller.min);
      controller.max = Common.compose(r, controller.max);
    } else if (controller instanceof BooleanController) {
      dom.bind(li, 'click', function () {
        dom.fakeEvent(controller.__checkbox, 'click');
      });
      dom.bind(controller.__checkbox, 'click', function (e) {
        e.stopPropagation();
      });
    } else if (controller instanceof FunctionController) {
      dom.bind(li, 'click', function () {
        dom.fakeEvent(controller.__button, 'click');
      });
      dom.bind(li, 'mouseover', function () {
        dom.addClass(controller.__button, 'hover');
      });
      dom.bind(li, 'mouseout', function () {
        dom.removeClass(controller.__button, 'hover');
      });
    } else if (controller instanceof ColorController) {
      dom.addClass(li, 'color');
      controller.updateDisplay = Common.compose(function (val) {
        li.style.borderLeftColor = controller.__color.toString();
        return val;
      }, controller.updateDisplay);
      controller.updateDisplay();
    }

    controller.setValue = Common.compose(function (val) {
      if (gui.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui.getRoot(), true);
      }

      return val;
    }, controller.setValue);
  }

  function recallSavedValue(gui, controller) {
    var root = gui.getRoot();

    var matchedIndex = root.__rememberedObjects.indexOf(controller.object);

    if (matchedIndex !== -1) {
      var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];

      if (controllerMap === undefined) {
        controllerMap = {};
        root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
      }

      controllerMap[controller.property] = controller;

      if (root.load && root.load.remembered) {
        var presetMap = root.load.remembered;
        var preset = void 0;

        if (presetMap[gui.preset]) {
          preset = presetMap[gui.preset];
        } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
          preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
        } else {
          return;
        }

        if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
          var value = preset[matchedIndex][controller.property];
          controller.initialValue = value;
          controller.setValue(value);
        }
      }
    }
  }

  function _add(gui, object, property, params) {
    if (object[property] === undefined) {
      throw new Error('Object "' + object + '" has no property "' + property + '"');
    }

    var controller = void 0;

    if (params.color) {
      controller = new ColorController(object, property);
    } else {
      var factoryArgs = [object, property].concat(params.factoryArgs);
      controller = ControllerFactory.apply(gui, factoryArgs);
    }

    if (params.before instanceof Controller) {
      params.before = params.before.__li;
    }

    recallSavedValue(gui, controller);
    dom.addClass(controller.domElement, 'c');
    var name = document.createElement('span');
    dom.addClass(name, 'property-name');
    name.innerHTML = controller.property;
    var container = document.createElement('div');
    container.appendChild(name);
    container.appendChild(controller.domElement);
    var li = addRow(gui, container, params.before);
    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);

    if (controller instanceof ColorController) {
      dom.addClass(li, 'color');
    } else {
      dom.addClass(li, _typeof(controller.getValue()));
    }

    augmentController(gui, li, controller);

    gui.__controllers.push(controller);

    return controller;
  }

  function getLocalStorageHash(gui, key) {
    return document.location.href + '.' + key;
  }

  function addPresetOption(gui, name, setSelected) {
    var opt = document.createElement('option');
    opt.innerHTML = name;
    opt.value = name;

    gui.__preset_select.appendChild(opt);

    if (setSelected) {
      gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
    }
  }

  function showHideExplain(gui, explain) {
    explain.style.display = gui.useLocalStorage ? 'block' : 'none';
  }

  function addSaveMenu(gui) {
    var div = gui.__save_row = document.createElement('li');
    dom.addClass(gui.domElement, 'has-save');

    gui.__ul.insertBefore(div, gui.__ul.firstChild);

    dom.addClass(div, 'save-row');
    var gears = document.createElement('span');
    gears.innerHTML = '&nbsp;';
    dom.addClass(gears, 'button gears');
    var button = document.createElement('span');
    button.innerHTML = 'Save';
    dom.addClass(button, 'button');
    dom.addClass(button, 'save');
    var button2 = document.createElement('span');
    button2.innerHTML = 'New';
    dom.addClass(button2, 'button');
    dom.addClass(button2, 'save-as');
    var button3 = document.createElement('span');
    button3.innerHTML = 'Revert';
    dom.addClass(button3, 'button');
    dom.addClass(button3, 'revert');
    var select = gui.__preset_select = document.createElement('select');

    if (gui.load && gui.load.remembered) {
      Common.each(gui.load.remembered, function (value, key) {
        addPresetOption(gui, key, key === gui.preset);
      });
    } else {
      addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
    }

    dom.bind(select, 'change', function () {
      for (var index = 0; index < gui.__preset_select.length; index++) {
        gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
      }

      gui.preset = this.value;
    });
    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);

    if (SUPPORTS_LOCAL_STORAGE) {
      var explain = document.getElementById('dg-local-explain');
      var localStorageCheckBox = document.getElementById('dg-local-storage');
      var saveLocally = document.getElementById('dg-save-locally');
      saveLocally.style.display = 'block';

      if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
        localStorageCheckBox.setAttribute('checked', 'checked');
      }

      showHideExplain(gui, explain);
      dom.bind(localStorageCheckBox, 'change', function () {
        gui.useLocalStorage = !gui.useLocalStorage;
        showHideExplain(gui, explain);
      });
    }

    var newConstructorTextArea = document.getElementById('dg-new-constructor');
    dom.bind(newConstructorTextArea, 'keydown', function (e) {
      if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
        SAVE_DIALOGUE.hide();
      }
    });
    dom.bind(gears, 'click', function () {
      newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });
    dom.bind(button, 'click', function () {
      gui.save();
    });
    dom.bind(button2, 'click', function () {
      var presetName = prompt('Enter a new preset name.');

      if (presetName) {
        gui.saveAs(presetName);
      }
    });
    dom.bind(button3, 'click', function () {
      gui.revert();
    });
  }

  function addResizeHandle(gui) {
    var pmouseX = void 0;
    gui.__resize_handle = document.createElement('div');
    Common.extend(gui.__resize_handle.style, {
      width: '6px',
      marginLeft: '-3px',
      height: '200px',
      cursor: 'ew-resize',
      position: 'absolute'
    });

    function drag(e) {
      e.preventDefault();
      gui.width += pmouseX - e.clientX;
      gui.onResize();
      pmouseX = e.clientX;
      return false;
    }

    function dragStop() {
      dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, 'mousemove', drag);
      dom.unbind(window, 'mouseup', dragStop);
    }

    function dragStart(e) {
      e.preventDefault();
      pmouseX = e.clientX;
      dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, 'mousemove', drag);
      dom.bind(window, 'mouseup', dragStop);
      return false;
    }

    dom.bind(gui.__resize_handle, 'mousedown', dragStart);
    dom.bind(gui.__closeButton, 'mousedown', dragStart);
    gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
  }

  function setWidth(gui, w) {
    gui.domElement.style.width = w + 'px';

    if (gui.__save_row && gui.autoPlace) {
      gui.__save_row.style.width = w + 'px';
    }

    if (gui.__closeButton) {
      gui.__closeButton.style.width = w + 'px';
    }
  }

  function getCurrentPreset(gui, useInitialValues) {
    var toReturn = {};
    Common.each(gui.__rememberedObjects, function (val, index) {
      var savedValues = {};
      var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
      Common.each(controllerMap, function (controller, property) {
        savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });
      toReturn[index] = savedValues;
    });
    return toReturn;
  }

  function setPresetSelectIndex(gui) {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      if (gui.__preset_select[index].value === gui.preset) {
        gui.__preset_select.selectedIndex = index;
      }
    }
  }

  function updateDisplays(controllerArray) {
    if (controllerArray.length !== 0) {
      requestAnimationFrame$1.call(window, function () {
        updateDisplays(controllerArray);
      });
    }

    Common.each(controllerArray, function (c) {
      c.updateDisplay();
    });
  }
  var GUI$1 = GUI;

  /**
   * @author mrdoob / http://mrdoob.com/
   */
  var Stats = function () {
    var mode = 0;
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    container.addEventListener('click', function (event) {
      event.preventDefault();
      showPanel(++mode % container.children.length);
    }, false); //

    function addPanel(panel) {
      container.appendChild(panel.dom);
      return panel;
    }

    function showPanel(id) {
      for (var i = 0; i < container.children.length; i++) {
        container.children[i].style.display = i === id ? 'block' : 'none';
      }

      mode = id;
    } //


    var beginTime = (performance || Date).now(),
        prevTime = beginTime,
        frames = 0;
    var fpsPanel = addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    var msPanel = addPanel(new Stats.Panel('MS', '#0f0', '#020'));

    if (self.performance && self.performance.memory) {
      var memPanel = addPanel(new Stats.Panel('MB', '#f08', '#201'));
    }

    showPanel(0);
    return {
      REVISION: 16,
      dom: container,
      addPanel: addPanel,
      showPanel: showPanel,
      begin: function () {
        beginTime = (performance || Date).now();
      },
      end: function () {
        frames++;
        var time = (performance || Date).now();
        msPanel.update(time - beginTime, 200);

        if (time > prevTime + 1000) {
          fpsPanel.update(frames * 1000 / (time - prevTime), 100);
          prevTime = time;
          frames = 0;

          if (memPanel) {
            var memory = performance.memory;
            memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
          }
        }

        return time;
      },
      update: function () {
        beginTime = this.end();
      },
      // Backwards Compatibility
      domElement: container,
      setMode: showPanel
    };
  };

  Stats.Panel = function (name, fg, bg) {
    var min = Infinity,
        max = 0,
        round = Math.round;
    var PR = round(window.devicePixelRatio || 1);
    var WIDTH = 80 * PR,
        HEIGHT = 48 * PR,
        TEXT_X = 3 * PR,
        TEXT_Y = 2 * PR,
        GRAPH_X = 3 * PR,
        GRAPH_Y = 15 * PR,
        GRAPH_WIDTH = 74 * PR,
        GRAPH_HEIGHT = 30 * PR;
    var canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:80px;height:48px';
    var context = canvas.getContext('2d');
    context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';
    context.fillStyle = bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = fg;
    context.fillText(name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    return {
      dom: canvas,
      update: function (value, maxValue) {
        min = Math.min(min, value);
        max = Math.max(max, value);
        context.fillStyle = bg;
        context.globalAlpha = 1;
        context.fillRect(0, 0, WIDTH, GRAPH_Y);
        context.fillStyle = fg;
        context.fillText(round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')', TEXT_X, TEXT_Y);
        context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);
        context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);
        context.fillStyle = bg;
        context.globalAlpha = 0.9;
        context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round((1 - value / maxValue) * GRAPH_HEIGHT));
      }
    };
  };

  /*
   * Effects
   */

  /*
   * Simple transforms
   */

  function transform(scene, progress, velocity) {
    let translateY = 0,
        translateX = 0;
    let skewY = 0,
        skewX = 0;
    let rotationAngle = 0;
    let skew = '';
    let scale = '';
    let rotate = '';

    if (scene.translateY.active) {
      const p = Math.min(Math.max(progress - scene.translateY.start / 100, 0), scene.translateY.end / 100);
      translateY = (p * scene.duration - scene.offset) * scene.translateY.speed;
    }

    if (scene.translateX.active) {
      const p = Math.min(Math.max(progress - scene.translateX.start / 100, 0), scene.translateX.end / 100);
      translateX = (p * 2 - 1) * scene.xOffset * scene.translateX.speed;
    }

    const translate = `translate3d(${translateX}px, ${translateY}px, 0px)`;

    if (scene.skewY.active) {
      if (scene.skewY.velocity) {
        skewY = velocity * scene.skewY.angle;
      } else {
        const p = Math.min(Math.max(progress - scene.skewY.start / 100, 0), scene.skewY.end / 100);
        skewY = (p * 2 - 1) * scene.skewY.angle;
      }
    }

    if (scene.skewX.active) {
      if (scene.skewX.velocity) {
        skewX = velocity * scene.skewX.angle;
      } else {
        const p = Math.min(Math.max(progress - scene.skewX.start / 100, 0), scene.skewX.end / 100);
        skewX = (p * 2 - 1) * scene.skewX.angle;
      }
    }

    skew = `skew(${skewX}deg, ${skewY}deg)`; // -------

    if (scene.rotateIn.active && !scene.rotateOut.active) {
      const start = scene.rotateIn.start / 100;
      const duration = scene.rotateIn.end / 100 - start;
      rotationAngle = getScaleFactor(start, duration, progress) * scene.rotateIn.angle;
    } else if (scene.rotateOut.active && !scene.rotateIn.active) {
      const start = scene.rotateOut.start / 100;
      const duration = scene.rotateOut.end / 100 - start;
      rotationAngle = (1 - getScaleFactor(start, duration, progress)) * scene.rotateOut.angle;
    } else if (scene.rotateIn.active && scene.rotateOut.active) {
      const inStart = scene.rotateIn.start / 100;
      const outStart = scene.rotateOut.start / 100;
      const inEnd = scene.rotateIn.end / 100;
      const outEnd = scene.rotateOut.end / 100;
      const isDuringIn = progress >= inStart && progress <= inEnd; // const isDuringOut = progress >= outStart && progress <= outEnd;

      const inFirst = inStart < outStart;
      const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd; // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

      if (isDuringIn || isAroundIn) {
        // inside in
        rotationAngle = getScaleFactor(inStart, inEnd - inStart, progress) * scene.rotateIn.angle;
      } else {
        // inside out
        rotationAngle = (1 - getScaleFactor(outStart, outEnd - outStart, progress)) * scene.rotateOut.angle;
      }
    }

    if (rotationAngle !== 0) {
      rotate = `rotate(${rotationAngle}deg)`;
    } // -------


    let scaleFactor = 0;

    if (scene.zoomIn.active && !scene.zoomOut.active) {
      const start = scene.zoomIn.start / 100;
      const duration = scene.zoomIn.end / 100 - start;
      scaleFactor = getScaleFactor(start, duration, progress) * (scene.zoomIn.factor - 1);
    } else if (scene.zoomOut.active && !scene.zoomIn.active) {
      const start = scene.zoomOut.start / 100;
      const duration = scene.zoomOut.end / 100 - start;
      scaleFactor = (1 - getScaleFactor(start, duration, progress)) * (scene.zoomOut.factor - 1);
    } else if (scene.zoomIn.active && scene.zoomOut.active) {
      const inStart = scene.zoomIn.start / 100;
      const outStart = scene.zoomOut.start / 100;
      const inEnd = scene.zoomIn.end / 100;
      const outEnd = scene.zoomOut.end / 100;
      const isDuringIn = progress >= inStart && progress <= inEnd; // const isDuringOut = progress >= outStart && progress <= outEnd;

      const inFirst = inStart < outStart;
      const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd; // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

      if (isDuringIn || isAroundIn) {
        // inside in
        scaleFactor = getScaleFactor(inStart, inEnd - inStart, progress) * (scene.zoomIn.factor - 1);
      } else {
        // inside out
        scaleFactor = (1 - getScaleFactor(outStart, outEnd - outStart, progress)) * (scene.zoomOut.factor - 1);
      }
    }

    if (scaleFactor !== 0) {
      scale = `scale(${1 + scaleFactor}, ${1 + scaleFactor})`;
    }

    let opacity = 1;

    if (scene.fadeIn.active && !scene.fadeOut.active) {
      const start = scene.fadeIn.start / 100;
      const duration = scene.fadeIn.end / 100 - start;
      opacity = getScaleFactor(start, duration, progress);
    } else if (scene.fadeOut.active && !scene.fadeIn.active) {
      const start = scene.fadeOut.start / 100;
      const duration = scene.fadeOut.end / 100 - start;
      opacity = 1 - getScaleFactor(start, duration, progress);
    } else if (scene.fadeIn.active && scene.fadeOut.active) {
      const inStart = scene.fadeIn.start / 100;
      const outStart = scene.fadeOut.start / 100;
      const inEnd = scene.fadeIn.end / 100;
      const outEnd = scene.fadeOut.end / 100;
      const isDuringIn = progress >= inStart && progress <= inEnd; // const isDuringOut = progress >= outStart && progress <= outEnd;

      const inFirst = inStart < outStart;
      const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd; // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

      if (isDuringIn || isAroundIn) {
        // inside in
        opacity = getScaleFactor(inStart, inEnd - inStart, progress);
      } else {
        // inside out
        opacity = 1 - getScaleFactor(outStart, outEnd - outStart, progress);
      }
    }

    scene.element.style.opacity = opacity.toFixed(3);
    scene.element.style.transform = `${translate} ${skew} ${scale} ${rotate}`;
  }

  function getScaleFactor(start, duration, progress) {
    const p = Math.min(Math.max(progress - start, 0), duration);
    return map$1(p, 0, duration, 0, 1);
  }
  /*
   * Simple filters
   */


  function focus(scene, progress) {
    scene.element.style.filter = `blur(${(1 - progress) * scene.radius}px)`;
  }

  function saturate(scene, progress) {
    scene.element.style.filter = `saturate(${progress * 100}%)`;
  }

  function hueRotate(scene, progress) {
    scene.element.style.filter = `hue-rotate(${(1 - progress) * 180}deg)`;
  }

  function sepia(scene, progress) {
    scene.element.style.filter = `sepia(${(1 - progress) * 100}%)`;
  }

  function invert(scene, progress) {
    scene.element.style.filter = `invert(${(1 - progress) * 100}%)`;
  }
  /*
   * Mix-blend-mode effects
   */


  function difference(scene, progress) {
    scene.element.style.backgroundColor = `hsl(0, 0%, ${(1 - progress) * 100}%)`;
  }

  function dodge(scene, progress) {
    scene.element.style.backgroundColor = `hsl(${scene.hue}, ${(1 - progress) * 100}%, 15%)`;
  }
  /*
   * Kampos
   */


  function displacement$1(scene, progress) {
    const shouldTick = progress < 1 && progress > 0;

    if (shouldTick && !scene.kampos.animationFrameId) {
      scene.kampos.play();
    } else if (!shouldTick && scene.kampos.animationFrameId) {
      scene.kampos.stop();
    }

    scene.displacement.scale = {
      y: 1 - progress
    };
  }

  const FILTERS = {
    focus,
    saturate,
    hueRotate,
    sepia,
    invert,
    difference,
    dodge,
    displacement: displacement$1
  };
  const FILTER_CONF = {
    displacement: 'displacement',
    focus: 'focus',
    saturate: 'saturate',
    'hue rotate': 'hueRotate',
    sepia: 'sepia',
    invert: 'invert',
    'blend-difference': 'difference',
    'blend-dodge': 'dodge'
  };
  window.gui = new GUI$1();

  function generateTransformsConfig() {
    return {
      translateY: {
        active: false,
        speed: 0.5,
        end: 100,
        start: 0
      },
      translateX: {
        active: false,
        speed: 0.5,
        end: 100,
        start: 0
      },
      skewY: {
        active: false,
        velocity: true,
        angle: 20,
        end: 100,
        start: 0
      },
      skewX: {
        active: false,
        velocity: true,
        angle: 20,
        end: 100,
        start: 0
      },
      zoomIn: {
        active: false,
        factor: 2,
        end: 100,
        start: 0
      },
      zoomOut: {
        active: false,
        factor: 2,
        end: 50,
        start: 0
      },
      fadeIn: {
        active: false,
        end: 40,
        start: 15
      },
      fadeOut: {
        active: false,
        end: 100,
        start: 65
      },
      rotateIn: {
        active: false,
        angle: -30,
        end: 100,
        start: 50
      },
      rotateOut: {
        active: false,
        angle: 30,
        end: 50,
        start: 0
      }
    };
  }

  const config = {
    scene: {
      'Save to File': function () {
        download(getValues(), `background-effects-${getTimeStamp()}.txt`, 'text/plain');
      },
      'Load from Files': function () {
        upload(); // stub
      },
      container: true,
      friction: 0.8
    },
    images: [{
      bgColor: '#000',
      transforms: generateTransformsConfig(),
      filter: {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
      }
    }, {
      bgColor: '#000',
      transforms: generateTransformsConfig(),
      filter: {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
      }
    }, {
      bgColor: '#000',
      transforms: generateTransformsConfig(),
      filter: {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
      }
    }, {
      bgColor: '#000',
      transforms: generateTransformsConfig(),
      filter: {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
      }
    }, {
      bgColor: '#000',
      transforms: generateTransformsConfig(),
      filter: {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
      }
    }]
  };

  function createTransformsControls(folder, config) {
    const panY = folder.addFolder('Pan Y');
    gui.remember(config.translateY);
    panY.add(config.translateY, 'active').onChange(restart);
    panY.add(config.translateY, 'speed', 0, 1, 0.05).onFinishChange(restart);
    panY.add(config.translateY, 'start', 0, 100, 5).onFinishChange(restart);
    panY.add(config.translateY, 'end', 0, 100, 5).onFinishChange(restart);
    const panX = folder.addFolder('Pan X');
    gui.remember(config.translateX);
    panX.add(config.translateX, 'active').onChange(restart);
    panX.add(config.translateX, 'speed', 0, 1, 0.05).onFinishChange(restart);
    panX.add(config.translateX, 'start', 0, 100, 5).onFinishChange(restart);
    panX.add(config.translateX, 'end', 0, 100, 5).onFinishChange(restart);
    const skewY = folder.addFolder('Skew Y');
    gui.remember(config.skewY);
    skewY.add(config.skewY, 'active').onChange(restart);
    skewY.add(config.skewY, 'velocity').onChange(restart);
    skewY.add(config.skewY, 'angle', 5, 40, 1).onFinishChange(restart);
    skewY.add(config.skewY, 'start', 0, 100, 5).onFinishChange(restart);
    skewY.add(config.skewY, 'end', 0, 100, 5).onFinishChange(restart);
    const skewX = folder.addFolder('Skew X');
    gui.remember(config.skewX);
    skewX.add(config.skewX, 'active').onChange(restart);
    skewX.add(config.skewX, 'velocity').onChange(restart);
    skewX.add(config.skewX, 'angle', 5, 40, 1).onFinishChange(restart);
    skewX.add(config.skewX, 'start', 0, 100, 5).onFinishChange(restart);
    skewX.add(config.skewX, 'end', 0, 100, 5).onFinishChange(restart);
    const zoomIn = folder.addFolder('Zoom In');
    gui.remember(config.zoomIn);
    zoomIn.add(config.zoomIn, 'active').onChange(restart);
    zoomIn.add(config.zoomIn, 'factor', 1.1, 4, 0.1).onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'start', 0, 90, 5).onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'end', 10, 100, 5).onFinishChange(restart);
    const zoomOut = folder.addFolder('Zoom Out');
    gui.remember(config.zoomOut);
    zoomOut.add(config.zoomOut, 'active').onChange(restart);
    zoomOut.add(config.zoomOut, 'factor', 1.1, 4, 0.1).onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'start', 0, 90, 5).onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'end', 10, 100, 5).onFinishChange(restart);
    const fadeIn = folder.addFolder('Fade In');
    gui.remember(config.fadeIn);
    fadeIn.add(config.fadeIn, 'active').onChange(restart);
    fadeIn.add(config.fadeIn, 'start', 0, 90, 5).onFinishChange(restart);
    fadeIn.add(config.fadeIn, 'end', 10, 100, 5).onFinishChange(restart);
    const fadeOut = folder.addFolder('Fade Out');
    gui.remember(config.fadeOut);
    fadeOut.add(config.fadeOut, 'active').onChange(restart);
    fadeOut.add(config.fadeOut, 'start', 0, 100, 5).onFinishChange(restart);
    fadeOut.add(config.fadeOut, 'end', 0, 100, 5).onFinishChange(restart);
    const rotateIn = folder.addFolder('Rotate In');
    gui.remember(config.rotateIn);
    rotateIn.add(config.rotateIn, 'active').onChange(restart);
    rotateIn.add(config.rotateIn, 'angle', -180, 180, 1).onFinishChange(restart);
    rotateIn.add(config.rotateIn, 'start', 0, 100, 5).onFinishChange(restart);
    rotateIn.add(config.rotateIn, 'end', 0, 100, 5).onFinishChange(restart);
    const rotateOut = folder.addFolder('Rotate Out');
    gui.remember(config.rotateOut);
    rotateOut.add(config.rotateOut, 'active').onChange(restart);
    rotateOut.add(config.rotateOut, 'angle', -180, 180, 1).onFinishChange(restart);
    rotateOut.add(config.rotateOut, 'start', 0, 100, 5).onFinishChange(restart);
    rotateOut.add(config.rotateOut, 'end', 0, 100, 5).onFinishChange(restart);
  }
  /*
   * Create controls for demo config
   */


  const sceneConfig = gui.addFolder('Scene config');
  gui.remember(config.scene);
  sceneConfig.add(config.scene, 'Save to File');
  sceneConfig.add(config.scene, 'Load from Files');
  sceneConfig.add(config.scene, 'container').onChange(restart);
  sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05).onFinishChange(restart);
  sceneConfig.open();
  /*
   * Image 1 controls
   */

  const image1 = gui.addFolder('Image 1');
  gui.remember(config.images[0]);
  gui.remember(config.images[0].filter);
  image1.addColor(config.images[0], 'bgColor').onFinishChange(restart);
  const image1Transforms = image1.addFolder('Transforms');
  image1Transforms.open();
  createTransformsControls(image1Transforms, config.images[0].transforms);
  const image1Filters = image1.addFolder('Filters'); // image1Filters.open();

  image1Filters.add(config.images[0].filter, 'active').onChange(filterToggle(0));
  image1Filters.add(config.images[0].filter, 'type', FILTER_CONF).onChange(filterChange(0));
  image1Filters.add(config.images[0].filter, 'start', 0, 100, 5).onChange(restart);
  image1Filters.add(config.images[0].filter, 'radius', 5, 30, 1).onChange(restart);
  image1Filters.add(config.images[0].filter, 'hue', 0, 359, 5).onChange(restart);
  /*
   * Image 2 controls
   */

  const image2 = gui.addFolder('Image 2');
  gui.remember(config.images[1]);
  gui.remember(config.images[1].filter);
  image2.addColor(config.images[1], 'bgColor').onFinishChange(restart);
  const image2Transforms = image2.addFolder('Transforms');
  image2Transforms.open();
  createTransformsControls(image2Transforms, config.images[1].transforms);
  const image2Filters = image2.addFolder('Filters'); // image2Filters.open();

  image2Filters.add(config.images[1].filter, 'active').onChange(filterToggle(1));
  image2Filters.add(config.images[1].filter, 'type', FILTER_CONF).onChange(filterChange(1));
  image2Filters.add(config.images[1].filter, 'start', 0, 100, 5).onChange(restart);
  image2Filters.add(config.images[1].filter, 'radius', 5, 30, 1).onChange(restart);
  image2Filters.add(config.images[1].filter, 'hue', 0, 359, 5).onChange(restart);
  /*
   * Image 3 controls
   */

  const image3 = gui.addFolder('image 3');
  gui.remember(config.images[2]);
  gui.remember(config.images[2].filter);
  image3.addColor(config.images[2], 'bgColor').onFinishChange(restart);
  const image3Transforms = image3.addFolder('Transforms');
  image3Transforms.open();
  createTransformsControls(image3Transforms, config.images[2].transforms);
  const image3Filters = image3.addFolder('Filters'); // image3Filters.open();

  image3Filters.add(config.images[2].filter, 'active').onChange(filterToggle(2));
  image3Filters.add(config.images[2].filter, 'type', FILTER_CONF).onChange(filterChange(2));
  image3Filters.add(config.images[2].filter, 'start', 0, 100, 5).onChange(restart);
  image3Filters.add(config.images[2].filter, 'radius', 5, 30, 1).onChange(restart);
  image3Filters.add(config.images[2].filter, 'hue', 0, 359, 5).onChange(restart);
  /*
   * Image 4 controls
   */

  const image4 = gui.addFolder('Image 4');
  gui.remember(config.images[3]);
  gui.remember(config.images[3].filter);
  image4.addColor(config.images[3], 'bgColor').onFinishChange(restart);
  const image4Transforms = image4.addFolder('Transforms');
  image4Transforms.open();
  createTransformsControls(image4Transforms, config.images[3].transforms);
  const image4Filters = image4.addFolder('Filters'); // image4Filters.open();

  image4Filters.add(config.images[3].filter, 'active').onChange(filterToggle(3));
  image4Filters.add(config.images[3].filter, 'type', FILTER_CONF).onChange(filterChange(3));
  image4Filters.add(config.images[3].filter, 'start', 0, 100, 5).onChange(restart);
  image4Filters.add(config.images[3].filter, 'radius', 5, 30, 1).onChange(restart);
  image4Filters.add(config.images[3].filter, 'hue', 0, 359, 5).onChange(restart);
  /*
   * Image 5 controls
   */

  const image5 = gui.addFolder('Image 5');
  gui.remember(config.images[4]);
  gui.remember(config.images[4].filter);
  image5.addColor(config.images[4], 'bgColor').onFinishChange(restart);
  const image5Transforms = image5.addFolder('Transforms');
  image5Transforms.open();
  createTransformsControls(image5Transforms, config.images[4].transforms);
  const image5Filters = image5.addFolder('Filters'); // image5Filters.open();

  image5Filters.add(config.images[4].filter, 'active').onChange(filterToggle(4));
  image5Filters.add(config.images[4].filter, 'type', FILTER_CONF).onChange(filterChange(4));
  image5Filters.add(config.images[4].filter, 'start', 0, 100, 5).onChange(restart);
  image5Filters.add(config.images[4].filter, 'radius', 5, 30, 1).onChange(restart);
  image5Filters.add(config.images[4].filter, 'hue', 0, 359, 5).onChange(restart);
  let instance;
  let stats;

  function init$1() {
    if (stats) {
      // cleanup old FPS meter
      stats.dom.remove();
    }
    /*
     * Start FPS meter
     */


    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

    document.body.appendChild(stats.dom); // create scenes

    const scenes = createScenes();

    if (!config.scene.container) {
      wrapper.style.position = 'static';
      wrapper.style.height = 'auto';
      wrapper.style.overflow = 'visible';
    }

    const scrollContainer = config.scene.container ? container : null;

    if (!scrollContainer) {
      container.style.transform = 'none';
    } // create new scroll controller


    const parallax = new Scroll({
      container: scrollContainer,
      wrapper,
      scenes,
      animationActive: true,
      animationFriction: config.scene.friction,
      velocityActive: config.images.some(img => img.transforms.skewY.active || img.transforms.skewX.active),
      velocityMax: 10
    }); // activate

    parallax.on(); // setup meter

    parallax.effects.unshift(function () {
      stats.begin();
    });
    parallax.effects.push(function () {
      stats.end();
    });
    return parallax;
  }
  /*
   * DOM we'll be using
   */


  const wrapper = document.querySelector('#wrapper');
  const container = document.querySelector('main');
  const viewportHeight = window.innerHeight;
  const parents = [...window.document.querySelectorAll('[data-effects~="bgparallax"]')];
  const images = [...window.document.querySelectorAll('[data-effects~="bgparallax"] .bg > img')]; // const canvases = [...window.document.querySelectorAll('canvas')];

  const kamposInstances = new Map();
  /*
   * Factory of scene data
   */

  function createScenes() {
    images.forEach(img => {
      const oldKampos = kamposInstances.get(img);

      if (oldKampos) {
        oldKampos.destroy();
        kamposInstances.delete(img);
      }
    }); // get only scenes with active filter

    const filterScenes = config.images.map((img, index) => [img.filter, images[index]]).filter(x => {
      return x[0] && x[0].active;
    }); // create configs for background transform scenes

    return images.map((img, index) => {
      const parent = parents[index];
      const parentTop = parent.offsetTop;
      const parentHeight = parent.offsetHeight;
      const start = parentTop - viewportHeight;
      const duration = parentHeight + viewportHeight;
      const transforms = config.images[index].transforms;
      const filter = config.images[index].filter;
      const hasWebGL = filter.active && filter.type === 'displacement';

      if (transforms.fadeIn.active || transforms.fadeOut.active) {
        parent.style.backgroundColor = config.images[index].bgColor;
      }

      if (transforms.translateX.active) {
        img.style.width = '200%';
        img.style.objectFit = 'scale-down';
      } else {
        img.style.width = '100%';
        img.style.objectFit = 'cover';
      }

      return {
        effect: transform,
        start,
        duration,
        element: hasWebGL ? img.nextElementSibling : img,
        pauseDuringSnap: true,
        offset: viewportHeight,
        xOffset: (img.offsetWidth - parent.offsetWidth) / 2,
        ...transforms
      };
    }) // create configs for filter effect scenes
    .concat(filterScenes.map(([filter, scene]) => {
      const parent = scene.closest('[data-effects]');
      const parentTop = parent.offsetTop;
      const type = filter.type;
      const extra = {};
      let element = scene;
      let start = parentTop - viewportHeight * (100 - filter.start) / 100;
      let duration = viewportHeight;

      if (type === 'difference' || type === 'dodge') {
        parent.dataset.blend = type;
        element = scene.parentElement;
      }

      if (type === 'dodge') {
        extra.hue = filter.hue;
      } else if (type === 'focus') {
        extra.radius = filter.radius;
      } else if (type === 'displacement') {
        parent.dataset.canvas = 'displacement';
        const target = scene.nextElementSibling;
        const displacement = kampos.effects.displacement('DISCARD');
        const instance = new kampos.Kampos({
          target,
          effects: [displacement]
        });
        extra.displacement = displacement;
        extra.kampos = instance;
        displacement.map = scene;

        function bootstrap() {
          instance.setSource({
            media: scene,
            width: scene.naturalWidth,
            height: scene.naturalHeight
          });
          instance.play();
        }

        if (scene.complete) {
          bootstrap();
        } else {
          scene.onload = bootstrap;
        }

        kamposInstances.set(scene, instance);
      }

      return {
        effect: FILTERS[type],
        start,
        duration,
        element,
        viewportHeight,
        ...extra
      };
    }));
  }
  /*
   * Bootstrap
   */


  instance = init$1();
  /*
   * Factory for filter state change handlers
   */

  function filterChange(i) {
    // returns a handler for filter state handler
    return function (v) {
      switch (v) {
        case 'displacement':
          parents[i].dataset.blend = '';
          images[i].dataset.filter = '';
          images[i].style.filter = '';
          break;

        case 'difference':
        case 'dodge':
          images[i].dataset.filter = '';
          images[i].style.filter = '';
          delete parents[i].dataset.canvas;
          break;

        default:
          parents[i].dataset.blend = '';
          delete parents[i].dataset.canvas;
      }

      restart();
    };
  }

  function filterToggle(i) {
    return function (toggle) {
      if (toggle) {
        // activate to current state in config
        return filterChange(i)(config.images[i].filter.type);
      } // deactivate filter and blend


      parents[i].dataset.blend = '';
      images[i].dataset.filter = '';
      images[i].style.filter = '';
      delete parents[i].dataset.canvas;
      restart();
    };
  }
  /*
   * Restart scroll controller and effects
   */


  function restart() {
    instance.off();
    instance = init$1();
  }

  function map$1(x, a, b, c, d) {
    return (x - a) * (d - c) / (b - a) + c;
  }
  /**
   * Get a date string
   * @returns {string} YYYY-MM-DD-HH:MM:SS
   */


  function getTimeStamp() {
    const date = new Date();
    return `${date.toISOString().split('T')[0]}-${date.toLocaleTimeString('en-US', {
    hour12: false
  })}`;
  }
  /**
   * Download data to a file
   * https://stackoverflow.com/a/30832210
   * @param {string} data the file contents
   * @param {string} filename the file to save
   * @param {string} type file mime type ('text/plain' etc.)
   */


  function download(data, filename, type) {
    const file = new Blob([data], {
      type: type
    });
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
  /**
   * Read data from a text file
   * https://stackoverflow.com/a/45815534
   */


  function upload() {
    //alert('Not implemented yet')
    const input = document.createElement("input");
    input.type = 'file';
    input.accept = 'text/plain';
    input.multiple = 'multiple';

    input.onchange = function () {
      for (const file of this.files || []) {
        if (file) {
          const reader = new FileReader();
          reader.addEventListener('load', function (e) {
            console.log('loading', file.name);
            setValues(JSON.parse(e.target.result));
            gui.saveAs(file.name);
          });
          reader.readAsBinaryString(file);
        }
      }
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(function () {
      document.body.removeChild(input);
    }, 0);
  }
  /**
   * @param {Array<Object>} values in the format of the output of getValues()
   * [
   *   {
   *     "someKey": "value",
   *     "otherKey": "otherValue"
   *   },
   *   {
   *     "thirdKey": "thirdValue"
   *   },
   *   ...
   * ]
   */


  function setValues(rememberedValues) {
    rememberedValues.forEach((values, index) => {
      Object.keys(values).forEach(key => {
        const controller = gui.__rememberedObjectIndecesToControllers[index][key];
        controller && controller.setValue(values[key]);
      });
    });
  }

  function getValues() {
    return JSON.stringify(gui.__rememberedObjects, null, 2);
  }

})));
