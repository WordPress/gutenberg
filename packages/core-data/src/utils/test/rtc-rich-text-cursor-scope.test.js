/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * Mock block schemas and sync providers.
 */
jest.mock( '@wordpress/blocks', () => {
	const actual = jest.requireActual( '@wordpress/blocks' );

	return {
		...actual,
		getBlockTypes: () => [
			{
				name: 'test/cursor-scope-bug',
				attributes: {
					first: { type: 'rich-text' },
					second: { type: 'rich-text' },
				},
			},
		],
	};
} );

jest.mock( '../../../../sync/src/providers', () => ( {
	getProviderCreators: jest.fn(),
} ) );

/**
 * Internal dependencies
 */
import { createSyncManager } from '../../../../sync/src/manager';
import { getProviderCreators } from '../../../../sync/src/providers';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import { applyPostChangesToCRDTDoc } from '../crdt';
import { deserializeBlockAttributes, mergeCrdtBlocks } from '../crdt-blocks';
import { getRootMap } from '../crdt-utils';

const mockGetProviderCreators = jest.mocked( getProviderCreators );

const SYNCED_PROPERTIES = new Set( [ 'blocks' ] );
const INITIAL_SECOND = '<em>b</em><em>i</em>';
const HIDDEN_SECOND = 'ab<em>b</em><strong>it</strong>';
const STEP_TWO_SECOND = 'a<strong>it</strong>';
const FINAL_SECOND = 'ab<em>b</em><strong>i</strong>t';

function makeBlock( first, second ) {
	return {
		clientId: 'block-1',
		name: 'test/cursor-scope-bug',
		attributes: { first, second },
		innerBlocks: [],
	};
}

function getSelection( offset ) {
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

function readSecondFromYBlocks( yblocks ) {
	const attrs = yblocks.get( 0 ).get( 'attributes' );
	return attrs.get( 'second' ).toString();
}

function readVisibleSecondFromYBlocks( yblocks ) {
	const second = deserializeBlockAttributes( yblocks.toJSON() )[ 0 ]
		.attributes.second;

	return typeof second?.toHTMLString === 'function'
		? second.toHTMLString()
		: String( second );
}

function readSecondFromDoc( ydoc ) {
	const ymap = getRootMap( ydoc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' );
	return readSecondFromYBlocks( yblocks );
}

function readVisibleSecondFromDoc( ydoc ) {
	const ymap = getRootMap( ydoc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' );
	return readVisibleSecondFromYBlocks( yblocks );
}

function runSequenceWithMergeCrdtBlocks( yblocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'x', HIDDEN_SECOND ) ], 1 );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xy', STEP_TWO_SECOND ) ], 2 );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xyq', FINAL_SECOND ) ], 3 );
}

function runSequenceWithMergeCrdtBlocksWithoutCursor( yblocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'x', HIDDEN_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xy', STEP_TWO_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( 'xyq', FINAL_SECOND ) ], null );
}

function runSecondFieldOnlySequence( yblocks ) {
	mergeCrdtBlocks( yblocks, [ makeBlock( '', INITIAL_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', HIDDEN_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', STEP_TWO_SECOND ) ], null );
	mergeCrdtBlocks( yblocks, [ makeBlock( '', FINAL_SECOND ) ], null );
}

function runSequenceWithApplyPostChangesToCRDTDoc( ydoc ) {
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
		jest.clearAllMocks();
		mockGetProviderCreators.mockReturnValue( [
			jest.fn( async () => ( {
				destroy: jest.fn(),
				on: jest.fn(),
			} ) ),
		] );
	} );

	it( 'keeps unrelated rich-text fields correct in mergeCrdtBlocks', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray( 'blocks' );

		runSequenceWithMergeCrdtBlocks( yblocks );

		expect( readSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
	} );

	it( 'stays correct in mergeCrdtBlocks when the same updates are applied without any cursor hint', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray( 'blocks' );

		runSequenceWithMergeCrdtBlocksWithoutCursor( yblocks );

		expect( readSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromYBlocks( yblocks ) ).toBe( FINAL_SECOND );
	} );

	it( 'stays correct in mergeCrdtBlocks when only the second field is updated and no cross-field cursor reuse is possible', () => {
		const doc = new Y.Doc();
		const yblocks = doc.getArray( 'blocks' );

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
		let capturedDoc;
		const manager = createSyncManager();
		const handlers = {
			addUndoMeta: jest.fn(),
			editRecord: jest.fn(),
			getEditedRecord: jest.fn( async () => ( {
				id: 1,
				blocks: [ makeBlock( '', INITIAL_SECOND ) ],
			} ) ),
			onStatusChange: jest.fn(),
			persistCRDTDoc: jest.fn(),
			refetchRecord: jest.fn( async () => {} ),
			restoreUndoMeta: jest.fn(),
		};
		const syncConfig = {
			applyChangesToCRDTDoc: ( ydoc, changes ) => {
				capturedDoc = ydoc;
				applyPostChangesToCRDTDoc( ydoc, changes, SYNCED_PROPERTIES );
			},
			createAwareness: jest.fn(),
			getChangesFromCRDTDoc: jest.fn( () => ( {} ) ),
			getPersistedCRDTDoc: jest.fn( () => null ),
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
		] ) {
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

		expect( readSecondFromDoc( capturedDoc ) ).toBe( FINAL_SECOND );
		expect( readVisibleSecondFromDoc( capturedDoc ) ).toBe( FINAL_SECOND );

		manager.unload( 'postType/post', '1' );
	} );
} );
