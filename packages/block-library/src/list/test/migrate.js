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
			values: '<li>test</li><li>test</li><li>test<ol><li>test test</li><li>test est eesssss</li></ol></li>',
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

	it( 'should handle empty space properly', () => {
		const [ updatedAttributes, updatedInnerBlocks ] = migrateToListV2( {
			values: `<li>Europe</li>
                <li>
                    \tAfrica
                    <ol>
                        <li>Algeria</li>
                    </ol>
                    \t
                </li>`,
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
<li>Europe</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Africa<!-- wp:list {\"ordered\":true} -->
<ol><!-- wp:list-item -->
<li>Algeria</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item -->` );
	} );

	it( 'should handle formats properly', () => {
		const [ updatedAttributes, updatedInnerBlocks ] = migrateToListV2( {
			values: `<li>Europe<ul><li>France<ul><li>Lyon <strong>Rhone</strong>s</li><li>Paris <em>Ile de france</em><ul><li><em>1er</em></li></ul></li></ul></li></ul></li></ul></li>`,
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
<li>Europe<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>France<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Lyon <strong>Rhone</strong>s</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Paris <em>Ile de france</em><!-- wp:list -->
<ul><!-- wp:list-item -->
<li><em>1er</em></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->` );
	} );

	it( 'should not add random space', () => {
		const [ updatedAttributes, updatedInnerBlocks ] = migrateToListV2( {
			values: `<li>Europe<ul><li>F<strong>ranc</strong>e<ul><li>Paris</li></ul></li></ul></li>`,
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
<li>Europe<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>F<strong>ranc</strong>e<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>Paris</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->` );
	} );
} );
