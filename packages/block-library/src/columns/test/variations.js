/**
 * WordPress dependencies
 */
import {
	createBlock,
	registerBlockType,
	serialize,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	metadata as columnsMetadata,
	name as columnsName,
	settings as columnsSettings,
} from '../index';
import {
	metadata as columnMetadata,
	name as columnName,
	settings as columnSettings,
} from '../../column';

describe( 'Columns variations', () => {
	beforeAll( () => {
		registerBlockType( columnsMetadata, columnsSettings );
		registerBlockType( columnMetadata, columnSettings );
	} );

	afterAll( () => {
		unregisterBlockType( columnsName );
		unregisterBlockType( columnName );
	} );

	it( 'provides transform variations for columns and grid layouts', () => {
		const variations = select( blocksStore ).getBlockVariations(
			columnsName,
			'transform'
		);

		expect( variations ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					name: 'columns',
					attributes: {
						layout: { type: 'flex', flexWrap: 'nowrap' },
					},
				} ),
				expect.objectContaining( {
					name: 'columns-grid',
					attributes: { layout: { type: 'grid' } },
				} ),
			] )
		);
	} );

	it( 'detects the active transform variation from the layout type', () => {
		expect(
			select( blocksStore ).getActiveBlockVariation(
				columnsName,
				{},
				'transform'
			)?.name
		).toBe( 'columns' );

		expect(
			select( blocksStore ).getActiveBlockVariation(
				columnsName,
				{ layout: { type: 'grid' } },
				'transform'
			)?.name
		).toBe( 'columns-grid' );
	} );

	it( 'allows grid layout controls without enabling layout type switching', () => {
		const blockType = select( blocksStore ).getBlockType( columnsName );

		expect( blockType.supports.layout ).toEqual(
			expect.objectContaining( {
				allowSwitching: false,
				allowInheriting: false,
				allowOrientation: false,
				allowJustification: false,
				allowVerticalAlignment: false,
				allowWrap: false,
			} )
		);
		expect( blockType.supports.layout.allowEditing ).not.toBe( false );
		expect(
			blockType.supports.layout.allowSizingOnChildren
		).toBeUndefined();
	} );

	it( 'does not serialize mobile stacking classes for grid layout', () => {
		const serialized = serialize(
			createBlock(
				columnsName,
				{
					isStackedOnMobile: false,
					layout: { type: 'grid' },
				},
				[ createBlock( columnName ) ]
			)
		);

		expect( serialized ).toContain( '"layout":{"type":"grid"}' );
		expect( serialized ).not.toContain( 'is-not-stacked-on-mobile' );
	} );
} );
