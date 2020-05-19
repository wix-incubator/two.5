import { Scroll } from '../../index.js';
import kampos from '../../node_modules/kampos/src/index';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module';
import Stats from '../../node_modules/stats.js/src/Stats';

/*
 * Effects
 */

/*
 * Simple transforms
 */
function transform (scene, progress, velocity) {
    let translateY = 0, translateX = 0;
    let skewY = 0, skewX = 0;
    let rotationAngle = 0;

    let scale = '';
    let rotate = '';

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
        if (scene.skewY.velocity) {
            skewY = velocity * scene.skewY.angle;
        }
        else {
            const p = Math.min(Math.max(progress - scene.skewY.start / 100, 0), scene.skewY.end / 100);
            skewY = (p * 2 - 1) * scene.skewY.angle;
        }
    }

    if (scene.skewX.active) {
        if (scene.skewX.velocity) {
            skewX = velocity * scene.skewX.angle;
        }
        else {
            const p = Math.min(Math.max(progress - scene.skewX.start / 100, 0), scene.skewX.end / 100);
            skewX = (p * 2 - 1) * scene.skewX.angle;
        }
    }

    const skew = `skew(${skewX}deg, ${skewY}deg)`;

   // -------

   if (scene.rotateIn.active && !scene.rotateOut.active) {
       const start = scene.rotateIn.start / 100;
       const duration = scene.rotateIn.end / 100 - start;
       rotationAngle = getScaleFactor(start, duration, progress) * (scene.rotateIn.angle);
   }
   else if (scene.rotateOut.active && !scene.rotateIn.active) {
       const start = scene.rotateOut.start / 100;
       const duration = scene.rotateOut.end / 100 - start;
       rotationAngle = (1 - getScaleFactor(start, duration, progress)) * (scene.rotateOut.angle);
   }
   else if (scene.rotateIn.active && scene.rotateOut.active) {
       const inStart = scene.rotateIn.start / 100;
       const outStart = scene.rotateOut.start / 100;
       const inEnd = scene.rotateIn.end / 100;
       const outEnd = scene.rotateOut.end / 100;
       const isDuringIn = progress >= inStart && progress <= inEnd;
       // const isDuringOut = progress >= outStart && progress <= outEnd;
       const inFirst = inStart < outStart;
       const isAroundIn = inFirst ? progress < inStart || progress < outStart : progress > inEnd;
       // const isAroundOut = inFirst ? progress > outEnd : progress < outStart || progress < inStart;

       if (isDuringIn || isAroundIn) {
           // inside in
           rotationAngle = getScaleFactor(inStart, inEnd - inStart, progress) * (scene.rotateIn.angle);
       }
       else {
           // inside out
           rotationAngle = (1 - getScaleFactor(outStart, outEnd - outStart, progress)) * (scene.rotateOut.angle);
       }
    }

    if (rotationAngle !== 0) {
        rotate = `rotate(${rotationAngle}deg)`;
    }

   // -------

    let scaleFactor = 1;
    let scaleXFactor = 1, scaleYFactor = 1;

    if (scene.zoomIn.active && !scene.zoomOut.active) {
        const start = scene.zoomIn.start / 100;
        const duration = scene.zoomIn.end / 100 - start;
        scaleFactor = lerp(scene.zoomIn.startFactor, scene.zoomIn.endFactor, getScaleFactor(start, duration, progress));
    }
    else if (scene.zoomOut.active && !scene.zoomIn.active) {
        const start = scene.zoomOut.start / 100;
        const duration = scene.zoomOut.end / 100 - start;
        scaleFactor = lerp(scene.zoomOut.startFactor, scene.zoomOut.endFactor, getScaleFactor(start, duration, progress));
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
            scaleFactor = lerp(scene.zoomIn.startFactor, scene.zoomIn.endFactor, getScaleFactor(inStart, inEnd - inStart, progress));
        }
        else {
            // inside out
            scaleFactor = lerp(scene.zoomOut.startFactor, scene.zoomOut.endFactor, getScaleFactor(outStart, outEnd - outStart, progress));
        }
    }

    if (scene.scaleX.active) {
        scaleXFactor = scaleFactor * (1 + Math.abs(velocity) * scene.scaleX.factor);
    }
    else {
        scaleXFactor = scaleFactor;
    }

    if (scene.scaleY.active) {
        scaleYFactor = scaleFactor * (1 + Math.abs(velocity) * scene.scaleY.factor);
    }
    else {
        scaleYFactor = scaleFactor;
    }

    if (scaleXFactor !== 1 || scaleYFactor !== 1) {
        scale = `scale(${scaleXFactor}, ${scaleYFactor})`;
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
    scene.element.style.transform = `${translate} ${skew} ${scale} ${rotate}`;
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

window.gui = new dat.GUI();

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
        skewX: {
            active: false,
            velocity: true,
            angle: 20,
            end: 100,
            start: 0
        },
        zoomIn: {
            active: false,
            startFactor: 1,
            endFactor: 2,
            end: 100,
            start: 0
        },
        zoomOut: {
            active: false,
            startFactor: 2,
            endFactor: 1,
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
        },
        rotateIn: {
            active: false,
            angle: -30,
            end: 100,
            start: 50,
        },
        rotateOut: {
            active: false,
            angle: 30,
            end: 50,
            start: 0,
        },
        scaleY: {
            active: false,
            factor: 0.5
        },
        scaleX: {
            active: false,
            factor: 0.5
        }
    };
}

