import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

const config = {
    input: 'demo.js',
    output: {
        name: 'demo',
        file: 'index.js',
        format: 'umd',
        sourcemap: false
    },
    plugins: [
        progress({
            clearLine: false
        }),
        // nodeResolve({
        //     module: true,
        //     main: true,
        //     browser: true,
        //     preferBuiltins: false
        // }),
        babel(),
        filesize()
    ]
};

export default config;
