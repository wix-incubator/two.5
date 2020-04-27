import { Scroll } from './two.5.js';
import kampos from '../../node_modules/kampos/src/index.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

/*
 * Effects
 */

/*
 * Simple transforms
 */
function transform (scene, progress, velocity) {
    let translateY = 0, translateX = 0;
    let skew = '';
    let scale = '';

    if (scene.translateY.active) {
        const p = Math.min(Math.max(progress - scene.translateY.start / 100, 0), scene.translateY.end / 100);
        translateY = (p * scene.duration - scene.offset) * scene.translateY.speed;
    }

    if (scene.translateX.active) {
        const p = Math.min(Math.max(progress - scene.translateX.start / 100, 0), scene.translateX.end / 100);
        translateX = (p * 2 - 1) * scene.xOffset * scene.translateX.speed;
    }

    const translate = `translate3d(${translateX}px, ${translateY}px, 0px)`;

    if (scene.skewY.active) {
        let skewY = 0;

        if (scene.skewY.velocity) {
            skewY = velocity * scene.skewY.angle;
        }
        else {
            const p = Math.min(Math.max(progress - scene.skewY.start / 100, 0), scene.skewY.end / 100);
            skewY = (p * 2 - 1) * scene.skewY.angle;
        }

        skew = ` skewY(${skewY}deg)`;
    }

    let scaleFactor = 0;

    if (scene.zoomIn.active && !scene.zoomOut.active) {
        const start = scene.zoomIn.start / 100;
        const duration = scene.zoomIn.end / 100 - start;
        scaleFactor = getScaleFactor(start, duration, progress) * (scene.zoomIn.factor - 1);
    }
    else if (scene.zoomOut.active && !scene.zoomIn.active) {
        const start = scene.zoomOut.start / 100;
        const duration = scene.zoomOut.end / 100 - start;
        scaleFactor = (1 - getScaleFactor(start, duration, progress)) * (scene.zoomOut.factor - 1);
    }
    else if (scene.zoomIn.active && scene.zoomOut.active) {
        const inStart = scene.zoomIn.start / 100;
        const outStart = scene.zoomOut.start / 100;
        const inEnd = scene.zoomIn.end / 100;
        const outEnd = scene.zoomOut.end / 100;
        const isDuringIn = progress >= inStart && progress <= inEnd;
        // const isDuringOut = progress >= outStart && progress <= outEnd;
        const inFirst = inStart < outStart;
        const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd;
        // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

        if (isDuringIn || isAroundIn) {
            // inside in
            scaleFactor = getScaleFactor(inStart, inEnd - inStart, progress) * (scene.zoomIn.factor - 1);
        }
        else {
            // inside out
            scaleFactor = (1 - getScaleFactor(outStart, outEnd - outStart, progress)) * (scene.zoomOut.factor - 1);
        }
    }

    if (scaleFactor !== 0) {
        scale = `scale(${1 + scaleFactor}, ${1 + scaleFactor})`;
    }

    let opacity = 1;

    if (scene.fadeIn.active && !scene.fadeOut.active) {
        const start = scene.fadeIn.start / 100;
        const duration = scene.fadeIn.end / 100 - start;
        opacity = getScaleFactor(start, duration, progress);
    }
    else if (scene.fadeOut.active && !scene.fadeIn.active) {
        const start = scene.fadeOut.start / 100;
        const duration = scene.fadeOut.end / 100 - start;
        opacity = 1 - getScaleFactor(start, duration, progress);
    }
    else if (scene.fadeIn.active && scene.fadeOut.active) {
        const inStart = scene.fadeIn.start / 100;
        const outStart = scene.fadeOut.start / 100;
        const inEnd = scene.fadeIn.end / 100;
        const outEnd = scene.fadeOut.end / 100;
        const isDuringIn = progress >= inStart && progress <= inEnd;
        // const isDuringOut = progress >= outStart && progress <= outEnd;
        const inFirst = inStart < outStart;
        const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd;
        // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

        if (isDuringIn || isAroundIn) {
            // inside in
            opacity = getScaleFactor(inStart, inEnd - inStart, progress);
        }
        else {
            // inside out
            opacity = 1 - getScaleFactor(outStart, outEnd - outStart, progress);
        }
    }

    scene.element.style.opacity = opacity.toFixed(3);
    scene.element.style.transform = `${translate}${skew}${scale}`;
}

