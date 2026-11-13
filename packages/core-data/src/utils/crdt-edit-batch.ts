import { CRDT_RECORD_MAP_KEY, Y } from '@wordpress/sync';
import type { SyncConfig } from '@wordpress/sync';
import type { EntitySyncEditBatch } from '../entity-sync';
import {
	applyCrdtBlockOperation,
	type YBlock,
	type YBlocks,
} from './crdt-blocks';
import { parseCursorSelection } from './crdt';
import type { WPSelection } from '../types';

/**
 * Apply a local batch inside the sync manager's existing Yjs transaction.
 * Structural operations are direct; field and attribute values retain their
 * existing schema-aware text/rich-text diffing.
 *
 * @param doc        The shared entity document.
 * @param batch      Local editor intents.
 * @param syncConfig Field serialization and sync policy.
 */
export function applyEditBatchToCRDTDoc(
	doc: Y.Doc,
	batch: EntitySyncEditBatch,
	syncConfig: SyncConfig
): void {
	const record = doc.getMap( CRDT_RECORD_MAP_KEY );
	const cursor = parseCursorSelection( batch.selection as WPSelection );
	for ( const operation of batch.operations ) {
		if ( operation.type === 'set-field' ) {
			syncConfig.applyChangesToCRDTDoc( doc, {
				[ operation.field ]: operation.value,
				// Raw source edits invalidate parsed blocks in the code editor.
				...( operation.field === 'content'
					? { blocks: undefined }
					: {} ),
			} );
		} else {
			let blocks = record.get( 'blocks' ) as YBlocks | undefined;
			if ( ! blocks ) {
				blocks = new Y.Array< YBlock >();
				record.set( 'blocks', blocks );
			}
			applyCrdtBlockOperation( blocks, operation, cursor );
		}
	}
	if ( 'selection' in batch ) {
		syncConfig.applyChangesToCRDTDoc( doc, { selection: batch.selection } );
	}
}
