/**
 * External dependencies
 */
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Internal dependencies
 */
import createExperimentalBlocksPlugin from '../esbuild-plugin';

async function createTempPackageDir( blocks ) {
	const dir = await mkdtemp( path.join( os.tmpdir(), 'block-library-' ) );
	const srcDir = path.join( dir, 'src' );
	await mkdir( srcDir );

	for ( const [ name, metadata ] of Object.entries( blocks ) ) {
		const blockDir = path.join( srcDir, name );
		await mkdir( blockDir );
		await writeFile(
			path.join( blockDir, 'block.json' ),
			JSON.stringify( metadata )
		);
	}

	return dir;
}

describe( 'createExperimentalBlocksPlugin', () => {
	let tmpDir;

	beforeEach( async () => {
		tmpDir = await createTempPackageDir( {
			'stable-block': { name: 'core/stable-block', title: 'Stable' },
			'experimental-block': {
				name: 'core/experimental-block',
				title: 'Experimental',
				__experimental: true,
			},
			'false-experimental-block': {
				name: 'core/false-experimental',
				title: 'Not Experimental',
				__experimental: false,
			},
		} );
	} );

	afterEach( async () => {
		await rm( tmpDir, { recursive: true, force: true } );
	} );

	it( 'registers no hooks when isGutenbergPlugin is true', () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: true,
		} );

		const registeredHooks = { onResolve: [], onLoad: [] };
		const mockBuild = {
			onResolve: ( filter, cb ) =>
				registeredHooks.onResolve.push( { filter, cb } ),
			onLoad: ( filter, cb ) =>
				registeredHooks.onLoad.push( { filter, cb } ),
		};

		plugin.setup( mockBuild );

		expect( registeredHooks.onResolve ).toHaveLength( 0 );
		expect( registeredHooks.onLoad ).toHaveLength( 0 );
	} );

	it( 'registers onResolve and onLoad hooks when isGutenbergPlugin is false', () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		const registeredHooks = { onResolve: [], onLoad: [] };
		const mockBuild = {
			onResolve: ( filter, cb ) =>
				registeredHooks.onResolve.push( { filter, cb } ),
			onLoad: ( filter, cb ) =>
				registeredHooks.onLoad.push( { filter, cb } ),
		};

		plugin.setup( mockBuild );

		expect( registeredHooks.onResolve ).toHaveLength( 1 );
		expect( registeredHooks.onLoad ).toHaveLength( 1 );
	} );

	it( 'stubs experimental block imports from index.js', async () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		let onResolveCb;
		const mockBuild = {
			onResolve: ( _filter, cb ) => {
				onResolveCb = cb;
			},
			onLoad: () => {},
		};

		plugin.setup( mockBuild );

		const srcIndexJs = path.join( tmpDir, 'src', 'index.js' );
		const result = await onResolveCb( {
			path: './experimental-block',
			importer: srcIndexJs,
		} );

		expect( result ).toEqual( {
			path: './experimental-block',
			namespace: 'experimental-block-stub',
		} );
	} );

	it( 'does not stub stable block imports from index.js', async () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		let onResolveCb;
		const mockBuild = {
			onResolve: ( _filter, cb ) => {
				onResolveCb = cb;
			},
			onLoad: () => {},
		};

		plugin.setup( mockBuild );

		const srcIndexJs = path.join( tmpDir, 'src', 'index.js' );
		const result = await onResolveCb( {
			path: './stable-block',
			importer: srcIndexJs,
		} );

		expect( result ).toBeNull();
	} );

	it( 'does not stub blocks with __experimental: false', async () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		let onResolveCb;
		const mockBuild = {
			onResolve: ( _filter, cb ) => {
				onResolveCb = cb;
			},
			onLoad: () => {},
		};

		plugin.setup( mockBuild );

		const srcIndexJs = path.join( tmpDir, 'src', 'index.js' );
		const result = await onResolveCb( {
			path: './false-experimental-block',
			importer: srcIndexJs,
		} );

		expect( result ).toBeNull();
	} );

	it( 'does not stub imports from files other than index.js', async () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		let onResolveCb;
		const mockBuild = {
			onResolve: ( _filter, cb ) => {
				onResolveCb = cb;
			},
			onLoad: () => {},
		};

		plugin.setup( mockBuild );

		const result = await onResolveCb( {
			path: './experimental-block',
			importer: path.join( tmpDir, 'src', 'other-file.js' ),
		} );

		expect( result ).toBeNull();
	} );

	it( 'returns empty module content for stubbed blocks', () => {
		const plugin = createExperimentalBlocksPlugin( {
			packageDir: tmpDir,
			isGutenbergPlugin: false,
		} );

		let onLoadCb;
		const mockBuild = {
			onResolve: () => {},
			onLoad: ( _filter, cb ) => {
				onLoadCb = cb;
			},
		};

		plugin.setup( mockBuild );

		const result = onLoadCb( { path: './experimental-block' } );

		expect( result ).toEqual( {
			contents: '',
			loader: 'js',
		} );
	} );
} );
