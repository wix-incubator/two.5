import { clamp } from '../utilities';

export default function getHandler ({target, samples, maxBeta, maxGamma}) {
    const totalAngleX = maxGamma * 2;
    const totalAngleY = maxBeta * 2;

    let lastGammaZero, lastBetaZero, gammaZero, betaZero;

    return function handler (event) {
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
        const x = clamp(0, 1, (event.gamma - maxGamma - gammaZero) / totalAngleX);
        const y = clamp(0, 1, (event.beta - maxBeta - betaZero) / totalAngleY);

        target.x = x;
        target.y = y;
    };
}
