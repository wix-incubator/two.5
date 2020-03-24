import Two5 from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const container = document.querySelector('main');
const layers = [...container.querySelectorAll('img, h1, h2')];

class Demo {
    constructor () {
        this.currentContainer = container;

        this.two5 = new Two5({
            translationActive: false,
            layers
        });

        this.two5.on();
        this.setupStats();

        this.two5Config = {
            hitRegion: null,
            perspectiveZ: 0,
            elevation: 0,
            transition: {
                active: this.two5.config.transitionActive,
                duration: this.two5.config.transitionDuration,
                easing: this.two5.config.transitionEasing
            },
            elements: this.createElementsConfig()
        };

        this.gui = new dat.GUI();

        this.gui.add(this.two5Config, 'hitRegion', {screen: null, container: 'container'})
            .onChange(value => {
                const mouseTarget = value && this.currentContainer;
                this.two5.off();
                this.two5.config.mouseTarget = mouseTarget;
                this.two5.on();
                this.setupStats();
            });

        this.sceneConfig = this.gui.addFolder('Scene config');

        this.sceneConfig.add(this.two5Config, 'elevation', 0, 40, 1)
            .onChange(this.getSceneHandler('elevation'));

        this.sceneConfig.add(this.two5Config, 'perspectiveZ', 100, 1000, 50)
            .onChange(this.getSceneHandler('perspectiveZ'));

        this.transition = this.gui.addFolder('Transition');
        this.transition.add(this.two5Config.transition, 'active')
            .onChange((function (handler) {
                return v => {
                    if (v === false) {
                        this.two5.container.style.transition = '';
                        this.two5.layers.forEach(layer => layer.el.style.transition = '');
                    }

                    return handler(v);
                };
            })(this.getSceneHandler('transitionActive')));
        this.transition.add(this.two5Config.transition, 'duration', 50, 1000, 50)
            .onChange(this.getSceneHandler('transitionDuration'));
        this.transition.add(this.two5Config.transition, 'easing', ['linear', 'ease-out'])
            .onChange(this.getSceneHandler('transitionEasing'));

        this.elementsFolder = this.gui.addFolder('Elements');

        this.two5.layers.forEach((layer, index) => {
            const layerFolder = this.elementsFolder.addFolder(layer.el.id);

            this.createEffectControls(layerFolder, this.two5Config.elements[index], index);
        });
    }

    setupStats () {
        this.two5.effects.unshift(function () {
            stats.begin();
        });
        this.two5.effects.push(function () {
            stats.end();
        });
    }

    createEffectConfig (config) {
        return {
            perspective: {
                active: config.perspectiveActive,
                invertX: config.perspectiveInvertX,
                invertY: config.perspectiveInvertY,
                max: config.perspectiveMax
            },
            translation: {
                active: config.translationActive,
                invertX: config.translationInvertX,
                invertY: config.translationInvertY,
                max: config.translationMax
            },
            rotation: {
                active: config.rotationActive,
                invertX: config.rotationInvertX,
                invertY: config.rotationInvertY,
                max: config.rotationMax
            },
            skewing: {
                active: config.skewActive,
                invertX: config.skewInvertX,
                invertY: config.skewInvertY,
                max: config.skewMax
            },
            scaling: {
                active: config.scaleActive,
                invertX: config.scaleInvertX,
                invertY: config.scaleInvertY,
                max: config.scaleMax
            }
        };
    }

    createElementsConfig () {
        return this.two5.layers.reduce((acc, layer, index) => {
            acc[index] = this.createEffectConfig(layer);
            return acc;
        }, {});
    }

    getSceneHandler (prop) {
        return v => {
            if (v === 'true') v = true;
            if (v === 'false') v = false;

            this.two5.layers.forEach(layer => {
                if (layer[prop] === this.two5.config[prop]) {
                    layer[prop] = v;
                }
            });
            this.two5.config[prop] = v;

            this.two5.teardownEffects();
            this.two5.setupEffects();
            this.setupStats();
        };
    }

    getLayerHandler (prop, index) {
        return v => {
            if (v === 'true') v = true;
            if (v === 'false') v = false;

            this.two5.layers[index][prop] = v;

            this.two5.teardownEffects();
            this.two5.setupEffects();
            this.setupStats();
        };
    }

    createEffectControls (folder, config, targetIndex) {
        const getHandler = config === this.two5Config
            ? prop => this.getSceneHandler(prop)
            : (prop, index) => this.getLayerHandler(prop, index);

        const perspective = folder.addFolder('Perspective');
        perspective.add(config.perspective, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('perspectiveActive', targetIndex));
        perspective.add(config.perspective, 'invertX')
            .onChange(getHandler('perspectiveInvertX', targetIndex));
        perspective.add(config.perspective, 'invertY')
            .onChange(getHandler('perspectiveInvertY', targetIndex));
        perspective.add(config.perspective, 'max', 0, 0.5, 0.05)
            .onChange(getHandler('perspectiveMax', targetIndex));

        const translation = folder.addFolder('Translation');
        translation.add(config.translation, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('translationActive', targetIndex));
        translation.add(config.translation, 'invertX')
            .onChange(getHandler('translationInvertX', targetIndex));
        translation.add(config.translation, 'invertY')
            .onChange(getHandler('translationInvertY', targetIndex));
        translation.add(config.translation, 'max', 10, 150, 5)
            .onChange(getHandler('translationMax', targetIndex));
        translation.open();

        const rotation = folder.addFolder('Rotation');
        rotation.add(config.rotation, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('rotationActive', targetIndex));
        rotation.add(config.rotation, 'invertX')
            .onChange(getHandler('rotationInvertX', targetIndex));
        rotation.add(config.rotation, 'invertY')
            .onChange(getHandler('rotationInvertY', targetIndex));
        rotation.add(config.rotation, 'max', 10, 60, 1)
            .onChange(getHandler('rotationMax', targetIndex));

        const skewing = folder.addFolder('Skewing');
        skewing.add(config.skewing, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('skewActive', targetIndex));
        skewing.add(config.skewing, 'invertX')
            .onChange(getHandler('skewInvertX', targetIndex));
        skewing.add(config.skewing, 'invertY')
            .onChange(getHandler('skewInvertY', targetIndex));
        skewing.add(config.skewing, 'max', 10, 60, 1)
            .onChange(getHandler('skewMax', targetIndex));

        const scaling = folder.addFolder('Scaling');
        scaling.add(config.scaling, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('scaleActive', targetIndex));
        scaling.add(config.scaling, 'invertX')
            .onChange(getHandler('scaleInvertX', targetIndex));
        scaling.add(config.scaling, 'invertY')
            .onChange(getHandler('scaleInvertY', targetIndex));
        scaling.add(config.scaling, 'max', 0.1, 2, 0.1)
            .onChange(getHandler('scaleMax', targetIndex));
    }
}

const demo = new Demo();
