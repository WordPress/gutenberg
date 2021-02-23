/**
 * Internal dependencies
 */
import { getInlineStyles, omitNonSerializableKeys } from '../style';

describe( 'getInlineStyles', () => {
	it( 'should return an empty object when called with undefined', () => {
		expect( getInlineStyles() ).toEqual( {} );
	} );

	it( 'should ignore unknown styles', () => {
		expect( getInlineStyles( { color: 'red' } ) ).toEqual( {} );
	} );

	it( 'should return the correct inline styles', () => {
		expect(
			getInlineStyles( {
				color: { text: 'red', background: 'black' },
				typography: { lineHeight: 1.5, fontSize: 10 },
				border: { radius: 10 },
			} )
		).toEqual( {
			backgroundColor: 'black',
			borderRadius: 10,
			color: 'red',
			lineHeight: 1.5,
			fontSize: 10,
		} );
	} );
} );

describe( 'omitNonSerializableKeys', () => {
	it( 'should return the same style if no keys are skipped from serialization', () => {
		const style = {
			color: { text: 'red' },
			lineHeigh: 2,
		};
		expect( omitNonSerializableKeys( style, {} ) ).toEqual( {
			color: { text: 'red' },
			lineHeigh: 2,
		} );
	} );

	it( 'should omit the color key if it is skipped for serialization', () => {
		const style = {
			color: { text: 'red' },
			lineHeigh: 2,
		};
		const blockSupports = {
			color: {
				__experimentalSkipSerialization: true,
			},
		};
		expect( omitNonSerializableKeys( style, blockSupports ) ).toEqual( {
			lineHeigh: 2,
		} );
	} );
} );
