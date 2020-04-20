import { Scroll } from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

/*
 * Effects
 */

/*
 * Simple transforms
 */
function transform (scene, progress) {
    let translate = '', skew = '';

    if (scene.translateY) {
        translate = `translate3d(0px, ${(progress * scene.duration - scene.offset) * scene.speed}px, 0px)`;
    }
    if (scene.skewY) {
        skew = ` skewY(${(1 - progress) * scene.angle}deg)`;
    }
    scene.element.style.transform = `${translate}${skew}`;
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

const FILTERS = {
    focus,
    saturate,
    hueRotate,
    sepia,
    invert,
    difference,
    dodge
};

const FILTER_CONF = {
    focus: 'focus',
    saturate: 'saturate',
    'hue rotate': 'hueRotate',
    sepia: 'sepia',
    invert: 'invert',
    'blend-difference': 'difference',
    'blend-dodge': 'dodge'
};

const gui = new dat.GUI();

const config = {
    scene: {
        container: true,
        friction: 0.8
    },
    images: [
        {
            speed: 0,
            angle: 30,
            transform: {
                translateY: true,
                skewY: false
            },
            filter: {
                active: false,
                type: 'sepia',
                start: 65,
                radius: 12,
                hue: 60
            }
        },
        {
            speed: 0.25,
            angle: 30,
            transform: {
                translateY: true,
                skewY: false
            },
            filter: {
                active: false,
                type: 'sepia',
                start: 65,
                radius: 12,
                hue: 60
            }
        },
        {
            speed: 0.5,
            angle: 30,
            transform: {
                translateY: true,
                skewY: false
            },
            filter: {
                active: false,
                type: 'sepia',
                start: 65,
                radius: 12,
                hue: 60
            }
        },
        {
            speed: 0.75,
            angle: 30,
            transform: {
                translateY: true,
                skewY: false
            },
            filter: {
                active: false,
                type: 'sepia',
                start: 65,
                radius: 12,
                hue: 60
            }
        },
        {
            speed: 1.0,
            angle: 30,
            transform: {
                translateY: true,
                skewY: false
            },
            filter: {
                active: false,
                type: 'sepia',
                start: 65,
                radius: 12,
                hue: 60
            }
        }
    ]
};

/*
 * Create controls for demo config
 */
/*
 * General scene config
 */
const extraControls = {
    hue: []
};

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

const image1Transforms = image1.addFolder('Transforms');
image1Transforms.open();
image1Transforms.add(config.images[0], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image1Transforms.add(config.images[0], 'angle', 5, 60, 1)
    .onFinishChange(restart);
image1Transforms.add(config.images[0].transform, 'translateY')
    .onChange(restart);
image1Transforms.add(config.images[0].transform, 'skewY')
    .onChange(restart);
const image1Filters = image1.addFolder('Filters');
image1Filters.open();
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


const image2Transforms = image2.addFolder('Transforms');
image2Transforms.open();
image2Transforms.add(config.images[1], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image2Transforms.add(config.images[1], 'angle', 5, 60, 1)
    .onFinishChange(restart);
image2Transforms.add(config.images[1].transform, 'translateY')
    .onChange(restart);
image2Transforms.add(config.images[1].transform, 'skewY')
    .onChange(restart);
const image2Filters = image2.addFolder('Filters');
image2Filters.open();
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

const image3Transforms = image3.addFolder('Transforms');
image3Transforms.open();
image3Transforms.add(config.images[2], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image3Transforms.add(config.images[2], 'angle', 5, 60, 1)
    .onFinishChange(restart);
image3Transforms.add(config.images[2].transform, 'translateY')
    .onChange(restart);
image3Transforms.add(config.images[2].transform, 'skewY')
    .onChange(restart);
const image3Filters = image3.addFolder('Filters');
image3Filters.open();
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

const image4Transforms = image4.addFolder('Transforms');
image4Transforms.open();
image4Transforms.add(config.images[3], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image4Transforms.add(config.images[3], 'angle', 5, 60, 1)
    .onFinishChange(restart);
image4Transforms.add(config.images[3].transform, 'translateY')
    .onChange(restart);
image4Transforms.add(config.images[3].transform, 'skewY')
    .onChange(restart);
const image4Filters = image4.addFolder('Filters');
image4Filters.open();
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

const image5Transforms = image5.addFolder('Transforms');
image5Transforms.open();
image5Transforms.add(config.images[4], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image5Transforms.add(config.images[4], 'angle', 5, 60, 1)
    .onFinishChange(restart);
image5Transforms.add(config.images[4].transform, 'translateY')
    .onChange(restart);
image5Transforms.add(config.images[4].transform, 'skewY')
    .onChange(restart);
const image5Filters = image5.addFolder('Filters');
image5Filters.open();
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
        animationFriction: config.scene.friction
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

/*
 * Factory of scene data
 */
function createScenes () {
    // get only scenes with active filter
    const filterScenes = config.images
        .map((img, index) => [img.filter, images[index]])
        .filter(x => {
            return x[0] && x[0].active;
        });

    // create configs for background translateY scenes
    return images.map((img, index) => {
        const parent = parents[index];
        const parentTop = parent.offsetTop;
        const parentHeight = parent.offsetHeight;

        const start = parentTop - viewportHeight;
        const duration = (parentHeight > viewportHeight ? parentHeight : viewportHeight) + viewportHeight;

        return {
            effect: transform,
            speed: +config.images[index].speed,
            angle: +config.images[index].angle,
            start,
            duration,
            element: img,
            pauseDuringSnap: true,
            offset: viewportHeight,
            ...config.images[index].transform
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
            case 'difference':
            case 'dodge':
                images[i].dataset.filter = '';
                break;
            default:
                parents[i].dataset.blend = '';
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
