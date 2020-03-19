function getEffect({
  container,
  layers,
  elevation,
  scenePerspective,
  perspective,
  translation,
  rotation,
  skewing,
  scaling
}) {
  let layerPerspective = '';
  /*
   * Init effect
   */

  if (container) {
    Object.assign(container.style, {
      // 'transform-style': 'preserve-3d',
      perspective: `${scenePerspective}px`
    });
  } else {
    layerPerspective = `perspective(${scenePerspective}px) `;
  }

  layers.forEach(layer => {
    Object.assign(layer.el.style, {
      'transform-style': 'preserve-3d',
      'pointer-events': 'none'
    });
  });
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
      translateXFactor = (translation.invertX ? -1 : 1) * translation.max * (2 * x - 1);
      translateYFactor = (translation.invertY ? -1 : 1) * translation.max * (2 * y - 1);
    }

    if (rotation.active) {
      rotateXFactor = (rotation.invertX ? -1 : 1) * rotation.max * (y * 2 - 1);
      rotateYFactor = (rotation.invertY ? -1 : 1) * rotation.max * (1 - x * 2);
    }

    if (skewing.active) {
      skewXFactor = (skewing.invertX ? -1 : 1) * skewing.max * (1 - x * 2);
      skewYFactor = (skewing.invertY ? -1 : 1) * skewing.max * (1 - y * 2);
    }

    if (scaling.active) {
      scaleXFactor = (scaling.invertX ? -1 : 1) * scaling.max * (Math.abs(0.5 - x) * 2);
      scaleYFactor = (scaling.invertY ? -1 : 1) * scaling.max * (Math.abs(0.5 - y) * 2);
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
      const perspX = perspective.invertX ? x : 1 - x;
      const perspY = perspective.invertY ? y : 1 - y;
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
  rect
}) {
  const {
    width,
    height,
    left,
    top
  } = rect;
  return function handler(event) {
    const {
      clientX,
      clientY
    } = event; // percentage of position progress

    const x = clamp(0, 1, (clientX - left) / width);
    const y = clamp(0, 1, (clientY - top) / height);
    target.x = x;
    target.y = y;
  };
}

const DEFAULTS = {
  mouseTarget: null,
  layersContainer: null,
  samples: 10,
  maxBeta: 30,
  maxGamma: 30,
  scenePerspective: 600,
  elevation: 10,
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
    if (this.config.mouseTarget) {
      this.tiltTarget = this.config.mouseTarget;
      this.rect = clone(this.tiltTarget.getBoundingClientRect().toJSON());
    } else {
      this.tiltTarget = window;
      this.rect = {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }

    this.hoverHandler = getHandler({
      target: this.progress,
      rect: this.rect
    });
    this.tiltTarget.addEventListener('mousemove', this.hoverHandler);
  }

  teardownEvents() {
    this.tiltTarget.removeEventListener('mousemove', this.hoverHandler);
  }

  setupEffects() {
    const tilt = getEffect({
      container: this.container,
      layers: this.layers,
      scenePerspective: this.config.scenePerspective,
      elevation: this.config.elevation,
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

}

export default Two5;
