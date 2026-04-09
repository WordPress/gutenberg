/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { diffWords } from 'diff/lib/diff/word';

/**
 * Build a smooth closed area path using monotone cubic interpolation.
 * Unlike Catmull-Rom, monotone interpolation never overshoots data points,
 * producing clean curves similar to Recharts' "monotone" curve type.
 *
 * @param {Array}  points   Array of { x, y }.
 * @param {number} baseline The Y coordinate of the center line.
 * @return {string} SVG path d attribute.
 */
function buildSmoothAreaPath( points, baseline ) {
	if ( points.length < 2 ) {
		return '';
	}

	// Compute tangent slopes using Fritsch-Carlson monotone method.
	const n = points.length;
	const slopes = new Array( n );
	const deltas = new Array( n - 1 );

	for ( let i = 0; i < n - 1; i++ ) {
		const dx = points[ i + 1 ].x - points[ i ].x;
		deltas[ i ] = dx === 0 ? 0 : ( points[ i + 1 ].y - points[ i ].y ) / dx;
	}

	slopes[ 0 ] = deltas[ 0 ];
	slopes[ n - 1 ] = deltas[ n - 2 ];

	for ( let i = 1; i < n - 1; i++ ) {
		if ( deltas[ i - 1 ] * deltas[ i ] <= 0 ) {
			slopes[ i ] = 0;
		} else {
			slopes[ i ] = ( deltas[ i - 1 ] + deltas[ i ] ) / 2;
		}
	}

	// Enforce monotonicity.
	for ( let i = 0; i < n - 1; i++ ) {
		if ( deltas[ i ] === 0 ) {
			slopes[ i ] = 0;
			slopes[ i + 1 ] = 0;
		} else {
			const alpha = slopes[ i ] / deltas[ i ];
			const beta = slopes[ i + 1 ] / deltas[ i ];
			const s = alpha * alpha + beta * beta;
			if ( s > 9 ) {
				const t = 3 / Math.sqrt( s );
				slopes[ i ] = t * alpha * deltas[ i ];
				slopes[ i + 1 ] = t * beta * deltas[ i ];
			}
		}
	}

	// Build path.
	let d = `M 0,${ baseline } L ${ points[ 0 ].x },${ points[ 0 ].y }`;

	for ( let i = 0; i < n - 1; i++ ) {
		const dx = points[ i + 1 ].x - points[ i ].x;
		const cp1x = points[ i ].x + dx / 3;
		const cp1y = points[ i ].y + ( slopes[ i ] * dx ) / 3;
		const cp2x = points[ i + 1 ].x - dx / 3;
		const cp2y = points[ i + 1 ].y - ( slopes[ i + 1 ] * dx ) / 3;
		d += ` C ${ cp1x },${ cp1y } ${ cp2x },${ cp2y } ${
			points[ i + 1 ].x
		},${ points[ i + 1 ].y }`;
	}

	d += ` L ${ points[ n - 1 ].x },${ baseline } Z`;
	return d;
}

const segmenter = new Intl.Segmenter( undefined, { granularity: 'word' } );

function countWords( text ) {
	let count = 0;
	for ( const { isWordLike } of segmenter.segment( text ) ) {
		if ( isWordLike ) {
			count++;
		}
	}
	return count;
}

function diffRevisionPair( prev, curr ) {
	const previousContent = prev?.content?.raw ?? '';
	const currentContent = curr?.content?.raw ?? '';
	const changes = diffWords( previousContent, currentContent );

	let added = 0;
	let removed = 0;

	for ( const change of changes ) {
		if ( change.added ) {
			added += countWords( change.value );
		} else if ( change.removed ) {
			removed += countWords( change.value );
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

		// Process from the last revision backwards so the max scale
		// is established early and the chart only grows, never shrinks.
		let index = sortedRevisions.length - 1;

		function processNext() {
			if ( revisionsRef.current !== sortedRevisions ) {
				return;
			}
			if ( index < 1 ) {
				return;
			}

			const i = index--;
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
// Fixed reference for log scale — changes of this many words
// or more fill the full chart height. Larger values clip.
const LOG_SCALE_REF = Math.log10( 2000 );

export default function RevisionDiffChart( { stats, width, height } ) {
	if ( ! stats || stats.length < 2 || ! width || ! height ) {
		return null;
	}

	const gap = 2;
	const midY = height / 2;
	const halfHeight = midY - gap - 2;
	const verticalScale = halfHeight / LOG_SCALE_REF;

	const addedPoints = stats.map( ( stat, index ) => ( {
		x: ( index / ( stats.length - 1 ) ) * width,
		y: midY - gap - Math.max( 0, Math.log10( stat.added ) ) * verticalScale,
	} ) );

	const removedPoints = stats.map( ( stat, index ) => ( {
		x: ( index / ( stats.length - 1 ) ) * width,
		y:
			midY +
			gap +
			Math.max( 0, Math.log10( stat.removed ) ) * verticalScale,
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