function generateFilterConfig () {
    return {
        active: false,
        type: 'displacement',
        start: 15,
        radius: 12,
        hue: 60
    };
}

const config = {
    scene: {
        'Save to File': function() {
            download(getValues(), `background-effects-${getTimeStamp()}.txt`);
        },
        'Load from Files': function() {
            upload(); // stub
        },
        container: true,
        friction: 0.8
    },
    images: [
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            filter: generateFilterConfig()
        }
    ]
};

function createImageControls (folder, config) {
    folder.add(config, 'height', 100, 2000, 50)
        .onFinishChange(restart);
    folder.addColor(config, 'bgColor')
        .onFinishChange(restart);
}

function createTransformsControls (folder, config) {
    const panY = folder.addFolder('Pan Y');
    gui.remember(config.translateY);

    panY.add(config.translateY, 'active')
        .onChange(restart);
    panY.add(config.translateY, 'speed', 0, 1, 0.05)
        .onFinishChange(restart);
    panY.add(config.translateY, 'start', 0, 100, 5)
        .onFinishChange(restart);
    panY.add(config.translateY, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const panX = folder.addFolder('Pan X');
    gui.remember(config.translateX);

    panX.add(config.translateX, 'active')
        .onChange(restart);
    panX.add(config.translateX, 'speed', 0, 1, 0.05)
        .onFinishChange(restart);
    panX.add(config.translateX, 'start', 0, 100, 5)
        .onFinishChange(restart);
    panX.add(config.translateX, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const skewY = folder.addFolder('Skew Y');
    gui.remember(config.skewY);

    skewY.add(config.skewY, 'active')
        .onChange(restart);
    skewY.add(config.skewY, 'velocity')
        .onChange(restart);
    skewY.add(config.skewY, 'angle', 5, 40, 1)
        .onFinishChange(restart);
    skewY.add(config.skewY, 'start', 0, 100, 5)
        .onFinishChange(restart);
    skewY.add(config.skewY, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const skewX = folder.addFolder('Skew X');
    gui.remember(config.skewX);

    skewX.add(config.skewX, 'active')
        .onChange(restart);
    skewX.add(config.skewX, 'velocity')
        .onChange(restart);
    skewX.add(config.skewX, 'angle', 5, 40, 1)
        .onFinishChange(restart);
    skewX.add(config.skewX, 'start', 0, 100, 5)
        .onFinishChange(restart);
    skewX.add(config.skewX, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const zoomIn = folder.addFolder('Zoom In');
    gui.remember(config.zoomIn);

    zoomIn.add(config.zoomIn, 'active')
        .onChange(restart);
    zoomIn.add(config.zoomIn, 'startFactor', 0.1, 2, 0.1)
        .onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'endFactor', 1, 4, 0.1)
        .onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'start', 0, 90, 5)
        .onFinishChange(restart);
    zoomIn.add(config.zoomIn, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const zoomOut = folder.addFolder('Zoom Out');
    gui.remember(config.zoomOut);

    zoomOut.add(config.zoomOut, 'active')
        .onChange(restart);
    zoomOut.add(config.zoomOut, 'startFactor', 1, 4, 0.1)
        .onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'endFactor', 0.1, 2, 0.1)
        .onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'start', 0, 90, 5)
        .onFinishChange(restart);
    zoomOut.add(config.zoomOut, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const fadeIn = folder.addFolder('Fade In');
    gui.remember(config.fadeIn);

    fadeIn.add(config.fadeIn, 'active')
        .onChange(restart);
    fadeIn.add(config.fadeIn, 'start', 0, 90, 5)
        .onFinishChange(restart);
    fadeIn.add(config.fadeIn, 'end', 10, 100, 5)
        .onFinishChange(restart);

    const fadeOut = folder.addFolder('Fade Out');
    gui.remember(config.fadeOut);

    fadeOut.add(config.fadeOut, 'active')
        .onChange(restart);
    fadeOut.add(config.fadeOut, 'start', 0, 100, 5)
        .onFinishChange(restart);
    fadeOut.add(config.fadeOut, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const rotateIn = folder.addFolder('Rotate In');
    gui.remember(config.rotateIn);

    rotateIn.add(config.rotateIn, 'active')
        .onChange(restart);
    rotateIn.add(config.rotateIn, 'angle', -180, 180, 1)
        .onFinishChange(restart);
    rotateIn.add(config.rotateIn, 'start', 0, 100, 5)
        .onFinishChange(restart);
    rotateIn.add(config.rotateIn, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const rotateOut = folder.addFolder('Rotate Out');
    gui.remember(config.rotateOut);

    rotateOut.add(config.rotateOut, 'active')
        .onChange(restart);
    rotateOut.add(config.rotateOut, 'angle', -180, 180, 1)
        .onFinishChange(restart);
    rotateOut.add(config.rotateOut, 'start', 0, 100, 5)
        .onFinishChange(restart);
    rotateOut.add(config.rotateOut, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const scaleY = folder.addFolder('Velocity Scale Y');
    gui.remember(config.scaleY);
    scaleY.add(config.scaleY, 'active')
        .onChange(restart);
    scaleY.add(config.scaleY, 'factor', -0.9, 3, 0.1)
        .onFinishChange(restart);

    const scaleX = folder.addFolder('Velocity Scale X');
    gui.remember(config.scaleX);
    scaleX.add(config.scaleX, 'active')
        .onChange(restart);
    scaleX.add(config.scaleX, 'factor', -0.9, 3, 0.1)
        .onFinishChange(restart);
}

function createFilterControls (folder, config) {
    folder.add(config, 'active')
        .onChange(filterToggle(0));
    folder.add(config, 'type', FILTER_CONF)
        .onChange(filterChange(0));
    folder.add(config, 'start', 0, 100, 5)
        .onChange(restart);
    folder.add(config, 'radius', 5, 30, 1)
        .onChange(restart);
    folder.add(config, 'hue', 0, 359, 5)
        .onChange(restart);
}

/*
 * Create controls for demo config
 */

const sceneConfig = gui.addFolder('Scene config');
gui.remember(config.scene);

sceneConfig.add(config.scene, 'Save to File');
sceneConfig.add(config.scene, 'Load from Files');

sceneConfig.add(config.scene, 'container')
    .onChange(restart);
sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05)
    .onFinishChange(restart);

sceneConfig.open();

/*
 * Image 1 controls
 */
const image1 = gui.addFolder('Image 1');
gui.remember(config.images[0]);
gui.remember(config.images[0].filter);

createImageControls(image1, config.images[0]);

const image1Transforms = image1.addFolder('Transforms');
image1Transforms.open();

createTransformsControls(image1Transforms, config.images[0].transforms);

const image1Filters = image1.addFolder('Filters');
// image1Filters.open();
createFilterControls(image1Filters, config.images[0].filter);

/*
 * Image 2 controls
 */
const image2 = gui.addFolder('Image 2');
gui.remember(config.images[1]);
gui.remember(config.images[1].filter);

createImageControls(image2, config.images[1]);

const image2Transforms = image2.addFolder('Transforms');
image2Transforms.open();

createTransformsControls(image2Transforms, config.images[1].transforms);

const image2Filters = image2.addFolder('Filters');
// image2Filters.open();
createFilterControls(image2Filters, config.images[1].filter);

/*
 * Image 3 controls
 */
const image3 = gui.addFolder('image 3');
gui.remember(config.images[2]);
gui.remember(config.images[2].filter);

createImageControls(image3, config.images[2]);

const image3Transforms = image3.addFolder('Transforms');
image3Transforms.open();

createTransformsControls(image3Transforms, config.images[2].transforms);

const image3Filters = image3.addFolder('Filters');
// image3Filters.open();
createFilterControls(image3Filters, config.images[2].filter);

/*
 * Image 4 controls
 */
const image4 = gui.addFolder('Image 4');
gui.remember(config.images[3]);
gui.remember(config.images[3].filter);

createImageControls(image4, config.images[3]);

const image4Transforms = image4.addFolder('Transforms');
image4Transforms.open();

createTransformsControls(image4Transforms, config.images[3].transforms);

const image4Filters = image4.addFolder('Filters');
// image4Filters.open();
createFilterControls(image4Filters, config.images[3].filter);

/*
 * Image 5 controls
 */
const image5 = gui.addFolder('Image 5');
gui.remember(config.images[4]);
gui.remember(config.images[4].filter);

createImageControls(image5, config.images[4]);

const image5Transforms = image5.addFolder('Transforms');
image5Transforms.open();

createTransformsControls(image5Transforms, config.images[4].transforms);

const image5Filters = image5.addFolder('Filters');
// image5Filters.open();
createFilterControls(image5Filters, config.images[4].filter);

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

    if (!config.scene.container) {
        wrapper.style.position = 'static';
        wrapper.style.height = 'auto';
        wrapper.style.overflow = 'visible';
    }

    const scrollContainer = config.scene.container ? container : null;

    if (!scrollContainer) {
        container.style.transform = 'none';
    }

    // create new scroll controller
    const parallax = new Scroll({
        container: scrollContainer,
        wrapper,
        scenes,
        animationActive: true,
        animationFriction: config.scene.friction,
        velocityActive: config.images.some(
            img => img.transforms.skewY.active && img.transforms.skewY.velocity
                || img.transforms.skewX.active && img.transforms.skewX.velocity
                || img.transforms.scaleY.active
                || img.transforms.scaleX.active
        ),
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
        const filter = config.images[index].filter;
        const hasWebGL = filter.active && filter.type === 'displacement';

        /*
         * Setup parents styling
         */
        parent.style.setProperty('--strip-height', `${config.images[index].height}px`);
        parent.style.backgroundColor = config.images[index].bgColor;

        if (transforms.translateX.active) {
            img.style.width = '200%';
        }
        else {
            img.style.width = '100%';
        }

        return {
            effect: transform,
            start,
            duration,
            element: hasWebGL ? img.nextElementSibling : img,
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
            parent.dataset.canvas = 'displacement';
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

function lerp (a, b, t) {
    return a * (1 - t) + b * t;
}

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
                    setValues(JSON.parse(e.target.result));
                    gui.saveAs(file.name);
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
function setValues(rememberedValues) {
    rememberedValues.forEach((values, index) => {
        Object.keys(values).forEach((key) => {
            const controller = gui.__rememberedObjectIndecesToControllers[index][key];
            controller && controller.setValue(values[key]);
        });
    });
}

function getValues() {
    return JSON.stringify(gui.__rememberedObjects, null, 2);
}
