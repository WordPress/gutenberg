import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { Media } from '../media-editor-provider';
import type { MediaEditorController } from '../../state';
import {
	buildModifiers,
	type Modifier,
} from '../media-editor-modal/build-modifiers';
import {
	createPendingCropPreview,
	getPendingCropperState,
	type MediaEditorPendingCrop,
} from './pending-crop';

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
	/**
	 * Set when the crop was deferred rather than saved. `id` and `url` are
	 * then still the original's, and the host commits the crop later.
	 */
	pendingCrop?: MediaEditorPendingCrop;
}

interface UseSaveMediaEditorArgs {
	cropper: MediaEditorController;
	/**
	 * Hand a crop back to the host as a pending edit instead of saving it.
	 * Details edits are still saved straight away.
	 */
	deferCrop?: boolean;
	id: number;
	isImage: boolean;
	media?: Media | null;
	onSaved?: ( result: MediaEditorSaveResult ) => void;
}

interface UseSaveMediaEditorReturn {
	isSaving: boolean;
	save: () => Promise< void >;
}

function getCropModifiers( cropper: MediaEditorController ): Modifier[] {
	if ( ! cropper.isCropperDirty || ! cropper.state.image ) {
		return [];
	}
	return buildModifiers( cropper.state, {
		width: cropper.state.image.naturalWidth,
		height: cropper.state.image.naturalHeight,
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

/**
 * Builds a pending crop, or returns `undefined` if its preview can't be
 * rendered, in which case the caller saves the crop straight away instead.
 *
 * @param cropper   The editor controller.
 * @param modifiers The crop's `/edit` modifiers.
 * @param mimeType  The original's MIME type.
 * @return The pending crop, or `undefined`.
 */
async function getPendingCrop(
	cropper: MediaEditorController,
	modifiers: Modifier[],
	mimeType?: string
): Promise< MediaEditorPendingCrop | undefined > {
	try {
		return {
			modifiers,
			cropperState: getPendingCropperState( cropper.state ),
			aspectRatioValue: cropper.cropOptions.aspectRatioValue,
			previewUrl: await createPendingCropPreview(
				cropper.state,
				mimeType
			),
		};
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn(
			'Could not preview the crop, so it will be saved now.',
			error
		);
		return undefined;
	}
}

export function useSaveMediaEditor( {
	cropper,
	deferCrop = false,
	id,
	isImage,
	media,
	onSaved,
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
			const modifiers = getCropModifiers( cropper );
			const pendingCrop =
				deferCrop && modifiers.length > 0
					? await getPendingCrop(
							cropper,
							modifiers,
							media?.mime_type
						)
					: undefined;

			if ( pendingCrop ) {
				// The crop is the host's to commit. Only Details edits, which
				// belong to this attachment either way, are saved now.
				saved = ( await saveEditedEntityRecord(
					'postType',
					'attachment',
					id
				) ) as Media | undefined;
				const next = ( saved ?? media ) as Media | null;
				if ( next ) {
					onSaved?.( {
						id,
						url: next.source_url,
						media: next,
						pendingCrop,
					} );
				}
				return;
			}

			const previous =
				modifiers.length > 0 && media
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
						id
					) as PendingMetadataEdits;
				const metadataEdits = getMetadataEdits( pendingEdits, media );

				saved = ( await apiFetch( {
					path: `/wp/v2/media/${ id }/edit`,
					method: 'POST',
					data: {
						src: media?.source_url,
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
			} else {
				saved = ( await saveEditedEntityRecord(
					'postType',
					'attachment',
					id
				) ) as Media | undefined;
			}

			const next = ( saved ?? media ) as Media | null;

			if ( next && next.id !== id ) {
				clearEntityRecordEdits( 'postType', 'attachment', id );
			}

			if ( next && next.id ) {
				if ( next.id === id ) {
					cropper.reset();
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
		cropper,
		deferCrop,
		id,
		isImage,
		media,
		onSaved,
		receiveEntityRecords,
		registry,
		removeAllNotices,
		saveEditedEntityRecord,
	] );

	return { isSaving, save };
}
