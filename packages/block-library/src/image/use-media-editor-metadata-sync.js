/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSyncedImageBlockAttributes } from './utils';

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

export function useMediaEditorMetadataSync( {
	attributes,
	image,
	setAttributes,
	openMediaEditorModal,
} ) {
	// Keep this hook private to the Image block and pass the block attributes
	// object so the callsite stays compact. Destructure only the attributes
	// currently used for metadata sync; add more here if the sync policy grows.
	const { id, url, alt, caption } = attributes;
	const registry = useRegistry();
	const blockMetadataRef = useRef( { alt, caption } );
	const mediaEditorMetadataBaselineRef = useRef();
	const mediaEditorMetadataSyncRequestRef = useRef( 0 );

	useEffect( () => {
		blockMetadataRef.current = { alt, caption };
	}, [ alt, caption ] );

	const getCachedAttachmentRecord = useCallback(
		( attachmentId, includeViewRecord = true ) => {
			const { getEditedEntityRecord, getEntityRecord } =
				registry.select( coreStore );
			const editedRecord = getEditedEntityRecord(
				'postType',
				'attachment',
				attachmentId
			);

			if ( editedRecord ) {
				return editedRecord;
			}

			const defaultRecord = getEntityRecord(
				'postType',
				'attachment',
				attachmentId
			);

			if ( defaultRecord || ! includeViewRecord ) {
				return defaultRecord;
			}

			return (
				getEntityRecord( 'postType', 'attachment', attachmentId, {
					context: 'view',
				} ) || ( attachmentId === id ? image : undefined )
			);
		},
		[ id, image, registry ]
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
				try {
					return await registry
						.resolveSelect( coreStore )
						.getEntityRecord(
							'postType',
							'attachment',
							attachmentId,
							{
								context: 'view',
							}
						);
				} catch {
					return undefined;
				}
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

	return useCallback( () => {
		if ( ! id || ! openMediaEditorModal ) {
			return;
		}

		mediaEditorMetadataBaselineRef.current =
			getCachedAttachmentRecord( id ) ||
			getAttachmentFallbackForEmptyBlockMetadata(
				blockMetadataRef.current
			);
		openMediaEditorModal( {
			id,
			onUpdate: handleMediaUpdate,
		} );
	}, [
		getCachedAttachmentRecord,
		handleMediaUpdate,
		id,
		openMediaEditorModal,
	] );
}
