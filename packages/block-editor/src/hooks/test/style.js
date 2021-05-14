/**
 * Internal dependencies
 */
import { getInlineStyles, omitKeysNotToSerialize } from '../style';

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
				border: {
					radius: 10,
					width: 3,
					style: 'dotted',
					color: '#21759b',
				},
				spacing: {
					padding: { top: '10px' },
					margin: { bottom: '15px' },
				},
			} )
		).toEqual( {
			backgroundColor: 'black',
			borderColor: '#21759b',
			borderRadius: 10,
			borderStyle: 'dotted',
			borderWidth: 3,
			color: 'red',
			lineHeight: 1.5,
			fontSize: 10,
			marginBottom: '15px',
			paddingTop: '10px',
		} );
	} );
} );

describe( 'omitKeysNotToSerialize', () => {
	it( 'should return the same style if no keys are skipped from serialization', () => {
		const style = {
			color: { text: 'red' },
			lineHeight: 2,
		};
		expect( omitKeysNotToSerialize( style, {} ) ).toEqual( {
			color: { text: 'red' },
			lineHeight: 2,
		} );
	} );

	it( 'should omit the color key if it is skipped for serialization', () => {
		const style = {
			color: { text: 'red' },
			lineHeight: 2,
		};
		const blockSupports = {
			color: {
				__experimentalSkipSerialization: true,
			},
		};
		expect( omitKeysNotToSerialize( style, blockSupports ) ).toEqual( {
			lineHeight: 2,
		} );
	} );
} );
