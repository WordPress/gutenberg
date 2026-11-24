import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { store as blockEditorStore } from '../index';
import { unlock } from '../../lock-unlock';
import { detachesOnEditKey } from '../private-keys';

const blockSettings = {
	apiVersion: 3,
	title: 'Item',
	category: 'text',
	attributes: { label: { type: 'string' } },
	save: () => null,
} as unknown as BlockConfiguration;

// The blocks used throughout:
//   a
//   list (x, y)   detaches on edit
//   c
function setUp() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const blocks = [
		createBlock( 'test/item' ),
		createBlock( 'test/item', {}, [
			createBlock( 'test/item' ),
			createBlock( 'test/item' ),
		] ),
		createBlock( 'test/item' ),
	];
	const [ a, list, c ] = blocks;
	const ids = {
		a: a.clientId,
		list: list.clientId,
		x: list.innerBlocks[ 0 ].clientId,
		y: list.innerBlocks[ 1 ].clientId,
		c: c.clientId,
	};
	const dispatch = unlock( registry.dispatch( blockEditorStore ) );
	const select = unlock( registry.select( blockEditorStore ) );
	dispatch.resetBlocks( blocks );
	// Containers need list settings to accept blocks.
	dispatch.updateBlockListSettings( ids.list, {
		[ detachesOnEditKey ]: true,
	} );

	// Whether the list was still there each time the store notified.
	const listSeen: boolean[] = [];
	registry.subscribe( () => {
		listSeen.push( !! select.getBlock( ids.list ) );
	}, blockEditorStore );

	return { registry, ids, dispatch, select, listSeen };
}

