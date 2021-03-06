import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: 'client/index.js',
    output: [
      {
        file: 'lib/client.umd.js',
        format: 'umd',
        name: 'SSEClient',
        // exports: 'named',
        sourcemap: true,
      },
    ],

    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
      }),
      //   terser(),
    ],
  },
]
