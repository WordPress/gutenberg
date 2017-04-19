/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { query, getBlocks, unregisterBlock, setUnknownTypeHandler } from 'api';
import { blockSettings } from '../';

describe( 'heading block', () => {
	afterEach( () => {
		setUnknownTypeHandler( undefined );
		getBlocks().forEach( ( block ) => {
			unregisterBlock( block.slug );
		} );
	} );

	it( 'should parse the block properly', () => {
		const rawContent = '<h4 style="text-align: right;">Chicken</h4>';
		const attrs = query.parse( rawContent, blockSettings.attributes );

		expect( attrs ).to.eql( {
			content: 'Chicken',
			tag: 'H4',
			align: 'right'
		} );
	} );
} );
