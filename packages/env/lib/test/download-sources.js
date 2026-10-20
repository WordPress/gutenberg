import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const require = createRequire( import.meta.url );
const got = require( 'got' );
const AdmZip = require( 'adm-zip' );
const { downloadZipSource } = require( '../download-sources' );

describe( 'downloadZipSource', () => {
	let tmpDir;
	let source;

	const read = ( file ) =>
		fs.readFileSync( path.join( source.path, file ), 'utf8' );
	const exists = ( file ) => fs.existsSync( path.join( source.path, file ) );

	beforeEach( () => {
		tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), 'wp-env-zip-' ) );
		source = {
			type: 'zip',
			url: 'https://wordpress.org/nightly-builds/wordpress-latest.zip',
			path: path.join( tmpDir, 'wordpress-latest' ),
			basename: 'wordpress-latest',
		};

		const zip = new AdmZip();
		zip.addFile( 'wordpress/index.php', Buffer.from( 'new index' ) );
		vi.spyOn( got, 'stream' ).mockImplementation( () =>
			Readable.from( [ zip.toBuffer() ] )
		);

		// A previous download that WordPress has since been configured in.
		fs.mkdirSync( source.path );
		fs.writeFileSync( path.join( source.path, 'index.php' ), 'old index' );
		fs.writeFileSync( path.join( source.path, 'stale.php' ), 'stale' );
		fs.writeFileSync( path.join( source.path, 'wp-config.php' ), 'config' );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );

	it( 'replaces a previous download with the archive contents', async () => {
		await downloadZipSource( source, { onProgress: () => {} } );

		expect( read( 'index.php' ) ).toBe( 'new index' );
		expect( exists( 'stale.php' ) ).toBe( false );
		expect( exists( 'wp-config.php' ) ).toBe( false );
	} );

	it( 'carries the files it is asked to preserve into the new download', async () => {
		await downloadZipSource( source, {
			onProgress: () => {},
			preserve: [ 'wp-config.php' ],
		} );

		expect( read( 'index.php' ) ).toBe( 'new index' );
		expect( exists( 'stale.php' ) ).toBe( false );
		expect( read( 'wp-config.php' ) ).toBe( 'config' );
	} );

	it( 'skips a preserved file the previous download does not have', async () => {
		fs.rmSync( path.join( source.path, 'wp-config.php' ) );

		await downloadZipSource( source, {
			onProgress: () => {},
			preserve: [ 'wp-config.php' ],
		} );

		expect( read( 'index.php' ) ).toBe( 'new index' );
		expect( exists( 'wp-config.php' ) ).toBe( false );
	} );
} );
