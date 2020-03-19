export function getEffect ({
    container,
    layers,
    elevation,
    scenePerspective,
    perspective,
    translation,
    rotation,
    skewing,
    scaling
}) {
    let layerPerspective = '';

    /*
     * Init effect
     */
    if (container) {
        Object.assign(container.style, {
            // 'transform-style': 'preserve-3d',
            perspective: `${scenePerspective}px`
        });
    }
    else {
        layerPerspective = `perspective(${scenePerspective}px) `;
    }

    layers.forEach(layer => {
        Object.assign(layer.el.style, {
            'transform-style': 'preserve-3d',
            'pointer-events': 'none'
        });
    });

    return function tilt ({x, y}) {
        const len = layers.length;

        let translateXFactor;
        let translateYFactor;
        let rotateXFactor;
        let rotateYFactor;

        if (translation.active) {
            translateXFactor = (translation.invertX ? -1 : 1) * translation.max * (2 * x - 1);
            translateYFactor = (translation.invertY ? -1 : 1) * translation.max * (2 * y - 1);
        }

        if (rotation.active) {
            rotateXFactor = (rotation.invertX ? -1 : 1) * rotation.max * (y * 2 - 1);
            rotateYFactor = (rotation.invertY ? -1 : 1) * rotation.max * (1 - x * 2 );
        }

        layers.forEach((layer, index) => {
            const depth = (index + 1) / len;

            let translatePart = '';
            if (translation.active) {
                const translateXVal = translateXFactor * depth;
                const translateYVal = translateYFactor * depth;

                translatePart = `translate3d(${translateXVal}px, ${translateYVal}px, ${elevation}px)`;
            }
            else {
                translatePart = `translateZ(${elevation * (index + 1)}px)`;
            }

            let rotatePart = '';
            if (rotation.active) {
                const rotateXVal = rotateXFactor * depth;
                const rotateYVal = rotateYFactor * depth;

                rotatePart = `rotateX(${rotateXVal}deg) rotateY(${rotateYVal}deg)`;
            }
            else {
                rotatePart = 'rotateX(0deg) rotateY(0deg)';
            }

            layer.el.style.transform = `${layerPerspective}${translatePart} ${rotatePart}`;
        });

        if (perspective.active) {
            const perspX = perspective.invertX ? x : (1 - x);
            const perspY = perspective.invertY ? y : (1 - y);

            let a = 1, b = 0;

            if (perspective.max) {
                a = 1 + 2 * perspective.max;
                b = perspective.max;
            }

            container.style.perspectiveOrigin = `${(perspX * a - b) * 100}% ${(perspY * a - b) * 100}%`;
        }
        else if (container) {
            container.style.perspectiveOrigin = '50% 50%';
        }
    }
}
