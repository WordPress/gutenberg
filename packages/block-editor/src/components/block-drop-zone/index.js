/**
 * WordPress dependencies
 */
import { useDropZone } from '@wordpress/components';
import {
	pasteHandler,
	getBlockTransforms,
	findTransform,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

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
		result = Object.assign( result, JSON.parse( event.dataTransfer.getData( 'text' ) ) );
	} catch ( err ) {
		return result;
	}

	return result;
};

export default function useBlockDropZone( { element, clientId, rootClientId } ) {
	function selector( select ) {
		const {
			getBlockIndex,
			getClientIdsOfDescendants,
			getSettings,
			getTemplateLock,
		} = select( 'core/block-editor' );
		return {
			getBlockIndex,
			getClientIdsOfDescendants,
			hasUploadPermissions: !! getSettings().mediaUpload,
			isLockedAll: getTemplateLock( rootClientId ) === 'all',
		};
	}

	const {
		getBlockIndex,
		getClientIdsOfDescendants,
		hasUploadPermissions,
		isLockedAll,
	} = useSelect( selector, [ rootClientId ] );
	const {
		insertBlocks,
		updateBlockAttributes,
		moveBlockToPosition,
	} = useDispatch( 'core/block-editor' );

	function getInsertIndex( position ) {
		if ( clientId !== undefined ) {
			const index = getBlockIndex( clientId, rootClientId );
			return ( position && position.y === 'top' ) ? index : index + 1;
		}
	}

	function onFilesDrop( files, position ) {
		if ( ! hasUploadPermissions ) {
			return;
		}

		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) => transform.type === 'files' && transform.isMatch( files )
		);

		if ( transformation ) {
			const insertIndex = getInsertIndex( position );
			const blocks = transformation.transform( files, updateBlockAttributes );
			insertBlocks( blocks, insertIndex, rootClientId );
		}
	}

	function onHTMLDrop( HTML, position ) {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			insertBlocks( blocks, getInsertIndex( position ), rootClientId );
		}
	}

	function onDrop( event, position ) {
		const { srcRootClientId, srcClientId, srcIndex, type } = parseDropEvent( event );

		const isBlockDropType = ( dropType ) => dropType === 'block';
		const isSameLevel = ( srcRoot, dstRoot ) => {
			// Note that rootClientId of top-level blocks will be undefined OR a void string,
			// so we also need to account for that case separately.
			return ( srcRoot === dstRoot ) || ( ! srcRoot === true && ! dstRoot === true );
		};
		const isSameBlock = ( src, dst ) => src === dst;
		const isSrcBlockAnAncestorOfDstBlock = ( src, dst ) => getClientIdsOfDescendants( [ src ] ).some( ( id ) => id === dst );

		if ( ! isBlockDropType( type ) ||
			isSameBlock( srcClientId, clientId ) ||
			isSrcBlockAnAncestorOfDstBlock( srcClientId, clientId || rootClientId ) ) {
			return;
		}

		const dstIndex = clientId ? getBlockIndex( clientId, rootClientId ) : undefined;
		const positionIndex = getInsertIndex( position );
		// If the block is kept at the same level and moved downwards,
		// subtract to account for blocks shifting upward to occupy its old position.
		const insertIndex = dstIndex && srcIndex < dstIndex && isSameLevel( srcRootClientId, rootClientId ) ? positionIndex - 1 : positionIndex;
		moveBlockToPosition( srcClientId, srcRootClientId, rootClientId, insertIndex );
	}

	return useDropZone( {
		element,
		onFilesDrop,
		onHTMLDrop,
		onDrop,
		isDisabled: isLockedAll,
	} );
}
