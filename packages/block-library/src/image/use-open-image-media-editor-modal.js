/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSyncedImageBlockAttributes } from './utils';
import { unlock } from '../lock-unlock';

const { openMediaEditorModalKey } = unlock( blockEditorPrivateApis );

function getAttachmentFallbackForEmptyBlockMetadata( { alt, caption } ) {
	const attachment = {};

	if ( ! alt ) {
		attachment.alt_text = '';
	}

	if ( ! caption ) {
		attachment.caption = '';
	}

	return Object.keys( attachment ).length ? attachment : undefined;
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
	const blockMetadataRef = useRef( { alt, caption } );
	const mediaEditorMetadataBaselineRef = useRef();
	const mediaEditorMetadataSyncRequestRef = useRef( 0 );

	useEffect( () => {
		blockMetadataRef.current = { alt, caption };
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
				) || getEntityRecord( 'postType', 'attachment', attachmentId )
			);
		},
		[ registry ]
	);

	const resolveAttachmentRecord = useCallback(
		async ( attachmentId ) => {
			try {
				return await registry
					.resolveSelect( coreStore )
					.getEntityRecord( 'postType', 'attachment', attachmentId );
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
				{ context: 'view' },
			] );

			try {
				return await registry
					.resolveSelect( coreStore )
					.getEntityRecord( 'postType', 'attachment', attachmentId );
			} catch {
				return undefined;
			}
		},
		[ registry ]
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
		const needsOriginalAttachmentRecord =
			! cachedAttachmentRecord &&
			( blockMetadataRef.current.alt ||
				blockMetadataRef.current.caption );

		mediaEditorMetadataBaselineRef.current = needsOriginalAttachmentRecord
			? ( await resolveAttachmentRecord( id ) ) ||
			  fallbackAttachmentRecord
			: cachedAttachmentRecord || fallbackAttachmentRecord;
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
