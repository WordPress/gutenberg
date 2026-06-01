/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

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

const { openMediaEditorModalKey } = unlock( blockEditorPrivateApis );
// Caption sync needs `caption.raw`; view/default attachment records can contain
// only rendered caption data or be tied to an in-flight stale resolution.
const ATTACHMENT_EDIT_QUERY = { context: 'edit' };

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
} ) {
	// Keep this hook private to the Image block and pass the block attributes
	// object so the callsite stays compact. Destructure only the attributes
	// currently used for metadata sync; add more here if the sync policy grows.
	const { id, url, alt, caption } = attributes;
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
		};
	}, [ alt, caption, id, url ] );

	const getCachedAttachmentRecord = useCallback(
		( attachmentId ) => {
			const { getEditedEntityRecord, getEntityRecord } =
				registry.select( coreStore );
			return (
				getEditedEntityRecord(
					'postType',
					'attachment',
					attachmentId
				) ||
				getEntityRecord(
					'postType',
					'attachment',
					attachmentId,
					ATTACHMENT_EDIT_QUERY
				) ||
				getEntityRecord( 'postType', 'attachment', attachmentId )
			);
		},
		[ registry ]
	);

	const resolveAttachmentRecord = useCallback(
		async ( attachmentId ) => {
			const resolveSelect = registry.resolveSelect( coreStore );

			try {
				return (
					( await resolveSelect.getEntityRecord(
						'postType',
						'attachment',
						attachmentId,
						ATTACHMENT_EDIT_QUERY
					) ) ||
					( await resolveSelect.getEntityRecord(
						'postType',
						'attachment',
						attachmentId
					) )
				);
			} catch {
				return undefined;
			}
		},
		[ registry ]
	);

	const resolveFreshAttachmentRecord = useCallback(
		async ( attachmentId ) => {
			// Bust cached records so resolveAttachmentRecord fetches the
			// server state that reflects the media editor's saved changes.
			const { invalidateResolution } = registry.dispatch( coreStore );

			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachmentId,
			] );
			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachmentId,
				ATTACHMENT_EDIT_QUERY,
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

			if ( newId !== currentBlockAttributes.id ) {
				nextAttributes.id = newId;
				nextAttributes.url = newUrl ?? currentBlockAttributes.url;
				blockAttributesRef.current = {
					...blockAttributesRef.current,
					id: nextAttributes.id,
					url: nextAttributes.url,
				};
			}

			if ( originalAttachment ) {
				// Fetch fresh server state so the comparison reflects what
				// the media editor actually saved, not a potentially stale
				// cache.
				const resolvedAttachment =
					await resolveFreshAttachmentRecord( newId );

				// A newer update started while we were awaiting; discard
				// this one.
				if (
					syncRequest !== mediaEditorMetadataSyncRequestRef.current
				) {
					return;
				}

				// Sync alt text and caption back to the block only when
				// they were changed in the media editor. Fields the user
				// has independently customised on the block (i.e. values
				// that don't match the pre-session attachment metadata)
				// are left untouched.
				const latestBlockAttributes = blockAttributesRef.current;
				const resolvedMetadataAttributes =
					getSyncedImageBlockAttributes(
						latestBlockAttributes,
						originalAttachment,
						resolvedAttachment
					);

				if ( Object.keys( resolvedMetadataAttributes ).length ) {
					Object.assign( nextAttributes, resolvedMetadataAttributes );
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
		[ resolveFreshAttachmentRecord, setAttributes ]
	);

	const openImageMediaEditorModal = useCallback( async () => {
		if ( ! id || ! openMediaEditorModal ) {
			return;
		}

		// Snapshot the attachment's current metadata before the user makes
		// any changes so handleMediaUpdate can compare against it later.
		// Prefer a freshly resolved edit-context record for accuracy; fall
		// back to whatever is in the cache, or a minimal object derived from
		// the block's own attributes when nothing is cached yet.
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
