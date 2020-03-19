function clamp (min, max, val) {
    return Math.min(Math.max(min, val), max);
}

function clone (...objects) {
    return Object.assign(Object.create(null), ...objects);
}

export {
    clamp,
    clone
};
