/**
 * Internal dependencies
 */
import { getCarriedGifConversionAttributes } from '../gif-conversion-attributes';

describe( 'getCarriedGifConversionAttributes', () => {
	it( 'carries align, anchor, className and margin spacing', () => {
		const result = getCarriedGifConversionAttributes( {
			align: 'wide',
			anchor: 'my-gif',
			className: 'is-style-rounded',
			style: { spacing: { margin: { top: '10px', bottom: '10px' } } },
		} );

		expect( result ).toEqual( {
			align: 'wide',
			anchor: 'my-gif',
			className: 'is-style-rounded',
			style: { spacing: { margin: { top: '10px', bottom: '10px' } } },
		} );
	} );

	it( 'omits attributes that are not set', () => {
		expect( getCarriedGifConversionAttributes( {} ) ).toEqual( {} );
		expect(
			getCarriedGifConversionAttributes( { align: 'full' } )
		).toEqual( { align: 'full' } );
	} );

	it( 'carries only margin from style, dropping unsupported styles', () => {
		const result = getCarriedGifConversionAttributes( {
			style: {
				spacing: {
					margin: { top: '5px' },
					padding: { top: '5px' },
				},
				border: { radius: '8px' },
				shadow: 'var:preset|shadow|natural',
			},
		} );

		// Only spacing.margin survives; padding/border/shadow are not carried
		// because the converted block may not support them.
		expect( result ).toEqual( {
			style: { spacing: { margin: { top: '5px' } } },
		} );
	} );

	it( 'does not carry image-only attributes such as links or sizing', () => {
		const result = getCarriedGifConversionAttributes( {
			align: 'center',
			href: 'https://example.com',
			linkDestination: 'custom',
			sizeSlug: 'large',
			scale: 'cover',
		} );

		expect( result ).toEqual( { align: 'center' } );
	} );
} );