function getScaleFactor (start, duration, progress) {
    const p = Math.min(Math.max(progress - start, 0), duration);
    return map(p, 0, duration, 0, 1);
}

/*
 * Simple filters
 */
function focus (scene, progress) {
    scene.element.style.filter = `blur(${(1 - progress) * scene.radius}px)`;
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

function invert (scene, progress) {
    scene.element.style.filter = `invert(${(1 - progress) * 100}%)`;
}

/*
 * Mix-blend-mode effects
 */
function difference (scene, progress) {
    scene.element.style.backgroundColor = `hsl(0, 0%, ${(1 - progress) * 100}%)`;
}

function dodge (scene, progress) {
    scene.element.style.backgroundColor = `hsl(${scene.hue}, ${(1 - progress) * 100}%, 15%)`;
}

/*
 * Kampos
 */
function displacement (scene, progress) {
    const shouldTick = progress < 1 && progress > 0;
    if (shouldTick && !scene.kampos.animationFrameId) {
        scene.kampos.play();
    }
    else if (!shouldTick && scene.kampos.animationFrameId) {
        scene.kampos.stop();
    }
    scene.displacement.scale = {y: 1 - progress};
}

const FILTERS = {
    focus,
    saturate,
    hueRotate,
    sepia,
    invert,
    difference,
    dodge,
    displacement
};

const FILTER_CONF = {
    displacement: 'displacement',
    focus: 'focus',
    saturate: 'saturate',
    'hue rotate': 'hueRotate',
    sepia: 'sepia',
    invert: 'invert',
    'blend-difference': 'difference',
    'blend-dodge': 'dodge'
};

const gui = new dat.GUI();

function generateTransformsConfig () {
    return {
        translateY: {
            active: false,
            speed: 0.5,
            end: 100,
            start: 0
        },
        translateX: {
            active: false,
            speed: 0.5,
            end: 100,
            start: 0
        },
        skewY: {
            active: false,
            velocity: true,
            angle: 20,
            end: 100,
            start: 0
        },
        zoomIn: {
            active: false,
            factor: 2,
            end: 100,
            start: 0
        },
        zoomOut: {
            active: false,
            factor: 2,
            end: 50,
            start: 0
        },
        fadeIn: {
            active: false,
            end: 40,
            start: 15
        },
        fadeOut: {
            active: false,
            end: 100,
            start: 65
        }
    };
}

const config = {
    scene: {
        container: true,
        friction: 0.8
    },
    images: [
        {
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: {
                active: false,
                type: 'displacement',
                start: 15,
                radius: 12,
                hue: 60
            }
        },
        {
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: {
                active: false,
                type: 'displacement',
                start: 15,
                radius: 12,
                hue: 60
            }
        },
        {
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: {
                active: false,
                type: 'displacement',
                start: 15,
                radius: 12,
                hue: 60
            }
        },
        {
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: {
                active: false,
                type: 'displacement',
                start: 15,
                radius: 12,
                hue: 60
            }
        },
        {
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: {
                active: false,
                type: 'displacement',
                start: 15,
                radius: 12,
                hue: 60
            }
        }
    ]
};

function createTransformsControls (folder, config) {
    const panY = folder.addFolder('Pan Y');
    panY.add(config.translateY, 'active')
        .onChange(restart);
    panY.add(config.translateY, 'speed', 0, 1, 0.05)
        .onFinishChange(restart);
    panY.add(config.translateY, 'end', 0, 100, 5)
        .onFinishChange(restart);
    panY.add(config.translateY, 'start', 0, 100, 5)
        .onFinishChange(restart);

    const panX = folder.addFolder('Pan X');
    panX.add(config.translateX, 'active')
        .onChange(restart);
    panX.add(config.translateX, 'speed', 0, 1, 0.05)
        .onFinishChange(restart);
    panX.add(config.translateX, 'end', 0, 100, 5)
        .onFinishChange(restart);
    panX.add(config.translateX, 'start', 0, 100, 5)
        .onFinishChange(restart);

    const skewY = folder.addFolder('Skew Y');
    skewY.add(config.skewY, 'active')
        .onChange(restart);
    skewY.add(config.skewY, 'velocity')
        .onChange(restart);
    skewY.add(config.skewY, 'angle', 5, 40, 1)
        .onFinishChange(restart);
    skewY.add(config.skewY, 'end', 0, 100, 5)
        .onFinishChange(restart);
    skewY.add(config.skewY, 'start', 0, 100, 5)
        .onFinishChange(restart);

    const zoomIn = folder.addFolder('Zoom In');
    zoomIn.add(config.zoomIn, 'active')
        .onChange(restart);
    zoomIn.add(config.zoomIn, 'factor', 1.1, 4, 0.1)
        .onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'start', 0, 90, 5)
        .onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const zoomOut = folder.addFolder('Zoom Out');
    zoomOut.add(config.zoomOut, 'active')
        .onChange(restart);
    zoomOut.add(config.zoomOut, 'factor', 1.1, 4, 0.1)
        .onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'start', 0, 90, 5)
        .onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const fadeIn = folder.addFolder('Fade In');
    fadeIn.add(config.fadeIn, 'active')
        .onChange(restart);
    fadeIn.add(config.fadeIn, 'start', 0, 90, 5)
        .onFinishChange(restart);
    fadeIn.add(config.fadeIn, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const fadeOut = folder.addFolder('Fade Out');
    fadeOut.add(config.fadeOut, 'active')
        .onChange(restart);
    fadeOut.add(config.fadeOut, 'start', 0, 100, 5)
        .onFinishChange(restart);
    fadeOut.add(config.fadeOut, 'end', 0, 100, 5)
        .onFinishChange(restart);
}