describe( 'blocks that detach on edit', () => {
	beforeAll( () => {
		registerBlockType( 'test/item', blockSettings );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/item' );
	} );

	let t: ReturnType< typeof setUp >;
	beforeEach( () => {
		t = setUp();
	} );

	describe( 'are replaced by their inner blocks in the same change when', () => {
		it( 'an inner block moves out', () => {
			t.dispatch.selectBlock( t.ids.y );
			t.listSeen.length = 0;

			t.dispatch.moveBlocksToPosition( [ t.ids.y ], t.ids.list, '', 0 );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.y,
				t.ids.a,
				t.ids.x,
				t.ids.c,
			] );
			expect( t.select.getBlock( t.ids.list ) ).toBeNull();
			// No notification showed the move with the list still there.
			expect( t.listSeen ).toEqual( [ false ] );
			expect( t.select.isLastBlockChangePersistent() ).toBe( true );
			// The inner blocks keep their client IDs, so selection survives.
			expect( t.select.getSelectedBlockClientId() ).toBe( t.ids.y );
			// The setting goes with the list.
			expect(
				t.select.getBlockListSettings( t.ids.list )
			).toBeUndefined();
		} );

		it( 'a block moves in', () => {
			t.dispatch.moveBlocksToPosition( [ t.ids.c ], '', t.ids.list, 1 );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.x,
				t.ids.c,
				t.ids.y,
			] );
			expect( t.listSeen ).toEqual( [ false ] );
		} );

		it( 'an inner block moves within it', () => {
			t.dispatch.moveBlocksUp( [ t.ids.y ], t.ids.list );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.y,
				t.ids.x,
				t.ids.c,
			] );
			expect( t.listSeen ).toEqual( [ false ] );
		} );

		it( 'an attribute of an inner block changes', () => {
			t.dispatch.updateBlockAttributes( t.ids.x, { label: 'X' } );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.x,
				t.ids.y,
				t.ids.c,
			] );
			expect( t.select.getBlockAttributes( t.ids.x ) ).toEqual( {
				label: 'X',
			} );
			expect( t.listSeen ).toEqual( [ false ] );
		} );

		it( 'a block is inserted among the inner blocks', () => {
			const block = createBlock( 'test/item' );

			t.dispatch.insertBlock( block, 1, t.ids.list );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.x,
				block.clientId,
				t.ids.y,
				t.ids.c,
			] );
			expect( t.listSeen ).toEqual( [ false ] );
		} );

		it( 'an inner block is removed', () => {
			t.dispatch.removeBlock( t.ids.x, false );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.y,
				t.ids.c,
			] );
			expect( t.listSeen ).toEqual( [ false ] );
		} );
	} );

	describe( 'stay when', () => {
		it( 'an inner block changes without a persistent change', () => {
			t.dispatch.__unstableMarkNextChangeAsNotPersistent();
			t.dispatch.updateBlockAttributes( t.ids.x, { label: 'X' } );

			expect( t.select.getBlockOrder( t.ids.list ) ).toEqual( [
				t.ids.x,
				t.ids.y,
			] );
			expect( t.select.getBlockAttributes( t.ids.x ) ).toEqual( {
				label: 'X',
			} );
		} );

		it( 'their inner blocks are reset outside the undo history', () => {
			const block = createBlock( 'test/item' );

			t.dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			t.dispatch.replaceInnerBlocks( t.ids.list, [ block ] );

			expect( t.select.getBlockOrder( t.ids.list ) ).toEqual( [
				block.clientId,
			] );
		} );

		it( 'an inner block controller lets go of their inner blocks', () => {
			// As `useBlockSync` does when it unmounts.
			const unsetControlled = () => {
				t.dispatch.__unstableMarkNextChangeAsNotPersistent( {
					history: 'ignore',
				} );
				t.dispatch.setHasControlledInnerBlocks( t.ids.list, false );
			};
			t.dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			t.dispatch.setHasControlledInnerBlocks( t.ids.list, true );
			t.dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			t.dispatch.replaceInnerBlocks( t.ids.list, [
				createBlock( 'test/item' ),
			] );

			unsetControlled();

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.list,
				t.ids.c,
			] );
		} );

		it( 'their own attributes change', () => {
			t.dispatch.updateBlockAttributes( t.ids.list, { label: 'List' } );

			expect( t.select.getBlockOrder( t.ids.list ) ).toEqual( [
				t.ids.x,
				t.ids.y,
			] );
		} );

		it( 'they move whole', () => {
			t.dispatch.moveBlocksDown( [ t.ids.list ], '' );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.c,
				t.ids.list,
			] );
			expect( t.select.getBlockOrder( t.ids.list ) ).toEqual( [
				t.ids.x,
				t.ids.y,
			] );
		} );

		it( 'they are removed whole', () => {
			t.dispatch.removeBlock( t.ids.list, false );

			expect( t.select.getBlockOrder( '' ) ).toEqual( [
				t.ids.a,
				t.ids.c,
			] );
			expect( t.select.getBlock( t.ids.x ) ).toBeNull();
			expect( t.select.getLastDetachedBlocks() ).toEqual( [] );
		} );

		it( 'they no longer detach on edit', () => {
			t.dispatch.updateBlockListSettings( t.ids.list, {} );

			t.dispatch.updateBlockAttributes( t.ids.x, { label: 'X' } );

			expect( t.select.getBlockOrder( t.ids.list ) ).toEqual( [
				t.ids.x,
				t.ids.y,
			] );
		} );
	} );

	it( 'keeps typing after the detaching keystroke in the same undo step', () => {
		t.dispatch.updateBlockAttributes( t.ids.x, { label: 'a' } );
		expect( t.select.getBlock( t.ids.list ) ).toBeNull();
		expect( t.select.isLastBlockChangePersistent() ).toBe( true );

		// The next keystroke updates the same attribute, as without the
		// detach, so it doesn't start a new undo step.
		t.dispatch.updateBlockAttributes( t.ids.x, { label: 'ab' } );
		expect( t.select.isLastBlockChangePersistent() ).toBe( false );
	} );

	describe( 'move a selection on them as removing them would, to', () => {
		// Removing their first inner block selects them, since it has no
		// block before it.
		it( 'the block before them', () => {
			t.dispatch.selectBlock( t.ids.x );
			t.dispatch.removeBlocks( [ t.ids.x ] );

			expect( t.select.getBlock( t.ids.list ) ).toBeNull();
			expect( t.select.getSelectedBlockClientId() ).toBe( t.ids.a );
		} );

		it( 'their parent, when no block is before them', () => {
			const menu = createBlock( 'test/item', {}, [
				createBlock( 'test/item', {}, [
					createBlock( 'test/item' ),
					createBlock( 'test/item' ),
				] ),
			] );
			const [ list ] = menu.innerBlocks;
			t.dispatch.resetBlocks( [ menu ] );
			t.dispatch.updateBlockListSettings( list.clientId, {
				[ detachesOnEditKey ]: true,
			} );

			t.dispatch.selectBlock( list.innerBlocks[ 0 ].clientId );
			t.dispatch.removeBlocks( [ list.innerBlocks[ 0 ].clientId ] );

			expect( t.select.getBlock( list.clientId ) ).toBeNull();
			expect( t.select.getSelectedBlockClientId() ).toBe( menu.clientId );
		} );
	} );

	it( 'leave a multi-selection that starts on them off the block before them', () => {
		t.dispatch.multiSelect( t.ids.list, t.ids.c );
		t.dispatch.moveBlocksToPosition( [ t.ids.y ], t.ids.list, '', 0 );

		expect( t.select.getBlock( t.ids.list ) ).toBeNull();
		expect( t.select.getSelectionStart().clientId ).not.toBe( t.ids.a );
	} );

	it( 'reports the blocks the last change detached, until the next change', () => {
		t.dispatch.updateBlockAttributes( t.ids.x, { label: 'X' } );

		expect( t.select.getLastDetachedBlocks() ).toEqual( [
			{ clientId: t.ids.list, name: 'test/item', rootClientId: '' },
		] );

		t.dispatch.updateBlockAttributes( t.ids.a, { label: 'A' } );

		expect( t.select.getLastDetachedBlocks() ).toEqual( [] );
	} );

	it( 'detaches controlled inner blocks into a controlled parent', () => {
		// Set up like two nested inner block controllers (`useBlockSync`):
		//   menu (home, list (x, y))
		const { registry } = t;
		const dispatch = unlock( registry.dispatch( blockEditorStore ) );
		const select = unlock( registry.select( blockEditorStore ) );
		const menu = createBlock( 'test/item' );
		const home = createBlock( 'test/item' );
		const list = createBlock( 'test/item' );
		const x = createBlock( 'test/item' );
		const y = createBlock( 'test/item' );
		const control = ( clientId: string, innerBlocks: ( typeof x )[] ) => {
			dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			dispatch.setHasControlledInnerBlocks( clientId, true );
			dispatch.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
			dispatch.replaceInnerBlocks( clientId, innerBlocks );
		};
		dispatch.resetBlocks( [ menu ] );
		control( menu.clientId, [ home, list ] );
		control( list.clientId, [ x, y ] );
		dispatch.updateBlockListSettings( menu.clientId, {} );
		dispatch.updateBlockListSettings( list.clientId, {
			[ detachesOnEditKey ]: true,
		} );

		dispatch.moveBlocksToPosition(
			[ y.clientId ],
			list.clientId,
			menu.clientId,
			0
		);

		expect( select.getBlockOrder( menu.clientId ) ).toEqual( [
			y.clientId,
			home.clientId,
			x.clientId,
		] );
		expect( select.getBlock( list.clientId ) ).toBeNull();
		expect( select.getLastDetachedBlocks() ).toEqual( [
			{
				clientId: list.clientId,
				name: 'test/item',
				rootClientId: menu.clientId,
			},
		] );
	} );
} );
