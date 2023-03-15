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

export function useDetectSnapping( {
	snapGap = 50,
	dwellTime = 300,
	throttle = 100,
} = {} ) {
	const alignmentGuides = useBlockAlignmentGuides();
	const snappedAlignmentInfo = useRef();

	return useThrottle( ( element, snapEdge ) => {
		const snappedAlignment = detectSnapping(
			element,
			snapEdge,
			alignmentGuides,
			snapGap
		);

		// Set snapped alignment info when the user first reaches a snap guide.
		if (
			snappedAlignment &&
			( ! snappedAlignmentInfo.current ||
				snappedAlignmentInfo.current.name !== snappedAlignment )
		) {
			snappedAlignmentInfo.current = {
				timestamp: Date.now(),
				name: snappedAlignment,
			};
		}

		// Unset snapped alignment info when the user moves away from a snap guide.
		if ( ! snappedAlignment && snappedAlignmentInfo.current ) {
			snappedAlignmentInfo.current = null;
			return null;
		}

		// If the user hasn't dwelt long enough on the alignment, return early.
		if (
			snappedAlignmentInfo.current &&
			Date.now() - snappedAlignmentInfo.current.timestamp < dwellTime
		) {
			return null;
		}

		const guide = alignmentGuides.get( snappedAlignmentInfo.current?.name );
		if ( ! guide ) {
			return null;
		}

		return {
			name: snappedAlignment,
			rect: getScreenRect( guide ),
		};
	}, throttle );
}
