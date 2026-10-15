import { describe, expect, it } from 'vitest';
import { nonBreakingSpace } from '..';

describe( 'nonBreakingSpace', () => {
	it( 'marks non-breaking spaces only while the preference is enabled', () => {
		const text = 'a\u00a0b\u00a0c';
		const formats = new Array( text.length );
		const prepare = ( isEnabled ) =>
			nonBreakingSpace.__experimentalCreatePrepareEditableTree( {
				isEnabled,
			} )( formats, text );

		expect( prepare( false ) ).toBe( formats );
		expect(
			prepare( true ).map( ( format ) => format?.[ 0 ].type )
		).toEqual( [
			undefined,
			'core/non-breaking-space',
			undefined,
			'core/non-breaking-space',
			undefined,
		] );
	} );

	it( 'defaults to enabled when the preference is unset', () => {
		const isEnabled = ( value ) =>
			nonBreakingSpace.__experimentalGetPropsForEditableTreePreparation(
				() => ( { get: () => value } )
			).isEnabled;

		expect( isEnabled( undefined ) ).toBe( true );
		expect( isEnabled( false ) ).toBe( false );
	} );
} );
