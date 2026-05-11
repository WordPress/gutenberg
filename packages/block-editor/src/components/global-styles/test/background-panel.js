/**
 * Internal dependencies
 */

import {
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
} from '../background-panel';

describe( 'hasBackgroundImageValue', () => {
	it( 'should return `true` when id and url exist', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { id: 1, url: 'url' } },
			} )
		).toBe( true );
	} );

	it( 'should return `true` when only url exists', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { url: 'url' } },
			} )
		).toBe( true );
	} );

	it( 'should return `true` when only id exists', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: { id: 1 } },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when id and url do not exist', () => {
		expect(
			hasBackgroundImageValue( {
				background: { backgroundImage: {} },
			} )
		).toBe( false );
	} );
} );

describe( 'hasBackgroundGradientValue', () => {
	it( 'should return `true` when a gradient string is set', () => {
		expect(
			hasBackgroundGradientValue( {
				background: {
					gradient: 'linear-gradient(135deg, red 0%, blue 100%)',
				},
			} )
		).toBe( true );
	} );

	it( 'should return `true` for a preset slug reference', () => {
		expect(
			hasBackgroundGradientValue( {
				background: { gradient: 'var:preset|gradient|vivid-cyan-blue' },
			} )
		).toBe( true );
	} );

	it( 'should return `false` when gradient is undefined', () => {
		expect( hasBackgroundGradientValue( { background: {} } ) ).toBe(
			false
		);
	} );

	it( 'should return `false` when gradient is an empty string', () => {
		expect(
			hasBackgroundGradientValue( { background: { gradient: '' } } )
		).toBe( false );
	} );

	it( 'should return `false` when background is undefined', () => {
		expect( hasBackgroundGradientValue( {} ) ).toBe( false );
	} );

	it( 'should return `false` when style is undefined', () => {
		expect( hasBackgroundGradientValue( undefined ) ).toBe( false );
	} );
} );
