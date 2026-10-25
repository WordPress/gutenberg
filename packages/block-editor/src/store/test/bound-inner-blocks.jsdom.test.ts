import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block, BlockConfiguration } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { store } from '../';
import { unlock } from '../../lock-unlock';

const BLOCK_TYPES = [
	'core/test-container',
	'core/test-text',
	'core/block',
	'core/test-template-part',
];

const blockSettings = {
	apiVersion: 3,
	title: 'Test',
	category: 'text',
	attributes: {
		content: { type: 'string' },
		metadata: { type: 'object' },
	},
	save: () => null,
} as unknown as BlockConfiguration;

function container( clientId: string, innerBlocks: Block[] = [] ) {
	return {
		...createBlock( 'core/test-container', {}, innerBlocks ),
		clientId,
	};
}

function text( clientId: string, content = clientId ) {
	return { ...createBlock( 'core/test-text', { content } ), clientId };
}

function clientIds( blocks: Block[] ) {
	return blocks.map( ( block ) => block.clientId );
}

const actions = () => unlock( dispatch( store ) );
const selectors = () => unlock( select( store ) );

/**
 * Binds the inner blocks of a block, and sets the bound inner blocks, the way
 * the inner blocks sync does.
 *
 * @param clientId    The block's client ID.
 * @param innerBlocks The bound inner blocks.
 * @param editable    Whether they can be edited.
 */
function bind( clientId: string, innerBlocks: Block[], editable = true ) {
	actions().setHasBoundInnerBlocks( clientId, { editable } );
	actions().replaceInnerBlocks( clientId, innerBlocks );
}

