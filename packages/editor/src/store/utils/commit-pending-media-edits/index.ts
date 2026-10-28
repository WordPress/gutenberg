import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import type { Block, BlockMediaEditorSettings } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

/**
 * A media edit held for a block until the post is saved. See the editor's
 * `setPendingMediaEdit`.
 */
export interface PendingMediaEdit {
	sourceId: number;
	sourceUrl?: string;
	modifiers: unknown[];
	previewUrl?: string;
}

interface SavedMedia {
	id: number;
	source_url: string;
	[ key: string ]: unknown;
}

/**
 * Returns the block's media editor settings, if the edit was made on the
 * attachment the block shows now.
 *
 * @param registry The data registry.
 * @param clientId Block client ID.
 * @param edit     The pending edit.
 */
function getMediaEditorForEdit(
	registry: DataRegistry,
	clientId: string,
	edit: PendingMediaEdit
): { block: Block; mediaEditor: BlockMediaEditorSettings } | undefined {
	const block = registry
		.select( blockEditorStore )
		.getBlock( clientId ) as Block | null;
	if ( ! block ) {
		return undefined;
	}
	const mediaEditor = getBlockType( block.name )?.mediaEditor;
	if ( mediaEditor?.getMedia( block.attributes ).id !== edit.sourceId ) {
		return undefined;
	}
	return { block, mediaEditor };
}

/**
 * Key for deduplicating edits, so blocks with the same edit to the same image
 * (e.g. a duplicated block) share one new attachment.
 *
 * @param edit The edit.
 */
function getEditKey( edit: PendingMediaEdit ): string {
	return `${ edit.sourceId }:${ JSON.stringify( edit.modifiers ) }`;
}

/**
 * Saves one edit as a new attachment, using the same request the media editor
 * makes.
 *
 * @param registry The data registry.
 * @param edit     The edit.
 */
async function saveEdit(
	registry: DataRegistry,
	edit: PendingMediaEdit
): Promise< SavedMedia > {
	const { sourceId, sourceUrl, modifiers } = edit;
	const source = ( await registry
		.resolveSelect( coreStore )
		.getEntityRecord( 'postType', 'attachment', sourceId ) ) as
		{ source_url?: string; post?: number } | undefined;

	const media = await apiFetch< SavedMedia >( {
		path: `/wp/v2/media/${ sourceId }/edit`,
		method: 'POST',
		data: {
			src: sourceUrl ?? source?.source_url,
			modifiers,
			// `/edit` doesn't copy the parent post to the new attachment.
			...( source?.post !== undefined && { post: source.post } ),
		},
	} );

	registry
		.dispatch( coreStore )
		.receiveEntityRecords(
			'postType',
			'attachment',
			media,
			undefined,
			true
		);

	return media;
}

/**
 * Saves pending media edits and points their blocks at the new attachments.
 *
 * Each distinct edit is saved once. Edits that succeed are applied even if
 * others fail, so a retry only repeats the failures. The blocks are read again
 * once the requests finish, so edits made in the meantime are kept.
 *
 * @param registry     The data registry.
 * @param pendingEdits Pending edits, keyed by block client ID.
 * @return The client IDs whose edits are done with, either saved or stale,
 *         and the first failure, if any.
 */
export default async function commitPendingMediaEdits(
	registry: DataRegistry,
	pendingEdits: Record< string, PendingMediaEdit >
): Promise< { done: string[]; error?: unknown } > {
	const edits = new Map< string, PendingMediaEdit >();
	for ( const [ clientId, edit ] of Object.entries( pendingEdits ) ) {
		if ( getMediaEditorForEdit( registry, clientId, edit ) ) {
			edits.set( getEditKey( edit ), edit );
		}
	}

	const saved = new Map< string, SavedMedia >();
	const results = await Promise.allSettled(
		[ ...edits ].map( async ( [ key, edit ] ) => {
			saved.set( key, await saveEdit( registry, edit ) );
		} )
	);
	const failure = results.find(
		( result ): result is PromiseRejectedResult =>
			result.status === 'rejected'
	);

	const done: string[] = [];
	const attributes: Record< string, Record< string, unknown > > = {};
	for ( const [ clientId, edit ] of Object.entries( pendingEdits ) ) {
		const current = getMediaEditorForEdit( registry, clientId, edit );
		const media = saved.get( getEditKey( edit ) );
		if ( ! current ) {
			done.push( clientId );
		} else if ( media ) {
			done.push( clientId );
			attributes[ clientId ] = current.mediaEditor.applyMedia(
				current.block.attributes,
				media
			);
		}
	}

	const clientIds = Object.keys( attributes );
	if ( clientIds.length ) {
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( clientIds, attributes, {
				uniqueByBlock: true,
			} );
	}

	return { done, error: failure?.reason };
}
