import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';

const config = {
    input: 'layers.js',
    output: {
        name: 'demo',
        file: 'layers.dist.js',
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
};

export default config;
