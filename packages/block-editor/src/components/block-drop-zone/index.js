/**
 * WordPress dependencies
 */
import { __unstableUseDropZone as useDropZone } from '@wordpress/components';
import {
	pasteHandler,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';

const parseDropEvent = ( event ) => {
	let result = {
		srcRootClientId: null,
		srcClientId: null,
		srcIndex: null,
		type: null,
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign(
			result,
			JSON.parse( event.dataTransfer.getData( 'text' ) )
		);
	} catch ( err ) {
		return result;
	}

	return result;
};

export default function useBlockDropZone( { element, rootClientId } ) {
	const [ clientId, setClientId ] = useState( null );

	function selector( select ) {
		const {
			getBlockIndex,
			getClientIdsOfDescendants,
			getSettings,
			getTemplateLock,
		} = select( 'core/block-editor' );
		return {
			getBlockIndex,
			blockIndex: getBlockIndex( clientId, rootClientId ),
			getClientIdsOfDescendants,
			hasUploadPermissions: !! getSettings().mediaUpload,
			isLockedAll: getTemplateLock( rootClientId ) === 'all',
		};
	}

	const {
		getBlockIndex,
		blockIndex,
		getClientIdsOfDescendants,
		hasUploadPermissions,
		isLockedAll,
	} = useSelect( selector, [ rootClientId, clientId ] );
	const {
		insertBlocks,
		updateBlockAttributes,
		moveBlockToPosition,
	} = useDispatch( 'core/block-editor' );

	const onFilesDrop = useCallback(
		( files ) => {
			if ( ! hasUploadPermissions ) {
				return;
			}

			const transformation = findTransform(
				getBlockTransforms( 'from' ),
				( transform ) =>
					transform.type === 'files' && transform.isMatch( files )
			);

			if ( transformation ) {
				const blocks = transformation.transform(
					files,
					updateBlockAttributes
				);
				insertBlocks( blocks, blockIndex, rootClientId );
			}
		},
		[
			hasUploadPermissions,
			updateBlockAttributes,
			insertBlocks,
			blockIndex,
			rootClientId,
		]
	);

	const onHTMLDrop = useCallback(
		( HTML ) => {
			const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

			if ( blocks.length ) {
				insertBlocks( blocks, blockIndex, rootClientId );
			}
		},
		[ insertBlocks, blockIndex, rootClientId ]
	);

	const onDrop = useCallback(
		( event ) => {
			const {
				srcRootClientId,
				srcClientId,
				srcIndex,
				type,
			} = parseDropEvent( event );

			const isBlockDropType = ( dropType ) => dropType === 'block';
			const isSameLevel = ( srcRoot, dstRoot ) => {
				// Note that rootClientId of top-level blocks will be undefined OR a void string,
				// so we also need to account for that case separately.
				return (
					srcRoot === dstRoot ||
					( ! srcRoot === true && ! dstRoot === true )
				);
			};
			const isSameBlock = ( src, dst ) => src === dst;
			const isSrcBlockAnAncestorOfDstBlock = ( src, dst ) =>
				getClientIdsOfDescendants( [ src ] ).some(
					( id ) => id === dst
				);

			if (
				! isBlockDropType( type ) ||
				isSameBlock( srcClientId, clientId ) ||
				isSrcBlockAnAncestorOfDstBlock(
					srcClientId,
					clientId || rootClientId
				)
			) {
				return;
			}

			const dstIndex = clientId
				? getBlockIndex( clientId, rootClientId )
				: undefined;
			const positionIndex = blockIndex;
			// If the block is kept at the same level and moved downwards,
			// subtract to account for blocks shifting upward to occupy its old position.
			const insertIndex =
				dstIndex &&
				srcIndex < dstIndex &&
				isSameLevel( srcRootClientId, rootClientId )
					? positionIndex - 1
					: positionIndex;
			moveBlockToPosition(
				srcClientId,
				srcRootClientId,
				rootClientId,
				insertIndex
			);
		},
		[
			getClientIdsOfDescendants,
			getBlockIndex,
			clientId,
			blockIndex,
			moveBlockToPosition,
			rootClientId,
		]
	);

	const { position } = useDropZone( {
		element,
		onFilesDrop,
		onHTMLDrop,
		onDrop,
		isDisabled: isLockedAll,
		withPosition: true,
	} );

	useEffect( () => {
		if ( position ) {
			const { y } = position;
			const rect = element.current.getBoundingClientRect();

			const offset = y - rect.top;
			const target = Array.from( element.current.children ).find(
				( blockEl ) => {
					return (
						blockEl.offsetTop + blockEl.offsetHeight / 2 > offset
					);
				}
			);

			if ( ! target ) {
				return;
			}

			const targetClientId = target.id.slice( 'block-'.length );

			if ( ! targetClientId ) {
				return;
			}

			setClientId( targetClientId );
		}
	}, [ position ] );

	if ( position ) {
		return clientId;
	}
}
