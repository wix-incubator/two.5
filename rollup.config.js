import progress from 'rollup-plugin-progress';
import filesize from 'rollup-plugin-filesize';

const config = {
    input: 'src/index.js',
    output: {
        name: 'Two5',
        file: 'index.js',
        format: 'es',
        sourcemap: false
    },
    plugins: [
        progress({
            clearLine: false
        }),
        filesize()
    ]
};

export default config;