/*
 * Create controls for demo config
 */

const sceneConfig = gui.addFolder('Scene config');

sceneConfig.add(config.scene, 'container')
    .onChange(restart);
sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05)
    .onFinishChange(restart);

sceneConfig.open();

/*
 * Image 1 controls
 */
const image1 = gui.addFolder('Image 1');

image1.addColor(config.images[0], 'bgColor')
    .onFinishChange(restart);

const image1Transforms = image1.addFolder('Transforms');
image1Transforms.open();

createTransformsControls(image1Transforms, config.images[0].transforms);

const image1Filters = image1.addFolder('Filters');
// image1Filters.open();
image1Filters.add(config.images[0].filter, 'active')
    .onChange(filterToggle(0));
image1Filters.add(config.images[0].filter, 'type', FILTER_CONF)
    .onChange(filterChange(0));
image1Filters.add(config.images[0].filter, 'start', 0, 100, 5)
    .onChange(restart);
image1Filters.add(config.images[0].filter, 'radius', 5, 30, 1)
    .onChange(restart);
image1Filters.add(config.images[0].filter, 'hue', 0, 359, 5)
    .onChange(restart);

/*
 * Image 2 controls
 */
const image2 = gui.addFolder('Image 2');

image2.addColor(config.images[1], 'bgColor')
    .onFinishChange(restart);

const image2Transforms = image2.addFolder('Transforms');
image2Transforms.open();

createTransformsControls(image2Transforms, config.images[1].transforms);

const image2Filters = image2.addFolder('Filters');
// image2Filters.open();
image2Filters.add(config.images[1].filter, 'active')
    .onChange(filterToggle(1));
image2Filters.add(config.images[1].filter, 'type', FILTER_CONF)
    .onChange(filterChange(1));
image2Filters.add(config.images[1].filter, 'start', 0, 100, 5)
    .onChange(restart);
