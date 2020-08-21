/**
 * External dependencies
 */
import { difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { __unstableUseDropZone as useDropZone } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useOnBlockDrop from '../use-on-block-drop';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * @typedef  {Object} WPBlockDragPosition
 * @property {number} x The horizontal position of a the block being dragged.
 * @property {number} y The vertical position of the block being dragged.
 */

/** @typedef {import('@wordpress/dom').WPPoint} WPPoint */

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
	// An undefined value represents a top-level block. Default to an empty
	// string for this so that `targetRootClientId` can be easily compared to
	// values returned by the `getRootBlockClientId` selector, which also uses
	// an empty string to represent top-level blocks.
	rootClientId: targetRootClientId = '',
} ) {
	const [ targetBlockIndex, setTargetBlockIndex ] = useState( null );

	const { isLockedAll, orientation } = useSelect(
		( select ) => {
			const { getBlockListSettings, getTemplateLock } = select(
				'core/block-editor'
			);
			return {
				isLockedAll: getTemplateLock( targetRootClientId ) === 'all',
				orientation: getBlockListSettings( targetRootClientId )
					?.orientation,
			};
		},
		[ targetRootClientId ]
	);

	const dropEventHandlers = useOnBlockDrop(
		targetRootClientId,
		targetBlockIndex
	);

	const { position } = useDropZone( {
		element,
		isDisabled: isLockedAll,
		withPosition: true,
		...dropEventHandlers,
	} );

	useEffect( () => {
		if ( position ) {
			// Get the root elements of blocks inside the element, ignoring
			// InnerBlocks item wrappers and the children of the blocks.
			const blockElements = difference(
				Array.from( element.current.querySelectorAll( '.wp-block' ) ),
				Array.from(
					element.current.querySelectorAll(
						':scope .wp-block .wp-block'
					)
				)
			);

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
