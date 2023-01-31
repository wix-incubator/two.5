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
    let translateY = 0, translateX = 0, translateZ = 0;
    let skewY = 0, skewX = 0;
    let rotationAngle = 0;
    let tiltXAngle = 0, tiltYAngle = 0;

    let perspective = '';
    let scale = '';
    let rotate = '';

    if (scene.perspectiveZ.active) {
        perspective = `perspective(${scene.perspectiveZ.distance}px) `;
    }

    if (scene.translateY.active) {
        const p = Math.min(Math.max(progress - scene.translateY.start / 100, 0), scene.translateY.end / 100);
        translateY = (p * scene.duration - scene.offset) * scene.translateY.factor;
    }

    if (scene.translateX.active) {
        const p = Math.min(Math.max(progress - scene.translateX.start / 100, 0), scene.translateX.end / 100);
        translateX = (p * 2 - 1) * scene.xOffset * scene.translateX.speed;
    }

    if (scene.translateZ.active) {
        const start = scene.translateZ.start / 100;
        const duration = scene.translateZ.end / 100 - start;
        const p = scene.translateZ.symmetric ? 1 - Math.abs(progress * 2 - 1) : progress;
        translateZ = lerp(scene.translateZ.distance, 0, mapProgress(start, duration, p));
    }

    const translate = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px)`;

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
        rotationAngle = mapProgress(start, duration, progress) * (scene.rotateIn.angle);
    }
    else if (scene.rotateOut.active && !scene.rotateIn.active) {
        const start = scene.rotateOut.start / 100;
        const duration = scene.rotateOut.end / 100 - start;
        rotationAngle = (1 - mapProgress(start, duration, progress)) * (scene.rotateOut.angle);
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
            rotationAngle = mapProgress(inStart, inEnd - inStart, progress) * (scene.rotateIn.angle);
        }
        else {
            // inside out
            rotationAngle = (1 - mapProgress(outStart, outEnd - outStart, progress)) * (scene.rotateOut.angle);
        }
    }

    if (scene.tiltX.active) {
        const start = scene.tiltX.start / 100;
        const duration = scene.tiltX.end / 100 - start;
        const p = scene.tiltX.symmetric ? 1 - Math.abs(progress * 2 - 1) : progress;
        const flip = scene.tiltX.symmetric && progress > 0.5 ? -1 : 1;
        tiltXAngle = lerp(scene.tiltX.angle, 0, mapProgress(start, duration, p)) * flip;
    }

    if (scene.tiltY.active) {
        const start = scene.tiltY.start / 100;
        const duration = scene.tiltY.end / 100 - start;
        const p = scene.tiltY.symmetric ? 1 - Math.abs(progress * 2 - 1) : progress;
        const flip = scene.tiltY.symmetric && progress > 0.5 ? -1 : 1;
        tiltYAngle = lerp(scene.tiltY.angle, 0, mapProgress(start, duration, p)) * flip;
    }

    if (rotationAngle !== 0 || tiltXAngle !== 0 || tiltYAngle !== 0) {
        rotate = `rotateX(${tiltXAngle}deg) rotateY(${tiltYAngle}deg) rotateZ(${rotationAngle}deg)`;
    }

    // -------

    let scaleFactor = 1;

    if (scene.zoomIn.active && !scene.zoomOut.active) {
        const start = scene.zoomIn.start / 100;
        const duration = scene.zoomIn.end / 100 - start;
        scaleFactor = lerp(scene.zoomIn.startFactor, scene.zoomIn.endFactor, mapProgress(start, duration, progress));
    }
    else if (scene.zoomOut.active && !scene.zoomIn.active) {
        const start = scene.zoomOut.start / 100;
        const duration = scene.zoomOut.end / 100 - start;
        scaleFactor = lerp(scene.zoomOut.startFactor, scene.zoomOut.endFactor, mapProgress(start, duration, progress));
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
            scaleFactor = lerp(scene.zoomIn.startFactor, scene.zoomIn.endFactor, mapProgress(inStart, inEnd - inStart, progress));
        }
        else {
            // inside out
            scaleFactor = lerp(scene.zoomOut.startFactor, scene.zoomOut.endFactor, mapProgress(outStart, outEnd - outStart, progress));
        }
    }

    let scaleXFactor = scaleFactor;
    let scaleYFactor = scaleFactor;

    if (scene.stretchX.active) {
        if (scene.stretchX.velocity) {
            scaleXFactor *= lerp(scene.stretchX.startFactor, scene.stretchX.endFactor, Math.abs(velocity));
        }
        else {
            const p = scene.stretchX.symmetric ? 1 - Math.abs(progress * 2 - 1) : progress;
            const start = scene.stretchX.start / 100;
            const duration = scene.stretchX.end / 100 - start;
            scaleXFactor *= lerp(scene.stretchX.startFactor, scene.stretchX.endFactor, mapProgress(start, duration, p));
        }
    }

    if (scene.stretchY.active) {
        if (scene.stretchY.velocity) {
            scaleYFactor *= lerp(scene.stretchY.startFactor, scene.stretchY.endFactor, Math.abs(velocity));
        }
        else {
            const p = scene.stretchY.symmetric ? 1 - Math.abs(progress * 2 - 1) : progress;
            const start = scene.stretchY.start / 100;
            const duration = scene.stretchY.end / 100 - start;
            scaleYFactor *= lerp(scene.stretchY.startFactor, scene.stretchY.endFactor, mapProgress(start, duration, p));
        }
    }

    if (scaleXFactor !== 1 || scaleYFactor !== 1) {
        scale = `scale(${scaleXFactor}, ${scaleYFactor})`;
    }

    let opacity = 1;

    if (scene.fadeIn.active && !scene.fadeOut.active) {
        const start = scene.fadeIn.start / 100;
        const duration = scene.fadeIn.end / 100 - start;
        opacity = mapProgress(start, duration, progress);
    }
    else if (scene.fadeOut.active && !scene.fadeIn.active) {
        const start = scene.fadeOut.start / 100;
        const duration = scene.fadeOut.end / 100 - start;
        opacity = 1 - mapProgress(start, duration, progress);
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
            opacity = mapProgress(inStart, inEnd - inStart, progress);
        }
        else {
            // inside out
            opacity = 1 - mapProgress(outStart, outEnd - outStart, progress);
        }
    }

    scene.element.style.opacity = opacity.toFixed(3);
    scene.element.style.transform = `${perspective}${translate} ${skew} ${scale} ${rotate}`;
}

function clip (scene, progress) {
    const start = scene.clip.start / 100;
    const duration = scene.clip.end / 100 - start;
    const p = 1 - mapProgress(start, duration, progress);
    let value = '';

    switch (scene.clip.type) {
        case 'left':
            value = `inset(0% 0% 0% ${p * 100}%)`;
            break;
        case 'right':
            value = `inset(0% ${p * 100}% 0% 0%)`;
            break;
        case 'up':
            value = `inset(${p * 100}% 0% 0% 0%)`;
            break;
        case 'down':
            value = `inset(0% 0% ${p * 100}% 0%)`;
            break;
        case 'x':
            value = `inset(0% ${p * 50}%)`;
            break;
        case 'y':
            value = `inset(${p * 50}% 0%)`;
            break;
        case 'rect':
            value = `inset(${p * 50}%)`;
    }

    scene.element.style.webkitClipPath = value;
    scene.element.style.clipPath = value;
}

function mapProgress (start, duration, progress) {
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
    'blend difference': 'difference',
    'blend dodge': 'dodge'
};

const CLIP_CONF = {
    left: 'left',
    right: 'right',
    up: 'up',
    down: 'down',
    y: 'y',
    x: 'x',
    rect: 'rect'
};

window.gui = new dat.GUI();

function generateTransformsConfig () {
    return {
        perspectiveZ: {
            active: false,
            distance: 50
        },
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
        translateZ: {
            active: false,
            symmetric: true,
            distance: -500,
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
        tiltX: {
            active: false,
            symmetric: true,
            angle: 90,
            start: 0,
            end: 100
        },
        tiltY: {
            active: false,
            symmetric: true,
            angle: 90,
            start: 0,
            end: 100
        },
        stretchX: {
            active: false,
            velocity: false,
            symmetric: false,
            startFactor: 2,
            endFactor: 1,
            start: 15,
            end: 40
        },
        stretchY: {
            active: false,
            velocity: false,
            symmetric: false,
            startFactor: 2,
            endFactor: 1,
            start: 15,
            end: 40
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
        }
    };
}

function generateClipConfig () {
    return {
        active: false,
        type: 'right',
        start: 5,
        end: 45,
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
        container: false,
        animation: false,
        friction: 0.8
    },
    images: [
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            clip: generateClipConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            clip: generateClipConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            clip: generateClipConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            clip: generateClipConfig(),
            filter: generateFilterConfig()
        },
        {
            height: 1000,
            bgColor: '#000',
            transforms: generateTransformsConfig(),
            clip: generateClipConfig(),
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
    const perspectiveZ = folder.addFolder('Perspective Z');
    gui.remember(config.perspectiveZ);

    perspectiveZ.add(config.perspectiveZ, 'active')
        .onChange(restart);
    perspectiveZ.add(config.perspectiveZ, 'distance', 50, 2000, 50)
        .onFinishChange(restart);

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

    const panZ = folder.addFolder('Pan Z');
    gui.remember(config.translateZ);

    panZ.add(config.translateZ, 'active')
        .onChange(restart);
    panZ.add(config.translateZ, 'symmetric')
        .onChange(restart);
    panZ.add(config.translateZ, 'distance', -2000, 2000, 50)
        .onFinishChange(restart);
    panZ.add(config.translateZ, 'start', 0, 100, 5)
        .onFinishChange(restart);
    panZ.add(config.translateZ, 'end', 0, 100, 5)
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

    const tiltX = folder.addFolder('Tilt X');
    gui.remember(config.tiltX);

    tiltX.add(config.tiltX, 'active')
        .onChange(restart);
    tiltX.add(config.tiltX, 'symmetric')
        .onChange(restart);
    tiltX.add(config.tiltX, 'angle', 0, 180, 5)
        .onFinishChange(restart);
    tiltX.add(config.tiltX, 'start', 0, 100, 5)
        .onFinishChange(restart);
    tiltX.add(config.tiltX, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const tiltY = folder.addFolder('Tilt Y');
    gui.remember(config.tiltY);

    tiltY.add(config.tiltY, 'active')
        .onChange(restart);
    tiltY.add(config.tiltY, 'symmetric')
        .onChange(restart);
    tiltY.add(config.tiltY, 'angle', 0, 180, 5)
        .onFinishChange(restart);
    tiltY.add(config.tiltY, 'start', 0, 100, 5)
        .onFinishChange(restart);
    tiltY.add(config.tiltY, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const stretchX = folder.addFolder('Stretch X');
    gui.remember(config.stretchX);

    stretchX.add(config.stretchX, 'active')
        .onChange(restart);
    stretchX.add(config.stretchX, 'velocity')
        .onChange(restart);
    stretchX.add(config.stretchX, 'symmetric')
        .onChange(restart);
    stretchX.add(config.stretchX, 'startFactor', 0.1, 4, 0.1)
        .onFinishChange(restart);
    stretchX.add(config.stretchX, 'endFactor', 0.1, 4, 0.1)
        .onFinishChange(restart);
    stretchX.add(config.stretchX, 'start', 0, 100, 5)
        .onFinishChange(restart);
    stretchX.add(config.stretchX, 'end', 0, 100, 5)
        .onFinishChange(restart);

    const stretchY = folder.addFolder('Stretch Y');
    gui.remember(config.stretchY);

    stretchY.add(config.stretchY, 'active')
        .onChange(restart);
    stretchY.add(config.stretchY, 'velocity')
        .onChange(restart);
    stretchY.add(config.stretchY, 'symmetric')
        .onChange(restart);
    stretchY.add(config.stretchY, 'startFactor', 0.1, 4, 0.1)
        .onFinishChange(restart);
    stretchY.add(config.stretchY, 'endFactor', 0.1, 4, 0.1)
        .onFinishChange(restart);
    stretchY.add(config.stretchY, 'start', 0, 100, 5)
        .onFinishChange(restart);
    stretchY.add(config.stretchY, 'end', 0, 100, 5)
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
}

function createClipControls (folder, config) {
    folder.add(config, 'active')
        .onChange(restart);
    folder.add(config, 'type', CLIP_CONF)
        .onChange(restart);
    folder.add(config, 'start', 0, 100, 5)
        .onChange(restart);
    folder.add(config, 'end', 0, 100, 5)
        .onChange(restart);
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
sceneConfig.add(config.scene, 'animation')
    .onChange(restart);
sceneConfig.add(config.scene, 'friction', 0, 0.95, 0.05)
    .onFinishChange(restart);

sceneConfig.open();

/*
 * Image 1 controls
 */
const image1 = gui.addFolder('Image 1');
gui.remember(config.images[0]);
gui.remember(config.images[0].clip);
gui.remember(config.images[0].filter);

createImageControls(image1, config.images[0]);

const image1Transforms = image1.addFolder('Transforms');
image1Transforms.open();

createTransformsControls(image1Transforms, config.images[0].transforms);

const image1Reveal = image1.addFolder('Reveal');
createClipControls(image1Reveal, config.images[0].clip);

const image1Filters = image1.addFolder('Filters');
// image1Filters.open();
createFilterControls(image1Filters, config.images[0].filter);

/*
 * Image 2 controls
 */
const image2 = gui.addFolder('Image 2');
gui.remember(config.images[1]);
gui.remember(config.images[1].clip);
gui.remember(config.images[1].filter);

createImageControls(image2, config.images[1]);

const image2Transforms = image2.addFolder('Transforms');
image2Transforms.open();

createTransformsControls(image2Transforms, config.images[1].transforms);

const image2Reveal = image2.addFolder('Reveal');
createClipControls(image2Reveal, config.images[1].clip);

const image2Filters = image2.addFolder('Filters');
// image2Filters.open();
createFilterControls(image2Filters, config.images[1].filter);

/*
 * Image 3 controls
 */
const image3 = gui.addFolder('image 3');
gui.remember(config.images[2]);
gui.remember(config.images[2].clip);
gui.remember(config.images[2].filter);

createImageControls(image3, config.images[2]);

const image3Transforms = image3.addFolder('Transforms');
image3Transforms.open();

createTransformsControls(image3Transforms, config.images[2].transforms);

const image3Reveal = image3.addFolder('Reveal');
createClipControls(image3Reveal, config.images[2].clip);

const image3Filters = image3.addFolder('Filters');
// image3Filters.open();
createFilterControls(image3Filters, config.images[2].filter);

/*
 * Image 4 controls
 */
const image4 = gui.addFolder('Image 4');
gui.remember(config.images[3]);
gui.remember(config.images[3].clip);
gui.remember(config.images[3].filter);

createImageControls(image4, config.images[3]);

const image4Transforms = image4.addFolder('Transforms');
image4Transforms.open();

createTransformsControls(image4Transforms, config.images[3].transforms);

const image4Reveal = image4.addFolder('Reveal');
createClipControls(image4Reveal, config.images[3].clip);

const image4Filters = image4.addFolder('Filters');
// image4Filters.open();
createFilterControls(image4Filters, config.images[3].filter);

/*
 * Image 5 controls
 */
const image5 = gui.addFolder('Image 5');
gui.remember(config.images[4]);
gui.remember(config.images[4].clip);
gui.remember(config.images[4].filter);

createImageControls(image5, config.images[4]);

const image5Transforms = image5.addFolder('Transforms');
image5Transforms.open();

createTransformsControls(image5Transforms, config.images[4].transforms);

const image5Reveal = image5.addFolder('Reveal');
createClipControls(image5Reveal, config.images[4].clip);

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
        transitionActive: config.scene.animation,
        transitionFriction: config.scene.friction,
        velocityActive: config.images.some(img =>
            img.transforms.skewY.active && img.transforms.skewY.velocity ||
            img.transforms.skewX.active && img.transforms.skewX.velocity ||
            img.transforms.stretchX.active && img.transforms.stretchX.velocity ||
            img.transforms.stretchY.active && img.transforms.stretchY.velocity
        ),
        velocityMax: 100
    });

    // activate
    parallax.start();

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

    // get only scenes with active reveal
    const revealScenes = config.images
        .map((img, index) => [img.clip, images[index]])
        .filter(x => {
            return x[0] && x[0].active;
        });

    // fix position so that we can get proper offsets
    parents.forEach((parent, index) => {
        if (config.scene.container) {
            delete parent.dataset.fixed;
        }
        else if (config.images[index].transforms.translateY.active) {
            parent.dataset.fixed = true;
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
        const transforms = config.images[index].transforms;

        /*
         * Setup parents styling
         */
        parent.style.setProperty('--strip-height', `${config.images[index].height}px`);
        parent.style.backgroundColor = config.images[index].bgColor;

        if (transforms.translateY.active) {
            if (config.scene.container) {
                transforms.translateY.factor = transforms.translateY.speed;
            }
            else {
                transforms.translateY.factor = (1 - transforms.translateY.speed) * -1;
            }
        }

        const parentTop = parent.offsetTop;
        const parentHeight = parent.offsetHeight;

        const start = parentTop - viewportHeight;
        const duration = parentHeight + viewportHeight;

        const filter = config.images[index].filter;
        const hasWebGL = filter.active && filter.type === 'displacement';

        let offset = config.scene.container ? viewportHeight + img.offsetTop : viewportHeight - (img.offsetHeight - parentHeight);

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
            viewport: parent,
            pauseDuringSnap: true,
            offset,
            xOffset: (img.offsetWidth - parent.offsetWidth) / 2,
            ...transforms
        };
    })
    // create configs for reveal effect scenes
        .concat(revealScenes.map(([reveal, scene]) => {
            const parent = scene.closest('[data-effects]');
            const parentTop = parent.offsetTop;
            // const parentHeight = parent.offsetHeight;

            const start = parentTop - viewportHeight;
            const duration = viewportHeight;

            return {
                effect: clip,
                start,
                duration,
                element: scene,
                viewport: parent,
                clip: reveal
            };
        }))
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
                viewport: parent,
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
    instance.destroy();
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
