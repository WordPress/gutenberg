/**
 * Internal dependencies
 */
import findFootnotesBlock from '../find-footnotes-block';

describe( 'findFootnotesBlock', () => {
	it( 'should return null when no footnotes block exists', () => {
		const blocks = [
			{ name: 'core/paragraph', attributes: {} },
			{ name: 'core/heading', attributes: {} },
		];

		expect( findFootnotesBlock( blocks ) ).toBeNull();
	} );

	it( 'should find footnotes block at root level', () => {
		const footnotesBlock = {
			name: 'core/footnotes',
			attributes: { footnotes: [] },
		};
		const blocks = [
			{ name: 'core/paragraph', attributes: {} },
			footnotesBlock,
		];

		expect( findFootnotesBlock( blocks ) ).toBe( footnotesBlock );
	} );

	it( 'should find footnotes block in inner blocks', () => {
		const footnotesBlock = {
			name: 'core/footnotes',
			attributes: { footnotes: [] },
		};
		const blocks = [
			{
				name: 'core/group',
				attributes: {},
				innerBlocks: [
					{ name: 'core/paragraph', attributes: {} },
					footnotesBlock,
				],
			},
		];

		expect( findFootnotesBlock( blocks ) ).toBe( footnotesBlock );
	} );

	it( 'should find first footnotes block when multiple exist', () => {
		const firstFootnotesBlock = {
			name: 'core/footnotes',
			attributes: { footnotes: [] },
		};
		const secondFootnotesBlock = {
			name: 'core/footnotes',
			attributes: { footnotes: [] },
		};
		const blocks = [ firstFootnotesBlock, secondFootnotesBlock ];

		expect( findFootnotesBlock( blocks ) ).toBe( firstFootnotesBlock );
	} );
} );
