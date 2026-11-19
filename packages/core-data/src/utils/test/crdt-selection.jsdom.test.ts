import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { dispatch, select } from '@wordpress/data';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Y } from '@wordpress/sync';
import { createBlockSelectionHistory } from '../block-selection-history';
import { restoreSelection } from '../crdt-selection';
import { CRDT_RECORD_MAP_KEY } from '../../sync';

describe( 'collaborative set restoration', () => {
	beforeAll( () => {
		registerBlockType( 'test/history-selection', {
			apiVersion: 3,
			title: 'Selection fixture',
			category: 'text',
			attributes: {},
			save: () => null,
		} );
		return () => unregisterBlockType( 'test/history-selection' );
	} );
	afterEach( () => dispatch( blockEditorStore ).resetBlocks( [] ) );

	test( 'preserves range restoration when setSelectionClientIds is absent', () => {
		const blocks = Array.from( { length: 3 }, () =>
			createBlock( 'test/history-selection' )
		);
		const doc = new Y.Doc();
		try {
			const yBlocks = new Y.Array< Y.Map< unknown > >();
			doc.getMap( CRDT_RECORD_MAP_KEY ).set( 'blocks', yBlocks );
			yBlocks.push(
				blocks.map(
					( block ) =>
						new Y.Map< unknown >( [
							[ 'clientId', block.clientId ],
							[ 'innerBlocks', new Y.Array() ],
							[ 'attributes', new Y.Map() ],
						] )
				)
			);
			dispatch( blockEditorStore ).resetBlocks( blocks );
			const history = createBlockSelectionHistory( doc );
			history.updateSelection( {
				selectionStart: { clientId: blocks[ 0 ].clientId },
				selectionEnd: { clientId: blocks[ 2 ].clientId },
			} );
			restoreSelection( history.getSelectionHistory(), doc );
			// Existing range restoration selects only the selectionEnd block.
			expect(
				select( blockEditorStore ).getSelectedBlockClientIds()
			).toEqual( [ blocks[ 2 ].clientId ] );
		} finally {
			doc.destroy();
		}
	} );

	test.each( [ false, true ] )(
		'restores selected blocks that still exist without selecting blocks between them (cloned IDs: %s)',
		( cloned ) => {
			const blocks = Array.from( { length: 5 }, () =>
				createBlock( 'test/history-selection' )
			);
			const doc = new Y.Doc();
			try {
				const yBlocks = new Y.Array< Y.Map< unknown > >();
				doc.getMap( CRDT_RECORD_MAP_KEY ).set( 'blocks', yBlocks );
				yBlocks.push(
					blocks.map(
						( block, i ) =>
							new Y.Map< unknown >( [
								[
									'clientId',
									cloned ? `external-${ i }` : block.clientId,
								],
								[ 'innerBlocks', new Y.Array() ],
								[ 'attributes', new Y.Map() ],
							] )
					)
				);
				const ids = yBlocks
					.toArray()
					.map( ( block ) => block.get( 'clientId' ) as string );
				const actions = dispatch( blockEditorStore );
				actions.resetBlocks( blocks );
				const history = createBlockSelectionHistory( doc );
				history.updateSelection( {
					selectionStart: { clientId: ids[ 4 ] },
					selectionEnd: { clientId: ids[ 0 ] },
					setSelectionClientIds: [ ids[ 0 ], ids[ 2 ], ids[ 4 ] ],
				} );
				restoreSelection( history.getSelectionHistory(), doc );
				expect(
					select( blockEditorStore ).getSelectedBlockClientIds()
				).toEqual( [
					blocks[ 0 ].clientId,
					blocks[ 2 ].clientId,
					blocks[ 4 ].clientId,
				] );
				expect(
					select( blockEditorStore ).getBlockSelectionStart()
				).toBe( blocks[ 4 ].clientId );
				// Simulate another user deleting the selectionStart block before undo.
				yBlocks.delete( 4, 1 );
				const moved = yBlocks.get( 2 ).clone();
				yBlocks.delete( 2, 1 );
				yBlocks.insert( 0, [ moved ] );
				actions.resetBlocks( [
					blocks[ 2 ],
					blocks[ 0 ],
					blocks[ 1 ],
					blocks[ 3 ],
				] );
				restoreSelection( history.getSelectionHistory(), doc );
				expect(
					select( blockEditorStore ).getSelectedBlockClientIds()
				).toEqual( [ blocks[ 2 ].clientId, blocks[ 0 ].clientId ] );
				expect(
					select( blockEditorStore ).getBlockSelectionStart()
				).toBe( blocks[ 2 ].clientId );
			} finally {
				doc.destroy();
			}
		}
	);
} );
