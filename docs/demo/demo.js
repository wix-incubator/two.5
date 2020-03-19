import Two5 from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

const container = document.querySelector('#container');
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
    layersContainer: container,
    mouseTarget: null
});

two5.on();
setupStats();

const two5Config = {
    hitRegion: null,
    elevation: 10,
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
    }
};

function getHandler (prop) {
    return v => {
        two5.config[prop] = v;
        two5.effects.length = 0;
        two5.setupEffects();
    };
}

const gui = new dat.GUI();

gui.add(two5Config, 'hitRegion', {screen: null, container: 'container'})
    .onChange(value => {
        const mouseTarget = value && document.getElementById(value);
        two5.off();
        const config = Object.assign(two5.config, {mouseTarget, layersContainer: container});
        two5 = createInstance(config);
        two5.on();
        setupStats();
    });

gui.add(two5Config, 'elevation', 0, 40)
    .onChange(getHandler('elevation'));

const perspective = gui.addFolder('Perspective');
perspective.add(two5Config.perspective, 'active')
    .onChange(getHandler('perspectiveActive'));
perspective.add(two5Config.perspective, 'invertX')
    .onChange(getHandler('perspectiveInvertX'));
perspective.add(two5Config.perspective, 'invertY')
    .onChange(getHandler('perspectiveInvertY'));
perspective.add(two5Config.perspective, 'max', 0, 0.5, 0.1)
    .onChange(getHandler('perspectiveMax'));

const translation = gui.addFolder('Translation');
translation.add(two5Config.translation, 'active')
    .onChange(getHandler('translationActive'));
translation.add(two5Config.translation, 'invertX')
    .onChange(getHandler('translationInvertX'));
translation.add(two5Config.translation, 'invertY')
    .onChange(getHandler('translationInvertY'));
translation.add(two5Config.translation, 'max', 10, 150, 5)
    .onChange(getHandler('translationMax'));
translation.open();

const rotation = gui.addFolder('Rotation');
rotation.add(two5Config.rotation, 'active')
    .onChange(getHandler('rotationActive'));
rotation.add(two5Config.rotation, 'invertX')
    .onChange(getHandler('rotationInvertX'));
rotation.add(two5Config.rotation, 'invertY')
    .onChange(getHandler('rotationInvertY'));
rotation.add(two5Config.rotation, 'max', 10, 60)
    .onChange(getHandler('rotationMax'));
