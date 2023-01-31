import test from 'ava';
import './mocks.js';
import {Scroll} from '../../src/index.js';

test('constructor :: empty', t => {
    const scroll = new Scroll();

    t.is(scroll.config.root, window);
});

test('constructor :: config', t => {
    const scroll = new Scroll({transitionActive: true});

    t.is(scroll.config.transitionActive, true);
});

test('resetProgress', t => {
    const scrollPosition = {x: 10, y: 20};
    const scroll = new Scroll();

    scroll.resetProgress(scrollPosition);

    t.is(window.scrollX, scrollPosition.x);
    t.is(window.scrollY, scrollPosition.y);
    t.is(scroll.progress.x, scrollPosition.x);
    t.is(scroll.progress.y, scrollPosition.y);
});

test('resetProgress :: animationActive=true', t => {
    const scrollPosition = {x: 10, y: 20};
    const scroll = new Scroll({
        transitionActive: true
    });

    scroll.resetProgress(scrollPosition);

    t.is(window.scrollX, scrollPosition.x);
    t.is(window.scrollY, scrollPosition.y);
    t.is(scroll.progress.x, scrollPosition.x);
    t.is(scroll.progress.y, scrollPosition.y);
    t.is(scroll.currentProgress.x, scrollPosition.x);
    t.is(scroll.currentProgress.y, scrollPosition.y);
});

test('start :: measure progress', t => {
    const scroll = new Scroll({
        root: window,
        scenes: [
            {
                effect() {},
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(10, 1000);
    window.executeAnimationFrame(scroll.time);

    t.is(scroll.progress.x, 10);
    t.is(scroll.progress.y, 1000);
});

test('start :: effect progress', t => {
    let progress = 0;
    const scroll = new Scroll({
        root: window,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.6);
});

test('start :: effect progress :: velocityActive=true', t => {
    let progress = 0;
    let velocity = 0;
    const scroll = new Scroll({
        root: window,
        velocityActive: true,
        velocityMax: 400,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                    velocity = v;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.6);
    t.is(velocity, 300 / 400);
});

test('start :: effect progress :: velocityActive=true with transitionActive=true', t => {
    let progress = 0;
    let velocity = 0;
    const scroll = new Scroll({
        root: window,
        transitionActive:  true,
        transitionFriction: 0.5,
        velocityActive: true,
        velocityMax: 400,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                    velocity = v;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.3);
    t.is(velocity, 150 / 400);
});

test('start :: effect progress :: transitionActive=true', t => {
    let progress = 0;
    const scroll = new Scroll({
        root: window,
        transitionActive: true,
        transitionFriction: 0.5,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.3);
});

test('start :: effect progress :: with container', t => {
    let progress = 0;
    const scrollY = 300;
    const container = {
        style: {
            transform: ''
        }
    };
    const scroll = new Scroll({
        root: window,
        container,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, scrollY);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.6);
    t.is(container.style.transform, `translate3d(0px, -${scrollY}px, 0px)`);
});

test('viewport :: disable', t => {
    let progress = 0;
    const viewport = {};
    const scrollY1 = 50;
    const scrollY2 = 300;
    const scroll = new Scroll({
        root: window,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 100,
                viewport
            }
        ]
    });

    scroll.start();

    window.intersectionEntries.push({
        isIntersecting: true,
        target: viewport
    });

    window.scrollTo(0, scrollY1);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.5);
    t.is(scroll.config.scenes[0].disabled, false);

    window.scrollTo(0, 75);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.75);

    window.scrollTo(0, scrollY2);
    window.intersectionEntries.push({
        isIntersecting: false,
        target: viewport
    });
    window.executeAnimationFrame(scroll.time);

    t.is(scroll.config.scenes[0].disabled, true);
});

test('pause', t => {
    let progress = 0;
    const scroll = new Scroll({
        root: window,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame(scroll.time);

    t.is(progress, 0.6);

    scroll.pause();

    t.is(scroll.ticking, false);
});

test('destroy', t => {
    let progress = 0;
    const scroll = new Scroll({
        root: window,
        scenes: [
            {
                effect(scene, p, v) {
                    progress = p;
                },
                start: 0,
                duration: 500
            }
        ]
    });

    scroll.start();

    window.scrollTo(0, 300);
    window.executeAnimationFrame();

    t.is(progress, 0.6);

    scroll.destroy();

    t.is(scroll.ticking, false);

    t.is(scroll.effects.length, 0);
});