image2Filters.add(config.images[1].filter, 'radius', 5, 30, 1)
    .onChange(restart);
image2Filters.add(config.images[1].filter, 'hue', 0, 359, 5)
    .onChange(restart);

/*
 * Image 3 controls
 */
const image3 = gui.addFolder('image 3');

image3.addColor(config.images[2], 'bgColor')
    .onFinishChange(restart);

const image3Transforms = image3.addFolder('Transforms');
image3Transforms.open();

createTransformsControls(image3Transforms, config.images[2].transforms);

const image3Filters = image3.addFolder('Filters');
// image3Filters.open();
image3Filters.add(config.images[2].filter, 'active')
    .onChange(filterToggle(2));
image3Filters.add(config.images[2].filter, 'type', FILTER_CONF)
    .onChange(filterChange(2));
image3Filters.add(config.images[2].filter, 'start', 0, 100, 5)
    .onChange(restart);
image3Filters.add(config.images[2].filter, 'radius', 5, 30, 1)
    .onChange(restart);
image3Filters.add(config.images[2].filter, 'hue', 0, 359, 5)
    .onChange(restart);

/*
 * Image 4 controls
 */
const image4 = gui.addFolder('Image 4');

image4.addColor(config.images[3], 'bgColor')
    .onFinishChange(restart);

const image4Transforms = image4.addFolder('Transforms');
image4Transforms.open();

createTransformsControls(image4Transforms, config.images[3].transforms);

const image4Filters = image4.addFolder('Filters');
// image4Filters.open();
image4Filters.add(config.images[3].filter, 'active')
    .onChange(filterToggle(3));
image4Filters.add(config.images[3].filter, 'type', FILTER_CONF)
    .onChange(filterChange(3));
image4Filters.add(config.images[3].filter, 'start', 0, 100, 5)
    .onChange(restart);
image4Filters.add(config.images[3].filter, 'radius', 5, 30, 1)
    .onChange(restart);
image4Filters.add(config.images[3].filter, 'hue', 0, 359, 5)
    .onChange(restart);

/*
 * Image 5 controls
 */
const image5 = gui.addFolder('Image 5');

image5.addColor(config.images[4], 'bgColor')
    .onFinishChange(restart);

const image5Transforms = image5.addFolder('Transforms');
image5Transforms.open();

createTransformsControls(image5Transforms, config.images[4].transforms);

const image5Filters = image5.addFolder('Filters');
// image5Filters.open();
image5Filters.add(config.images[4].filter, 'active')
    .onChange(filterToggle(4));
image5Filters.add(config.images[4].filter, 'type', FILTER_CONF)
    .onChange(filterChange(4));
image5Filters.add(config.images[4].filter, 'start', 0, 100, 5)
    .onChange(restart);
image5Filters.add(config.images[4].filter, 'radius', 5, 30, 1)
    .onChange(restart);
image5Filters.add(config.images[4].filter, 'hue', 0, 359, 5)
    .onChange(restart);

let instance;
let stats;

function init () {
    if (stats) {
        // cleanup old FPS meter
        stats.dom.remove();
    }

    /*
     * Start FPS meter
     */
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    // create scenes
    const scenes = createScenes();

    // create new scroll controller
    const parallax = new Scroll({
        container: config.scene.container ? container : null,
        wrapper,
        scenes,
        animationActive: true,
        animationFriction: config.scene.friction,
        velocityActive: config.images.some(img => img.transforms.skewY.active),
        velocityMax: 10
    });

    // activate
    parallax.on();

    // setup meter
    parallax.effects.unshift(function () {
        stats.begin();
    });
    parallax.effects.push(function () {
        stats.end();
    });

    return parallax;
}

/*
 * DOM we'll be using
 */
const wrapper = document.querySelector('#wrapper');
const container = document.querySelector('main');
const viewportHeight = window.innerHeight;
const parents = [...window.document.querySelectorAll('[data-effects~="bgparallax"]')];
const images = [...window.document.querySelectorAll('[data-effects~="bgparallax"] .bg > img')];
// const canvases = [...window.document.querySelectorAll('canvas')];

