(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function defaultTo(obj, defaults) {
    return Object.assign(Object.create(defaults), obj);
  }

  function lerp(a, b, t) {
    return a * (1 - t) + b * t;
  }

  const DEFAULTS = {
    horizontal: false
  };

  function getEffect(config) {
    const _config = defaultTo(config, DEFAULTS);

    const container = _config.container;
    const horizontal = _config.horizontal;
    let totalHeight, totalWidth;

    if (container) {
      /*
       * Setup Smooth Scroll technique
       */
      totalHeight = container.offsetHeight;
      totalWidth = container.offsetWidth;
      window.document.body.style.height = `${totalHeight}px`;
      window.document.body.style.width = `${totalWidth}px`;
    } else {
      totalHeight = window.innerHeight;
      totalWidth = window.innerWidth;
    }

    _config.scenes = _config.scenes.map(scene => {
      const conf = defaultTo(scene, _config);

      if (conf.end == null) {
        conf.end = conf.start + conf.duration;
      } else if (conf.duration == null) {
        conf.duration = conf.end - conf.start;
      }

      return conf;
    });
    return function controller({
      x,
      y
    }) {
      if (container) {
        container.style.transform = `translate3d(${-x}px, ${-y}px, 0px)`;
      }

      _config.scenes.forEach(scene => {
        if (!scene.disabled) {
          const {
            start,
            end,
            duration
          } = scene;
          let progress = 0;

          if (horizontal) {
            if (x >= start && x <= end) {
              progress = duration ? (x - start) / duration : 1;
            } else if (x > end) {
              progress = 1;
            }
          } else {
            if (y >= start && y <= end) {
              progress = duration ? (y - start) / duration : 1;
            } else if (y > end) {
              progress = 1;
            }
          }

          scene.effects.forEach(effect => effect(scene, progress));
        }
      });
    };
  }

  function getHandler() {
    function handler(progress) {
      progress.x = window.scrollX || window.pageXOffset;
      progress.y = window.scrollY || window.pageYOffset;
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

  const DEFAULTS$1 = {
    animationActive: false,
    animationFriction: 0.4
  };

  class Two5 {
    constructor(config = {}) {
      this.config = defaultTo(config, DEFAULTS$1);
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

  class Scroll extends Two5 {
    constructor(config = {}) {
      super(config);
    }

    getEffects() {
      return [getEffect(this.config)];
    }

    setupEvents() {
      this.measures.push(getHandler().handler);
    }

    teardownEvents() {
      this.measures.length = 0;
    }

  }

  function background(scene, progress) {
    scene.element.style.transform = `translate3d(0px, ${(progress * scene.duration - scene.viewportHeight) * scene.speed}px, 0px)`;
  }

  function createScenes() {
    const viewportHeight = window.innerHeight;
    const parents = window.document.querySelectorAll('[data-effects~="parallax"]');
    const layers = [...window.document.querySelectorAll('[data-effects~="parallax"] img')];
    return layers.map((layer, index) => {
      const parentTop = parents[index].offsetTop;
      const parentHeight = parents[index].offsetHeight;
      return {
        effects: [background],
        speed: +parents[index].dataset.speed,
        start: parentTop - viewportHeight,
        duration: (parentHeight > viewportHeight ? parentHeight : viewportHeight) + viewportHeight,
        element: layer,
        viewportHeight
      };
    });
  }

  const parallax = new Scroll({
    container: document.querySelector('main'),
    scenes: createScenes(),
    animationActive: true,
    animationFriction: 0.9
  });
  parallax.on();

})));
