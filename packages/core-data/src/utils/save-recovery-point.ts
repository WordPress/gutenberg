import apiFetch from '@wordpress/api-fetch';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import type { ObjectData } from '@wordpress/sync';
import { getRawValue } from './crdt';

/**
 * Autosaves request parameter asking for the content to be stored as a
 * permanent revision. Must match `CRDT_RECOVERY_POINT_PARAM` in the
 * Gutenberg autosaves REST controller.
 */
export const CRDT_RECOVERY_POINT_KEY = 'crdt_recovery_point';

/**
 * Store the content of a record as a permanent revision of its post.
 *
 * Used when a remote peer's document replaced this session's content (see
 * `onRemoteReplacement` in `@wordpress/sync`). The replaced content is gone
 * from the shared document and from the undo history, and the next autosave
 * overwrites the user's autosave revision, so a permanent revision is the
 * only durable copy. The parent post is left untouched.
 *
 * Nothing is stored when the content cannot be derived from the record, since
 * a revision with empty content would wipe the post if restored.
 *
 * @param autosavesPath REST path of the post's autosaves route.
 * @param record        The record as it was before the replacement.
 */
export async function saveRecoveryPoint(
	autosavesPath: string,
	record: ObjectData
): Promise< void > {
	const content = Array.isArray( record.blocks )
		? __unstableSerializeAndClean( record.blocks )
		: getRawValue( record.content );

	if ( undefined === content ) {
		return;
	}

	const data: Record< string, unknown > = {
		[ CRDT_RECOVERY_POINT_KEY ]: true,
		content,
	};
	const title = getRawValue( record.title );
	const excerpt = getRawValue( record.excerpt );

	if ( undefined !== title ) {
		data.title = title;
	}

	if ( undefined !== excerpt ) {
		data.excerpt = excerpt;
	}

	await apiFetch( {
		path: autosavesPath,
		method: 'POST',
		data,
	} );
}
