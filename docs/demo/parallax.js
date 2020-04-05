import { Scroll } from './two.5.js';

function background (scene, progress) {
    scene.element.style.transform = `translate3d(0px, ${(progress * scene.duration - scene.viewportHeight) * scene.speed}px, 0px)`;
}

function createScenes () {
    const viewportHeight = window.innerHeight;
    const parents = window.document.querySelectorAll('[data-effects~="parallax"]');
    const layers = [...window.document.querySelectorAll('[data-effects~="parallax"] img')];
    return layers.map((layer, index) => {
        const parentTop = parents[index].offsetTop;
        const parentHeight = parents[index].offsetHeight;

        return {
            effects: [background],
            speed: +parents[index].dataset.speed,
            start: parentTop - viewportHeight,
            duration: (parentHeight > viewportHeight ? parentHeight : viewportHeight) + viewportHeight,
            element: layer,
            viewportHeight
        };
    });
}

const parallax = new Scroll({
    container: document.querySelector('main'),
    scenes: createScenes(),
    animationActive: true,
    animationFriction: 0.9
});

parallax.on();
