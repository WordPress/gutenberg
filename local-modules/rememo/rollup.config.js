import { terser } from 'rollup-plugin-terser';

export default /** @type {import('rollup').RollupOptions[]} */ [
	{
		input: 'rememo.js',
		output: {
			file: 'rememo.cjs',
			format: 'cjs',
			exports: 'default',
		},
	},
	{
		input: 'rememo.js',
		output: {
			file: 'dist/rememo.js',
			name: 'rememo',
			exports: 'default',
			format: 'iife',
		},
	},
	{
		input: 'rememo.js',
		output: {
			file: 'dist/rememo.min.js',
			name: 'rememo',
			exports: 'default',
			format: 'iife',
		},
		plugins: [terser()],
	},
];
