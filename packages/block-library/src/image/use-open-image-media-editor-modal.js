import { store as coreStore } from '@wordpress/core-data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { unlock } from '../lock-unlock';
import {
	DEFAULT_MEDIA_SIZE_SLUG,
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_MEDIA,
} from './constants';

function normalizeImageBlockCaption( caption ) {
	if ( typeof caption !== 'string' ) {
		return '';
	}

	const textContent = stripHTML( caption ).trim();

	if ( ! textContent ) {
		return '';
	}

	return caption.replace( /\n/g, '<br>' );
}

function getAttachmentCaption( attachment ) {
	const caption = attachment?.caption;

	if ( typeof caption === 'string' ) {
		return normalizeImageBlockCaption( caption );
	}

	if (
		caption &&
		typeof caption === 'object' &&
		Object.hasOwn( caption, 'raw' )
	) {
		return normalizeImageBlockCaption( caption.raw );
	}

	return undefined;
}

export function getImageBlockMetadataFromAttachment( attachment ) {
	return {
		alt:
			typeof attachment?.alt_text === 'string'
				? attachment.alt_text
				: attachment?.alt || '',
		caption: getAttachmentCaption( attachment ),
	};
}

function normalizeMetadataAttribute( value ) {
	return value || '';
}

export function getSyncedImageBlockAttributes(
	currentAttributes,
	originalAttachment,
	updatedAttachment
) {
	if ( ! originalAttachment || ! updatedAttachment ) {
		return {};
	}

	const originalMetadata =
		getImageBlockMetadataFromAttachment( originalAttachment );
	const updatedMetadata =
		getImageBlockMetadataFromAttachment( updatedAttachment );
	const syncedAttributes = {};

	const normalizedCurrentAlt = normalizeMetadataAttribute(
		currentAttributes.alt
	);
	if (
		originalMetadata.alt !== updatedMetadata.alt &&
		( normalizedCurrentAlt === originalMetadata.alt ||
			! normalizedCurrentAlt )
	) {
		syncedAttributes.alt = updatedMetadata.alt;
	}

	const normalizedCurrentCaption = normalizeMetadataAttribute(
		currentAttributes.caption
	);
	if (
		originalMetadata.caption !== undefined &&
		updatedMetadata.caption !== undefined &&
		originalMetadata.caption !== updatedMetadata.caption &&
		( normalizedCurrentCaption === originalMetadata.caption ||
			! normalizedCurrentCaption )
	) {
		syncedAttributes.caption = updatedMetadata.caption || undefined;
	}

	return syncedAttributes;
}

/**
 * Resolves the attributes needed to keep the selected image size on a new
 * attachment.
 *
 * WordPress skips generating a sub-size larger than the file itself, so the
 * selected size may not exist on the edited image; fall back to full when it
 * doesn't.
 *
 * @param {string|undefined} sizeSlug   The block's currently selected size.
 * @param {Object}           attachment The new attachment record.
 *
 * @return {Object|undefined} Attributes to apply, if any.
 */
function getNewAttachmentSizeAttributes( sizeSlug, attachment ) {
	const sizes = attachment.media_details?.sizes;

	if ( ! sizeSlug || sizeSlug === DEFAULT_MEDIA_SIZE_SLUG || ! sizes ) {
		return undefined;
	}

	const sizeUrl = sizes[ sizeSlug ]?.source_url;

	if ( sizeUrl ) {
		return { url: sizeUrl };
	}

	const fullUrl = attachment.source_url ?? sizes.full?.source_url;

	return fullUrl
		? { url: fullUrl, sizeSlug: DEFAULT_MEDIA_SIZE_SLUG }
		: undefined;
}

/**
 * Resolves the link attributes needed to keep the block's link pointing at the
 * new attachment.
 *
 * Only the destinations derived from the attachment follow the edited image. A
 * `custom` link is the user's own URL and a `none` link has nothing to point
 * at, so both are left alone. When the record doesn't carry the field, the
 * existing link is kept rather than cleared.
 *
 * @param {string|undefined} linkDestination The block's link destination.
 * @param {Object}           attachment      The new attachment record.
 *
 * @return {Object|undefined} Attributes to apply, if any.
 */
function getNewAttachmentLinkAttributes( linkDestination, attachment ) {
	// Media file links point at the full-size file, independently of the size
	// the block renders.
	if ( linkDestination === LINK_DESTINATION_MEDIA ) {
		return attachment.source_url
			? { href: attachment.source_url }
			: undefined;
	}

	if ( linkDestination === LINK_DESTINATION_ATTACHMENT ) {
		return attachment.link ? { href: attachment.link } : undefined;
	}

	return undefined;
}

/**
 * Resolves the block attributes that are derived from the attachment, for an
 * edit that saved to a different one.
 *
 * Editing media (crop, rotate, flip) creates a new attachment with its own
 * generated sub-sizes and its own attachment page, and the media editor
 * reports the full-size file. Without re-deriving these, the size control
 * keeps reporting e.g. "Medium" while the block renders the full-size image,
 * and a "Media file" or "Attachment page" link still points at the image as it
 * was before the edit. Everything else the user set on the block — dimensions,
 * lightbox, title, custom links — is left untouched.
 *
 * @param {Object}           blockAttributes The block's current attributes.
 * @param {Object|undefined} attachment      The new attachment record.
 *
 * @return {Object|undefined} Attributes to apply, or undefined when the
 *                            attachment record isn't known yet.
 */
