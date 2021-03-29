/**
 * Internal dependencies
 */
import { getInlineStyles } from '../style';

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
				spacing: {
					padding: { top: '10px' },
					margin: { bottom: '15px' },
				},
			} )
		).toEqual( {
			backgroundColor: 'black',
			borderRadius: 10,
			color: 'red',
			lineHeight: 1.5,
			fontSize: 10,
			marginBottom: '15px',
			paddingTop: '10px',
		} );
	} );
} );
