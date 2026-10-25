import { afterEach, describe, expect, it, vi } from 'vitest';
import { infoVerbatim } from '../core.ts';

describe( 'infoVerbatim', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'stops workflow commands around the message and resumes them', () => {
		const write = vi
			.spyOn( process.stdout, 'write' )
			.mockImplementation( () => true );

		infoVerbatim( '::add-mask::secret\n::warning::spoofed' );

		const lines = write.mock.calls.map( ( [ chunk ] ) => String( chunk ) );
		const token = lines[ 0 ].match( /^::stop-commands::(.+)\n$/ )?.[ 1 ];

		expect( token ).toBeTruthy();
		expect( lines[ 1 ] ).toBe( '::add-mask::secret\n::warning::spoofed\n' );
		expect( lines[ 2 ] ).toBe( `::${ token }::\n` );
	} );

	it( 'uses a fresh token each time', () => {
		const write = vi
			.spyOn( process.stdout, 'write' )
			.mockImplementation( () => true );

		infoVerbatim( 'one' );
		infoVerbatim( 'two' );

		const starts = write.mock.calls
			.map( ( [ chunk ] ) => String( chunk ) )
			.filter( ( line ) => line.startsWith( '::stop-commands::' ) );

		expect( new Set( starts ).size ).toBe( 2 );
	} );
} );
