import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';

const config = [
    {
        input: './demo/js/background.js',
        output: {
            dir: './docs/demo/js',
            format: 'umd',
            sourcemap: false
        },
        plugins: [
            progress({
                clearLine: false
            }),
            babel(),
            filesize()
        ]
    },
    {
        input: './demo/js/layers.js',
        output: {
            dir: './docs/demo/js',
            format: 'umd',
            sourcemap: false
        },
        plugins: [
            progress({
                clearLine: false
            }),
            babel(),
            filesize()
        ]
    },
    {
        input: './demo/js/single.js',
        output: {
            dir: './docs/demo/js',
            format: 'umd',
            sourcemap: false
        },
        plugins: [
            progress({
                clearLine: false
            }),
            babel(),
            filesize()
        ]
    },
    {
        input: './demo/js/parallax.js',
        output: {
            dir: './docs/demo/js',
            format: 'umd',
            sourcemap: false
        },
        plugins: [
            progress({
                clearLine: false
            }),
            babel(),
            filesize()
        ]
    }
];

export default config;
