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

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * @typedef  {Object} WPBlockDragPosition
 * @property {number} x The horizontal position of a the block being dragged.
 * @property {number} y The vertical position of the block being dragged.
 */

/**
 * The orientation of a block list.
 *
 * @typedef {'horizontal'|'vertical'|undefined} WPBlockListOrientation
 */

/**
 * Given a list of block DOM elements finds the index that a block should be dropped
 * at.
 *
 * This function works for both horizontal and vertical block lists and uses the following
 * terms for its variables:
 *
 * - Lateral, meaning the axis running horizontally when a block list is vertical and vertically when a block list is horizontal.
 * - Forward, meaning the axis running vertically when a block list is vertical and horizontally
 * when a block list is horizontal.
 *
 *
 * @param {Element[]}              elements    Array of DOM elements that represent each block in a block list.
 * @param {WPBlockDragPosition}    position    The position of the item being dragged.
 * @param {WPBlockListOrientation} orientation The orientation of a block list.
 *
 * @return {number|undefined} The block index that's closest to the drag position.
 */
export function getNearestBlockIndex( elements, position, orientation ) {
	const { x, y } = position;
	const isHorizontal = orientation === 'horizontal';

	let candidateIndex;
	let candidateDistance;

	elements.forEach( ( element, index ) => {
		// Ensure the element is a block. It should have the `wp-block` class.
		if ( ! element.classList.contains( 'wp-block' ) ) {
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
			( cursorLateralPosition - edgeLateralPosition ) ** 2 +
				( cursorForwardPosition - leadingEdgeForwardPosition ) ** 2
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
			( cursorLateralPosition - edgeLateralPosition ) ** 2 +
				( cursorForwardPosition - trailingEdgeForwardPosition ) ** 2
		);

		// If no candidate has been assigned yet or this is the nearest
		// block edge to the cursor, then assign the next block as the candidate.
		if ( Math.abs( trailingEdgeDistance ) < candidateDistance ) {
			candidateDistance = trailingEdgeDistance;
			let nextBlockOffset = 1;

			// If the next block is the one being dragged, skip it and consider
			// the block afterwards the drop target. This is needed as the
			// block being dragged is set to display: none and won't display
			// any drop target styling.
			if (
				elements[ index + 1 ] &&
				elements[ index + 1 ].classList.contains( 'is-dragging' )
			) {
				nextBlockOffset = 2;
			}

			candidateIndex = index + nextBlockOffset;
		}
	} );

	return candidateIndex;
}

/**
 * Retrieve the data for a block drop event.
 *
 * @param {WPSyntheticEvent} event The drop event.
 *
 * @return {Object} An object with block drag and drop data.
 */
function parseDropEvent( event ) {
	let result = {
		srcRootClientId: null,
		srcClientIds: null,
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
}

/**
 * @typedef  {Object} WPBlockDropZoneConfig
 * @property {Object} element      A React ref object pointing to the block list's DOM element.
 * @property {string} rootClientId The root client id for the block list.
 */

/**
 * A React hook that can be used to make a block list handle drag and drop.
 *
 * @param {WPBlockDropZoneConfig} dropZoneConfig configuration data for the drop zone.
 *
 * @return {number|undefined} The block index that's closest to the drag position.
 */
export default function useBlockDropZone( {
	element,
	rootClientId: targetRootClientId,
} ) {
	const [ targetBlockIndex, setTargetBlockIndex ] = useState( null );

	const {
		getClientIdsOfDescendants,
		getBlockIndex,
		hasUploadPermissions,
		isLockedAll,
		orientation,
	} = useSelect(
		( select ) => {
			const {
				getBlockListSettings,
				getClientIdsOfDescendants: _getClientIdsOfDescendants,
				getBlockIndex: _getBlockIndex,
				getSettings,
				getTemplateLock,
			} = select( 'core/block-editor' );
			return {
				orientation: getBlockListSettings( targetRootClientId )
					?.orientation,
				getClientIdsOfDescendants: _getClientIdsOfDescendants,
				getBlockIndex: _getBlockIndex,
				hasUploadPermissions: !! getSettings().mediaUpload,
				isLockedAll: getTemplateLock( targetRootClientId ) === 'all',
			};
		},
		[ targetRootClientId ]
	);
	const {
		insertBlocks,
		updateBlockAttributes,
		moveBlocksToPosition,
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
				srcClientIds: sourceClientIds,
				type: dropType,
			} = parseDropEvent( event );

			// If the user isn't dropping a block, return early.
			if ( dropType !== 'block' ) {
				return;
			}

			const sourceBlockIndex = getBlockIndex(
				sourceClientIds[ 0 ],
				sourceRootClientId
			);

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
				sourceClientIds.includes( targetRootClientId ) ||
				getClientIdsOfDescendants( sourceClientIds ).some(
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

			moveBlocksToPosition(
				sourceClientIds,
				sourceRootClientId,
				targetRootClientId,
				insertIndex
			);
		},
		[
			getClientIdsOfDescendants,
			getBlockIndex,
			targetBlockIndex,
			moveBlocksToPosition,
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
				orientation
			);

			setTargetBlockIndex( targetIndex === undefined ? 0 : targetIndex );
		}
	}, [ position ] );

	if ( position ) {
		return targetBlockIndex;
	}
}
