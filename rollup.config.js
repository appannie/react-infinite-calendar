import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import url from '@rollup/plugin-url';
import babel from 'rollup-plugin-babel';
import peer from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-cpy'
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const umdOutputOptions = {
  name: 'InfiniteCalendar',
  format: 'umd',
  exports: 'named',
  globals: {
    react: 'React',
    'react-dom': 'reactDom',
    'react-transition-group': 'reactTransitionGroup',
  },
  sourcemap: true
};

const plugins = [
  url(),
  babel({
    presets: [['react-app', { absoluteRuntime: false, useESModules: false }]],
    plugins: [
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      'transform-react-remove-prop-types',
    ],
    exclude: 'node_modules/**',
    runtimeHelpers: true,
  }),
  resolve(),
];

export default [
  {
    input: 'src/index.js',
    output: [
      {
        dir: pkg.main,
        format: 'cjs',
        exports: 'named',
      },
      {
        dir: pkg.module,
        format: 'es',
        exports: 'named',
      },
    ],
    external: id => id.startsWith('@babel/runtime/helpers'),
    preserveModules: true,
    plugins: [
      ...plugins,
      commonjs(),
      peer({
        includeDependencies: true,
      }),
      postcss({
        modules: true,
        use: {
          sass: true,
        }, 
        extract: 'styles.css'
      }),
      del({
        targets: pkg.files,
      }),
      copy({
        files: ['lib/styles.css'],
        dest: './',
        options: {
          verbose: true
        }
      })
    ]
  },
  {
    input: 'src/index.js',
    output: [
      {
        file: `${pkg['umd:main']}/${pkg.name}.js`,
        ...umdOutputOptions,
      },
      {
        file: `${pkg['umd:main']}/${pkg.name}.min.js`,
        ...umdOutputOptions,
      },
    ],
    external: ['react', 'react-dom', 'react-transition-group'],
    plugins: [
      ...plugins,
      commonjs({
        sourceMap: true
      }),
      postcss({
        modules: true,
        use: {
          sass: true,
        }, 
        extract: true
      }),
      terser({})
    ]
  }
];
