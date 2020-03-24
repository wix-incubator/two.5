function formatTransition({
  property,
  duration,
  easing
}) {
  return `${property} ${duration}ms ${easing}`;
}

function getEffect(config) {
  const container = config.container;
  const layers = config.layers;
  const perspectiveZ = config.perspectiveZ;
  /*
   * Init effect
   * also set transition if required.
   */

  if (container) {
    const containerStyle = {
      perspective: `${perspectiveZ}px`
    };

    if (config.transitionActive && config.perspectiveActive) {
      containerStyle.transition = formatTransition({
        property: 'perspective-origin',
        duration: config.transitionDuration,
        easing: config.transitionEasing
      });
    }

    Object.assign(container.style, containerStyle);
  }
  /*
   * Setup layers styling
   */


  layers.forEach(layer => {
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
    const len = layers.length;
    layers.forEach((layer, index) => {
      const depth = layer.depth || (index + 1) / len;
      const translateZVal = layer.elevation !== null ? layer.elevation : config.elevation * (index + 1);
      let translatePart = '';

      if (layer.translationActive) {
        const translateXVal = layer.translationActive === 'y' ? 0 : (layer.translationInvertX ? -1 : 1) * layer.translationMax * (2 * x - 1) * depth;
        const translateYVal = layer.translationActive === 'x' ? 0 : (layer.translationInvertY ? -1 : 1) * layer.translationMax * (2 * y - 1) * depth;
        translatePart = `translate3d(${translateXVal}px, ${translateYVal}px, ${translateZVal}px)`;
      } else {
        translatePart = `translateZ(${translateZVal}px)`;
      }

      let rotatePart = '';

      if (layer.rotationActive) {
        const rotateXVal = layer.rotationActive === 'y' ? 0 : (layer.rotationInvertX ? -1 : 1) * layer.rotationMax * (1 - y * 2) * depth;
        const rotateYVal = layer.rotationActive === 'x' ? 0 : (layer.rotationInvertY ? -1 : 1) * layer.rotationMax * (x * 2 - 1) * depth;
        rotatePart = `rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg)`;
      } else {
        rotatePart = 'rotateX(0deg) rotateY(0deg)';
      }

      let skewPart = '';

      if (layer.skewActive) {
        const skewXVal = layer.skewActive === 'y' ? 0 : (layer.skewInvertX ? -1 : 1) * layer.skewMax * (1 - x * 2) * depth;
        const skewYVal = layer.skewActive === 'x' ? 0 : (layer.skewInvertY ? -1 : 1) * layer.skewMax * (1 - y * 2) * depth;
        skewPart = `skew(${skewXVal}deg, ${skewYVal}deg)`;
      } else {
        skewPart = 'skew(0deg, 0deg)';
      }

      let scalePart = '';

      if (layer.scaleActive) {
        const scaleXVal = layer.scaleActive === 'y' ? 1 : 1 + (layer.scaleInvertX ? -1 : 1) * layer.scaleMax * (Math.abs(0.5 - x) * 2) * depth;
        const scaleYVal = layer.scaleActive === 'x' ? 1 : 1 + (layer.scaleInvertY ? -1 : 1) * layer.scaleMax * (Math.abs(0.5 - y) * 2) * depth;
        scalePart = `scale(${scaleXVal}, ${scaleYVal})`;
      } else {
        scalePart = 'scale(1, 1)';
      }

      let layerPerspectiveZ = '';

      if (layer.perspectiveZ) {
        layerPerspectiveZ = `perspective(${layer.perspectiveZ}px) `;
      } else if (!container) {
        layerPerspectiveZ = `perspective(${config.perspectiveZ}px) `;
      }

      layer.el.style.transform = `${layerPerspectiveZ}${translatePart} ${scalePart} ${skewPart} ${rotatePart}`;
    });

    if (config.perspectiveActive) {
      const perspX = config.perspectiveActive === 'y' ? 0 : config.perspectiveInvertX ? x : 1 - x;
      const perspY = config.perspectiveActive === 'x' ? 0 : config.perspectiveInvertY ? y : 1 - y;
      let a = 1,
          b = 0;

      if (config.perspectiveMax) {
        a = 1 + 2 * config.perspectiveMax;
        b = config.perspectiveMax;
      }

      container.style.perspectiveOrigin = `${(perspX * a - b) * 100}% ${(perspY * a - b) * 100}%`;
    } else if (container) {
      container.style.perspectiveOrigin = '50% 50%';
    }
  };
}

function clamp(min, max, val) {
  return Math.min(Math.max(min, val), max);
}

function clone(...objects) {
  return Object.assign(Object.create(null), ...objects);
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

function getHandler$1({
  samples,
  maxBeta,
  maxGamma,
  progress
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

const DEFAULTS = {
  mouseTarget: null,
  layersContainer: null,
  layers: null,
  gyroscopeSamples: 3,
  maxBeta: 15,
  maxGamma: 15,
  perspectiveZ: 600,
  elevation: 10,
  transitionActive: false,
  transitionDuration: 200,
  transitionEasing: 'ease-out',
  perspectiveActive: false,
  perspectiveInvertX: false,
  perspectiveInvertY: false,
  perspectiveMax: 0,
  translationActive: true,
  translationInvertX: false,
  translationInvertY: false,
  translationMax: 50,
  rotationActive: false,
  rotationInvertX: false,
  rotationInvertY: false,
  rotationMax: 25,
  skewActive: false,
  skewInvertX: false,
  skewInvertY: false,
  skewMax: 25,
  scaleActive: false,
  scaleInvertX: false,
  scaleInvertY: false,
  scaleMax: 0.5
};
const LAYER_PROPS_WITH_DEFAULT = {
  perspectiveZ: null,
  elevation: null
};
class Two5 {
  constructor(config = {}) {
    this.config = clone(DEFAULTS, config);
    this.progress = {
      x: 0,
      y: 0
    };
    this.container = this.config.layersContainer || null;
    this.createLayers();
    this.effects = [];
  }

  createLayers() {
    const layersContainer = this.container || window.document.body;
    this.layers = this.config.layers || [...layersContainer.querySelectorAll('[data-tilt-layer]')];
    this.layers = this.layers.map(layer => {
      let config;

      if (layer instanceof Element) {
        config = clone(this.config, {
          el: layer,
          ...LAYER_PROPS_WITH_DEFAULT
        }, layer.dataset);
      } else if (typeof layer == 'object' && layer) {
        config = clone(this.config, LAYER_PROPS_WITH_DEFAULT, layer);
      }

      return config;
    }).filter(x => x);
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
    this.effects.forEach(effect => effect(this.progress));
  }

  setupEvents() {
    const gyroscoeHandler = getHandler$1({
      samples: this.config.gyroscopeSamples,
      maxBeta: this.config.maxBeta,
      maxGamma: this.config.maxGamma,
      progress: this.progress
    });

    if (gyroscoeHandler) {
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

  setupEffects() {
    const tilt = getEffect(clone(this.config, {
      container: this.container,
      layers: this.layers
    }));
    this.effects.push(tilt);
  }

  teardownEffects() {
    this.effects.length = 0;
  }

}

export default Two5;
