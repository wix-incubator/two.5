import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';

const config = {
    input: 'parallax.js',
    output: {
        name: 'demo',
        file: 'parallax.dist.js',
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
