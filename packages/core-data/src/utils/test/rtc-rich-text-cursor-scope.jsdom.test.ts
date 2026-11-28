import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Y } from '@wordpress/sync';
import type { RichTextData } from '@wordpress/rich-text';
import { createSyncManager } from '../../../../sync/src/manager';
import { getProviderCreators } from '../../../../sync/src/providers';
import type { RecordHandlers, SyncConfig } from '../../../../sync/src/types';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import { applyPostChangesToCRDTDoc } from '../crdt';
import type { YPostRecord } from '../crdt';
import { deserializeBlockAttributes, mergeCrdtBlocks } from '../crdt-blocks';
import type { Block, YBlock, YBlockAttributes, YBlocks } from '../crdt-blocks';
import { getRootMap } from '../crdt-utils';
/**
 * Mock block schemas and sync providers.
 */
vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const actual = await importOriginal();

	return {
		...actual,
		getBlockTypes: ( () => [
			{
				name: 'test/cursor-scope-bug',
				attributes: {
					first: { type: 'rich-text' },
					second: { type: 'rich-text' },
				},
			},
		] ) as unknown as typeof actual.getBlockTypes,
	};
} );

vi.mock( import( '../../../../sync/src/providers' ), () => ( {
	getProviderCreators: vi.fn(),
} ) );

const mockGetProviderCreators = vi.mocked( getProviderCreators );

const SYNCED_PROPERTIES = new Set( [ 'blocks' ] );
const INITIAL_SECOND = '<em>b</em><em>i</em>';
const HIDDEN_SECOND = 'ab<em>b</em><strong>it</strong>';
const STEP_TWO_SECOND = 'a<strong>it</strong>';
const FINAL_SECOND = 'ab<em>b</em><strong>i</strong>t';

function makeBlock( first: string, second: string ): Block {
	return {
		clientId: 'block-1',
		name: 'test/cursor-scope-bug',
		attributes: { first, second },
		innerBlocks: [],
	};
}

function getSelection( offset: number ) {
	return {
		selectionStart: {
			clientId: 'block-1',
			attributeKey: 'first',
			offset,
		},
		selectionEnd: {
			clientId: 'block-1',
			attributeKey: 'first',
			offset,
		},
	};
}

function readSecondFromYBlocks( yblocks: YBlocks ) {
	const attrs = yblocks.get( 0 ).get( 'attributes' ) as YBlockAttributes;
	return ( attrs.get( 'second' ) as Y.Text ).toString();
}

function readVisibleSecondFromYBlocks( yblocks: YBlocks ) {
	// The attribute deserializes to rich-text data, or stays a plain value.
	const second = deserializeBlockAttributes( yblocks.toJSON() )[ 0 ]
		.attributes.second as Partial< RichTextData > | undefined;

	return typeof second?.toHTMLString === 'function'
		? second.toHTMLString()
		: String( second );
}

function readSecondFromDoc( ydoc: Y.Doc ) {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' )!;
	return readSecondFromYBlocks( yblocks );
}

function readVisibleSecondFromDoc( ydoc: Y.Doc ) {
	const ymap = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' )!;
	return readVisibleSecondFromYBlocks( yblocks );
}

function runSequenceWithMergeCrdtBlocks( yblocks: YBlocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks(
		yblocks,
		[ makeBlock( 'x', HIDDEN_SECOND ) ],
		// @ts-expect-error Bug: a bare offset is not a cursor, so the merge runs without one.
		1
	);
	mergeCrdtBlocks(
		yblocks,
		[ makeBlock( 'xy', STEP_TWO_SECOND ) ],
		// @ts-expect-error Bug: a bare offset is not a cursor, so the merge runs without one.
		2
	);
	mergeCrdtBlocks(
		yblocks,
		[ makeBlock( 'xyq', FINAL_SECOND ) ],
		// @ts-expect-error Bug: a bare offset is not a cursor, so the merge runs without one.
		3
	);
}

function runSequenceWithMergeCrdtBlocksWithoutCursor( yblocks: YBlocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'x', HIDDEN_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xy', STEP_TWO_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xyq', FINAL_SECOND ) ], null );
}

function runSecondFieldOnlySequence( yblocks: YBlocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', HIDDEN_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', STEP_TWO_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', FINAL_SECOND ) ], null );
}

