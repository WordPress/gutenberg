/**
 * WordPress dependencies
 */
import { useThrottle } from '@wordpress/compose';
import { getScreenRect } from '@wordpress/dom';
import { createContext, useContext, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getDistanceFromPointToEdge } from '../../utils/math';

const BlockAlignmentGuideContext = createContext( new Map() );
export const useBlockAlignmentGuides = () =>
	useContext( BlockAlignmentGuideContext );

export function BlockAlignmentGuideContextProvider( { children } ) {
	const guides = useRef( new Map() );

	return (
		<BlockAlignmentGuideContext.Provider value={ guides.current }>
			{ children }
		</BlockAlignmentGuideContext.Provider>
	);
}

/**
 * Detect whether the `element` is snapping to one of the alignment guide along its `snapEdge`.
 *
 * @param {Node}           element         The element to check for snapping.
 * @param {'left'|'right'} snapEdge        The edge that will snap.
 * @param {Map}            alignmentGuides A Map of alignment guide nodes.
 * @param {number}         snapGap         The pixel threshold for snapping.
 *
 * @return {null|'none'|'wide'|'full'} The alignment guide or `null` if no snapping was detected.
 */
function detectSnapping( element, snapEdge, alignmentGuides, snapGap ) {
	const elementRect = getScreenRect( element );

	// Get a point on the resizable rect's edge for `getDistanceFromPointToEdge`.
	// - Caveat: this assumes horizontal resizing.
	const pointFromElementRect = {
		x: elementRect[ snapEdge ],
		y: elementRect.top,
	};

	let candidateGuide = null;

	// Loop through alignment guide nodes.
	alignmentGuides?.forEach( ( guide, name ) => {
		const guideRect = getScreenRect( guide );

		// Calculate the distance from the resizeable element's edge to the
		// alignment zone's edge.
		const distance = getDistanceFromPointToEdge(
			pointFromElementRect,
			guideRect,
			snapEdge
		);

		// If the distance is within snapping tolerance, we are snapping to this alignment.
		if ( distance < snapGap ) {
			candidateGuide = name;
		}
	} );

	return candidateGuide;
}

export function useDetectSnapping( snapGap ) {
	const alignmentGuides = useBlockAlignmentGuides();
	return useThrottle( ( element, snapEdge ) => {
		const snappedAlignment = detectSnapping(
			element,
			snapEdge,
			alignmentGuides,
			snapGap
		);
		const guide = alignmentGuides.get( snappedAlignment );

		if ( ! guide ) {
			return null;
		}

		return {
			name: snappedAlignment,
			rect: getScreenRect( guide ),
		};
	}, 100 );
}
