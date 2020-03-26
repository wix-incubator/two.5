function clamp (min, max, val) {
    return Math.min(Math.max(min, val), max);
}

function fixed (num, digits=2) {
    return +num.toFixed(digits);
}

function clone (...objects) {
    return Object.assign(Object.create(null), ...objects);
}

function lerp (a, b, t) {
    return a * (1 - t) + b * t
}

export {
    clamp,
    fixed,
    clone,
    lerp
};