function runSequenceWithApplyPostChangesToCRDTDoc( ydoc: Y.Doc ) {
	applyPostChangesToCRDTDoc(
		ydoc,
		{ blocks: [ makeBlock( '', INITIAL_SECOND ) ] },
		SYNCED_PROPERTIES
	);
	applyPostChangesToCRDTDoc(
		ydoc,
		{
			blocks: [ makeBlock( 'x', HIDDEN_SECOND ) ],
			selection: getSelection( 1 ),
		},
		SYNCED_PROPERTIES
	);
	applyPostChangesToCRDTDoc(
		ydoc,
		{
			blocks: [ makeBlock( 'xy', STEP_TWO_SECOND ) ],
			selection: getSelection( 2 ),
		},
		SYNCED_PROPERTIES
	);
	applyPostChangesToCRDTDoc(
		ydoc,
		{
			blocks: [ makeBlock( 'xyq', FINAL_SECOND ) ],
			selection: getSelection( 3 ),
		},
		SYNCED_PROPERTIES
	);
}

function waitForNextTick() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'RTC rich-text cursor scope bug', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockGetProviderCreators.mockReturnValue( [
			vi.fn( async () => ( {
				destroy: vi.fn(),
				on: vi.fn(),
			} ) ),
		] );
	} );

	it( 'keeps unrelated rich-text fields correct in mergeCrdtBlocks', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		runSequenceWithMergeCrdtBlocks( yblocks );

		expect( readSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
	} );

	it( 'stays correct in mergeCrdtBlocks when the same updates are applied without any cursor hint', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		runSequenceWithMergeCrdtBlocksWithoutCursor( yblocks );

		expect( readSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
	} );

	it( 'stays correct in mergeCrdtBlocks when only the second field is updated and no cross-field cursor reuse is possible', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray< YBlock >( 'blocks' );

		runSecondFieldOnlySequence( yblocks );

		expect( readSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
	} );

	it( 'keeps unrelated rich-text fields correct in applyPostChangesToCRDTDoc', () => {
		const doc = new Y.Doc();

		runSequenceWithApplyPostChangesToCRDTDoc( doc );

		expect( readSecondFromDoc( doc ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromDoc( doc ) ).toBe( FINAL_SECOND );
	} );

	it( 'keeps unrelated rich-text fields correct in SyncManager.update', async () => {
		let capturedDoc: Y.Doc | undefined;
		const manager = createSyncManager();
		const handlers: RecordHandlers = {
			addUndoMeta: vi.fn(),
			editRecord: vi.fn(),
			getEditedRecord: vi.fn( async () => ( {
				id: 1,
				blocks: [ makeBlock( '', INITIAL_SECOND ) ],
			} ) ),
			onStatusChange: vi.fn(),
			persistCRDTDoc: vi.fn(),
			refetchRecord: vi.fn( async () => {} ),
			restoreUndoMeta: vi.fn(),
		};
		const syncConfig: SyncConfig = {
			applyChangesToCRDTDoc: ( ydoc, changes ) => {
				capturedDoc = ydoc;
				applyPostChangesToCRDTDoc( ydoc, changes, SYNCED_PROPERTIES );
			},
			createAwareness: vi.fn(),
			getChangesFromCRDTDoc: vi.fn( () => ( {} ) ),
			getPersistedCRDTDoc: vi.fn( () => null ),
		};

		await manager.load(
			syncConfig,
			'postType/post',
			'1',
			{ id: 1, blocks: [ makeBlock( '', INITIAL_SECOND ) ] },
			handlers
		);

		for ( const [ first, second, offset ] of [
			[ 'x', HIDDEN_SECOND, 1 ],
			[ 'xy', STEP_TWO_SECOND, 2 ],
			[ 'xyq', FINAL_SECOND, 3 ],
		] as const ) {
			manager.update(
				'postType/post',
				'1',
				{
					blocks: [ makeBlock( first, second ) ],
					selection: getSelection( offset ),
				},
				'LOCAL_EDITOR_ORIGIN'
			);
			// Selection history writes are deferred. Wait one tick before
			// inspecting the document.
			await waitForNextTick();
		}

		expect( readSecondFromDoc( capturedDoc! ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromDoc( capturedDoc! ) ).toBe( FINAL_SECOND );

		manager.unload( 'postType/post', '1' );
	} );
} );