export function getNewAttachmentImageBlockAttributes(
	blockAttributes,
	attachment
) {
	if ( ! attachment ) {
		return undefined;
	}

	return {
		...getNewAttachmentSizeAttributes(
			blockAttributes.sizeSlug,
			attachment
		),
		...getNewAttachmentLinkAttributes(
			blockAttributes.linkDestination,
			attachment
		),
	};
}

const { openMediaEditorModalKey } = unlock( blockEditorPrivateApis );

function getAttachmentFallbackForEmptyBlockMetadata( { alt, caption } ) {
	const attachment = {};

	if ( ! alt ) {
		attachment.alt_text = '';
	}

	if ( ! caption?.toString() ) {
		attachment.caption = '';
	}

	return Object.keys( attachment ).length ? attachment : undefined;
}

function hasKnownAttachmentMetadata( attachment ) {
	if ( ! attachment ) {
		return false;
	}

	const hasKnownAlt =
		typeof attachment.alt_text === 'string' ||
		typeof attachment.alt === 'string';
	const hasKnownCaption =
		getImageBlockMetadataFromAttachment( attachment ).caption !== undefined;

	return hasKnownAlt && hasKnownCaption;
}

export function useOpenImageMediaEditorModal( {
	attributes,
	setAttributes,
	onClose,
	onUrlChange,
} ) {
	// Keep this hook private to the Image block and pass the block attributes
	// object so the callsite stays compact. Destructure only the attributes
	// the update needs to read — those synced from the attachment's metadata,
	// and those derived from which attachment the block points at; add more
	// here if the sync policy grows.
	const { id, url, alt, caption, sizeSlug, linkDestination } = attributes;
	const registry = useRegistry();
	const openMediaEditorModal = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()[ openMediaEditorModalKey ],
		[]
	);
	// Track the block's current attachment and metadata in a ref so
	// handleMediaUpdate can read the latest values without being listed as
	// dependencies (which would recreate the callback and re-register the
	// onUpdate handler on every block change while the modal is open).
	const blockAttributesRef = useRef( {
		id,
		url,
		alt,
		caption: caption?.toString(),
		sizeSlug,
		linkDestination,
	} );
	// Snapshot of the attachment's metadata taken just before the modal opens,
	// used as the baseline for detecting what changed during the editing session.
	const mediaEditorMetadataBaselineRef = useRef();
	// Incremented on every handleMediaUpdate call; stale async continuations
	// check against this to bail out if a newer update has since started.
	const mediaEditorMetadataSyncRequestRef = useRef( 0 );

	useEffect( () => {
		blockAttributesRef.current = {
			id,
			url,
			alt,
			caption: caption?.toString(),
			sizeSlug,
			linkDestination,
		};
	}, [ alt, caption, id, linkDestination, sizeSlug, url ] );

	// Reads the cached attachment record. The `attachment` postType entity
	// fetches with `context: 'edit'` by default, so `getEditedEntityRecord`
	// returns the edit-context record — carrying `caption` as `{ raw }` and a
	// usable `alt_text` — without us specifying a context. It is resolver-
	// backed, so on a cold cache this also kicks off the fetch and returns a
	// falsy value synchronously; that resolution shares its cache key with the
	// `resolveAttachmentRecord` call below (both keyed on the no-query
	// `getEntityRecord`), so the two dedupe into a single request.
	const getCachedAttachmentRecord = useCallback(
		( attachmentId ) =>
			registry
				.select( coreStore )
				.getEditedEntityRecord(
					'postType',
					'attachment',
					attachmentId
				),
		[ registry ]
	);

	const resolveAttachmentRecord = useCallback(
		async ( attachmentId ) => {
			const resolveSelect = registry.resolveSelect( coreStore );

			try {
				return await resolveSelect.getEntityRecord(
					'postType',
					'attachment',
					attachmentId
				);
			} catch {
				return undefined;
			}
		},
		[ registry ]
	);

	const resolveFreshAttachmentRecord = useCallback(
		async ( attachmentId ) => {
			// Invalidate the cached resolution so resolveAttachmentRecord
			// re-fetches the server state that reflects the media editor's
			// saved changes.
			const { invalidateResolution } = registry.dispatch( coreStore );

			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachmentId,
			] );
			return resolveAttachmentRecord( attachmentId );
		},
		[ registry, resolveAttachmentRecord ]
	);

	const handleMediaUpdate = useCallback(
		async ( { id: newId, url: newUrl } ) => {
			if ( typeof newId !== 'number' ) {
				return;
			}

			// Capture and clear the baseline so a rapid second save doesn't
			// reuse a stale snapshot.
			const originalAttachment = mediaEditorMetadataBaselineRef.current;
			mediaEditorMetadataBaselineRef.current = undefined;
			const syncRequest = ++mediaEditorMetadataSyncRequestRef.current;
			const nextAttributes = {};

			const currentBlockAttributes = blockAttributesRef.current;
			const isNewAttachment = newId !== currentBlockAttributes.id;

			if ( isNewAttachment ) {
				nextAttributes.id = newId;
				nextAttributes.url = newUrl ?? currentBlockAttributes.url;
				if ( nextAttributes.url !== currentBlockAttributes.url ) {
					// The block is about to point at a freshly generated file
					// the browser hasn't loaded yet; let the caller show a
					// loading state until its <img> fires load/error. Raising
					// it here, before anything is awaited, keeps the rest of
					// this update behind that loading state: the attributes
					// land in a single `setAttributes` at the end, so the
					// image never renders against half-updated settings.
					onUrlChange?.( nextAttributes.url );
				}
				blockAttributesRef.current = {
					...blockAttributesRef.current,
					id: nextAttributes.id,
					url: nextAttributes.url,
				};
			}

			if ( originalAttachment || isNewAttachment ) {
				// Fetch fresh server state so this reflects what the media
				// editor actually saved, not a potentially stale cache.
				const resolvedAttachment =
					await resolveFreshAttachmentRecord( newId );

				// A newer update started while we were awaiting; discard
				// this one.
				if (
					syncRequest !== mediaEditorMetadataSyncRequestRef.current
				) {
					return;
				}

				// A failed refetch returns nothing, which would leave the
				// block pointing at the new file while its size and link
				// still describe the old one. The record the media editor
				// received when it saved is already in the store, so fall
				// back to that rather than half-updating the block.
				const attachmentRecord =
					resolvedAttachment ?? getCachedAttachmentRecord( newId );

				const latestBlockAttributes = blockAttributesRef.current;

				// Sync alt text and caption back to the block only when
				// they were changed in the media editor. Fields the user
				// has independently customised on the block (i.e. values
				// that don't match the pre-session attachment metadata)
				// are left untouched. Without a baseline there's no way to
				// tell the two apart, so nothing is synced.
				if ( originalAttachment ) {
					const resolvedMetadataAttributes =
						getSyncedImageBlockAttributes(
							latestBlockAttributes,
							originalAttachment,
							attachmentRecord
						);

					if ( Object.keys( resolvedMetadataAttributes ).length ) {
						Object.assign(
							nextAttributes,
							resolvedMetadataAttributes
						);
					}
				}

				if ( isNewAttachment ) {
					const derivedAttributes =
						getNewAttachmentImageBlockAttributes(
							latestBlockAttributes,
							attachmentRecord
						);

					if ( derivedAttributes ) {
						Object.assign( nextAttributes, derivedAttributes );

						// The URL announced before the resolve was the
						// full-size file the media editor reported, and
						// deriving the selected size can change it.
						// Re-announce so the pending swap names the file
						// that actually lands: an update that is undone or
						// superseded never changes the <img> src, and the
						// block then clears its loading state by matching
						// the pending URL against the rendered one.
						if (
							derivedAttributes.url &&
							derivedAttributes.url !== latestBlockAttributes.url
						) {
							onUrlChange?.( derivedAttributes.url );
						}
					}
				}
			}

			if ( Object.keys( nextAttributes ).length ) {
				blockAttributesRef.current = {
					...blockAttributesRef.current,
					...nextAttributes,
				};
				setAttributes( nextAttributes );
			}
		},
		[
			getCachedAttachmentRecord,
			onUrlChange,
			resolveFreshAttachmentRecord,
			setAttributes,
		]
	);

	const openImageMediaEditorModal = useCallback( async () => {
		if ( ! id || ! openMediaEditorModal ) {
			return;
		}

		// Snapshot the attachment's current metadata before the user makes
		// any changes so handleMediaUpdate can compare against it later. Use
		// the cached record when it's already present; only resolve when
		// nothing is cached yet, then fall back to a minimal object derived
		// from the block's own attributes.
		const cachedAttachmentRecord = getCachedAttachmentRecord( id );
		const fallbackAttachmentRecord =
			getAttachmentFallbackForEmptyBlockMetadata(
				blockAttributesRef.current
			);
		const resolvedAttachmentRecord = hasKnownAttachmentMetadata(
			cachedAttachmentRecord
		)
			? undefined
			: await resolveAttachmentRecord( id );

		mediaEditorMetadataBaselineRef.current =
			resolvedAttachmentRecord ||
			( hasKnownAttachmentMetadata( cachedAttachmentRecord )
				? cachedAttachmentRecord
				: fallbackAttachmentRecord ) ||
			cachedAttachmentRecord;

		openMediaEditorModal( {
			id,
			onUpdate: handleMediaUpdate,
			onClose,
		} );
	}, [
		getCachedAttachmentRecord,
		handleMediaUpdate,
		id,
		onClose,
		openMediaEditorModal,
		resolveAttachmentRecord,
	] );

	return id && openMediaEditorModal ? openImageMediaEditorModal : undefined;
}
