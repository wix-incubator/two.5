import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';

const config = {
    input: 'background.js',
    output: {
        name: 'demo',
        file: 'background.dist.js',
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
