function formatTransition({
  property,
  duration,
  easing
}) {
  return `${property} ${duration}ms ${easing}`;
}

function getEffect({
  container,
  layers,
  elevation,
  scenePerspective,
  transition,
  perspective,
  translation,
  rotation,
  skewing,
  scaling
}) {
  let layerPerspective = '';
  /*
   * Init effect
   * also set transition if required.
   */

  if (container) {
    const containerStyle = {
      perspective: `${scenePerspective}px`
    };

    if (transition.active && perspective.active) {
      containerStyle.transition = formatTransition({
        property: 'perspective-origin',
        ...transition
      });
    }

    Object.assign(container.style, containerStyle);
  } else {
    // if there's no container set perspective() as part of transform of each layer
    layerPerspective = `perspective(${scenePerspective}px) `;
  }

  const layerStyle = {
    'pointer-events': 'none'
  };

  if (transition.active) {
    layerStyle.transition = formatTransition({
      property: 'transform',
      ...transition
    });
  }

  layers.forEach(layer => Object.assign(layer.el.style, layerStyle));
  return function tilt({
    x,
    y
  }) {
    const len = layers.length;
    let translateXFactor;
    let translateYFactor;
    let rotateXFactor;
    let rotateYFactor;
    let skewXFactor;
    let skewYFactor;
    let scaleXFactor;
    let scaleYFactor;

    if (translation.active) {
      translateXFactor = translation.active === 'y' ? 0 : (translation.invertX ? -1 : 1) * translation.max * (2 * x - 1);
      translateYFactor = translation.active === 'x' ? 0 : (translation.invertY ? -1 : 1) * translation.max * (2 * y - 1);
    }

    if (rotation.active) {
      rotateXFactor = rotation.active === 'y' ? 0 : (rotation.invertX ? -1 : 1) * rotation.max * (y * 2 - 1);
      rotateYFactor = rotation.active === 'x' ? 0 : (rotation.invertY ? -1 : 1) * rotation.max * (1 - x * 2);
    }

    if (skewing.active) {
      skewXFactor = skewing.active === 'y' ? 0 : (skewing.invertX ? -1 : 1) * skewing.max * (1 - x * 2);
      skewYFactor = skewing.active === 'x' ? 0 : (skewing.invertY ? -1 : 1) * skewing.max * (1 - y * 2);
    }

    if (scaling.active) {
      scaleXFactor = scaling.active === 'y' ? 0 : (scaling.invertX ? -1 : 1) * scaling.max * (Math.abs(0.5 - x) * 2);
      scaleYFactor = scaling.active === 'x' ? 0 : (scaling.invertY ? -1 : 1) * scaling.max * (Math.abs(0.5 - y) * 2);
    }

    layers.forEach((layer, index) => {
      const depth = (index + 1) / len;
      let translatePart = '';
      const translateZVal = elevation * (index + 1);

      if (translation.active) {
        const translateXVal = translateXFactor * depth;
        const translateYVal = translateYFactor * depth;
        translatePart = `translate3d(${translateXVal}px, ${translateYVal}px, ${translateZVal}px)`;
      } else {
        translatePart = `translateZ(${translateZVal}px)`;
      }

      let rotatePart = '';

      if (rotation.active) {
        const rotateXVal = rotateXFactor * depth;
        const rotateYVal = rotateYFactor * depth;
        rotatePart = `rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg)`;
      } else {
        rotatePart = 'rotateX(0deg) rotateY(0deg)';
      }

      let skewPart = '';

      if (skewing.active) {
        const skewXVal = skewXFactor * depth;
        const skewYVal = skewYFactor * depth;
        skewPart = `skew(${skewXVal}deg, ${skewYVal}deg)`;
      } else {
        skewPart = 'skew(0deg, 0deg)';
      }

      let scalePart = '';

      if (scaling.active) {
        const scaleXVal = 1 + scaleXFactor * depth;
        const scaleYVal = 1 + scaleYFactor * depth;
        scalePart = `scale(${scaleXVal}, ${scaleYVal})`;
      } else {
        scalePart = 'scale(1, 1)';
      }

      layer.el.style.transform = `${layerPerspective}${translatePart} ${scalePart} ${skewPart} ${rotatePart}`;
    });

    if (perspective.active) {
      const perspX = perspective.active === 'y' ? 0 : perspective.invertX ? x : 1 - x;
      const perspY = perspective.active === 'x' ? 0 : perspective.invertY ? y : 1 - y;
      let a = 1,
          b = 0;

      if (perspective.max) {
        a = 1 + 2 * perspective.max;
        b = perspective.max;
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
  gyroscopeSamples: 3,
  maxBeta: 15,
  maxGamma: 15,
  scenePerspective: 600,
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
class Two5 {
  constructor(config = {}) {
    this.config = clone(DEFAULTS, config);
    this.progress = {
      x: 0,
      y: 0
    };
    let layersContainer;

    if (this.config.layersContainer) {
      layersContainer = this.config.layersContainer;
      this.container = layersContainer;
    } else {
      layersContainer = window.document.body;
      this.container = null;
    }

    this.layers = [...layersContainer.querySelectorAll('[data-tilt-layer]')].map(el => ({
      el
    }));
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
    const tilt = getEffect({
      container: this.container,
      layers: this.layers,
      scenePerspective: this.config.scenePerspective,
      elevation: this.config.elevation,
      transition: {
        active: this.config.transitionActive,
        duration: this.config.transitionDuration,
        easing: this.config.transitionEasing
      },
      perspective: {
        active: this.config.perspectiveActive,
        invertX: this.config.perspectiveInvertX,
        invertY: this.config.perspectiveInvertY,
        max: this.config.perspectiveMax
      },
      translation: {
        active: this.config.translationActive,
        invertX: this.config.translationInvertX,
        invertY: this.config.translationInvertY,
        max: this.config.translationMax
      },
      rotation: {
        active: this.config.rotationActive,
        invertX: this.config.rotationInvertX,
        invertY: this.config.rotationInvertY,
        max: this.config.rotationMax
      },
      skewing: {
        active: this.config.skewActive,
        invertX: this.config.skewInvertX,
        invertY: this.config.skewInvertY,
        max: this.config.skewMax
      },
      scaling: {
        active: this.config.scaleActive,
        invertX: this.config.scaleInvertX,
        invertY: this.config.scaleInvertY,
        max: this.config.scaleMax
      }
    });
    this.effects.push(tilt);
  }

  teardownEffects() {
    this.effects.length = 0;
  }

}

export default Two5;
