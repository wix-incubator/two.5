import { Tilt } from '../../index.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module';
import Stats from '../../node_modules/stats.js/src/Stats';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const EFFECT_EASINGS = ['linear', 'quad', 'cubic', 'quart', 'quint', 'expo', 'sine', 'circ'];

const container = document.querySelector('main');
const layers = [...container.querySelectorAll('img, h1')].map(el => {
    const rect = el.getBoundingClientRect().toJSON();
    return {el, depth: 1, rect,  centerToLayer: false};
});

class Demo {
    constructor () {
        this.currentContainer = container;

        this.two5 = new Tilt({
            translationActive: false,
            layers
        });

        this.two5.on();
        this.setupStats();

        this.two5Config = {
            'Save to local': function() {
                window.localStorage.setItem('data', getValues());
            },
            'Clear local': function() {
                window.localStorage.clear();
                window.location.reload();
            },
            'Save to File': function() {
                download(getValues(), `background-effects-${getTimeStamp()}.txt`);
            },
            'Load from File': function() {
                upload();
            },
            hitRegion: null,
            perspectiveZ: 0,
            elevation: 0,
            animation: {
                active: this.two5.config.animationActive,
                friction: this.two5.config.animationFriction
            },
            transition: {
                active: this.two5.config.transitionActive || false,
                duration: this.two5.config.transitionDuration || 300,
                easing: this.two5.config.transitionEasing || 'linear'
            },
            elements: this.createElementsConfig()
        };

        this.gui = new dat.GUI();
        this.gui.remember(this.two5Config);

        this.gui.add(this.two5Config, 'Save to local');
        this.gui.add(this.two5Config, 'Clear local');
        this.gui.add(this.two5Config, 'Save to File');
        this.gui.add(this.two5Config, 'Load from File');
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

        this.animation = this.gui.addFolder('Animation');
        this.gui.remember(this.two5Config.animation);
        this.animation.add(this.two5Config.animation, 'active')
            .onChange(v => {
                this.two5.config.animationActive = v;
            });
        this.animation.add(this.two5Config.animation, 'friction', 0, 0.9, 0.1)
            .onChange(v => {
                this.two5.config.animationFriction = v;
            });

        this.transition = this.gui.addFolder('Transition');
        this.gui.remember(this.two5Config.transition);
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
        this.transition.add(this.two5Config.transition, 'easing', ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'])
            .onChange(this.getSceneHandler('transitionEasing'));

        this.elementsFolder = this.gui.addFolder('Elements');
        this.elementsFolder.open();

        this.two5.layers.forEach((layer, index) => {
            const layerFolder = this.elementsFolder.addFolder(layer.el.id);

            this.createEffectControls(layerFolder, this.two5Config.elements[index], index);
        });

        setValues(JSON.parse(window.localStorage.getItem('data') || '[]'), this);
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
            depth: config.depth,
            centerToLayer: config.centerToLayer,
            perspective: {
                active: config.perspectiveActive || false,
                invertX: config.perspectiveInvertX || false,
                invertY: config.perspectiveInvertY || false,
                maxX: config.perspectiveMaxX || 0,
                maxY: config.perspectiveMaxY || 0
            },
            translation: {
                active: config.translationActive || false,
                easing: config.translationEasing || 'linear',
                invertX: config.translationInvertX || false,
                invertY: config.translationInvertY || false,
                maxX: config.translationMaxX || 50,
                maxY: config.translationMaxY || 50
            },
            rotate: {
                active: config.rotateActive || false,
                easing: config.rotateEasing || 'linear',
                invert: config.rotateInvert || false,
                max: config.rotate || 25
            },
            tilt: {
                active: config.tiltActive || false,
                easing: config.tiltEasing || 'linear',
                invertX: config.tiltInvertX || false,
                invertY: config.tiltInvertY || false,
                maxX: config.tiltMaxX || 25,
                maxY: config.tiltMaxY || 25
            },
            skewing: {
                active: config.skewActive || false,
                easing: config.skewEasing || 'linear',
                invertX: config.skewInvertX || false,
                invertY: config.skewInvertY || false,
                maxX: config.skewMaxX || 25,
                maxY: config.skewMaxY || 25
            },
            scaling: {
                active: config.scaleActive || false,
                easing: config.scaleEasing || 'linear',
                invertX: config.scaleInvertX || false,
                invertY: config.scaleInvertY || false,
                maxX: config.scaleMaxX || 0.5,
                maxY: config.scaleMaxY || 0.5
            },
            blur: {
                active: config.blurActive || false,
                easing: config.blurEasing || 'linear',
                invert: config.blurInvert || false,
                max: config.blurMax || 20
            },
            opacity: {
                active: config.opacityActive || false,
                easing: config.opacityEasing || 'linear',
                invert: config.opacityInvert || false,
                min: config.opacityMin || 0.3
            },
            clip: {
                active: config.clipActive || false,
                easing: config.clipEasing || 'linear',
                direction: config.clipDirection || 'left'
            },
            pointLight: {
                active: config.pointLightActive || false,
                easing: config.pointLightEasing || 'linear',
                invert: config.pointLightInvert || false,
                z: config.pointLightZ || 20
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
        this.gui.remember(config);

        folder.add(config, 'depth', 0.2, 1, 0.2)
            .onChange(getHandler('depth', targetIndex));

        folder.add(config, 'centerToLayer')
            .onChange(getHandler('centerToLayer', targetIndex));

        const perspective = folder.addFolder('Perspective');
        this.gui.remember(config.perspective);
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

        const translation = folder.addFolder('Translation');
        this.gui.remember(config.translation);
        translation.add(config.translation, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('translationActive', targetIndex));
        translation.add(config.translation, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('translationEasing', targetIndex));
        translation.add(config.translation, 'invertX')
            .onChange(getHandler('translationInvertX', targetIndex));
        translation.add(config.translation, 'invertY')
            .onChange(getHandler('translationInvertY', targetIndex));
        translation.add(config.translation, 'maxX', 10, 500, 5)
            .onChange(getHandler('translationMaxX', targetIndex));
        translation.add(config.translation, 'maxY', 10, 500, 5)
            .onChange(getHandler('translationMaxY', targetIndex));

        const rotate = folder.addFolder('Rotate');
        this.gui.remember(config.rotate);
        rotate.add(config.rotate, 'active', {non: false, follow: 'follow', x: 'x', y: 'y'})
            .onChange(getHandler('rotateActive', targetIndex));
        rotate.add(config.rotate, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('rotateEasing', targetIndex));
        rotate.add(config.rotate, 'invert')
            .onChange(getHandler('rotateInvert', targetIndex));
        rotate.add(config.rotate, 'max', 10, 270, 1)
            .onChange(getHandler('rotateMax', targetIndex));

        const tilt = folder.addFolder('Tilt');
        this.gui.remember(config.tilt);
        tilt.add(config.tilt, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('tiltActive', targetIndex));
        tilt.add(config.tilt, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('tiltEasing', targetIndex));
        tilt.add(config.tilt, 'invertX')
            .onChange(getHandler('tiltInvertX', targetIndex));
        tilt.add(config.tilt, 'invertY')
            .onChange(getHandler('tiltInvertY', targetIndex));
        tilt.add(config.tilt, 'maxX', 10, 85, 1)
            .onChange(getHandler('tiltMaxX', targetIndex));
        tilt.add(config.tilt, 'maxY', 10, 85, 1)
            .onChange(getHandler('tiltMaxY', targetIndex));

        const skewing = folder.addFolder('Skewing');
        this.gui.remember(config.skewing);
        skewing.add(config.skewing, 'active', {non: false, both: true, x: 'x', y: 'y'})
            .onChange(getHandler('skewActive', targetIndex));
        skewing.add(config.skewing, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('skewEasing', targetIndex));
        skewing.add(config.skewing, 'invertX')
            .onChange(getHandler('skewInvertX', targetIndex));
        skewing.add(config.skewing, 'invertY')
            .onChange(getHandler('skewInvertY', targetIndex));
        skewing.add(config.skewing, 'maxX', 10, 85, 1)
            .onChange(getHandler('skewMaxX', targetIndex));
        skewing.add(config.skewing, 'maxY', 10, 85, 1)
            .onChange(getHandler('skewMaxY', targetIndex));

        const scaling = folder.addFolder('Scaling');
        this.gui.remember(config.scaling);
        scaling.add(config.scaling, 'active', {non: false, sync: 'sync', both: true, 'x sync': 'xx', 'y sync': 'yy', x: 'x', y: 'y'})
            .onChange(getHandler('scaleActive', targetIndex));
        scaling.add(config.scaling, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('scaleEasing', targetIndex));
        scaling.add(config.scaling, 'invertX')
            .onChange(getHandler('scaleInvertX', targetIndex));
        scaling.add(config.scaling, 'invertY')
            .onChange(getHandler('scaleInvertY', targetIndex));
        scaling.add(config.scaling, 'maxX', 0.1, 3, 0.1)
            .onChange(getHandler('scaleMaxX', targetIndex));
        scaling.add(config.scaling, 'maxY', 0.1, 3, 0.1)
            .onChange(getHandler('scaleMaxY', targetIndex));

        const blur = folder.addFolder('Blur');
        this.gui.remember(config.blur);
        blur.add(config.blur, 'active', {non: false, x: 'x', y: 'y', distance: 'r'})
            .onChange(getHandler('blurActive', targetIndex));
        blur.add(config.blur, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('blurEasing', targetIndex));
        blur.add(config.blur, 'invert')
            .onChange(getHandler('blurInvert', targetIndex));
        blur.add(config.blur, 'max', 5, 50, 5)
            .onChange(getHandler('blurMax', targetIndex));

        const opacity = folder.addFolder('Opacity');
        this.gui.remember(config.opacity);
        opacity.add(config.opacity, 'active', {non: false, x: 'x', y: 'y', distance: 'r'})
            .onChange(getHandler('opacityActive', targetIndex));
        opacity.add(config.opacity, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('opacityEasing', targetIndex));
        opacity.add(config.opacity, 'invert')
            .onChange(getHandler('opacityInvert', targetIndex));
        opacity.add(config.opacity, 'min', 0.05, 0.85, 0.05)
            .onChange(getHandler('opacityMin', targetIndex));

        const clip = folder.addFolder('Clip');
        this.gui.remember(config.clip);
        clip.add(config.clip, 'active')
            .onChange(getHandler('clipActive', targetIndex));
        clip.add(config.clip, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('clipEasing', targetIndex));
        clip.add(config.clip, 'direction', {left: 'left', right: 'right', top: 'top', bottom: 'bottom', rect: 'rect'})
            .onChange(getHandler('clipDirection', targetIndex));

        const pointLight = folder.addFolder('Point light');
        this.gui.remember(config.pointLight);
        pointLight.add(config.pointLight, 'active', {non: false, follow: 'follow', x: 'x', y: 'y'})
            .onChange(getHandler('pointLightActive', targetIndex));
        pointLight.add(config.pointLight, 'easing', EFFECT_EASINGS)
            .onChange(getHandler('pointLightEasing', targetIndex));
        pointLight.add(config.pointLight, 'invert')
            .onChange(getHandler('pointLightInvert', targetIndex));
        pointLight.add(config.pointLight, 'z', 0, 200, 1)
            .onChange(getHandler('pointLightZ', targetIndex));
    }
}

const demo = new Demo();

/**
 * Get a date string
 * @returns {string} YYYY-MM-DD-HH:MM:SS
 */
function getTimeStamp() {
    const date = new Date();
    return `${date.toISOString().split('T')[0]}-${date.toLocaleTimeString('en-US', { hour12: false })}`
}

/**
 * Download data to a file
 * https://stackoverflow.com/a/30832210
 * @param {string} data the file contents
 * @param {string} filename the file to save
 * @param {string} [type='text/plain'] file mime type ('text/plain' etc.)
 */
function download(data, filename, type='text/plain') {
    const file = new Blob([data], {type});
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();
    setTimeout(function() {
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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/plain';
    input.multiple = 'multiple';
    input.onchange = function () {
        for (const file of this.files || []) {
            if (file) {
                const reader = new FileReader();

                reader.addEventListener('load', function (e) {
                    console.log('loading', file.name);
                    setValues(JSON.parse(e.target.result), demo);
                    demo.gui.saveAs(file.name);
                });

                reader.readAsBinaryString(file);
            }
        }
    };
    document.body.appendChild(input);

    input.click();
    setTimeout(function() {
        document.body.removeChild(input);
    }, 0);
}

/**
 * @param {Array<Object>} rememberedValues in the format of the output of getValues()
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
function setValues(rememberedValues, instance) {
    rememberedValues.forEach((values, index) => {
        (Array.isArray(values) ? values : Object.keys(values)).forEach((key) => {
            const controller = instance.gui.__rememberedObjectIndecesToControllers[index][key];
            controller && controller.setValue(values[key]);
        });
    });
}

function getValues() {
    return JSON.stringify(demo.gui.__rememberedObjects, null, 2);
}
