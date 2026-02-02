'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const os = require( 'os' );

/**
 * Internal dependencies
 */
const { getNgrokState } = require( '../ngrok' );

describe( 'ngrok command', () => {
	let tempDir;

	beforeEach( async () => {
		tempDir = await fs.mkdtemp( path.join( os.tmpdir(), 'wp-env-ngrok-' ) );
	} );

	afterEach( async () => {
		if ( tempDir ) {
			await fs.rm( tempDir, { recursive: true, force: true } );
		}
	} );

	describe( 'getNgrokState', () => {
		it( 'should return null when no state file exists', async () => {
			const state = await getNgrokState( tempDir );
			expect( state ).toBeNull();
		} );

		it( 'should return state when state file exists', async () => {
			const expectedState = {
				pid: 12345,
				url: 'https://abc123.ngrok.io',
				originalSiteUrl: 'http://localhost:8888',
				startedAt: '2024-01-01T00:00:00.000Z',
			};

			const statePath = path.join( tempDir, 'ngrok-state.json' );
			await fs.writeFile(
				statePath,
				JSON.stringify( expectedState, null, 2 )
			);

			const state = await getNgrokState( tempDir );
			expect( state ).toEqual( expectedState );
		} );

		it( 'should return null when state file is invalid JSON', async () => {
			const statePath = path.join( tempDir, 'ngrok-state.json' );
			await fs.writeFile( statePath, 'invalid json' );

			const state = await getNgrokState( tempDir );
			expect( state ).toBeNull();
		} );
	} );
} );
