import { access, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { dts } from 'rollup-plugin-dts';

const packageRoot = fileURLToPath( new URL( '../..', import.meta.url ) );
const inputPath = join( packageRoot, 'build-types/index.d.ts' );
const outputPath = join( packageRoot, 'build-types/index.bundled.d.ts' );

try {
	await access( inputPath );
} catch {
	throw new Error(
		'@wordpress/theme: Missing build-types/index.d.ts. Run `npm run build` from the repository root first.'
	);
}

const bundle = await rollup( {
	input: inputPath,
	plugins: [
		dts( {
			tsconfig: join( packageRoot, 'tsconfig.src.json' ),
		} ),
	],
} );

try {
	await bundle.write( {
		file: outputPath,
		format: 'es',
	} );
	await rename( outputPath, inputPath );
} finally {
	try {
		await bundle.close();
	} finally {
		await rm( outputPath, { force: true } );
	}
}
