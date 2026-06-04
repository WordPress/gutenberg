/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';

jest.mock( '../crdt-selection', () => ( {
	getSelectionHistory: jest.fn( () => [] ),
	getShiftedSelection: jest.fn( () => null ),
	restoreSelection: jest.fn(),
	updateSelectionHistory: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY, LOCAL_EDITOR_ORIGIN } from '../../sync';
import { applyPostChangesToCRDTDoc, type YPostRecord } from '../crdt';
import {
	mergeCrdtBlocks,
	type Block,
	type MergeCursorPosition,
	type YBlock,
	type YBlocks,
} from '../crdt-blocks';
import { getRootMap } from '../crdt-utils';

const SYNCED_BLOCK_PROPERTIES = new Set( [ 'blocks' ] );

function paragraph( clientId: string, content: string ): Block {
	return {
		name: 'core/paragraph',
		clientId,
		attributes: { content },
		innerBlocks: [],
	};
}

function blockContents( blocks: YBlocks ): string[] {
	return ( blocks.toJSON() as Block[] ).map(
		( block ) => block.attributes.content as string
	);
}

function postBlocks( ydoc: Y.Doc ): YBlocks {
	return getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY ).get(
		'blocks'
	) as YBlocks;
}

const mergeCrdtBlocksWithBase = mergeCrdtBlocks as (
	yblocks: YBlocks,
	incomingBlocks: Block[],
	attributeCursor: MergeCursorPosition,
	options?: { baseBlocks?: Block[] }
) => void;

const applyPostChangesWithBase = applyPostChangesToCRDTDoc as (
	ydoc: Y.Doc,
	changes: { blocks: Block[] },
	syncedProperties: Set< string >,
	options?: { baseRecord?: { blocks: Block[] } }
) => void;

describe( 'CRDT stale block base snapshots', () => {
	let doc: Y.Doc;
	let yblocks: YBlocks;

	beforeEach( () => {
		doc = new Y.Doc();
		yblocks = doc.getArray< YBlock >();
	} );

	afterEach( () => {
		doc.destroy();
	} );

	it( 'preserves an unseen remote top-level append when applying a stale local edit', () => {
		const baseBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
		];
		const currentBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
			paragraph( 'remote-appended', 'Gamma' ),
		];
		const staleLocalBlocks = [
			paragraph( 'local-edited', 'Alpha local edit' ),
			paragraph( 'unchanged', 'Beta' ),
		];

		mergeCrdtBlocks( yblocks, baseBlocks, null );
		mergeCrdtBlocks( yblocks, currentBlocks, null );
		mergeCrdtBlocksWithBase( yblocks, staleLocalBlocks, null, {
			baseBlocks,
		} );

		expect( blockContents( yblocks ) ).toEqual( [
			'Alpha local edit',
			'Beta',
			'Gamma',
		] );
	} );

	it( 'preserves a remote top-level delete when applying a stale local edit', () => {
		const baseBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
			paragraph( 'remote-deleted', 'Gamma' ),
		];
		const currentBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
		];
		const staleLocalBlocks = [
			paragraph( 'local-edited', 'Alpha local edit' ),
			paragraph( 'unchanged', 'Beta' ),
			paragraph( 'remote-deleted', 'Gamma' ),
		];

		mergeCrdtBlocks( yblocks, baseBlocks, null );
		mergeCrdtBlocks( yblocks, currentBlocks, null );
		mergeCrdtBlocksWithBase( yblocks, staleLocalBlocks, null, {
			baseBlocks,
		} );

		expect( blockContents( yblocks ) ).toEqual( [
			'Alpha local edit',
			'Beta',
		] );
	} );

	it( 'keeps an observed local delete of a top-level block inserted by another peer', () => {
		const baseBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
			paragraph( 'observed-remote-insert', 'Gamma' ),
		];
		const staleLocalBlocks = [
			paragraph( 'local-edited', 'Alpha local edit' ),
			paragraph( 'unchanged', 'Beta' ),
		];

		mergeCrdtBlocks( yblocks, baseBlocks, null );
		mergeCrdtBlocksWithBase( yblocks, staleLocalBlocks, null, {
			baseBlocks,
		} );

		expect( blockContents( yblocks ) ).toEqual( [
			'Alpha local edit',
			'Beta',
		] );
	} );

	it( 'uses the post CRDT baseRecord path to preserve a remote delete', () => {
		const baseBlocks = [
			paragraph( 'local-edited', 'Alpha' ),
			paragraph( 'unchanged', 'Beta' ),
			paragraph( 'remote-deleted', 'Gamma' ),
		];

		applyPostChangesWithBase(
			doc,
			{ blocks: baseBlocks },
			SYNCED_BLOCK_PROPERTIES
		);

		applyPostChangesWithBase(
			doc,
			{
				blocks: [
					paragraph( 'local-edited', 'Alpha' ),
					paragraph( 'unchanged', 'Beta' ),
				],
			},
			SYNCED_BLOCK_PROPERTIES,
			{ baseRecord: { blocks: baseBlocks } }
		);

		expect( blockContents( postBlocks( doc ) ) ).toEqual( [
			'Alpha',
			'Beta',
		] );

		applyPostChangesWithBase(
			doc,
			{
				blocks: [
					paragraph( 'local-edited', 'Alpha local edit' ),
					paragraph( 'unchanged', 'Beta' ),
					paragraph( 'remote-deleted', 'Gamma' ),
				],
			},
			SYNCED_BLOCK_PROPERTIES,
			{ baseRecord: { blocks: baseBlocks } }
		);

		expect( blockContents( postBlocks( doc ) ) ).toEqual( [
			'Alpha local edit',
			'Beta',
		] );
	} );

	it( 'applies local edits after reload regenerates block client IDs', () => {
		const baseBlocks = [ paragraph( 'after-reload', 'Alpha' ) ];
		const currentBlocks = [ paragraph( 'before-reload', 'Alpha' ) ];
		const localBlocks = [ paragraph( 'after-reload', 'Alpha local edit' ) ];

		mergeCrdtBlocks( yblocks, currentBlocks, null );
		mergeCrdtBlocksWithBase( yblocks, localBlocks, null, {
			baseBlocks,
		} );

		expect( blockContents( yblocks ) ).toEqual( [ 'Alpha local edit' ] );
	} );

	it( 'records undo for local edits after reload regenerates block client IDs', () => {
		const recordMap = getRootMap< YPostRecord >( doc, CRDT_RECORD_MAP_KEY );
		const undoManager = new Y.UndoManager( recordMap, {
			trackedOrigins: new Set( [ LOCAL_EDITOR_ORIGIN ] ),
		} );
		const baseBlocks = [ paragraph( 'after-reload', 'Alpha' ) ];
		const currentBlocks = [ paragraph( 'before-reload', 'Alpha' ) ];
		const localBlocks = [ paragraph( 'after-reload', 'Alpha local edit' ) ];

		applyPostChangesWithBase(
			doc,
			{ blocks: currentBlocks },
			SYNCED_BLOCK_PROPERTIES
		);

		doc.transact( () => {
			applyPostChangesWithBase(
				doc,
				{ blocks: localBlocks },
				SYNCED_BLOCK_PROPERTIES,
				{ baseRecord: { blocks: baseBlocks } }
			);
		}, LOCAL_EDITOR_ORIGIN );

		expect( blockContents( postBlocks( doc ) ) ).toEqual( [
			'Alpha local edit',
		] );
		expect( undoManager.canUndo() ).toBe( true );

		undoManager.undo();

		expect( blockContents( postBlocks( doc ) ) ).toEqual( [ 'Alpha' ] );
	} );
} );
