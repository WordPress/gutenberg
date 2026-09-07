import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const transformer = require( '../babel-transformer' );

function getTransformOptions() {
	return {
		cacheFS: new Map(),
		config: {
			cwd: process.cwd(),
			rootDir: process.cwd(),
		},
		configString: '{}',
		instrument: false,
		supportsDynamicImport: false,
		supportsExportNamespaceFrom: false,
		supportsStaticESM: false,
		supportsTopLevelAwait: false,
	};
}

describe( 'Babel transformer cache key', () => {
	let temporaryDirectory;

	afterEach( () => {
		if ( temporaryDirectory ) {
			fs.rmSync( temporaryDirectory, { force: true, recursive: true } );
			temporaryDirectory = undefined;
		}
	} );

	it.each( [ 'js', 'jsx' ] )(
		'changes when block.json changes for block index.%s files',
		( extension ) => {
			temporaryDirectory = fs.mkdtempSync(
				path.join( os.tmpdir(), 'gutenberg-babel-transformer-' )
			);
			const blockDirectory = path.join(
				temporaryDirectory,
				'block-library',
				'src',
				'example'
			);
			fs.mkdirSync( blockDirectory, { recursive: true } );
			const blockJSONPath = path.join( blockDirectory, 'block.json' );
			const blockIndexPath = path.join(
				blockDirectory,
				`index.${ extension }`
			);
			fs.writeFileSync( blockJSONPath, '{"name":"core/example"}' );
			const firstCacheKey = transformer.getCacheKey(
				'block source',
				blockIndexPath,
				getTransformOptions()
			);

			fs.writeFileSync(
				blockJSONPath,
				'{"name":"core/example","version":2}'
			);
			const secondCacheKey = transformer.getCacheKey(
				'block source',
				blockIndexPath,
				getTransformOptions()
			);

			expect( secondCacheKey ).not.toBe( firstCacheKey );

			fs.writeFileSync( blockJSONPath, '{"name":"core/example"}' );
			const restoredCacheKey = transformer.getCacheKey(
				'block source',
				blockIndexPath,
				getTransformOptions()
			);

			expect( restoredCacheKey ).toBe( firstCacheKey );
		}
	);
} );
