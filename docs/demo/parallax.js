import { Scroll } from './two.5.js';
import * as dat from '../../node_modules/dat.gui/build/dat.gui.module.js';
import Stats from '../../node_modules/stats.js/src/Stats.js';

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

function invert (scene, progress) {
    scene.element.style.filter = `invert(${(1 - progress) * 100}%)`;
}

function difference (scene, progress) {
    scene.element.style.backgroundColor = `hsl(0, 0%, ${(1 - progress) * 100}%)`;
}

function dodge (scene, progress) {
    scene.element.style.backgroundColor = `hsl(15, ${(1 - progress) * 100}%, 20%)`;
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

const wrapper = document.querySelector('#wrapper');
const viewportHeight = window.innerHeight;
const parents = [...window.document.querySelectorAll('[data-effects~="parallax"]')];
const images = [...window.document.querySelectorAll('[data-effects~="parallax"] img')];

function createScenes (pins) {
    const filterScenes = config.images
        .map((img, index) => [img.filter, images[index]])
        .filter(x => {
            return x[0] && x[0] !== 'null'
        });
    const pin1Duration = pins[0] ? pins[0].duration : 0;
    const pin2Duration = pins[1] ? pins[1].duration : 0;

    return images.map((img, index) => {
        const parent = parents[index];
        const parentTop = parent.offsetTop;
        const parentHeight = parent.offsetHeight;

        const start = parentTop - viewportHeight;
        const duration = (parentHeight > viewportHeight ? parentHeight : viewportHeight) + viewportHeight;

        return {
            effect: background,
            speed: +config.images[index].speed,
            start,
            duration,
            element: img,
            pauseDuringPin: true,
            viewportHeight
        };
    }).concat(filterScenes.map(([filter, scene]) => {
        const parent = scene.closest('[data-effects]');
        const parentTop = parent.offsetTop;
        const index = parents.indexOf(parent);
        let element = scene;
        let start = parentTop - viewportHeight * 0.65;
        let duration = viewportHeight;

        if (filter === 'difference' || filter === 'dodge') {
            parent.dataset.blend = filter;
            element = scene.parentElement;
        }

        if (index === 1) {
            duration += pin1Duration;
        }
        if (index > 1) {
            start += pin1Duration;
        }
        if (index === 3) {
            duration += pin2Duration;
        }
        if (index > 3) {
            start += pin2Duration;
        }

        return {
            effect: FILTERS[filter],
            start,
            duration,
            element,
            viewportHeight
        };
    }));
}

const gui = new dat.GUI();

const config = {
    scene: {
        container: true,
        friction: 0.8,
        pins: {
            'image 2': true,
            'image 4': true
        }
    },
    images: [
        {
            speed: 0,
            filter: null
        },
        {
            speed: 0.25,
            filter: null
        },
        {
            speed: 0.5,
            filter: null
        },
        {
            speed: 0.75,
            filter: null
        },
        {
            speed: 1.0,
            filter: null
        }
    ]
};

const FILTER_CONF = {
    non: null,
    focus: 'focus',
    saturate: 'saturate',
    'hue rotate': 'hueRotate',
    sepia: 'sepia',
    invert: 'invert',
    'blend-difference': 'difference',
    'blend-dodge': 'dodge'
};

const PINS_CONF = {
    'image 2': () => ({start: parents[1].offsetTop, duration: 1500}),
    'image 4': () => ({start: parents[3].offsetTop + (config.scene.pins['image 2'] ? 1500 : 0), duration: 1700})
};

const sceneConfig = gui.addFolder('Scene config');
sceneConfig.add(config.scene, 'container').onChange(restart);
sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05).onFinishChange(restart);
const pins = sceneConfig.addFolder('Pins');
pins.add(config.scene.pins, 'image 2').onChange(restart);
pins.add(config.scene.pins, 'image 4').onChange(restart);
pins.open();
sceneConfig.open();

const image1 = gui.addFolder('image 1');
image1.add(config.images[0], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image1.add(config.images[0], 'filter', FILTER_CONF)
    .onChange(filterChange(0));

const image2 = gui.addFolder('Image 2');
image2.add(config.images[1], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image2.add(config.images[1], 'filter', FILTER_CONF)
    .onChange(filterChange(1));

const image3 = gui.addFolder('image 3');
image3.add(config.images[2], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image3.add(config.images[2], 'filter', FILTER_CONF)
    .onChange(filterChange(2));

const image4 = gui.addFolder('Image 4');
image4.add(config.images[3], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image4.add(config.images[3], 'filter', FILTER_CONF)
    .onChange(filterChange(3));

const image5 = gui.addFolder('Image 5');
image5.add(config.images[4], 'speed', 0, 1, 0.05)
    .onFinishChange(restart);
image5.add(config.images[4], 'filter', FILTER_CONF)
    .onChange(filterChange(4));

let instance;

function filterChange (i) {
    return function (v) {
        switch (v) {
            case 'null':
                parents[i].dataset.blend = '';
                images[i].dataset.filter = '';
                break;
            case 'difference':
            case 'dodge':
                images[i].dataset.filter = '';
                break
            default:
                parents[i].dataset.blend = '';
        }

        restart();
    };
}

function restart () {
    instance.off();
    instance = init();
}

let stats;

function init () {
    if (stats) {
        stats.dom.remove();
    }

    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    wrapper.classList.toggle('root', config.scene.container);

    const pins = Object.entries(config.scene.pins).map(([key, toggle]) => toggle && PINS_CONF[key]());
    const scenes = createScenes(pins);
    const parallax = new Scroll({
        container: config.scene.container ? document.querySelector('main') : null,
        pins: pins.filter(Boolean),
        scenes,
        animationActive: true,
        animationFriction: config.scene.friction
    });

    parallax.on();

    parallax.effects.unshift(function () {
        stats.begin();
    });
    parallax.effects.push(function () {
        stats.end();
    });

    return parallax;
}

instance = init();
