import type { createRegistry } from '@wordpress/data';
import {
	ErrorCode,
	isClientSideMediaSupported,
	store as uploadStore,
	UploadError,
	type ImageEditModifier,
} from '@wordpress/upload-media';
import type { Media } from '../media-editor-provider';

type WPDataRegistry = ReturnType< typeof createRegistry >;

/**
 * Attachment fields the REST `/edit` endpoint copies from the source
 * attachment onto the edited one. The upload endpoint copies nothing, so
 * the client-side path has to carry them across itself.
 */
const COPIED_FIELDS = [
	'title',
	'caption',
	'description',
	'alt_text',
] as const;

type PendingEdits = Record< string, unknown > | undefined;

/**
 * Reads the raw value of an attachment field that the REST API may return
 * either as a string or as a `{ raw, rendered }` object.
 *
 * @param value Field value.
 * @return The raw string, or undefined when there is none.
 */
function getRawValue( value: unknown ): string | undefined {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( value && typeof value === 'object' ) {
		const { raw, rendered } = value as { raw?: string; rendered?: string };
		return raw ?? rendered;
	}
	return undefined;
}

/**
 * Whether the upload queue can process an image edit in the browser.
 *
 * Requires both browser support for client-side media processing and a
 * queue wired to a server transport that can sideload sub-sizes and
 * finalize the attachment, which the block editor provider sets up when
 * client-side media processing is enabled. Elsewhere (for example the
 * standalone media editor page) the edit stays on the server.
 *
 * @param registry Data registry.
 * @return Whether edits can be processed client-side.
 */
export function canEditImageClientSide( registry: WPDataRegistry ): boolean {
	if ( ! isClientSideMediaSupported() ) {
		return false;
	}
	const settings = registry.select( uploadStore ).getSettings();
	return (
		typeof settings?.mediaSideload === 'function' &&
		typeof settings?.mediaFinalize === 'function'
	);
}

/**
 * Resolves the URL of the attachment's original (full-size) file.
 *
 * `source_url` points at the `-scaled` copy when the upload exceeded the
 * big image size threshold; `media_details.original_image` then names the
 * unscaled file alongside it. Edits are applied to that original, as the
 * REST `/edit` endpoint does.
 *
 * @param media Attachment record.
 * @return The original file URL, or undefined when the record has none.
 */
export function getOriginalImageUrl( media: Media ): string | undefined {
	const sourceUrl = media.source_url;
	if ( ! sourceUrl ) {
		return undefined;
	}
	const originalImage = media.media_details?.original_image;
	if ( typeof originalImage === 'string' && originalImage ) {
		return sourceUrl.replace( /[^/]+$/, originalImage );
	}
	return sourceUrl;
}

/**
 * Builds the request data for the edited attachment.
 *
 * Pending Details-tab edits win; anything not edited is copied from the
 * source attachment, matching what the REST `/edit` endpoint does for its
 * new attachment. `post` is carried across explicitly so an explicit `0`
 * (unattached) is preserved.
 *
 * @param pendingEdits Unsaved attachment edits from core-data.
 * @param media        Source attachment record.
 * @return Additional data for the upload request.
 */
export function getEditedAttachmentData(
	pendingEdits: PendingEdits,
	media: Media
): Record< string, unknown > {
	const data: Record< string, unknown > = {};
	for ( const key of COPIED_FIELDS ) {
		const value = getRawValue(
			pendingEdits && key in pendingEdits
				? pendingEdits[ key ]
				: media[ key ]
		);
		if ( value !== undefined ) {
			data[ key ] = value;
		}
	}
	const post =
		pendingEdits && 'post' in pendingEdits ? pendingEdits.post : media.post;
	if ( post !== undefined ) {
		data.post = post;
	}
	return data;
}

/**
 * Downloads the attachment's original file.
 *
 * @param media Attachment record.
 * @return The file, or null when it could not be fetched.
 */
async function fetchOriginalImage( media: Media ): Promise< File | null > {
	const url = getOriginalImageUrl( media );
	if ( ! url ) {
		return null;
	}
	try {
		const response = await fetch( url );
		if ( ! response.ok ) {
			return null;
		}
		const blob = await response.blob();
		const fileName = decodeURIComponent(
			url.split( '?' )[ 0 ].split( '/' ).pop() ?? 'image'
		);
		return new File( [ blob ], fileName, {
			type: media.mime_type || blob.type,
		} );
	} catch {
		return null;
	}
}

interface EditImageClientSideArgs {
	registry: WPDataRegistry;
	media: Media;
	modifiers: ImageEditModifier[];
	additionalData: Record< string, unknown >;
}

/**
 * Applies edits to an attachment's image in the browser and uploads the
 * result as a new attachment through the upload queue.
 *
 * Resolves to `null` whenever the client-side path is unavailable or fails
 * before anything reaches the server, so the caller can fall back to the
 * REST `/edit` endpoint. Rejects when the upload itself fails.
 *
 * @param $0
 * @param $0.registry       Data registry.
 * @param $0.media          Attachment record being edited.
 * @param $0.modifiers      Edits to apply, in order.
 * @param $0.additionalData Fields for the new attachment.
 * @return The new attachment's ID, or null to fall back to the server.
 */
export async function editImageClientSide( {
	registry,
	media,
	modifiers,
	additionalData,
}: EditImageClientSideArgs ): Promise< number | null > {
	if ( ! media.id || ! canEditImageClientSide( registry ) ) {
		return null;
	}

	const file = await fetchOriginalImage( media );
	if ( ! file ) {
		return null;
	}

	return new Promise< number | null >( ( resolve, reject ) => {
		void registry.dispatch( uploadStore ).addEditedImage( {
			file,
			modifiers,
			sourceAttachmentId: media.id,
			additionalData,
			onSuccess: ( [ attachment ] ) => {
				if ( attachment?.id ) {
					resolve( attachment.id );
				} else {
					reject(
						new Error( 'Upload did not return an attachment' )
					);
				}
			},
			onError: ( error ) => {
				// The edit itself failed (unsupported format, decode error)
				// and nothing was uploaded, so the server can still try.
				if (
					error instanceof UploadError &&
					error.code === ErrorCode.IMAGE_EDIT_ERROR
				) {
					resolve( null );
					return;
				}
				reject( error );
			},
		} );
	} );
}
