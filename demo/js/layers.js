import { Tilt } from '../../index.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module';
import Stats from '../../node_modules/stats.js/src/Stats';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const scenes = document.querySelector('[data-scene]');
const imagesContainer = scenes.querySelector('#images-container');
const shapesContainer = scenes.querySelector('#shapes-container');

class Demo {
    constructor () {
        this.currentContainer = imagesContainer;

        this.two5 = new Tilt({
            layersContainer: this.currentContainer,
            mouseTarget: null,
            translationActive: true
        });

        this.two5.on();
        this.setupStats();

        this.two5Config = {
            scene: 'images',
            hitRegion: null,
            perspectiveZ: 600,
            elevation: 10,
            animation: {
                active: this.two5.config.animationActive,
                friction: this.two5.config.animationFriction
            },
            ...this.createEffectConfig(this.two5.config),
            layers: this.createLayersConfig()
        };

        this.sceneLayers = {};
        this.sceneLayers[this.two5Config.scene] = this.two5.layers;

        this.gui = new dat.GUI();

        this.gui.add(this.two5Config, 'scene', ['images', 'shapes'])
            .onChange(value => {
                this.currentLayersFolder.hide();

                switch (value) {
                    case 'images':
                        this.currentContainer = imagesContainer;
                        scenes.dataset.scene = value;
                        this.currentLayersFolder = this.imagesLayersFolder;
                        break;
                    case 'shapes':
                        this.currentContainer = shapesContainer;
                        scenes.dataset.scene = value;
                        this.currentLayersFolder = this.shapesLayersFolder;
                        break;
                }
                this.two5.off();
                this.two5.config.layersContainer = this.two5.container = this.currentContainer;

                if (this.sceneLayers[value]) {
                    this.two5.layers = this.sceneLayers[value];
                    this.currentLayersFolder.show();
                }
                else {
                    this.two5.createLayers();
                    this.sceneLayers[value] = this.two5.layers;

                    if (value === 'shapes') {
                        this.currentLayersFolder = this.shapesLayersFolder = this.gui.addFolder('Shapes layers');

                        this.two5.layers.forEach((layer, index) => {
                            const layerFolder = this.shapesLayersFolder.addFolder(`Layer ${index + 1}`);

                            this.createEffectControls(layerFolder, this.two5Config.layers[index], index);
                        });
                    }
                }

                this.two5.on();
                this.setupStats();
            });

        this.gui.add(this.two5Config, 'hitRegion', {screen: null, container: 'container'})
            .onChange(value => {
                const mouseTarget = value && this.currentContainer;
                this.two5.off();
                this.two5.config.mouseTarget = mouseTarget;
                this.two5.config.layersContainer = this.two5.container = this.currentContainer;
                this.two5.on();
                this.setupStats();
            });

        this.sceneConfig = this.gui.addFolder('Scene config');

        this.sceneConfig.add(this.two5Config, 'elevation', 0, 40, 1)
            .onChange(this.getSceneHandler('elevation'));

        this.sceneConfig.add(this.two5Config, 'perspectiveZ', 100, 1000, 50)
            .onChange(this.getSceneHandler('perspectiveZ'));

        this.animation = this.gui.addFolder('Animation');
        this.animation.add(this.two5Config.animation, 'active')
            .onChange(v => {
                this.two5.config.animationActive = v;
            });
        this.animation.add(this.two5Config.animation, 'friction', 0, 0.9, 0.1)
            .onChange(v => {
                this.two5.config.animationFriction = v;
            });

        this.transition = this.gui.addFolder('Transition');
        this.transition.add(this.two5Config.transition, 'active')
            .onChange((handler => {
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
        this.transition.add(this.two5Config.transition, 'easing', ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'])
            .onChange(this.getSceneHandler('transitionEasing'));

        this.effects = this.gui.addFolder('Effects');

        this.createEffectControls(this.effects, this.two5Config);

        // assuming we're starting with `Images` scene here
        this.currentLayersFolder = this.imagesLayersFolder = this.gui.addFolder('Images layers');

        this.two5.layers.forEach((layer, index) => {
            const layerFolder = this.imagesLayersFolder.addFolder(`Layer ${index + 1}`);

            this.createEffectControls(layerFolder, this.two5Config.layers[index], index);
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
        const result = {
            transition: {
                active: config.transitionActive || false,
                duration: config.transitionDuration || 300,
                easing: config.transitionEasing || 'linear'
            },
            translation: {
                active: config.translationActive || false,
                invertX: config.translationInvertX || false,
                invertY: config.translationInvertY || false,
                maxX: config.translationMaxX || 50,
                maxY: config.translationMaxY || 50
            },
            rotate: {
                active: config.rotateActive || false,
                invert: config.rotateInvert || false,
                max: config.rotateMax || 25,
            },
            tilt: {
                active: config.tiltActive || false,
                invertX: config.tiltInvertX || false,
                invertY: config.tiltInvertY || false,
                maxX: config.tiltMaxX || 25,
                maxY: config.tiltMaxY || 25
            },
            skewing: {
                active: config.skewActive || false,
                invertX: config.skewInvertX || false,
                invertY: config.skewInvertY || false,
                maxX: config.skewMaxX || 25,
                maxY: config.skewMaxY || 25
            },
            scaling: {
                active: config.scaleActive || false,
                invertX: config.scaleInvertX || false,
                invertY: config.scaleInvertY || false,
                maxX: config.scaleMaxX || 0.5,
                maxY: config.scaleMaxY || 0.5
            },
            blur: {
                active: config.blurActive || false,
                invert: config.blurInvert || false,
                max: config.blurMax || 20
            },
            opacity: {
                active: config.opacityActive || false,
                invert: config.opacityInvert || false,
                min: config.opacityMin || 0.3
            }
        };

        if (config === this.two5.config) {
            result.perspective = {
                active: config.perspectiveActive || false,
                invertX: config.perspectiveInvertX || false,
                invertY: config.perspectiveInvertY || false,
                maxX: config.perspectiveMaxX || 0,
                maxY: config.perspectiveMaxY || 0
            };
        }

        return result;
    }

    createLayersConfig () {
        return this.two5.layers.reduce((acc, layer, index) => {
            acc[index] = this.createEffectConfig(layer);
            return acc;
        }, {});
    }

    getSceneHandler (prop) {
        return v => {
            if (v === 'true') v = true;
            if (v === 'false') v = false;

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

        if (config === this.two5Config) {
            const perspective = folder.addFolder('Perspective');
            perspective.add(config.perspective, 'active', {non: false, both: true, x: 'x', y: 'y'})
                .onChange(getHandler('perspectiveActive', targetIndex));
            perspective.add(config.perspective, 'invertX')
                .onChange(getHandler('perspectiveInvertX', targetIndex));
            perspective.add(config.perspective, 'invertY')
                .onChange(getHandler('perspectiveInvertY', targetIndex));
            perspective.add(config.perspective, 'maxX', 0, 0.5, 0.05)
                .onChange(getHandler('perspectiveMaxX', targetIndex));
            perspective.add(config.perspective, 'maxY', 0, 0.5, 0.05)
                .onChange(getHandler('perspectiveMaxY', targetIndex));
        }

        const translation = folder.addFolder('Translation');
        translation.add(config.translation, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('translationActive', targetIndex));
        translation.add(config.translation, 'invertX')
            .onChange(getHandler('translationInvertX', targetIndex));
        translation.add(config.translation, 'invertY')
            .onChange(getHandler('translationInvertY', targetIndex));
        translation.add(config.translation, 'maxX', 10, 500, 5)
            .onChange(getHandler('translationMaxX', targetIndex));
        translation.add(config.translation, 'maxY', 10, 500, 5)
            .onChange(getHandler('translationMaxY', targetIndex));
        translation.open();

        const rotate = folder.addFolder('Rotate');
        rotate.add(config.rotate, 'active', {non: false, follow: 'follow', x: 'x', y: 'y'})
            .onChange(getHandler('rotateActive', targetIndex));
        rotate.add(config.rotate, 'invert')
            .onChange(getHandler('rotateInvert', targetIndex));
        rotate.add(config.rotate, 'max', 10, 270, 1)
            .onChange(getHandler('rotateMax', targetIndex));

        const tilt = folder.addFolder('Tilt');
        tilt.add(config.tilt, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('tiltActive', targetIndex));
        tilt.add(config.tilt, 'invertX')
            .onChange(getHandler('tiltInvertX', targetIndex));
        tilt.add(config.tilt, 'invertY')
            .onChange(getHandler('tiltInvertY', targetIndex));
        tilt.add(config.tilt, 'maxX', 10, 85, 1)
            .onChange(getHandler('tiltMaxX', targetIndex));
        tilt.add(config.tilt, 'maxY', 10, 85, 1)
            .onChange(getHandler('tiltMaxY', targetIndex));

        const skewing = folder.addFolder('Skewing');
        skewing.add(config.skewing, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('skewActive', targetIndex));
        skewing.add(config.skewing, 'invertX')
            .onChange(getHandler('skewInvertX', targetIndex));
        skewing.add(config.skewing, 'invertY')
            .onChange(getHandler('skewInvertY', targetIndex));
        skewing.add(config.skewing, 'maxX', 10, 85, 1)
            .onChange(getHandler('skewMaxX', targetIndex));
        skewing.add(config.skewing, 'maxY', 10, 85, 1)
            .onChange(getHandler('skewMaxY', targetIndex));

        const scaling = folder.addFolder('Scaling');
        scaling.add(config.scaling, 'active', {non: false, sync: 'sync', both: true, 'x sync': 'xx', 'y sync': 'yy', x: 'x', y: 'y'})
            .onChange(getHandler('scaleActive', targetIndex));
        scaling.add(config.scaling, 'invertX')
            .onChange(getHandler('scaleInvertX', targetIndex));
        scaling.add(config.scaling, 'invertY')
            .onChange(getHandler('scaleInvertY', targetIndex));
        scaling.add(config.scaling, 'maxX', 0.1, 3, 0.1)
            .onChange(getHandler('scaleMaxX', targetIndex));
        scaling.add(config.scaling, 'maxY', 0.1, 3, 0.1)
            .onChange(getHandler('scaleMaxY', targetIndex));

        const blur = folder.addFolder('Blur');
        blur.add(config.blur, 'active', {non: false, x: 'x', y: 'y', distance: 'r'})
            .onChange(getHandler('blurActive', targetIndex));
        blur.add(config.blur, 'invert')
            .onChange(getHandler('blurInvert', targetIndex));
        blur.add(config.blur, 'max', 5, 50, 5)
            .onChange(getHandler('blurMax', targetIndex));

        const opacity = folder.addFolder('Opacity');
        opacity.add(config.opacity, 'active', {non: false, x: 'x', y: 'y', distance: 'r'})
            .onChange(getHandler('opacityActive', targetIndex));
        opacity.add(config.opacity, 'invert')
            .onChange(getHandler('opacityInvert', targetIndex));
        opacity.add(config.opacity, 'min', 0.05, 0.85, 0.05)
            .onChange(getHandler('opacityMin', targetIndex));
    }
}

const demo = new Demo();
