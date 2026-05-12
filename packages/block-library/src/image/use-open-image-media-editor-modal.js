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

export function useOpenImageMediaEditorModal( { attributes, setAttributes } ) {
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
	const blockMetadataRef = useRef( { alt, caption: caption?.toString() } );
	const mediaEditorMetadataBaselineRef = useRef();
	const mediaEditorMetadataSyncRequestRef = useRef( 0 );

	useEffect( () => {
		blockMetadataRef.current = { alt, caption: caption?.toString() };
	}, [ alt, caption ] );

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
			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachmentId,
				{ context: 'view' },
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

			const originalAttachment = mediaEditorMetadataBaselineRef.current;
			mediaEditorMetadataBaselineRef.current = undefined;
			const syncRequest = ++mediaEditorMetadataSyncRequestRef.current;
			const nextAttributes = {};

			if ( newId !== id ) {
				Object.assign( nextAttributes, {
					id: newId,
					url: newUrl ?? url,
				} );
			}

			if ( Object.keys( nextAttributes ).length ) {
				setAttributes( nextAttributes );
			}

			if ( ! originalAttachment ) {
				return;
			}

			const resolvedAttachment =
				await resolveFreshAttachmentRecord( newId );

			if ( syncRequest !== mediaEditorMetadataSyncRequestRef.current ) {
				return;
			}

			const resolvedMetadataAttributes = getSyncedImageBlockAttributes(
				blockMetadataRef.current,
				originalAttachment,
				resolvedAttachment
			);

			if ( Object.keys( resolvedMetadataAttributes ).length ) {
				setAttributes( resolvedMetadataAttributes );
				blockMetadataRef.current = {
					...blockMetadataRef.current,
					...resolvedMetadataAttributes,
				};
			}
		},
		[ id, resolveFreshAttachmentRecord, setAttributes, url ]
	);

	const openImageMediaEditorModal = useCallback( async () => {
		if ( ! id || ! openMediaEditorModal ) {
			return;
		}

		const cachedAttachmentRecord = getCachedAttachmentRecord( id );
		const fallbackAttachmentRecord =
			getAttachmentFallbackForEmptyBlockMetadata(
				blockMetadataRef.current
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
		} );
	}, [
		getCachedAttachmentRecord,
		handleMediaUpdate,
		id,
		openMediaEditorModal,
		resolveAttachmentRecord,
	] );

	return id && openMediaEditorModal ? openImageMediaEditorModal : undefined;
}
