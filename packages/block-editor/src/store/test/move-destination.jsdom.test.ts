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
import { isMoveTransparentKey } from '../private-keys';

const blockSettings = {
	apiVersion: 3,
	title: 'Item',
	category: 'text',
	save: () => null,
} as unknown as BlockConfiguration;

// The menu used throughout:
//   a
//   list (x, y)   transparent in some tests
//   group (z)     expanded in some tests
//   empty         a container with no children
//   c
function setUp() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	const blocks = [
		createBlock( 'test/item', {}, [] ),
		createBlock( 'test/item', {}, [
			createBlock( 'test/item' ),
			createBlock( 'test/item' ),
		] ),
		createBlock( 'test/item', {}, [ createBlock( 'test/item' ) ] ),
		createBlock( 'test/item' ),
		createBlock( 'test/item' ),
	];
	const [ a, list, group, empty, c ] = blocks;
	const ids = {
		a: a.clientId,
		list: list.clientId,
		x: list.innerBlocks[ 0 ].clientId,
		y: list.innerBlocks[ 1 ].clientId,
		group: group.clientId,
		z: group.innerBlocks[ 0 ].clientId,
		empty: empty.clientId,
		c: c.clientId,
	};
	const dispatch = unlock( registry.dispatch( blockEditorStore ) );
	dispatch.resetBlocks( blocks );
	// Containers need list settings to accept blocks.
	for ( const clientId of [ ids.list, ids.group, ids.empty ] ) {
		dispatch.updateBlockListSettings( clientId, {} );
	}
	const select = unlock( registry.select( blockEditorStore ) );
	const destination = (
		clientId: string,
		direction: 'up' | 'down',
		options?: object
	) => select.getBlockMoveDestination( [ clientId ], direction, options );
	return { ids, dispatch, select, destination };
}

describe( 'getBlockMoveDestination', () => {
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

	it( 'moves past the next sibling', () => {
		expect( t.destination( t.ids.a, 'down' ) ).toEqual( {
			rootClientId: '',
			index: 1,
		} );
		expect( t.destination( t.ids.c, 'up' ) ).toEqual( {
			rootClientId: '',
			index: 3,
		} );
	} );

	it( 'returns null at the edge of an ordinary parent', () => {
		expect( t.destination( t.ids.a, 'up' ) ).toBeNull();
		expect( t.destination( t.ids.x, 'up' ) ).toBeNull();
		expect( t.destination( t.ids.y, 'down' ) ).toBeNull();
	} );

	it( 'passes the children of a transparent block one at a time', () => {
		t.dispatch.updateBlockListSettings( t.ids.list, {
			[ isMoveTransparentKey ]: true,
		} );

		// Past x, into the list.
		expect( t.destination( t.ids.a, 'down' ) ).toEqual( {
			rootClientId: t.ids.list,
			index: 1,
		} );
		// From below the list, past y.
		expect( t.destination( t.ids.group, 'up' ) ).toEqual( {
			rootClientId: t.ids.list,
			index: 1,
		} );
	} );

	it( 'steps an edge child out of a transparent block, past the block beyond', () => {
		t.dispatch.updateBlockListSettings( t.ids.list, {
			[ isMoveTransparentKey ]: true,
		} );

		// Before a.
		expect( t.destination( t.ids.x, 'up' ) ).toEqual( {
			rootClientId: '',
			index: 0,
		} );
		// After the group (index 2 in the root).
		expect( t.destination( t.ids.y, 'down' ) ).toEqual( {
			rootClientId: '',
			index: 3,
		} );
	} );

	it( 'keeps an edge child in a transparent block with nothing beyond it', () => {
		t.dispatch.updateBlockListSettings( t.ids.list, {
			[ isMoveTransparentKey ]: true,
		} );
		// Make the list the last block, so nothing is beyond it.
		t.dispatch.moveBlocksToPosition( [ t.ids.list ], '', '', 4 );

		expect( t.destination( t.ids.y, 'down' ) ).toBeNull();
	} );

	it( 'passes a transparent block whole when it is shown collapsed', () => {
		t.dispatch.updateBlockListSettings( t.ids.list, {
			[ isMoveTransparentKey ]: true,
		} );

		expect(
			t.destination( t.ids.a, 'down', { isExpanded: () => false } )
		).toEqual( { rootClientId: '', index: 1 } );
	} );

	it( 'returns null for a block that cannot move', () => {
		t.dispatch.updateBlockAttributes( t.ids.a, {
			lock: { move: true },
		} );

		expect( t.destination( t.ids.a, 'down' ) ).toBeNull();
	} );

	it( 'keeps a block that cannot be removed in its parent', () => {
		t.dispatch.updateBlockListSettings( t.ids.list, {
			[ isMoveTransparentKey ]: true,
		} );
		t.dispatch.updateBlockAttributes( t.ids.a, {
			lock: { remove: true },
		} );

		expect( t.destination( t.ids.a, 'down' ) ).toEqual( {
			rootClientId: '',
			index: 1,
		} );
	} );

	it( 'enters an expanded container with children, but not an empty one', () => {
		const isExpanded = () => true;

		expect( t.destination( t.ids.list, 'down', { isExpanded } ) ).toEqual( {
			rootClientId: t.ids.group,
			index: 0,
		} );
		expect( t.destination( t.ids.c, 'up', { isExpanded } ) ).toEqual( {
			rootClientId: '',
			index: 3,
		} );
	} );

	it( 'steps out of any parent the options allow', () => {
		const canStepOut = ( clientId: string ) => clientId !== '';

		expect( t.destination( t.ids.z, 'up', { canStepOut } ) ).toEqual( {
			rootClientId: '',
			index: 2,
		} );
		expect( t.destination( t.ids.z, 'down', { canStepOut } ) ).toEqual( {
			rootClientId: '',
			index: 3,
		} );
	} );
} );

describe( 'moveBlocksDown', () => {
	beforeAll( () => {
		registerBlockType( 'test/item', blockSettings );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/item' );
	} );

	it( 'moves into a transparent block past its first child', () => {
		const { ids, dispatch, select } = setUp();
		dispatch.updateBlockListSettings( ids.list, {
			[ isMoveTransparentKey ]: true,
		} );

		dispatch.moveBlocksDown( [ ids.a ], '' );

		expect( select.getBlockOrder( ids.list ) ).toEqual( [
			ids.x,
			ids.a,
			ids.y,
		] );
	} );

	it( 'still swaps ordinary siblings', () => {
		const { ids, dispatch, select } = setUp();

		dispatch.moveBlocksDown( [ ids.a ], '' );

		expect( select.getBlockOrder( '' ) ).toEqual( [
			ids.list,
			ids.a,
			ids.group,
			ids.empty,
			ids.c,
		] );
	} );
} );
