/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { diffWords } from 'diff/lib/diff/word';

/**
 * Build a smooth closed area path from data points using Catmull-Rom splines.
 *
 * @param {Array}  points   Array of { x, y }.
 * @param {number} baseline The Y coordinate of the center line.
 * @return {string} SVG path d attribute.
 */
function buildSmoothAreaPath( points, baseline ) {
	if ( points.length < 2 ) {
		return '';
	}

	const tension = 0.3;
	let d = `M 0,${ baseline } L ${ points[ 0 ].x },${ points[ 0 ].y }`;

	for ( let i = 0; i < points.length - 1; i++ ) {
		const p0 = points[ Math.max( 0, i - 1 ) ];
		const p1 = points[ i ];
		const p2 = points[ i + 1 ];
		const p3 = points[ Math.min( points.length - 1, i + 2 ) ];

		const cp1x = p1.x + ( p2.x - p0.x ) * tension;
		const cp1y = p1.y + ( p2.y - p0.y ) * tension;
		const cp2x = p2.x - ( p3.x - p1.x ) * tension;
		const cp2y = p2.y - ( p3.y - p1.y ) * tension;

		d += ` C ${ cp1x },${ cp1y } ${ cp2x },${ cp2y } ${ p2.x },${ p2.y }`;
	}

	d += ` L ${ points[ points.length - 1 ].x },${ baseline } Z`;
	return d;
}

function diffRevisionPair( prev, curr ) {
	const previousContent = prev?.content?.raw ?? '';
	const currentContent = curr?.content?.raw ?? '';
	const changes = diffWords( previousContent, currentContent );

	let added = 0;
	let removed = 0;

	for ( const change of changes ) {
		const wordCount = change.value
			.trim()
			.split( /\s+/ )
			.filter( Boolean ).length;
		if ( change.added ) {
			added += wordCount;
		} else if ( change.removed ) {
			removed += wordCount;
		}
	}

	return { added, removed };
}

/**
 * Compute per-revision change stats by diffing consecutive revisions.
 * Diffs are computed asynchronously to avoid blocking the main thread.
 *
 * @param {Array} sortedRevisions Revisions sorted by date ascending.
 * @return {Array<{added: number, removed: number}>} Change stats per revision.
 */
export function useRevisionDiffStats( sortedRevisions ) {
	const [ stats, setStats ] = useState( [] );
	const revisionsRef = useRef();

	useEffect( () => {
		if ( ! sortedRevisions || sortedRevisions.length < 2 ) {
			setStats( [] );
			return;
		}

		// Reset if revisions changed.
		revisionsRef.current = sortedRevisions;
		const initial = sortedRevisions.map( () => ( {
			added: 0,
			removed: 0,
		} ) );
		setStats( initial );

		let index = 1;

		function processNext() {
			if ( revisionsRef.current !== sortedRevisions ) {
				return;
			}
			if ( index >= sortedRevisions.length ) {
				return;
			}

			const i = index++;
			const result = diffRevisionPair(
				sortedRevisions[ i - 1 ],
				sortedRevisions[ i ]
			);

			setStats( ( prev ) => {
				const next = [ ...prev ];
				next[ i ] = result;
				return next;
			} );

			window.requestIdleCallback( processNext );
		}

		const id = window.requestIdleCallback( processNext );
		return () => window.cancelIdleCallback( id );
	}, [ sortedRevisions ] );

	return stats;
}

/**
 * Render a flamegraph-style area chart of revision diffs.
 *
 * @param {Object} props
 * @param {Array}  props.stats  Array of { added, removed } per revision.
 * @param {number} props.width  Width of the SVG in pixels.
 * @param {number} props.height Height of the SVG in pixels.
 * @return {React.JSX.Element|null} The SVG chart or null if insufficient data.
 */
export default function RevisionDiffChart( { stats, width, height } ) {
	if ( ! stats || stats.length < 2 || ! width || ! height ) {
		return null;
	}

	const gap = 2;
	const midY = height / 2;
	const halfHeight = midY - gap - 2;

	// Use square root scale so small changes remain visible
	// relative to large ones.
	const maxValue = Math.max(
		1,
		...stats.map( ( s ) =>
			Math.max( Math.sqrt( s.added ), Math.sqrt( s.removed ) )
		)
	);
	const verticalScale = halfHeight / maxValue;

	const addedPoints = stats.map( ( stat, index ) => ( {
		x: ( index / ( stats.length - 1 ) ) * width,
		y: midY - gap - Math.sqrt( stat.added ) * verticalScale,
	} ) );

	const removedPoints = stats.map( ( stat, index ) => ( {
		x: ( index / ( stats.length - 1 ) ) * width,
		y: midY + gap + Math.sqrt( stat.removed ) * verticalScale,
	} ) );

	/* eslint-disable react/forbid-elements */
	return (
		<svg
			className="editor-revisions-slider__chart"
			viewBox={ `0 0 ${ width } ${ height }` }
			preserveAspectRatio="none"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d={ buildSmoothAreaPath( addedPoints, midY - gap ) }
				fill="rgba(0, 163, 42, 0.3)"
			/>
			<path
				d={ buildSmoothAreaPath( removedPoints, midY + gap ) }
				fill="rgba(214, 54, 56, 0.3)"
			/>
		</svg>
	);
	/* eslint-enable react/forbid-elements */
}
