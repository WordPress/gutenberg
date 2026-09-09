import { describe, expect, it } from 'vitest';
import variations from '../variations';

describe( 'video variations', () => {
	it( 'registers exactly one variation', () => {
		expect( variations ).toHaveLength( 1 );
		expect( variations[ 0 ].name ).toBe( 'video' );
	} );

	it( 'video variation is always active', () => {
		expect( variations[ 0 ].isActive( {} ) ).toBe( true );
		expect( variations[ 0 ].isActive( { controls: true } ) ).toBe( true );
		expect( variations[ 0 ].isActive( { controls: false } ) ).toBe( true );
	} );

	it( 'video variation is not in the inserter scope', () => {
		expect( variations[ 0 ].scope ).not.toContain( 'inserter' );
	} );
} );
