import * as esbuild from 'esbuild';

await esbuild.build( {
	entryPoints: [ './packages/*/src/index.js' ],
	bundle: true,
	outdir: 'build',
	platform: 'node',
	loader: { '.js': 'jsx', '.ts': 'ts' },
} );
