/**
 * WordPress dependencies
 */
import { registerBlockType, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { migrateToListV2 } from '../v2/migrate';
import * as listItem from '../../list-item';
import * as list from '../../list';
import listV2 from '../../list/v2';

describe( 'Migrate list block', () => {
	beforeAll( () => {
		const prev = window.__experimentalEnableListBlockV2;

		// force list and list item block registration.
		registerBlockType(
			{ name: listItem.name, ...listItem.metadata },
			listItem.settings
		);
		registerBlockType( { name: list.name, ...list.metadata }, listV2 );

		window.__experimentalEnableListBlockV2 = prev;
	} );

	it( 'should migrate the values attribute to inner blocks', () => {
		const [ updatedAttributes, updatedInnerBlocks ] = migrateToListV2( {
			values:
				'<li>test</li><li>test</li><li>test<ol><li>test test</li><li>test est eesssss</li></ol></li>',
			ordered: false,
		} );

		expect( updatedAttributes ).toEqual( {
			ordered: false,
			// Ideally the values attributes shouldn't be here
			// but since we didn't enable v2 by default yet,
			// we're keeping the old default value in block.json
			values: '',
		} );
		expect( serialize( updatedInnerBlocks ) )
			.toEqual( `<!-- wp:list-item -->
<li>test</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>test</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>test<!-- wp:list {\"ordered\":true} -->
<ol><!-- wp:list-item -->
<li>test test</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>test est eesssss</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item -->` );
	} );
} );
