import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { indentListItems, outdentListItems } from '../utils';

describe( 'list indentation selection', () => {
	let registry: ReturnType< typeof createRegistry >;
	beforeAll( () => {
		for ( const name of [ 'core/list', 'core/list-item' ] ) {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				attributes: {},
				save: () => null,
			} );
		}
	} );
	afterAll( () => {
		unregisterBlockType( 'core/list' );
		unregisterBlockType( 'core/list-item' );
	} );
	beforeEach( () => {
		registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry
			.dispatch( blocksStore )
			.addBlockTypes(
				[ 'core/list', 'core/list-item' ].map( ( name ) =>
					getBlockType( name )!
				)
			);
	} );

	it.each( [ indentListItems, outdentListItems ] )(
		'preserves list contents for unsupported selections with %s',
		( move ) => {
			const items = Array.from( { length: 4 }, () =>
				createBlock( 'core/list-item' )
			);
			const otherItem = createBlock( 'core/list-item' );
			const firstList = createBlock( 'core/list', {}, items );
			const otherList = createBlock( 'core/list', {}, [ otherItem ] );
			const parents = [ firstList, otherList ].map( ( list ) =>
				createBlock( 'core/list-item', {}, [ list ] )
			);
			const list = createBlock( 'core/list', {}, parents );
			const actions = registry.dispatch( blockEditorStore );
			actions.resetBlocks( [ list ] );
			for ( const block of [
				list,
				...parents,
				firstList,
				otherList,
				...items,
				otherItem,
			] ) {
				actions.updateBlockListSettings( block.clientId, {} );
			}
			for ( const selectedIds of [
				[ items[ 2 ].clientId, otherItem.clientId ],
				[ items[ 1 ].clientId, items[ 3 ].clientId ],
			] ) {
				actions.multiSelectSet( selectedIds );
				const before = registry.select( blockEditorStore ).getBlocks();
				expect( move( registry ) ).toBe( false );
				expect(
					registry.select( blockEditorStore ).getBlocks()
				).toEqual( before );
				expect(
					registry
						.select( blockEditorStore )
						.getSelectedBlockClientIds()
				).toEqual( selectedIds );
			}
		}
	);

	it( 'outdents contiguous items without losing content', () => {
		const items = Array.from( { length: 4 }, () =>
			createBlock( 'core/list-item' )
		);
		const nested = createBlock( 'core/list', {}, items );
		const parent = createBlock( 'core/list-item', {}, [ nested ] );
		const list = createBlock( 'core/list', {}, [ parent ] );
		const actions = registry.dispatch( blockEditorStore );
		actions.resetBlocks( [ list ] );
		for ( const block of [ list, parent, nested, ...items ] ) {
			actions.updateBlockListSettings( block.clientId, {} );
		}
		actions.multiSelect( items[ 1 ].clientId, items[ 3 ].clientId );
		expect( outdentListItems( registry ) ).toBe( true );
		expect(
			registry.select( blockEditorStore ).getBlockOrder( list.clientId )
		).toEqual( [
			parent.clientId,
			...items.slice( 1 ).map( ( item ) => item.clientId ),
		] );
		expect(
			registry.select( blockEditorStore ).getBlockOrder( nested.clientId )
		).toEqual( [ items[ 0 ].clientId ] );
	} );
} );
