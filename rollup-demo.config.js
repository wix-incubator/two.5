import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';

const config = [
    {
        input: './demo/js/gradients.js',
        output: {
            dir: './docs/demo/js',
            format: 'umd',
            sourcemap: false
        },
        plugins: [
            progress({
                clearLine: false
            }),
            filesize()
        ]
    },
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
            filesize()
        ]
    }
];

export default config;
