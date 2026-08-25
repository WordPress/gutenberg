/**
 * Internal dependencies
 */
import transforms from '../transforms';

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes = {}, innerBlocks = [] ) => ( {
		name,
		attributes,
		innerBlocks,
	} ) ),
} ) );

describe( 'core/figure transforms', () => {
	describe( 'from', () => {
		it( 'should transform raw <figure> HTML into a Figure block and extract the caption', () => {
			const rawTransform = transforms.from.find(
				( t ) => t.type === 'raw' && t.selector === 'figure'
			);

			const node = document.createElement( 'figure' );
			const img = document.createElement( 'img' );
			const figcaption = document.createElement( 'figcaption' );
			figcaption.innerHTML = 'An editorial caption';
			node.appendChild( img );
			node.appendChild( figcaption );

			const result = rawTransform.transform( node );

			expect( result ).toEqual( {
				name: 'core/figure',
				attributes: { caption: 'An editorial caption' },
				innerBlocks: [],
			} );
		} );

		it( 'should gracefully handle raw <figure> HTML with no figcaption', () => {
			const rawTransform = transforms.from.find(
				( t ) => t.type === 'raw' && t.selector === 'figure'
			);

			const node = document.createElement( 'figure' );
			const img = document.createElement( 'img' );
			node.appendChild( img );

			const result = rawTransform.transform( node );

			expect( result.attributes.caption ).toBe( '' );
		} );

		it( 'should transform from core/group and preserve styling attributes', () => {
			const groupTransform = transforms.from.find(
				( t ) => t.type === 'block' && t.blocks.includes( 'core/group' )
			);

			const attributes = {
				backgroundColor: 'black',
				textColor: 'white',
				align: 'wide',
			};
			const innerBlocks = [ { name: 'core/paragraph' } ];

			const result = groupTransform.transform( attributes, innerBlocks );

			expect( result.name ).toBe( 'core/figure' );
			expect( result.attributes ).toEqual(
				expect.objectContaining( attributes )
			);
			expect( result.innerBlocks ).toEqual( innerBlocks );
		} );

		it( 'should transform from core/quote and map citation to caption', () => {
			const quoteTransform = transforms.from.find(
				( t ) => t.type === 'block' && t.blocks.includes( 'core/quote' )
			);

			const attributes = { citation: 'Famous Author' };
			const innerBlocks = [ { name: 'core/paragraph' } ];

			const result = quoteTransform.transform( attributes, innerBlocks );

			expect( result.name ).toBe( 'core/figure' );
			expect( result.attributes.caption ).toBe( 'Famous Author' );

			expect( result.innerBlocks[ 0 ].name ).toBe( 'core/quote' );
			expect( result.innerBlocks[ 0 ].attributes.citation ).toBe( '' );
		} );

		it( 'should group multiple blocks into a Figure container via multi-block transform', () => {
			const multiBlockTransform = transforms.from.find(
				( t ) => t.type === 'block' && t.isMultiBlock === true
			);

			const blocks = [
				{ name: 'core/image', attributes: { id: 1 }, innerBlocks: [] },
				{
					name: 'core/paragraph',
					attributes: { content: 'Text' },
					innerBlocks: [],
				},
			];

			expect(
				multiBlockTransform.isMatch( {}, [ { name: 'core/figure' } ] )
			).toBe( false );
			expect( multiBlockTransform.isMatch( {}, blocks ) ).toBe( true );

			const result = multiBlockTransform.__experimentalConvert( blocks );

			expect( result.name ).toBe( 'core/figure' );
			expect( result.innerBlocks.length ).toBe( 2 );
			expect( result.innerBlocks[ 0 ].name ).toBe( 'core/image' );
		} );
	} );

	describe( 'to', () => {
		it( 'should transform to core/group and preserve styling attributes', () => {
			const groupTransform = transforms.to.find(
				( t ) => t.type === 'block' && t.blocks.includes( 'core/group' )
			);

			const attributes = {
				backgroundColor: 'red',
				align: 'full',
			};
			const innerBlocks = [ { name: 'core/image' } ];

			const result = groupTransform.transform( attributes, innerBlocks );

			expect( result.name ).toBe( 'core/group' );
			expect( result.attributes.backgroundColor ).toBe( 'red' );
			expect( result.innerBlocks ).toEqual( innerBlocks );
		} );

		it( 'should transform to core/quote and map caption back to citation', () => {
			const quoteTransform = transforms.to.find(
				( t ) => t.type === 'block' && t.blocks.includes( 'core/quote' )
			);

			const attributes = { caption: 'Figure Caption' };
			const innerBlocks = [ { name: 'core/paragraph' } ];

			const result = quoteTransform.transform( attributes, innerBlocks );

			expect( result.name ).toBe( 'core/quote' );
			expect( result.attributes.citation ).toBe( 'Figure Caption' );
			expect( result.innerBlocks ).toEqual( innerBlocks );
		} );

		it( 'should cleanly unwrap an inner core/quote when transforming to core/quote', () => {
			const quoteTransform = transforms.to.find(
				( t ) => t.type === 'block' && t.blocks.includes( 'core/quote' )
			);

			const attributes = { caption: 'Outer Figure Caption' };
			const innerBlocks = [
				{
					name: 'core/quote',
					attributes: { citation: '' },
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: 'Inside' },
						},
					],
				},
			];

			const result = quoteTransform.transform( attributes, innerBlocks );

			expect( result.name ).toBe( 'core/quote' );
			expect( result.attributes.citation ).toBe( 'Outer Figure Caption' );
			expect( result.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
		} );
	} );
} );
