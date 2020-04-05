import { Scroll } from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function background (scene, progress) {
    scene.element.style.transform = `translate3d(0px, ${(progress * scene.duration - scene.viewportHeight) * scene.speed}px, 0px)`;
}

function focus (scene, progress) {
    scene.element.style.filter = `blur(${(1 - progress) * 12}px)`;
}

function saturate (scene, progress) {
    scene.element.style.filter = `saturate(${progress * 100}%)`;
}

function hueRotate (scene, progress) {
    scene.element.style.filter = `hue-rotate(${(1 - progress) * 180}deg)`;
}

function sepia (scene, progress) {
    scene.element.style.filter = `sepia(${(1 - progress) * 100}%)`;
}

const FILTERS = {
    focus,
    saturate,
    hueRotate,
    sepia
};

function createScenes () {
    const viewportHeight = window.innerHeight;
    const parents = window.document.querySelectorAll('[data-effects~="parallax"]');
    const scenes = [...window.document.querySelectorAll('[data-effects~="parallax"] img')];
    const filterScenes = config.images
        .map((img, index) => [img.filter, scenes[index]])
        .filter(x => x[0]);

    return scenes.map((scene, index) => {
        const parent = parents[index];
        const parentTop = parent.offsetTop;
        const parentHeight = parent.offsetHeight;

        return {
            effect: background,
            speed: +parent.dataset.speed,
            start: parentTop - viewportHeight,
            duration: (parentHeight > viewportHeight ? parentHeight : viewportHeight) + viewportHeight,
            element: scene,
            viewportHeight
        };
    }).concat(filterScenes.map(([filter, scene]) => {
        const parent = scene.closest('[data-effects]');
        const parentTop = parent.offsetTop;

        return {
            effect: FILTERS[filter],
            start: parentTop - viewportHeight * 0.65,
            duration: viewportHeight,
            element: scene,
            viewportHeight
        };
    }));
}

const gui = new dat.GUI();

const config = {
    scene: {
        friction: 0.8
    },
    images: [
        {
            filter: null
        },
        {
            filter: null
        },
        {
            filter: null
        },
        {
            filter: null
        },
        {
            filter: null
        }
    ]
};

const sceneConfig = gui.addFolder('Scene config');
sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05).onFinishChange(restart);

const image1 = gui.addFolder('Image 1');
image1.add(config.images[0], 'filter', {non: null, focus: 'focus', saturate: 'saturate', 'hue rotate': 'hueRotate', sepia: 'sepia'})
    .onChange(restart);

const image2 = gui.addFolder('Image 2');
image2.add(config.images[1], 'filter', {non: null, focus: 'focus', saturate: 'saturate', 'hue rotate': 'hueRotate', sepia: 'sepia'})
    .onChange(restart);

const image3 = gui.addFolder('Image 3');
image3.add(config.images[2], 'filter', {non: null, focus: 'focus', saturate: 'saturate', 'hue rotate': 'hueRotate', sepia: 'sepia'})
    .onChange(restart);

const image4 = gui.addFolder('Image 4');
image4.add(config.images[3], 'filter', {non: null, focus: 'focus', saturate: 'saturate', 'hue rotate': 'hueRotate', sepia: 'sepia'})
    .onChange(restart);

const image5 = gui.addFolder('Image 5');
image5.add(config.images[4], 'filter', {non: null, focus: 'focus', saturate: 'saturate', 'hue rotate': 'hueRotate', sepia: 'sepia'})
    .onChange(restart);

let instance;

function restart () {
    instance.off();
    instance = init();
}

function init () {
    const parallax = new Scroll({
        container: document.querySelector('main'),
        scenes: createScenes(),
        animationActive: true,
        animationFriction: config.scene.friction
    });

    parallax.effects.unshift(function () {
        stats.begin();
    });
    parallax.effects.push(function () {
        stats.end();
    });

    parallax.on();

    return parallax;
}

instance = init();