describe( 'bound inner blocks', () => {
	beforeAll( () => {
		for ( const name of BLOCK_TYPES ) {
			registerBlockType( name, blockSettings );
		}
	} );

	afterAll( () => {
		for ( const name of BLOCK_TYPES ) {
			unregisterBlockType( name );
		}
	} );

	beforeEach( () => {
		actions().resetBlocks( [] );
	} );

	it( 'keeps the own inner blocks of a bound block as the ones its parents see', () => {
		actions().resetBlocks( [
			container( 'host', [ text( 'a' ), text( 'b' ) ] ),
		] );
		const root = selectors().getBlocks();

		bind( 'host', [ text( 'x' ) ] );

		expect( selectors().getBlocks() ).toBe( root );
		expect( clientIds( selectors().getBlocks()[ 0 ].innerBlocks ) ).toEqual(
			[ 'a', 'b' ]
		);
		expect( clientIds( selectors().getBlocks( 'host' ) ) ).toEqual( [
			'x',
		] );
		expect( selectors().getBlockOrder( 'host' ) ).toEqual( [ 'x' ] );
		expect( selectors().getBlock( 'a' ) ).toBeNull();
	} );

	it( 'restores the own inner blocks when released, as its parents see them', () => {
		actions().resetBlocks( [
			container( 'host', [ text( 'a' ), text( 'b' ) ] ),
		] );
		bind( 'host', [ text( 'x' ) ] );
		const root = selectors().getBlocks();

		actions().setHasBoundInnerBlocks( 'host', false );

		expect( selectors().getBlocks() ).toBe( root );
		expect( selectors().getBlocks( 'host' ) ).toBe( root[ 0 ].innerBlocks );
		expect( selectors().getBlock( 'a' ) ).not.toBeNull();
		expect( selectors().getBlock( 'x' ) ).toBeNull();
		expect( selectors().areInnerBlocksControlled( 'host' ) ).toBe( false );
		expect( selectors().getBoundInnerBlocks( 'host' ) ).toBeUndefined();
	} );

	it( 'keeps both sets of inner blocks unchanged when all blocks are reset to the same ones', () => {
		actions().resetBlocks( [
			container( 'host', [ text( 'a' ), text( 'b' ) ] ),
		] );
		bind( 'host', [ text( 'x' ) ] );
		const ownInnerBlocks = selectors().getBlocks()[ 0 ].innerBlocks;
		const boundInnerBlocks = selectors().getBlocks( 'host' );

		// E.g. an undo, which resets the blocks the post saved.
		actions().resetBlocks( selectors().getBlocks() );

		expect( selectors().getBlocks()[ 0 ].innerBlocks ).toBe(
			ownInnerBlocks
		);
		expect( selectors().getBlocks( 'host' ) ).toBe( boundInnerBlocks );
		expect( selectors().getBlock( 'a' ) ).toBeNull();
		expect( selectors().getBoundInnerBlocks( 'host' ) ).toEqual( {
			editable: true,
		} );
	} );

	it( 'keeps empty bound inner blocks empty when all blocks are reset', () => {
		actions().resetBlocks( [ container( 'host', [ text( 'a' ) ] ) ] );
		bind( 'host', [] );

		actions().resetBlocks( selectors().getBlocks() );

		expect( selectors().getBlocks( 'host' ) ).toEqual( [] );
		expect( selectors().getBlockOrder( 'host' ) ).toEqual( [] );
		expect( clientIds( selectors().getBlocks()[ 0 ].innerBlocks ) ).toEqual(
			[ 'a' ]
		);
	} );

	it( 'leaves no own inner blocks of a bound block in the store when an ancestor replaces its inner blocks', () => {
		actions().resetBlocks( [
			container( 'parent', [ container( 'host', [ text( 'a' ) ] ) ] ),
		] );
		bind( 'host', [ text( 'x' ) ] );

		actions().replaceInnerBlocks(
			'parent',
			selectors().getBlocks( 'parent' )
		);

		expect( selectors().getBlock( 'a' ) ).toBeNull();
		expect( clientIds( selectors().getBlocks( 'host' ) ) ).toEqual( [
			'x',
		] );
		expect(
			clientIds(
				selectors().getBlocks()[ 0 ].innerBlocks[ 0 ].innerBlocks
			)
		).toEqual( [ 'a' ] );
	} );

	it( 'updates the blocks its parents see when a block moves out of bound inner blocks to the root', () => {
		actions().resetBlocks( [ container( 'host', [ text( 'a' ) ] ) ] );
		bind( 'host', [ text( 'x' ), text( 'y' ) ] );

		actions().moveBlockToPosition( 'x', 'host', '', 1 );

		expect( clientIds( selectors().getBlocks() ) ).toEqual( [
			'host',
			'x',
		] );
	} );

	it( 'updates the blocks its parents see when a block moves out of blocks nested in bound inner blocks to the root', () => {
		actions().resetBlocks( [ container( 'host', [ text( 'a' ) ] ) ] );
		bind( 'host', [ container( 'group', [ text( 'x' ), text( 'y' ) ] ) ] );

		actions().moveBlockToPosition( 'x', 'group', '', 1 );

		expect( clientIds( selectors().getBlocks() ) ).toEqual( [
			'host',
			'x',
		] );
	} );

	it( 'leaves no blocks behind when a reset puts a controlled block in the own inner blocks of a bound block', () => {
		actions().resetBlocks( [
			container( 'inner-host', [ text( 'inner-own' ) ] ),
			container( 'host', [ text( 'own' ) ] ),
		] );
		bind( 'inner-host', [ text( 'inner-bound' ) ] );
		bind( 'host', [ text( 'bound' ) ] );

		actions().resetBlocks( [
			container( 'host', [
				container( 'inner-host', [ text( 'inner-own' ) ] ),
			] ),
		] );

		expect( selectors().getBlockName( 'inner-bound' ) ).toBeNull();
		expect( selectors().getBlockName( 'inner-host' ) ).toBeNull();
		expect( selectors().areInnerBlocksControlled( 'inner-host' ) ).toBe(
			false
		);
		expect( selectors().getBoundInnerBlocks( 'inner-host' ) ).toBe(
			undefined
		);
		expect( clientIds( selectors().getBlocks( 'host' ) ) ).toEqual( [
			'bound',
		] );
		expect( clientIds( selectors().getBlocks()[ 0 ].innerBlocks ) ).toEqual(
			[ 'inner-host' ]
		);
	} );

	it( 'still removes the own inner blocks of other controlled blocks from their parents', () => {
		actions().resetBlocks( [
			{
				...createBlock( 'core/test-template-part', {}, [
					text( 'a' ),
				] ),
				clientId: 'controller',
			},
		] );

		actions().setHasControlledInnerBlocks( 'controller', true );

		expect( selectors().getBlocks()[ 0 ].innerBlocks ).toEqual( [] );
	} );

	describe( 'in synced patterns', () => {
		beforeEach( () => {
			actions().resetBlocks( [
				{ ...createBlock( 'core/block' ), clientId: 'pattern' },
			] );
			actions().setHasControlledInnerBlocks( 'pattern', true );
			actions().replaceInnerBlocks( 'pattern', [
				{
					...createBlock( 'core/test-container', {
						metadata: {
							name: 'Area',
							bindings: {
								innerBlocks: {
									source: 'core/pattern-overrides',
								},
							},
						},
					} ),
					clientId: 'host',
				},
				text( 'locked' ),
			] );
			actions().updateBlockListSettings( 'host', {} );
		} );

		it( 'lets the bound inner blocks be edited, and only them', () => {
			bind( 'host', [ text( 'a' ) ] );

			expect( selectors().getBlockEditingMode( 'locked' ) ).toBe(
				'disabled'
			);
			expect( selectors().getBlockEditingMode( 'a' ) ).toBe( 'default' );
			expect(
				selectors().canInsertBlockType( 'core/test-text', 'host' )
			).toBe( true );
			expect( selectors().canRemoveBlock( 'a' ) ).toBe( true );
			expect( selectors().canMoveBlock( 'a' ) ).toBe( true );
		} );

		it( 'keeps the bound inner blocks disabled when they can not be edited', () => {
			bind( 'host', [ text( 'a' ) ] );

			actions().updateBoundInnerBlocks( 'host', { editable: false } );

			expect( selectors().getBlockEditingMode( 'a' ) ).toBe( 'disabled' );
			expect(
				selectors().canInsertBlockType( 'core/test-text', 'host' )
			).toBe( false );
		} );

		it( 'keeps editable bound inner blocks editable after all blocks are reset', () => {
			bind( 'host', [ text( 'a' ) ] );

			actions().resetBlocks( selectors().getBlocks() );

			expect( selectors().getBlockEditingMode( 'a' ) ).toBe( 'default' );
		} );

		it( 'keeps editable bound inner blocks out of the sections the synced pattern is in', () => {
			actions().resetBlocks( [
				{
					...createBlock(
						'core/test-container',
						{ metadata: { patternName: 'test/section' } },
						[
							{
								...createBlock( 'core/block' ),
								clientId: 'pattern',
							},
						]
					),
					clientId: 'section',
				},
			] );
			actions().setHasControlledInnerBlocks( 'pattern', true );
			actions().replaceInnerBlocks( 'pattern', [
				{
					...createBlock( 'core/test-container', {
						metadata: {
							name: 'Area',
							bindings: {
								innerBlocks: {
									source: 'core/pattern-overrides',
								},
							},
						},
					} ),
					clientId: 'host',
				},
			] );
			actions().updateBlockListSettings( 'host', {} );
			bind( 'host', [ text( 'a' ) ] );

			actions().insertBlock(
				container( 'inserted', [ text( 'inserted-text' ) ] ),
				1,
				'host'
			);

			expect( selectors().getBlockEditingMode( 'a' ) ).toBe( 'default' );
			expect( selectors().getBlockEditingMode( 'inserted' ) ).toBe(
				'default'
			);
			expect( selectors().getBlockEditingMode( 'inserted-text' ) ).toBe(
				'default'
			);
			expect(
				selectors().canInsertBlockType( 'core/test-container', 'host' )
			).toBe( true );
		} );

		it( 'treats a synced pattern within editable bound inner blocks as a top-level one', () => {
			bind( 'host', [
				{ ...createBlock( 'core/block' ), clientId: 'nested-pattern' },
			] );
			actions().setHasControlledInnerBlocks( 'nested-pattern', true );
			actions().replaceInnerBlocks( 'nested-pattern', [
				text( 'nested' ),
			] );

			expect( selectors().getBlockEditingMode( 'nested-pattern' ) ).toBe(
				'default'
			);
			// Like the content of a top-level pattern without overrides.
			expect( selectors().getBlockEditingMode( 'nested' ) ).toBe(
				'disabled'
			);
		} );
	} );

	it( 'is not ungroupable, and has no block overlay', () => {
		actions().resetBlocks( [ container( 'host', [ text( 'a' ) ] ) ] );
		bind( 'host', [ text( 'x' ) ] );

		expect( selectors().isUngroupable( 'host' ) ).toBe( false );
		expect(
			selectors().__unstableHasActiveBlockOverlayActive( 'host' )
		).toBe( false );
	} );

	it( 'identifies a change derived from another one, and the changes derived from it, with that change', () => {
		actions().resetBlocks( [ text( 'a', '' ), text( 'b', '' ) ] );
		actions().updateBlockAttributes( 'a', { content: 'h' } );
		const origin = selectors().getLastBlockChangeOrigin();

		actions().markNextChangeAsDerived();
		actions().updateBlockAttributes( 'b', { content: 'h' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( true );
		expect( selectors().getLastBlockChangeOrigin() ).toBe( origin );

		actions().markNextChangeAsDerived();
		actions().updateBlockAttributes( 'b', { content: 'hi' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( true );
		expect( selectors().getLastBlockChangeOrigin() ).toBe( origin );

		actions().updateBlockAttributes( 'b', { content: 'hey' } );
		expect( selectors().getLastBlockChangeOrigin() ).not.toBe( origin );
	} );

	it( 'applies a mark that a derived change follows to it, and to no later change', () => {
		actions().resetBlocks( [ text( 'a', '' ), text( 'b', '' ) ] );
		actions().updateBlockAttributes( 'a', { content: 'h' } );

		// As a source marks its change through the actions it writes with.
		actions().markNextChangeAsDerived();
		actions().__unstableMarkNextChangeAsNotPersistent( {
			history: 'ignore',
		} );
		actions().markNextChangeAsDerived();
		actions().updateBlockAttributes( 'b', { content: 'h' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( false );
		expect( selectors().__unstableGetLastBlockChangeHistoryMode() ).toBe(
			'ignore'
		);

		actions().updateBlockAttributes( 'b', { content: 'x' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( true );
		expect( selectors().__unstableGetLastBlockChangeHistoryMode() ).toBe(
			'persistent'
		);
	} );

	it( 'lets a change derived from the previous one take its persistence without interrupting its coalescing', () => {
		actions().resetBlocks( [ text( 'a', '' ), text( 'b', '' ) ] );
		actions().updateBlockAttributes( 'a', { content: 'h' } );
		actions().updateBlockAttributes( 'a', { content: 'he' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( false );

		actions().markNextChangeAsDerived();
		actions().updateBlockAttributes( 'b', { content: 'he' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( false );

		actions().updateBlockAttributes( 'a', { content: 'hey' } );
		expect( selectors().isLastBlockChangePersistent() ).toBe( false );
	} );
} );