const kamposInstances = new Map();

/*
 * Factory of scene data
 */
function createScenes () {
    images.forEach(img => {
        const oldKampos = kamposInstances.get(img);

        if (oldKampos) {
            oldKampos.destroy();
            kamposInstances.delete(img);
        }
    });

    // get only scenes with active filter
    const filterScenes = config.images
        .map((img, index) => [img.filter, images[index]])
        .filter(x => {
            return x[0] && x[0].active;
        });

    // create configs for background transform scenes
    return images.map((img, index) => {
        const parent = parents[index];
        const parentTop = parent.offsetTop;
        const parentHeight = parent.offsetHeight;

        const start = parentTop - viewportHeight;
        const duration = parentHeight + viewportHeight;

        const transforms = config.images[index].transforms;

        if (transforms.fadeIn.active || transforms.fadeOut.active) {
            parent.style.backgroundColor = config.images[index].bgColor;
        }

        if (transforms.translateX.active) {
            img.style.width = '200%';
            img.style.objectFit = 'scale-down';
        }

        return {
            effect: transform,
            start,
            duration,
            element: img,
            pauseDuringSnap: true,
            offset: viewportHeight,
            xOffset: (img.offsetWidth - parent.offsetWidth) / 2,
            ...transforms
        };
    })
    // create configs for filter effect scenes
    .concat(filterScenes.map(([filter, scene]) => {
        const parent = scene.closest('[data-effects]');
        const parentTop = parent.offsetTop;
        const type = filter.type;
        const extra = {};
        let element = scene;
        let start = parentTop - viewportHeight * (100 - filter.start) / 100;
        let duration = viewportHeight;

        if (type === 'difference' || type === 'dodge') {
            parent.dataset.blend = type;
            element = scene.parentElement;
        }

        if (type === 'dodge') {
            extra.hue = filter.hue;
        }
        else if (type === 'focus') {
            extra.radius = filter.radius;
        }
        else if (type === 'displacement') {
            parent.dataset.canvas = '';
            const target = scene.nextElementSibling;
            const displacement = kampos.effects.displacement('DISCARD');
            const instance = new kampos.Kampos({target, effects: [displacement]});
            extra.displacement = displacement;
            extra.kampos = instance;
            displacement.map = scene;
            function bootstrap () {
                instance.setSource({media: scene, width: scene.naturalWidth, height: scene.naturalHeight});
                instance.play();
            }
            if (scene.complete) {
                bootstrap();
            }
            else {
                scene.onload = bootstrap;
            }
            kamposInstances.set(scene, instance);
        }

        return {
            effect: FILTERS[type],
            start,
            duration,
            element,
            viewportHeight,
            ...extra
        };
    }));
}

/*
 * Bootstrap
 */
instance = init();

/*
 * Factory for filter state change handlers
 */
function filterChange (i) {
    // returns a handler for filter state handler
    return function (v) {
        switch (v) {
            case 'displacement':
                parents[i].dataset.blend = '';
                images[i].dataset.filter = '';
                images[i].style.filter = '';
                break;
            case 'difference':
            case 'dodge':
                images[i].dataset.filter = '';
                images[i].style.filter = '';
                delete parents[i].dataset.canvas;
                break;
            default:
                parents[i].dataset.blend = '';
                delete parents[i].dataset.canvas;
        }

        restart();
    };
}

function filterToggle (i) {
    return function (toggle) {
        if (toggle) {
            // activate to current state in config
            return filterChange(i)(config.images[i].filter.type);
        }

        // deactivate filter and blend
        parents[i].dataset.blend = '';
        images[i].dataset.filter = '';
        images[i].style.filter = '';

        delete parents[i].dataset.canvas;

        restart();
    };
}

/*
 * Restart scroll controller and effects
 */
function restart () {
    instance.off();
    instance = init();
}

function map (x, a, b, c, d) {
    return (x - a) * (d - c) / (b - a) + c;
}
