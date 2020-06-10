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
import { useEffect, useCallback, useState } from '@wordpress/element';

function getNearestBlockIndex( elements, position, orientation ) {
	const { x, y } = position;
	const isHorizontal = orientation === 'horizontal';

	let candidateIndex;
	let candidateDistance;

	elements.forEach( ( element, index ) => {
		// Ensure the element is a block. It should have the `data-block` attribute.
		if ( ! element.dataset.block ) {
			return;
		}

		const rect = element.getBoundingClientRect();
		const cursorLateralPosition = isHorizontal ? y : x;
		const cursorForwardPosition = isHorizontal ? x : y;
		const edgeLateralStart = isHorizontal ? rect.top : rect.left;
		const edgeLateralEnd = isHorizontal ? rect.bottom : rect.right;

		// When the cursor position is within the lateral bounds of the block,
		// measure the straight line distance to the nearest point on the
		// block's edge, else measure diagonal distance to the nearest corner.
		let edgeLateralPosition;
		if (
			cursorLateralPosition >= edgeLateralStart &&
			cursorLateralPosition <= edgeLateralEnd
		) {
			edgeLateralPosition = cursorLateralPosition;
		} else if ( cursorLateralPosition < edgeLateralStart ) {
			edgeLateralPosition = edgeLateralStart;
		} else {
			edgeLateralPosition = edgeLateralEnd;
		}
		const leadingEdgeForwardPosition = isHorizontal ? rect.left : rect.top;
		const trailingEdgeForwardPosition = isHorizontal
			? rect.right
			: rect.bottom;

		// First measure the distance to the leading edge of the block.
		const leadingEdgeDistance = Math.sqrt(
			Math.pow( cursorLateralPosition - edgeLateralPosition, 2 ) +
				Math.pow(
					cursorForwardPosition - leadingEdgeForwardPosition,
					2
				)
		);

		// If no candidate has been assigned yet or this is the nearest
		// block edge to the cursor, then assign it as the candidate.
		if (
			candidateDistance === undefined ||
			Math.abs( leadingEdgeDistance ) < candidateDistance
		) {
			candidateDistance = leadingEdgeDistance;
			candidateIndex = index;
		}

		// Next measure the distance to the trailing edge of the block.
		const trailingEdgeDistance = Math.sqrt(
			Math.pow( cursorLateralPosition - edgeLateralPosition, 2 ) +
				Math.pow(
					cursorForwardPosition - trailingEdgeForwardPosition,
					2
				)
		);

		// If no candidate has been assigned yet or this is the nearest
		// block edge to the cursor, then assign it as the candidate.
		if ( Math.abs( trailingEdgeDistance ) < candidateDistance ) {
			candidateDistance = trailingEdgeDistance;
			candidateIndex = index + 1;
		}
	} );

	return candidateIndex;
}

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

export default function useBlockDropZone( {
	element,
	rootClientId: targetRootClientId,
} ) {
	const [ targetBlockIndex, setTargetBlockIndex ] = useState( null );

	function selector( select ) {
		const {
			getBlockIndex,
			getBlockListSettings,
			getClientIdsOfDescendants,
			getSettings,
			getTemplateLock,
		} = select( 'core/block-editor' );
		return {
			getBlockIndex,
			moverDirection: getBlockListSettings( targetRootClientId )
				?.__experimentalMoverDirection,
			getClientIdsOfDescendants,
			hasUploadPermissions: !! getSettings().mediaUpload,
			isLockedAll: getTemplateLock( targetRootClientId ) === 'all',
		};
	}

	const {
		getBlockIndex,
		getClientIdsOfDescendants,
		hasUploadPermissions,
		isLockedAll,
		moverDirection,
	} = useSelect( selector, [ targetRootClientId ] );
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
				insertBlocks( blocks, targetBlockIndex, targetRootClientId );
			}
		},
		[
			hasUploadPermissions,
			updateBlockAttributes,
			insertBlocks,
			targetBlockIndex,
			targetRootClientId,
		]
	);

	const onHTMLDrop = useCallback(
		( HTML ) => {
			const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

			if ( blocks.length ) {
				insertBlocks( blocks, targetBlockIndex, targetRootClientId );
			}
		},
		[ insertBlocks, targetBlockIndex, targetRootClientId ]
	);

	const onDrop = useCallback(
		( event ) => {
			const {
				srcRootClientId: sourceRootClientId,
				srcClientId: sourceClientId,
				srcIndex: sourceBlockIndex,
				type: dropType,
			} = parseDropEvent( event );

			// If the user isn't dropping a block, return early.
			if ( dropType !== 'block' ) {
				return;
			}

			// If the user is dropping to the same position, return early.
			if (
				sourceRootClientId === targetRootClientId &&
				sourceBlockIndex === targetBlockIndex
			) {
				return;
			}

			// If the user is attempting to drop a block within its own
			// nested blocks, return early as this would create infinite
			// recursion.
			if (
				targetRootClientId === sourceClientId ||
				getClientIdsOfDescendants( [ sourceClientId ] ).some(
					( id ) => id === targetRootClientId
				)
			) {
				return;
			}

			const isAtSameLevel =
				sourceRootClientId === targetRootClientId ||
				( sourceRootClientId === '' &&
					targetRootClientId === undefined );

			// If the block is kept at the same level and moved downwards,
			// subtract to account for blocks shifting upward to occupy its old position.
			const insertIndex =
				isAtSameLevel && sourceBlockIndex < targetBlockIndex
					? targetBlockIndex - 1
					: targetBlockIndex;

			moveBlockToPosition(
				sourceClientId,
				sourceRootClientId,
				targetRootClientId,
				insertIndex
			);
		},
		[
			getClientIdsOfDescendants,
			getBlockIndex,
			targetBlockIndex,
			moveBlockToPosition,
			targetRootClientId,
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
			const blockElements = Array.from( element.current.children );
			const targetIndex = getNearestBlockIndex(
				blockElements,
				position,
				moverDirection
			);

			if ( targetIndex === undefined ) {
				return;
			}

			setTargetBlockIndex( targetIndex );
		}
	}, [ position ] );

	if ( position ) {
		return targetBlockIndex;
	}
}
