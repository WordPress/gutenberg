import {
	mkdirSync,
	mkdtempSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { createServer } from 'vite';

const temporaryRoots = [];

afterEach( async () => {
	for ( const { root, server } of temporaryRoots.splice( 0 ) ) {
		await server.close();
		rmSync( root, { force: true, recursive: true } );
	}
} );

describe( 'Vite block metadata invalidation', () => {
	test( 'invalidates a block entry when its imported block.json changes', async () => {
		const root = realpathSync(
			mkdtempSync(
				path.join( os.tmpdir(), 'gutenberg-vite-block-metadata-' )
			)
		);
		const blockDirectory = path.join( root, 'block' );
		const blockEntry = path.join( blockDirectory, 'index.js' );
		const blockMetadata = path.join( blockDirectory, 'block.json' );

		mkdirSync( blockDirectory );
		writeFileSync(
			blockEntry,
			"import metadata from './block.json'; export default metadata;"
		);
		writeFileSync( blockMetadata, '{"name":"core/example"}' );

		const server = await createServer( {
			configFile: false,
			logLevel: 'silent',
			root,
			server: {
				middlewareMode: true,
			},
		} );
		temporaryRoots.push( { root, server } );

		await server.transformRequest( '/block/index.js' );
		await server.transformRequest( '/block/block.json' );

		const entryModule =
			await server.moduleGraph.getModuleByUrl( '/block/index.js' );
		const metadataModule =
			await server.moduleGraph.getModuleByUrl( '/block/block.json' );

		expect( entryModule.transformResult ).not.toBeNull();
		expect( metadataModule.transformResult ).not.toBeNull();
		expect( entryModule.importedModules ).toContain( metadataModule );

		server.moduleGraph.onFileChange( blockMetadata );

		expect( metadataModule.transformResult ).toBeNull();
		expect( entryModule.transformResult ).toBeNull();
	} );
} );
