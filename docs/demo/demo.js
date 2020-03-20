import Two5 from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

const scenes = document.querySelector('[data-scene]');
const imagesContainer = document.querySelector('#images-container');
const shapesContainer = document.querySelector('#shapes-container');
let currentContainer = imagesContainer;
let two5;


const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function setupStats () {
    two5.effects.unshift(function () {
        stats.begin();
    });
    two5.effects.push(function () {
        stats.end();
    });
}

function createInstance (config) {
    return new Two5(config);
}

two5 = createInstance({
    layersContainer: currentContainer,
    mouseTarget: null
});

two5.on();
setupStats();

const two5Config = {
    scene: 'images',
    hitRegion: null,
    scenePerspective: 600,
    elevation: 10,
    transition: {
        active: two5.config.transitionActive,
        duration: two5.config.transitionDuration,
        easing: two5.config.transitionEasing
    },
    perspective: {
        active: two5.config.perspectiveActive,
        invertX: two5.config.perspectiveInvertX,
        invertY: two5.config.perspectiveInvertY,
        max: two5.config.perspectiveMax
    },
    translation: {
        active: two5.config.translationActive,
        invertX: two5.config.translationInvertX,
        invertY: two5.config.translationInvertY,
        max: two5.config.translationMax
    },
    rotation: {
        active: two5.config.rotationActive,
        invertX: two5.config.rotationInvertX,
        invertY: two5.config.rotationInvertY,
        max: two5.config.rotationMax
    },
    skewing: {
        active: two5.config.skewActive,
        invertX: two5.config.skewInvertX,
        invertY: two5.config.skewInvertY,
        max: two5.config.skewMax
    },
    scaling: {
        active: two5.config.scaleActive,
        invertX: two5.config.scaleInvertX,
        invertY: two5.config.scaleInvertY,
        max: two5.config.scaleMax
    }
};

function getHandler (prop) {
    return v => {
        if (v === 'true') v = true;
        if (v === 'false') v = false;
        two5.config[prop] = v;
        two5.effects.length = 0;
        two5.setupEffects();
        setupStats();
    };
}

const gui = new dat.GUI();

gui.add(two5Config, 'scene', ['images', 'shapes'])
    .onChange(value => {
        switch (value) {
            case 'images':
                currentContainer = imagesContainer;
                scenes.dataset.scene = value;
                break;
            case 'shapes':
                currentContainer = shapesContainer;
                scenes.dataset.scene = value;
                break;
        }
        two5.off();
        const config = Object.assign(two5.config, {layersContainer: currentContainer});
        two5 = createInstance(config);
        two5.on();
        setupStats();
    });

gui.add(two5Config, 'hitRegion', {screen: null, container: 'container'})
    .onChange(value => {
        const mouseTarget = value && currentContainer;
        two5.off();
        const config = Object.assign(two5.config, {mouseTarget, layersContainer: currentContainer});
        two5 = createInstance(config);
        two5.on();
        setupStats();
    });

gui.add(two5Config, 'elevation', 0, 40, 1)
    .onChange(getHandler('elevation'));

gui.add(two5Config, 'scenePerspective', 100, 1000, 50)
    .onChange(getHandler('scenePerspective'));

const transition = gui.addFolder('Transition');
transition.add(two5Config.transition, 'active')
    .onChange(getHandler('transitionActive'));
transition.add(two5Config.transition, 'duration', 50, 1000, 50)
    .onChange(getHandler('transitionDuration'));
transition.add(two5Config.transition, 'easing', ['linear', 'ease-in', 'ease-out', 'ease-in-out'])
    .onChange(getHandler('transitionEasing'));

const perspective = gui.addFolder('Perspective');
perspective.add(two5Config.perspective, 'active', {non: false, both: true, x: 'x', y: 'y'})
    .onChange(getHandler('perspectiveActive'));
perspective.add(two5Config.perspective, 'invertX')
    .onChange(getHandler('perspectiveInvertX'));
perspective.add(two5Config.perspective, 'invertY')
    .onChange(getHandler('perspectiveInvertY'));
perspective.add(two5Config.perspective, 'max', 0, 0.5, 0.05)
    .onChange(getHandler('perspectiveMax'));

const translation = gui.addFolder('Translation');
translation.add(two5Config.translation, 'active', {non: false, both: true, x: 'x', y: 'y'})
    .onChange(getHandler('translationActive'));
translation.add(two5Config.translation, 'invertX')
    .onChange(getHandler('translationInvertX'));
translation.add(two5Config.translation, 'invertY')
    .onChange(getHandler('translationInvertY'));
translation.add(two5Config.translation, 'max', 10, 150, 5)
    .onChange(getHandler('translationMax'));
translation.open();

const rotation = gui.addFolder('Rotation');
rotation.add(two5Config.rotation, 'active', {non: false, both: true, x: 'x', y: 'y'})
    .onChange(getHandler('rotationActive'));
rotation.add(two5Config.rotation, 'invertX')
    .onChange(getHandler('rotationInvertX'));
rotation.add(two5Config.rotation, 'invertY')
    .onChange(getHandler('rotationInvertY'));
rotation.add(two5Config.rotation, 'max', 10, 60, 1)
    .onChange(getHandler('rotationMax'));

const skewing = gui.addFolder('Skewing');
skewing.add(two5Config.skewing, 'active', {non: false, both: true, x: 'x', y: 'y'})
    .onChange(getHandler('skewActive'));
skewing.add(two5Config.skewing, 'invertX')
    .onChange(getHandler('skewInvertX'));
skewing.add(two5Config.skewing, 'invertY')
    .onChange(getHandler('skewInvertY'));
skewing.add(two5Config.skewing, 'max', 10, 60, 1)
    .onChange(getHandler('skewMax'));

const scaling = gui.addFolder('Scaling');
scaling.add(two5Config.scaling, 'active', {non: false, both: true, x: 'x', y: 'y'})
    .onChange(getHandler('scaleActive'));
scaling.add(two5Config.scaling, 'invertX')
    .onChange(getHandler('scaleInvertX'));
scaling.add(two5Config.scaling, 'invertY')
    .onChange(getHandler('scaleInvertY'));
scaling.add(two5Config.scaling, 'max', 0.1, 2, 0.1)
    .onChange(getHandler('scaleMax'));
