import { describe, expect, it } from 'vitest';
import { getColumnStyle } from '../utils';

describe( 'getColumnStyle', () => {
	it( 'returns lengths unchanged', () => {
		expect( getColumnStyle( '320px' ) ).toEqual( { flexBasis: '320px' } );
		expect( getColumnStyle( '20rem' ) ).toEqual( { flexBasis: '20rem' } );
	} );

	it( 'treats numbers as percentages for template compatibility', () => {
		expect( getColumnStyle( 33.33 ) ).toEqual( { flexBasis: '33.33%' } );
	} );

	it( 'rounds long percentage floats', () => {
		expect( getColumnStyle( '33.333333333333336%' ) ).toEqual( {
			flexBasis: '33.333333333333%',
		} );
	} );

	it( 'resolves preset references to custom properties', () => {
		expect( getColumnStyle( 'var:preset|dimension|wide' ) ).toEqual( {
			flexBasis: 'var(--wp--preset--dimension--wide)',
		} );
	} );

	it( 'kebab-cases preset slugs, matching the declared custom property', () => {
		expect( getColumnStyle( 'var:preset|dimension|wideColumn' ) ).toEqual( {
			flexBasis: 'var(--wp--preset--dimension--wide-column)',
		} );
	} );

	it( 'lets the fill preset take the remaining space', () => {
		expect( getColumnStyle( 'var:preset|dimension|fill' ) ).toEqual( {
			flexBasis: '0',
			flexGrow: '1',
		} );
	} );

	it( 'treats a zero length as fill, which is what "None" stores', () => {
		expect( getColumnStyle( '0' ) ).toEqual( {
			flexBasis: '0',
			flexGrow: '1',
		} );
		expect( getColumnStyle( '0%' ) ).toEqual( {
			flexBasis: '0',
			flexGrow: '1',
		} );
		expect( getColumnStyle( '0px' ) ).toEqual( {
			flexBasis: '0',
			flexGrow: '1',
		} );
	} );

	it( 'returns undefined for values without a width', () => {
		expect( getColumnStyle( undefined ) ).toBeUndefined();
		expect( getColumnStyle( '' ) ).toBeUndefined();
		expect( getColumnStyle( 0 ) ).toBeUndefined();
		expect( getColumnStyle( 'auto' ) ).toBeUndefined();
	} );
} );
