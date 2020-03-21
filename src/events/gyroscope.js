import { clamp } from '../utilities';

export function getHandler ({samples, maxBeta, maxGamma, progress}) {
    const hasSupport = window.DeviceOrientationEvent && 'ontouchstart' in window.document.body;

    if (!hasSupport) {
        return null;
    }

    const totalAngleX = maxGamma * 2;
    const totalAngleY = maxBeta * 2;

    let lastGammaZero, lastBetaZero, gammaZero, betaZero;

    function handler (event) {
        if (event.gamma === null || event.beta === null) {
            return;
        }

        // initial angles calibration
        if (samples > 0) {
            lastGammaZero = gammaZero;
            lastBetaZero = betaZero;

            if (gammaZero == null) {
                gammaZero = event.gamma;
                betaZero = event.beta;
            } else {
                gammaZero = (event.gamma + lastGammaZero) / 2;
                betaZero = (event.beta + lastBetaZero) / 2;
            }

            samples -= 1;
        }

        // get angles progress
        const x = clamp(0, 1, (event.gamma - gammaZero + maxGamma) / totalAngleX);
        const y = clamp(0, 1, (event.beta -  betaZero + maxBeta) / totalAngleY);

        progress.x = x;
        progress.y = y;
    }

    function on (config) {
        window.addEventListener('deviceorientation', handler, config || false);
    }

    function off (config) {
        window.removeEventListener('deviceorientation', handler, config || false);
    }

    return {
        on,
        off,
        handler
    };
}
