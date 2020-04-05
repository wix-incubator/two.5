function clamp(min, max, val) {
  return Math.min(Math.max(min, val), max);
}

function defaultTo(obj, defaults) {
  return Object.assign(Object.create(defaults), obj);
}

function clone(...objects) {
  return Object.assign({}, ...objects);
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

const DEFAULTS = {
  animationActive: false,
  animationFriction: 0.4
};
class Two5 {
  constructor(config = {}) {
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
  }

  on() {
    this.setupEvents();
    this.setupEffects(); // start animating

    window.requestAnimationFrame(() => this.loop());
  }

  off() {
    window.cancelAnimationFrame(this.animationFrame);
    this.teardownEvents();
  }

  loop() {
    this.animationFrame = window.requestAnimationFrame(() => this.loop());
    this.measures.forEach(measure => measure(this.progress));

    if (this.config.animationActive) {
      this.lerp();
    }

    this.effects.forEach(effect => effect(this.config.animationActive ? this.currentProgress : this.progress));
  }

  lerp() {
    this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.animationFriction);
    this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.animationFriction);
  }

  setupEvents() {}

  teardownEvents() {}

  getEffects() {
    return [];
  }

  setupEffects() {
    this.effects.push(...this.getEffects());
  }

  teardownEffects() {
    this.measures.length = 0;
    this.effects.length = 0;
  }

}

const DEFAULTS$1 = {
  perspectiveZ: 600,
  elevation: 10,
  transitionDuration: 200,
  transitionActive: false,
  transitionEasing: 'ease-out',
  perspectiveActive: false,
  perspectiveInvertX: false,
  perspectiveInvertY: false,
  perspectiveMaxX: 0,
  perspectiveMaxY: 0,
  translationActive: true,
  translationInvertX: false,
  translationInvertY: false,
  translationMaxX: 50,
  translationMaxY: 50,
  invertRotation: false,
  // used for orientation compensation when using deviceorientation event, reference see below
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

function getHandler({
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

const DEFAULTS$2 = {
  samples: 3,
  maxBeta: 15,
  maxGamma: 15
};
function getHandler$1({
  progress,
  samples = DEFAULTS$2.samples,
  maxBeta = DEFAULTS$2.maxBeta,
  maxGamma = DEFAULTS$2.maxGamma
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

class Tilt extends Two5 {
  constructor(config = {}) {
    super(config);
    this.container = this.config.layersContainer || null;
    this.createLayers();
  }

  createLayers() {
    const layersContainer = this.container || window.document.body;
    this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
    this.layers = this.layers.map(layer => {
      let config;

      if (layer instanceof Element) {
        config = Object.assign({
          el: layer
        }, layer.dataset);
      } else if (typeof layer == 'object' && layer) {
        config = layer;
      }

      return config;
    }).filter(x => x);
  }

  getEffects() {
    return [getEffect(clone({
      invertRotation: !!this.usingGyroscope
    }, this.config, {
      container: this.container,
      layers: this.layers
    }))];
  }

  setupEvents() {
    const gyroscoeHandler = getHandler$1({
      progress: this.progress,
      samples: this.config.gyroscopeSamples,
      maxBeta: this.config.maxBeta,
      maxGamma: this.config.maxGamma
    });

    if (gyroscoeHandler) {
      this.usingGyroscope = true;
      this.tiltHandler = gyroscoeHandler;
    } else {
      /*
       * No deviceorientation support
       */
      this.tiltHandler = getHandler({
        target: this.config.mouseTarget,
        progress: this.progress
      });
    }

    this.tiltHandler.on();
  }

  teardownEvents() {
    this.tiltHandler.off();
  }

}

export { Tilt };
