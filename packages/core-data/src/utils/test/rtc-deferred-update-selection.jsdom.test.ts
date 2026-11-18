import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Y } from '@wordpress/sync';
import { createSyncManager } from '../../../../sync/src/manager';
import { getProviderCreators } from '../../../../sync/src/providers';
import { LOCAL_EDITOR_ORIGIN } from '../../../../sync/src/config';
import type { RecordHandlers, SyncConfig } from '../../../../sync/src/types';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import { applyPostChangesToCRDTDoc } from '../crdt';
import type { YPostRecord } from '../crdt';
import type { Block } from '../crdt-blocks';
import { getSelectionHistory, getShiftedSelection } from '../crdt-selection';
import { getRootMap, getYTextByAttributeKey } from '../crdt-utils';

vi.mock( import( '@wordpress/blocks' ), async ( importOriginal ) => {
	const actual = await importOriginal();

	return {
		...actual,
		getBlockTypes: ( () => [
			{
				name: 'test/paragraph',
				attributes: { content: { type: 'rich-text' } },
			},
		] ) as unknown as typeof actual.getBlockTypes,
	};
} );

vi.mock( import( '../../../../sync/src/providers' ), () => ( {
	getProviderCreators: vi.fn(),
} ) );

const SYNCED_PROPERTIES = new Set( [ 'blocks' ] );

function makeBlock( content: string ): Block {
	return {
		clientId: 'block-1',
		name: 'test/paragraph',
		attributes: { content },
		innerBlocks: [],
	};
}

function getContentText( ydoc: Y.Doc ): Y.Text {
	const attributes = getRootMap< YPostRecord >( ydoc, CRDT_RECORD_MAP_KEY )
		.get( 'blocks' )
		?.get( 0 )
		.get( 'attributes' );
	const text = attributes && getYTextByAttributeKey( attributes, 'content' );

	if ( ! text ) {
		throw new Error( 'The block has no content text.' );
	}

	return text;
}

function waitForNextTick() {
	return new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
}

describe( 'RTC deferred update merged with a remote change', () => {
	const docs: Y.Doc[] = [];
	let flushLocalUpdates = () => {};

	beforeEach( () => {
		vi.clearAllMocks();
		docs.length = 0;
		vi.mocked( getProviderCreators ).mockReturnValue( [
			vi.fn( async ( { ydoc, flushLocalUpdates: flush } ) => {
				docs.push( ydoc );
				flushLocalUpdates = flush;
				return {
					destroy: vi.fn(),
					flushesLocalUpdates: true,
					on: vi.fn(),
				};
			} ),
		] );
	} );

	it( 'records the caret of the merged edit for the entity document', async () => {
		const record = { id: 1, blocks: [ makeBlock( 'Hello' ) ] };
		const syncConfig: SyncConfig = {
			applyChangesToCRDTDoc: ( ydoc, changes ) =>
				applyPostChangesToCRDTDoc( ydoc, changes, SYNCED_PROPERTIES ),
			getChangesFromCRDTDoc: () => ( {} ),
		};
		const handlers: RecordHandlers = {
			addUndoMeta: vi.fn(),
			editRecord: vi.fn(),
			getEditedRecord: vi.fn( async () => record ),
			onStatusChange: vi.fn(),
			persistCRDTDoc: vi.fn(),
			refetchRecord: vi.fn( async () => {} ),
			restoreUndoMeta: vi.fn(),
		};
		const manager = createSyncManager();
		await manager.load(
			syncConfig,
			'postType/post',
			'1',
			record,
			handlers
		);
		const [ liveDoc ] = docs;

		// The peer starts from the current document.
		const peerDoc = new Y.Doc();
		Y.applyUpdateV2( peerDoc, Y.encodeStateAsUpdateV2( liveDoc ) );

		// The user types "!" with the caret after it. No peer is in
		// awareness, so the update is deferred.
		const caret = {
			clientId: 'block-1',
			attributeKey: 'content',
			offset: 6,
		};
		manager.update(
			'postType/post',
			'1',
			{
				blocks: [ makeBlock( 'Hello!' ) ],
				selection: { selectionStart: caret, selectionEnd: caret },
			},
			LOCAL_EDITOR_ORIGIN
		);

		// The peer's change arrives before the deferred update is applied.
		// The provider applies the local updates first.
		const before = Y.encodeStateVector( peerDoc );
		getContentText( peerDoc ).insert( 0, 'Bob says ' );
		flushLocalUpdates();
		Y.applyUpdateV2(
			liveDoc,
			Y.encodeStateAsUpdateV2( peerDoc, before ),
			'provider'
		);
		await waitForNextTick();

		expect( getContentText( liveDoc ).toString() ).toBe(
			'Bob says Hello!'
		);

		// The caret is recorded for the entity document, and it resolves to
		// the position after the "!" in the merged text.
		const history = getSelectionHistory( liveDoc );
		expect( history ).toHaveLength( 1 );
		expect(
			getShiftedSelection( liveDoc, history )?.selectionStart.offset
		).toBe( 15 );
	} );
} );
