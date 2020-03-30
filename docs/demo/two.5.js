function formatTransition({
  property,
  duration,
  easing
}) {
  return `${property} ${duration}ms ${easing}`;
}

function setProperty(scope, name, v) {
  scope.style.setProperty(name, v);
}

const SETTERS = {
  depth(scope, v) {
    setProperty(scope, '--depth', v);
  },

  perspectiveZ(scope, v) {
    setProperty(scope, '--pz', `${v}px`);
  },

  perspectiveActive(scope, v, config) {
    const px = config.container ? 0 : +(v && v !== 'y');
    const py = config.container ? 0 : +(v && v !== 'x');
    setProperty(scope, '--px-on', px);
    setProperty(scope, '--py-on', py);
  },

  perspectiveInvertX(scope, v) {
    setProperty(scope, '--px-dir', v);
  },

  perspectiveInvertY(scope, v) {
    setProperty(scope, '--py-dir', v);
  },

  perspectiveMax(scope, v) {
    setProperty(scope, '--p-max', v);
  },

  translationActive(scope, v) {
    const tx = +(v && v !== 'y');
    const ty = +(v && v !== 'x');
    setProperty(scope, '--tx-on', tx);
    setProperty(scope, '--ty-on', ty);
  },

  translationInvertX(scope, v) {
    setProperty(scope, '--tx-dir', v);
  },

  translationInvertY(scope, v) {
    setProperty(scope, '--ty-dir', v);
  },

  translationMax(scope, v) {
    setProperty(scope, '--t-max', `${v}px`);
  },

  rotationActive(scope, v, con) {
    const rx = +(v && v !== 'y');
    const ry = +(v && v !== 'x');
    setProperty(scope, '--rx-on', rx);
    setProperty(scope, '--ry-on', ry);
  },

  rotationInvertX(scope, v) {
    setProperty(scope, '--rx-dir', v);
  },

  rotationInvertY(scope, v) {
    setProperty(scope, '--ry-dir', v);
  },

  rotationMax(scope, v) {
    setProperty(scope, '--r-max', `${v}deg`);
  },

  skewActive(scope, v) {
    const skx = +(v && v !== 'y');
    const sky = +(v && v !== 'x');
    setProperty(scope, '--skx-on', skx);
    setProperty(scope, '--sky-on', sky);
  },

  skewInvertX(scope, v) {
    setProperty(scope, '--skx-dir', v);
  },

  skewInvertY(scope, v) {
    setProperty(scope, '--sky-dir', v);
  },

  skewMax(scope, v) {
    setProperty(scope, '--sk-max', `${v}deg`);
  },

  scaleActive(scope, v) {
    const sx = +(v && v !== 'y');
    const sy = +(v && v !== 'x');
    setProperty(scope, '--sx-on', sx);
    setProperty(scope, '--sy-on', sy);
  },

  scaleInvertX(scope, v) {
    setProperty(scope, '--sx-dir', v);
  },

  scaleInvertY(scope, v) {
    setProperty(scope, '--sy-dir', v);
  },

  scaleMax(scope, v) {
    setProperty(scope, '--s-max', v);
  }

};
function getEffect(config) {
  const container = config.container;
  const scope = container || window.document.documentElement;
  const layers = config.layers;
  /*
   * Setup container/global config
   */

  Object.keys(config).forEach(key => {
    const setter = SETTERS[key];

    if (setter) {
      setter(scope, config[key], config);
    }
  });
  /*
   * Setup perspective transition if required.
   */

  if (container && config.transitionActive && config.perspectiveActive) {
    container.style.transition = formatTransition({
      property: 'perspective-origin',
      duration: config.transitionDuration,
      easing: config.transitionEasing
    });
  } else if (container) {
    container.style.transition = '';
  }
  /*
   * Setup layers config
   */


  const len = layers.length;
  layers.forEach((layer, index) => {
    if (!layer.allowPointer) {
      layer.el.dataset.tiltNoPointer = '';
    }

    if (layer.transitionActive) {
      layer.el.style.transition = formatTransition({
        property: 'transform',
        duration: layer.transitionDuration,
        easing: layer.transitionEasing
      });
    } else {
      layer.el.transition = '';
    }

    Object.keys(layer).forEach(key => {
      const setter = SETTERS[key];

      if (setter) {
        setter(layer.el, layer[key], layer);
      }
    });

    if (!Object.prototype.hasOwnProperty.call(layer, 'depth')) {
      SETTERS.depth(layer.el, (index + 1) / len);
    }

    if (config.elevation && !Object.prototype.hasOwnProperty.call(layer, 'elevation')) {
      setProperty(layer.el, '--tz', `${config.elevation * (index + 1)}px`);
    } else if (Object.prototype.hasOwnProperty.call(layer, 'elevation')) {
      setProperty(layer.el, '--tz', `${layer.elevation}px`);
    }
  });
  return function tilt({
    x,
    y
  }) {
    // const style = window.document.documentElement.style;
    const style = scope.style;
    style.setProperty('--x', x);
    style.setProperty('--y', y);
    style.setProperty('--x-scale', Math.abs(0.5 - x));
    style.setProperty('--y-scale', Math.abs(0.5 - y));
  };
}

function clamp(min, max, val) {
  return Math.min(Math.max(min, val), max);
}

function clone(...objects) {
  return Object.assign(Object.create(null), ...objects);
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
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

class Two5 {
  constructor(config = {}) {
    this.config = config;
    this.progress = {
      x: 0,
      y: 0
    };
    this.currentProgress = {
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
        config = clone({
          el: layer
        }, layer.dataset);
      } else if (typeof layer == 'object' && layer) {
        config = clone(layer);
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

    if (this.config.animationActive) {
      this.lerp();
    }

    this.effects.forEach(effect => effect(this.config.animationActive ? this.currentProgress : this.progress));
  }

  lerp() {
    this.currentProgress.x = lerp(this.currentProgress.x, this.progress.x, 1 - this.config.animationFriction);
    this.currentProgress.y = lerp(this.currentProgress.y, this.progress.y, 1 - this.config.animationFriction);
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
