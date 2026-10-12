import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { Media } from '../media-editor-provider';
import type { MediaEditorSession } from '../../state';
import {
	buildModifiers,
	type Modifier,
} from '../media-editor-modal/build-modifiers';

// Details-tab edits are bundled into transformed `/edit` requests. Core's
// endpoint only accepts this whitelist.
const METADATA_EDIT_KEYS = [
	'title',
	'caption',
	'description',
	'alt_text',
	'post',
] as const;

// Scope media editor snackbars so they don't leak into the host editor/page.
export const MEDIA_EDITOR_NOTICES_CONTEXT = 'media-editor';

type PendingMetadataEdits = Record< string, unknown > | undefined;

export interface MediaEditorSaveResult {
	id: number;
	url?: string;
	media: Media;
	previous?: {
		id: number;
		url?: string;
	};
}

interface UseSaveMediaEditorArgs {
	session: MediaEditorSession;
	id: number;
	isImage: boolean;
	media?: Media | null;
	onSaved?: ( result: MediaEditorSaveResult ) => void;
	/**
	 * When another attachment has replaced the edited one (today, the original
	 * via "Restore original image"), the save targets the replacement:
	 * - with no fresh crop, the block is repointed at the replacement and any
	 *   changed details are saved there (no `/edit`);
	 * - with a fresh crop, `/edit` runs against the replacement's id and url.
	 */
	replacementSource?: {
		id: number;
		url?: string;
		media: Media;
	};
}

interface UseSaveMediaEditorReturn {
	isSaving: boolean;
	save: () => Promise< void >;
}

function getCropModifiers( session: MediaEditorSession ): Modifier[] {
	const { state } = session.cropper;
	if ( ! session.hasOutputEdits || ! state.image ) {
		return [];
	}
	return buildModifiers( state, {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	} );
}

function getMetadataEdits(
	pendingEdits: PendingMetadataEdits,
	media?: Media | null
): Record< string, unknown > {
	const metadataEdits: Record< string, unknown > = {};
	for ( const key of METADATA_EDIT_KEYS ) {
		if ( pendingEdits && key in pendingEdits ) {
			metadataEdits[ key ] = pendingEdits[ key ];
		}
	}
	// The `/edit` endpoint creates a new attachment for the crop and doesn't
	// inherit `post_parent` from the source (unlike title/caption/etc.), so
	// carry the existing value across when the user hasn't explicitly edited
	// it. Use a defined-check so an explicit `0` (unattached) is preserved.
	if ( ! ( 'post' in metadataEdits ) && media?.post !== undefined ) {
		metadataEdits.post = media.post;
	}
	return metadataEdits;
}

export function useSaveMediaEditor( {
	session,
	id,
	isImage,
	media,
	onSaved,
	replacementSource,
}: UseSaveMediaEditorArgs ): UseSaveMediaEditorReturn {
	const registry = useRegistry();
	const {
		clearEntityRecordEdits,
		receiveEntityRecords,
		saveEditedEntityRecord,
	} = useDispatch( coreStore );
	const { createErrorNotice, removeAllNotices } = useDispatch( noticesStore );
	const [ isSaving, setIsSaving ] = useState( false );

	const save = useCallback( async () => {
		removeAllNotices( 'snackbar', MEDIA_EDITOR_NOTICES_CONTEXT );
		setIsSaving( true );
		try {
			let saved: Media | null | undefined;
			const modifiers = getCropModifiers( session );

			// A replacement retargets the save; without one the current
			// attachment is both source and target as before.
			const targetId = replacementSource?.id ?? id;
			const targetUrl = replacementSource?.url ?? media?.source_url;
			const targetMedia = replacementSource?.media ?? media;

			// Both a fresh crop and a bare replacement swap the block's image,
			// so both offer an Undo back to the current attachment.
			const previous =
				( modifiers.length > 0 || replacementSource ) && media
					? {
							id,
							url: media.source_url,
						}
					: undefined;

			if ( modifiers.length > 0 ) {
				const pendingEdits = registry
					.select( coreStore )
					.getEntityRecordNonTransientEdits(
						'postType',
						'attachment',
						targetId
					) as PendingMetadataEdits;
				const metadataEdits = getMetadataEdits(
					pendingEdits,
					targetMedia
				);

				saved = ( await apiFetch( {
					path: `/wp/v2/media/${ targetId }/edit`,
					method: 'POST',
					data: {
						src: targetUrl,
						modifiers,
						...metadataEdits,
					},
				} ) ) as Media;

				if ( saved ) {
					receiveEntityRecords(
						'postType',
						'attachment',
						saved,
						undefined,
						true
					);
				}
			} else if (
				replacementSource &&
				! registry
					.select( coreStore )
					.hasEditsForEntityRecord(
						'postType',
						'attachment',
						targetId
					)
			) {
				// A bare replacement only repoints the block. The replacement
				// already exists and has no changes to persist.
				saved = replacementSource.media;
			} else {
				saved = ( await saveEditedEntityRecord(
					'postType',
					'attachment',
					targetId,
					{ throwOnError: true }
				) ) as Media | undefined;
			}

			const next = ( saved ?? targetMedia ) as Media | null;

			if ( next && next.id !== targetId ) {
				clearEntityRecordEdits( 'postType', 'attachment', targetId );
			}

			if ( next && next.id ) {
				if ( next.id === id ) {
					session.cropper.reset();
				}
				onSaved?.( {
					id: next.id,
					url: next.source_url,
					media: next,
					previous,
				} );
			}
		} catch ( error ) {
			const message =
				error instanceof Error
					? error.message
					: ( ( error as { message?: string } )?.message ??
						__( 'An unknown error occurred.' ) );
			createErrorNotice(
				isImage
					? sprintf(
							/* translators: %s: Error message. */
							__( 'Could not save image. %s' ),
							message
						)
					: sprintf(
							/* translators: %s: Error message. */
							__( 'Could not save media. %s' ),
							message
						),
				{
					type: 'snackbar',
					context: MEDIA_EDITOR_NOTICES_CONTEXT,
				}
			);
		} finally {
			setIsSaving( false );
		}
	}, [
		clearEntityRecordEdits,
		createErrorNotice,
		id,
		isImage,
		media,
		onSaved,
		receiveEntityRecords,
		registry,
		removeAllNotices,
		replacementSource,
		saveEditedEntityRecord,
		session,
	] );

	return { isSaving, save };
}
