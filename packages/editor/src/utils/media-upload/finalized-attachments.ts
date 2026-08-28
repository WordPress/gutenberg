import { dispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

type FinalizedAttachment = {
	id?: number;
};

/**
 * The queries the editor resolves an attachment record with.
 *
 * Blocks read the record either as `getEntityRecord( 'postType', 'attachment',
 * id, { context: 'view' } )` or without a query at all, and resolution state is
 * keyed on the exact arguments, so both have to be addressed.
 */
const ATTACHMENT_QUERIES = [ { context: 'view' }, undefined ];

/**
 * IDs of attachments whose finalized record has already been received.
 *
 * An entry is consumed by `mediaUploadOnSuccess`, which then has nothing left
 * to refetch for that attachment.
 */
const finalized = new Set< number >();

/**
 * Stores the attachment record returned by the `finalize` endpoint.
 *
 * `finalize` is the server's commit point for a client-side upload: it writes
 * the sub-size metadata collected from the sideloads and returns the attachment
 * as prepared *after* that write, so its `media_details.sizes` is the finished
 * set of generated sizes. Storing that response is what makes the editor's copy
 * of the record current, and it leaves nothing for a refetch to go and get.
 *
 * The record is received under both queries the editor resolves attachments
 * with. It is prepared in the `edit` context, which for an attachment carries
 * every field the `view` context does plus a few edit-only ones, so it also
 * satisfies a consumer reading the `view` record.
 *
 * @param record Attachment record as returned by the `finalize` endpoint.
 */
export function receiveFinalizedAttachment(
	record: FinalizedAttachment
): void {
	if ( ! record?.id ) {
		return;
	}

	const { receiveEntityRecords } = dispatch( coreDataStore );

	for ( const query of ATTACHMENT_QUERIES ) {
		/*
		 * Passing the record on its own rather than in an array keeps this a
		 * single-item receive, which leaves list queries (the media library,
		 * the inserter's Media tab) untouched.
		 */
		receiveEntityRecords( 'postType', 'attachment', record, query );
	}

	finalized.add( record.id );
}

/**
 * Reports whether a finalized record has been received for an attachment,
 * forgetting it in the process.
 *
 * @param id Attachment ID.
 *
 * @return Whether the editor already holds the finalized record.
 */
export function consumeFinalizedAttachment( id: number ): boolean {
	return finalized.delete( id );
}
