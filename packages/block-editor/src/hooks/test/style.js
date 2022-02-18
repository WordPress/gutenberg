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
				border: {
					radius: '10px',
					width: '1em',
					style: 'dotted',
					color: '#21759b',
				},
				dimensions: {
					height: '500px',
					width: '100%',
				},
				spacing: {
					blockGap: '1em',
					padding: { top: '10px' },
					margin: { bottom: '15px' },
				},
			} )
		).toEqual( {
			backgroundColor: 'black',
			borderColor: '#21759b',
			borderRadius: '10px',
			borderStyle: 'dotted',
			borderWidth: '1em',
			color: 'red',
			lineHeight: 1.5,
			fontSize: 10,
			height: '500px',
			marginBottom: '15px',
			paddingTop: '10px',
			width: '100%',
		} );
	} );

	it( 'should return individual border radius styles', () => {
		expect(
			getInlineStyles( {
				border: {
					radius: {
						topLeft: '10px',
						topRight: '0.5rem',
						bottomLeft: '0.5em',
						bottomRight: '1em',
					},
				},
			} )
		).toEqual( {
			borderTopLeftRadius: '10px',
			borderTopRightRadius: '0.5rem',
			borderBottomLeftRadius: '0.5em',
			borderBottomRightRadius: '1em',
		} );
	} );

	it( 'should support longhand spacing styles', () => {
		expect(
			getInlineStyles( {
				spacing: {
					margin: {
						top: '10px',
						right: '0.5rem',
						bottom: '0.5em',
						left: '1em',
					},
					padding: {
						top: '20px',
						right: '25px',
						bottom: '30px',
						left: '35px',
					},
				},
			} )
		).toEqual( {
			marginTop: '10px',
			marginRight: '0.5rem',
			marginBottom: '0.5em',
			marginLeft: '1em',
			paddingTop: '20px',
			paddingRight: '25px',
			paddingBottom: '30px',
			paddingLeft: '35px',
		} );
	} );

	it( 'should support shorthand spacing styles', () => {
		expect(
			getInlineStyles( {
				spacing: {
					blockGap: '1em',
					margin: '10px',
					padding: '20px',
				},
			} )
		).toEqual( {
			margin: '10px',
			padding: '20px',
		} );
	} );
} );
