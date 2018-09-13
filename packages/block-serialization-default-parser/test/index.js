/**
 * Internal dependencies
 */
import { parse } from '../';

describe( 'block-serialization-spec-parser', () => {
	test( 'parse() accepts inputs with multiple Reusable blocks', () => {
		const result = parse(
			'<!-- wp:block {"ref":313} /--><!-- wp:block {"ref":482} /-->'
		);

		expect( result ).toEqual( [
			{
				blockName: 'core/block',
				attrs: { ref: 313 },
				innerBlocks: [],
				innerHTML: '',
			},
			{
				blockName: 'core/block',
				attrs: { ref: 482 },
				innerBlocks: [],
				innerHTML: '',
			},
		] );
	} );
} );
