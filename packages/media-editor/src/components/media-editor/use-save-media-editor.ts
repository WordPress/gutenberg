/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { Media } from '../media-editor-provider';
import type { MediaEditorController } from '../../state';
import {
	buildModifiers,
	buildExifOrientationModifiers,
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

const HEIC_SOURCE_IMAGE_REGEX = /\.hei[cf]$/i;
const NON_SAFARI_IOS_BROWSER_REGEX = /\b(CriOS|FxiOS|EdgiOS|OPiOS)\b/;

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
	cropper: MediaEditorController;
	id: number;
	isImage: boolean;
	media?: Media | null;
	onSaved?: ( result: MediaEditorSaveResult ) => void;
}

interface UseSaveMediaEditorReturn {
	isSaving: boolean;
	save: () => Promise< void >;
}

function isMobileSafari() {
	if ( typeof navigator === 'undefined' ) {
		return false;
	}

	const { userAgent, platform, maxTouchPoints } = navigator;
	const isIOS =
		/iP(ad|hone|od)/.test( userAgent ) ||
		( platform === 'MacIntel' && maxTouchPoints > 1 );

	return (
		isIOS &&
		/Safari\//.test( userAgent ) &&
		! NON_SAFARI_IOS_BROWSER_REGEX.test( userAgent )
	);
}

function isHeicSourceImage( media?: Media | null ): boolean {
	const sourceImage = media?.media_details?.source_image;
	return (
		typeof sourceImage === 'string' &&
		HEIC_SOURCE_IMAGE_REGEX.test( sourceImage )
	);
}

export function getHeicExifOrientationModifiers(
	media?: Media | null,
	isMobileSafariBrowser = isMobileSafari()
): Modifier[] {
	const orientation = Number( media?.exif_orientation );
	if (
		! isMobileSafariBrowser ||
		! isHeicSourceImage( media ) ||
		! Number.isInteger( orientation )
	) {
		return [];
	}

	return buildExifOrientationModifiers( orientation );
}

function getCropModifiers(
	cropper: MediaEditorController,
	media?: Media | null
): Modifier[] {
	if ( ! cropper.isCropperDirty || ! cropper.state.image ) {
		return [];
	}
	const modifiers = buildModifiers( cropper.state, {
		width: cropper.state.image.naturalWidth,
		height: cropper.state.image.naturalHeight,
	} );

	if ( modifiers.length === 0 ) {
		return modifiers;
	}

	return [ ...getHeicExifOrientationModifiers( media ), ...modifiers ];
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
	cropper,
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
			const modifiers = getCropModifiers( cropper, media );
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
					: ( error as { message?: string } )?.message ??
					  __( 'An unknown error occurred.' );
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
