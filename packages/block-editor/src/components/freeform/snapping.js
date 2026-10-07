import { DESIGN_WIDTH } from './constants';

// All the maths in this module is in design units; the interaction layer
// converts to and from screen pixels.
export { DESIGN_WIDTH };

/**
 * How close an edge has to come to a magnet before it is captured.
 */
export const SNAP_THRESHOLD = 6;

/**
 * The quiet mesh a drop rounds to when no magnet is in reach.
 */
export const BASE_MESH = 8;

/**
 * The canvas content margin. New blocks are born here, and it is a magnet in
 * its own right — the one guide people reach for that no other block provides.
 */
export const MARGIN = 72;

/**
 * Gaps offered from a lone neighbour, so a hand-placed block lands on a sane
 * rhythm without anyone having to know the rhythm exists.
 */
export const RHYTHM = 24;
export const MAJOR_RHYTHM = 72;

/**
 * The lattice the canvas paints while a block is on the move: 24 columns with
 * gutters between them, inside the content margins, and rows of 24 with a gutter
 * of 12, running from the top. Nothing is drawn in the side margins.
 *
 * It is drawing plus one promise: an edge released near a line a person can see
 * lands exactly on it. A line you cannot land on is worse than no line at all.
 */
export const LATTICE = {
	columns: 24,
	gutter: 12,
	padding: MARGIN,
	row: RHYTHM,
	rowGutter: 12,
};

/**
 * A spacing magnet captures the raw pointer position over a slightly wider
 * band than an alignment magnet: it has to beat the alignment candidates and
 * the mesh, or equal gaps are unreachable in practice.
 */
const SPACING_THRESHOLD = 8;

/**
 * Gaps and distances below this are not worth drawing a label for.
 */
const MIN_LABELLED_GAP = 4;

/**
 * Smallest size a resize may produce.
 */
const MIN_SIZE = 16;

/**
 * How much slack to allow when deciding whether two blocks sit side by side.
 */
const ADJACENCY_SLACK = 2;

/**
 * Keeps a rect within the canvas. Only the left, right and top edges are walls:
 * the canvas grows to fit whatever is dragged below its current height, so the
 * bottom is not a limit and no height is needed here.
 *
 * @param {Object} rect Rect in design units.
 * @return {Object} The constrained rect.
 */
export function constrainRect( rect ) {
	return {
		...rect,
		x: Math.max( 0, Math.min( DESIGN_WIDTH - rect.width, rect.x ) ),
		y: Math.max( 0, rect.y ),
	};
}

/**
 * The width of one lattice column, in design units.
 *
 * @return {number} Column width.
 */
export function getLatticeColumnWidth() {
	const { columns, gutter, padding } = LATTICE;
	return ( DESIGN_WIDTH - padding * 2 - ( columns - 1 ) * gutter ) / columns;
}

/**
 * The nearest of a set of candidates.
 *
 * @param {number}   value      The value to match.
 * @param {number[]} candidates Candidates.
 * @return {number} The nearest candidate.
 */
function nearestOf( value, candidates ) {
	return candidates.reduce( ( nearest, candidate ) =>
		Math.abs( candidate - value ) < Math.abs( nearest - value )
			? candidate
			: nearest
	);
}

/**
 * The drawn vertical line nearest a position: a column's start or end, or one
 * of the canvas's own edges.
 *
 * Lines are rounded to whole design units. The painted line sits on the exact
 * fraction, but coordinates are integers, and half a design unit is far less
 * than a pixel at any size the canvas is actually edited.
 *
 * @param {number} value A position in design units.
 * @return {number} The nearest drawn line.
 */
export function snapToLatticeX( value ) {
	const { columns, gutter, padding } = LATTICE;
	const cell = getLatticeColumnWidth();
	const pitch = cell + gutter;
	const column = Math.max(
		0,
		Math.min( columns - 1, Math.floor( ( value - padding ) / pitch ) )
	);
	const start = padding + column * pitch;

	return Math.round(
		nearestOf( value, [
			0,
			DESIGN_WIDTH,
			start,
			start + cell,
			Math.min( DESIGN_WIDTH - padding, start + pitch ),
		] )
	);
}

/**
 * The drawn horizontal line nearest a position: a row's start or end. Rows run
 * from the canvas's top, so the content margin is itself a row start.
 *
 * @param {number} value A position in design units.
 * @return {number} The nearest drawn line.
 */
export function snapToLatticeY( value ) {
	const { row, rowGutter } = LATTICE;
	const pitch = row + rowGutter;
	const start = Math.max( 0, Math.floor( value / pitch ) ) * pitch;

	return Math.round(
		nearestOf( value, [ start, start + row, start + pitch ] )
	);
}

/**
 * Captures an edge on the lattice, if one of the drawn lines is in reach.
 *
 * Only a rect's outer edges are offered. A centre has no line of its own on
 * screen, so letting it capture would stop the block somewhere that looks
 * like nothing in particular.
 *
 * @param {Object[]} edges An axis's candidate edges, with their offsets.
 * @param {number}   span  The rect's size on this axis.
 * @param {string}   axis  'x' or 'y'.
 * @return {?number} The snapped origin, or null when no line is in reach.
 */
function snapToLattice( edges, span, axis ) {
	let distance = SNAP_THRESHOLD + 1;
	let value = null;

	for ( const edge of edges ) {
		if ( edge.offset !== 0 && edge.offset !== span ) {
			continue;
		}
		const line =
			axis === 'y'
				? snapToLatticeY( edge.position )
				: snapToLatticeX( edge.position );
		const lineDistance = Math.abs( line - edge.position );
		if ( lineDistance < distance ) {
			distance = lineDistance;
			value = line - edge.offset;
		}
	}

	return value;
}

/**
 * The nearest block on each side of `rect` that overlaps it on the
 * perpendicular axis — the blocks a person would call its neighbours.
 *
 * @param {Object}   rect   Rect in design units.
 * @param {Object[]} others Every other rect on the canvas.
 * @return {{left: ?Object, right: ?Object, top: ?Object, bottom: ?Object}} Neighbours.
 */
export function getNeighbors( rect, others ) {
	let left = null;
	let right = null;
	let top = null;
	let bottom = null;

	for ( const other of others ) {
		if ( other === rect ) {
			continue;
		}

		const overlapsVertically =
			other.y < rect.y + rect.height && other.y + other.height > rect.y;
		const overlapsHorizontally =
			other.x < rect.x + rect.width && other.x + other.width > rect.x;

		if ( overlapsVertically ) {
			if (
				other.x + other.width <= rect.x + ADJACENCY_SLACK &&
				( ! left || other.x + other.width > left.x + left.width )
			) {
				left = other;
			}
			if (
				other.x >= rect.x + rect.width - ADJACENCY_SLACK &&
				( ! right || other.x < right.x )
			) {
				right = other;
			}
		}

		if ( overlapsHorizontally ) {
			if (
				other.y + other.height <= rect.y + ADJACENCY_SLACK &&
				( ! top || other.y + other.height > top.y + top.height )
			) {
				top = other;
			}
			if (
				other.y >= rect.y + rect.height - ADJACENCY_SLACK &&
				( ! bottom || other.y < bottom.y )
			) {
				bottom = other;
			}
		}
	}

	return { left, right, top, bottom };
}

/**
 * The lines a dragged edge can align to on one axis: the canvas edges, its
 * centre, the content margins, and every other block's two edges and centre.
 *
 * @param {Object[]} others Every other rect on the canvas.
 * @param {string}   axis   'x' or 'y'.
 * @param {number}   extent Canvas width or height in design units.
 * @return {number[]} Candidate coordinates.
 */
function getAlignmentCandidates( others, axis, extent ) {
	const candidates =
		axis === 'x'
			? [ 0, extent, extent / 2, MARGIN, extent - MARGIN ]
			: [ 0, extent, extent / 2 ];
	const size = axis === 'x' ? 'width' : 'height';

	for ( const other of others ) {
		candidates.push(
			other[ axis ],
			other[ axis ] + other[ size ],
			other[ axis ] + other[ size ] / 2
		);
	}

	return candidates;
}

/**
 * The edges one axis of a rect offers a magnet: its start, its end and its
 * centre, each with the offset from the origin that produced it.
 *
 * @param {number}  origin    The unsnapped origin on this axis.
 * @param {number}  size      The rect's size on this axis.
 * @param {?number} inkOffset Optional offset of the visual centre from the
 *                            origin, replacing the box centre.
 * @return {Object[]} The candidate edges.
 */
function getAxisEdges( origin, size, inkOffset = null ) {
	const edges = [
		{ position: origin, offset: 0 },
		{ position: origin + size, offset: size },
		{ position: origin + size / 2, offset: size / 2 },
	];

	// When a text block's words don't fill its box, the ink's visual centre
	// replaces the box centre. The two must not compete, or the box magnet
	// catches first and the words sit visibly off-centre.
	if ( inkOffset !== null && inkOffset > 0 && inkOffset < size ) {
		return [
			...edges.filter( ( edge ) => edge.offset !== size / 2 ),
			{ position: origin + inkOffset, offset: inkOffset },
		];
	}

	return edges;
}

/**
 * Captures the nearest alignment candidate for one axis of a rect.
 *
 * The closest pairing of any of the rect's edges with any candidate wins.
 *
 * @param {number}   origin     The unsnapped origin on this axis.
 * @param {number}   size       The rect's size on this axis.
 * @param {number[]} candidates Candidate coordinates.
 * @param {?number}  inkOffset  Optional offset of the visual centre from the
 *                              origin, replacing the box centre.
 * @return {?{value: number, guide: number}} The snapped origin and the guide
 *                                           line that captured it.
 */
function snapToAlignment( origin, size, candidates, inkOffset ) {
	const edges = getAxisEdges( origin, size, inkOffset );

	let distance = SNAP_THRESHOLD + 1;
	let value = null;
	let guide = null;

	for ( const edge of edges ) {
		for ( const candidate of candidates ) {
			const edgeDistance = Math.abs( candidate - edge.position );
			if ( edgeDistance < distance ) {
				distance = edgeDistance;
				value = candidate - edge.offset;
				guide = candidate;
			}
		}
	}

	return distance <= SNAP_THRESHOLD ? { value, guide } : null;
}

/**
 * The exact midpoint between two facing neighbours — the only position at
 * which both gaps are truly equal.
 *
 * @param {number}  size   The rect's size on this axis.
 * @param {?Object} before Neighbour before the rect.
 * @param {?Object} after  Neighbour after the rect.
 * @param {string}  axis   'x' or 'y'.
 * @param {number}  raw    The unsnapped origin.
 * @return {?{value: number}} The midpoint, when the pointer is near it.
 */
function snapToEqualSpacing( size, before, after, axis, raw ) {
	if ( ! before || ! after ) {
		return null;
	}

	const sizeKey = axis === 'x' ? 'width' : 'height';
	const beforeEnd = before[ axis ] + before[ sizeKey ];
	const midpoint = ( beforeEnd + after[ axis ] - size ) / 2;

	if (
		midpoint < beforeEnd ||
		Math.abs( raw - midpoint ) >= SPACING_THRESHOLD
	) {
		return null;
	}

	return { value: midpoint };
}

/**
 * The gap a run already keeps. With a neighbour on one side only, that
 * neighbour's own gap to the next block along is the run's gap, and it is
 * offered here — so a fourth card lands in step with three without anyone
 * counting.
 *
 * @param {Object}   rect      The rect being placed.
 * @param {Object}   neighbors Its neighbours.
 * @param {Object[]} others    Every other rect on the canvas.
 * @param {string}   axis      'x' or 'y'.
 * @param {number}   raw       The unsnapped origin.
 * @return {?Object} The snapped origin plus the run it copies.
 */
function snapToRepeatedGap( rect, neighbors, others, axis, raw ) {
	const sizeKey = axis === 'x' ? 'width' : 'height';
	const sides = axis === 'x' ? [ 'left', 'right' ] : [ 'top', 'bottom' ];
	const [ beforeSide, afterSide ] = sides;
	const before = neighbors[ beforeSide ];
	const after = neighbors[ afterSide ];

	// Only a run with one open end has a gap to copy.
	if ( !! before === !! after ) {
		return null;
	}

	const side = before ? beforeSide : afterSide;
	const inner = before || after;
	const innerNeighbors = getNeighbors(
		inner,
		others.filter( ( other ) => other !== inner )
	);
	const outer = innerNeighbors[ side ];

	if ( ! outer || outer === rect ) {
		return null;
	}

	const gap = before
		? inner[ axis ] - ( outer[ axis ] + outer[ sizeKey ] )
		: outer[ axis ] - ( inner[ axis ] + inner[ sizeKey ] );

	if ( ! ( gap > 0 ) ) {
		return null;
	}

	const value = before
		? inner[ axis ] + inner[ sizeKey ] + gap
		: inner[ axis ] - gap - rect[ sizeKey ];

	if ( value < 0 || ( axis === 'x' && value + rect.width > DESIGN_WIDTH ) ) {
		return null;
	}

	if ( Math.abs( raw - value ) >= SPACING_THRESHOLD ) {
		return null;
	}

	return { value, gap: Math.round( gap ), side, neighbor: inner, outer };
}

/**
 * The nearest rhythm gap from any neighbour on this axis. With nothing to
 * copy, a gap of 24, 48 or 72 is offered instead.
 *
 * @param {Object} rect      The rect being placed.
 * @param {Object} neighbors Its neighbours.
 * @param {string} axis      'x' or 'y'.
 * @param {number} raw       The unsnapped origin.
 * @return {?Object} The snapped origin plus the gap it keeps.
 */
function snapToRhythmGap( rect, neighbors, axis, raw ) {
	const sizeKey = axis === 'x' ? 'width' : 'height';
	const sides = axis === 'x' ? [ 'left', 'right' ] : [ 'top', 'bottom' ];
	let best = null;

	for ( const side of sides ) {
		const neighbor = neighbors[ side ];
		if ( ! neighbor ) {
			continue;
		}

		const isBefore = side === 'left' || side === 'top';

		for ( const gap of [ RHYTHM, RHYTHM * 2, MAJOR_RHYTHM ] ) {
			const value = isBefore
				? neighbor[ axis ] + neighbor[ sizeKey ] + gap
				: neighbor[ axis ] - gap - rect[ sizeKey ];

			if (
				value < 0 ||
				( axis === 'x' && value + rect.width > DESIGN_WIDTH )
			) {
				continue;
			}

			const distance = Math.abs( raw - value );
			if (
				distance <= SNAP_THRESHOLD &&
				( ! best || distance < best.distance )
			) {
				best = { value, distance, gap, side, neighbor };
			}
		}
	}

	return best;
}

/**
 * Resolves one frame of a drag into the position the block will land at.
 *
 * The magnets are tiered, strongest first: spacing intelligence (equal gaps,
 * a repeated gap, a rhythm gap), then alignment to another block's edges or
 * the canvas, then the quiet mesh. Only one tier may claim an axis, and the
 * guide line is reported only when an alignment magnet is what caught it —
 * nothing is drawn on screen until something is true.
 *
 * @param {Object}   options
 * @param {Object}   options.rect         The rect at its pick-up position.
 * @param {Object[]} options.others       Every other rect on the canvas.
 * @param {number}   options.canvasHeight Canvas height in design units.
 * @param {number}   options.rawX         Unsnapped target origin x.
 * @param {number}   options.rawY         Unsnapped target origin y.
 * @param {boolean}  options.movedX       Whether the pointer moved on x.
 * @param {boolean}  options.movedY       Whether the pointer moved on y.
 * @param {?string}  options.lockedAxis   'x' or 'y' to pin that axis.
 * @param {boolean}  options.freeform     Bypass every magnet.
 * @param {boolean}  options.lattice      Whether the lattice is on screen, and
 *                                        so whether its lines may capture.
 * @param {?number}  options.inkOffsetX   Visual centre offset for text.
 * @return {Object} The landing position, the guides, and which spacing
 *                  magnets are holding.
 */
export function resolveDragPosition( {
	rect,
	others = [],
	canvasHeight,
	rawX,
	rawY,
	movedX = true,
	movedY = true,
	lockedAxis = null,
	freeform = false,
	lattice = false,
	inkOffsetX = null,
} ) {
	const lockedX = lockedAxis === 'x';
	const lockedY = lockedAxis === 'y';

	const result = {
		x: rect.x,
		y: rect.y,
		guideX: null,
		guideY: null,
		equalX: false,
		equalY: false,
		repeatX: null,
		repeatY: null,
		rhythmX: null,
		rhythmY: null,
	};

	// Freeform drag answers to nothing but the pointer.
	if ( freeform ) {
		const free = constrainRect( {
			...rect,
			x: Math.round( rawX ),
			y: Math.round( rawY ),
		} );
		return { ...result, x: free.x, y: free.y };
	}

	const clamped = constrainRect( { ...rect, x: rawX, y: rawY } );
	const targetX = clamped.x;
	const targetY = clamped.y;

	const alignX = snapToAlignment(
		targetX,
		rect.width,
		getAlignmentCandidates( others, 'x', DESIGN_WIDTH ),
		inkOffsetX
	);
	const alignY = snapToAlignment(
		targetY,
		rect.height,
		getAlignmentCandidates( others, 'y', canvasHeight ),
		null
	);

	// The painted lattice is the middle tier: an alignment magnet beats it, but
	// a line the person can actually see beats the invisible mesh underneath.
	// Landing beside a drawn line, rather than on it, is the thing that makes a
	// canvas feel broken.
	const latticeX =
		lattice && ! alignX
			? snapToLattice(
					getAxisEdges( targetX, rect.width, inkOffsetX ),
					rect.width,
					'x'
				)
			: null;
	const latticeY =
		lattice && ! alignY
			? snapToLattice(
					getAxisEdges( targetY, rect.height ),
					rect.height,
					'y'
				)
			: null;

	const toMesh = ( value ) => Math.round( value / BASE_MESH ) * BASE_MESH;

	result.x = alignX
		? Math.round( alignX.value )
		: ( latticeX ?? toMesh( targetX ) );
	result.y = alignY
		? Math.round( alignY.value )
		: ( latticeY ?? toMesh( targetY ) );
	// A lattice line is already drawn, so it needs no guide of its own.
	result.guideX = alignX ? alignX.guide : null;
	result.guideY = alignY ? alignY.guide : null;

	// Spacing magnets read the raw pointer position and outrank alignment:
	// a nearby edge candidate must not make equal gaps unreachable.
	//
	// Neighbours are whatever surrounds the block where it is being *dropped*,
	// not where it was picked up. Measuring from the pick-up position means a
	// block dragged into a gap still believes it is back where it started, and
	// no spacing magnet ever engages.
	const neighbors = getNeighbors(
		{ ...rect, x: result.x, y: result.y },
		others
	);

	if ( ! lockedX && movedX ) {
		const equal = snapToEqualSpacing(
			rect.width,
			neighbors.left,
			neighbors.right,
			'x',
			targetX
		);
		if ( equal ) {
			result.x = equal.value;
			result.guideX = null;
			result.equalX = true;
		} else {
			const repeated = snapToRepeatedGap(
				rect,
				neighbors,
				others,
				'x',
				targetX
			);
			if ( repeated ) {
				result.x = repeated.value;
				result.guideX = null;
				result.repeatX = repeated;
			} else {
				const rhythm = snapToRhythmGap( rect, neighbors, 'x', targetX );
				if ( rhythm ) {
					result.x = rhythm.value;
					result.guideX = null;
					result.rhythmX = rhythm;
				}
			}
		}
	}

	if ( ! lockedY && movedY ) {
		const equal = snapToEqualSpacing(
			rect.height,
			neighbors.top,
			neighbors.bottom,
			'y',
			targetY
		);
		if ( equal ) {
			result.y = equal.value;
			result.guideY = null;
			result.equalY = true;
		} else {
			const repeated = snapToRepeatedGap(
				rect,
				neighbors,
				others,
				'y',
				targetY
			);
			if ( repeated ) {
				result.y = repeated.value;
				result.guideY = null;
				result.repeatY = repeated;
			} else {
				const rhythm = snapToRhythmGap( rect, neighbors, 'y', targetY );
				if ( rhythm ) {
					result.y = rhythm.value;
					result.guideY = null;
					result.rhythmY = rhythm;
				}
			}
		}
	}

	// An axis the pointer never moved is not being dragged: it keeps its exact
	// coordinate. Quantizing both axes meant a purely horizontal drag nudged a
	// block vertically, which reads as the canvas drifting under your hand.
	if ( lockedX || ! movedX ) {
		result.x = rect.x;
		result.guideX = null;
		result.equalX = false;
		result.repeatX = null;
		result.rhythmX = null;
	}
	if ( lockedY || ! movedY ) {
		result.y = rect.y;
		result.guideY = null;
		result.equalY = false;
		result.repeatY = null;
		result.rhythmY = null;
	}

	const constrained = constrainRect( {
		...rect,
		x: result.x,
		y: result.y,
	} );
	result.x = constrained.x;
	result.y = constrained.y;

	return result;
}

/**
 * The eight resize directions, as the sign of their effect on each axis.
 */
export const RESIZE_DIRECTIONS = {
	n: { x: 0, y: -1 },
	ne: { x: 1, y: -1 },
	e: { x: 1, y: 0 },
	se: { x: 1, y: 1 },
	s: { x: 0, y: 1 },
	sw: { x: -1, y: 1 },
	w: { x: -1, y: 0 },
	nw: { x: -1, y: -1 },
};

/**
 * Captures a resized edge, preferring an alignment candidate or a size-matching
 * magnet, then a drawn lattice line, then the mesh.
 *
 * @param {number}   position   The unsnapped edge position.
 * @param {number[]} candidates Alignment candidates.
 * @param {Object}   sizeTags   Map of candidate position to its label.
 * @param {boolean}  lattice    Whether the lattice is on screen.
 * @param {string}   axis       'x' or 'y'.
 * @return {{value: number, guide: ?number, label: ?string}} The captured edge.
 */
function snapResizeEdge( position, candidates, sizeTags, lattice, axis ) {
	let distance = SNAP_THRESHOLD + 1;
	let value = null;

	for ( const candidate of candidates ) {
		const candidateDistance = Math.abs( candidate - position );
		if ( candidateDistance < distance ) {
			distance = candidateDistance;
			value = candidate;
		}
	}

	if ( distance <= SNAP_THRESHOLD ) {
		const label = sizeTags[ value ] || null;
		// A size match is about the size, not about a line on the canvas, so
		// it gets a label instead of a guide.
		return { value, guide: label ? null : value, label };
	}

	if ( lattice ) {
		const line =
			axis === 'y'
				? snapToLatticeY( position )
				: snapToLatticeX( position );
		if ( Math.abs( line - position ) <= SNAP_THRESHOLD ) {
			// The line is already painted, so it needs no guide of its own.
			return { value: line, guide: null, label: null };
		}
	}

	return {
		value: Math.round( position / BASE_MESH ) * BASE_MESH,
		guide: null,
		label: null,
	};
}

/**
 * Resolves one frame of a resize into the rect the block will land at.
 *
 * Alongside the usual alignment candidates, a neighbour's width and height are
 * magnets too: "make the cards even" becomes a resize that stops by itself,
 * and the label says why it stopped.
 *
 * @param {Object}   options
 * @param {Object}   options.rect         The rect at its pick-up size.
 * @param {string}   options.direction    One of `RESIZE_DIRECTIONS`.
 * @param {Object[]} options.others       Every other rect on the canvas.
 * @param {number}   options.canvasHeight Canvas height in design units.
 * @param {number}   options.deltaX       Pointer travel on x, in design units.
 * @param {number}   options.deltaY       Pointer travel on y, in design units.
 * @param {boolean}  options.freeform     Bypass every magnet.
 * @param {boolean}  options.lattice      Whether the lattice is on screen, and
 *                                        so whether its lines may capture.
 * @return {Object} The resulting rect, the guides, and any size-match labels.
 */
export function resolveResize( {
	rect,
	direction,
	others = [],
	canvasHeight,
	deltaX = 0,
	deltaY = 0,
	freeform = false,
	lattice = false,
} ) {
	const dir = RESIZE_DIRECTIONS[ direction ];
	const next = { ...rect };
	let guideX = null;
	let guideY = null;
	let sizeLabelX = null;
	let sizeLabelY = null;

	const candidatesX = freeform
		? []
		: getAlignmentCandidates( others, 'x', DESIGN_WIDTH );
	const candidatesY = freeform
		? []
		: getAlignmentCandidates( others, 'y', canvasHeight );
	const sizeTagsX = {};
	const sizeTagsY = {};

	if ( ! freeform ) {
		for ( const other of others ) {
			if ( dir.x === 1 ) {
				candidatesX.push( rect.x + other.width );
				sizeTagsX[ rect.x + other.width ] = 'width';
			}
			if ( dir.x === -1 ) {
				candidatesX.push( rect.x + rect.width - other.width );
				sizeTagsX[ rect.x + rect.width - other.width ] = 'width';
			}
			if ( dir.y === 1 ) {
				candidatesY.push( rect.y + other.height );
				sizeTagsY[ rect.y + other.height ] = 'height';
			}
			if ( dir.y === -1 ) {
				candidatesY.push( rect.y + rect.height - other.height );
				sizeTagsY[ rect.y + rect.height - other.height ] = 'height';
			}
		}
	}

	if ( dir.x === 1 ) {
		const snapped = freeform
			? { value: rect.x + rect.width + deltaX, guide: null, label: null }
			: snapResizeEdge(
					rect.x + rect.width + deltaX,
					candidatesX,
					sizeTagsX,
					lattice,
					'x'
				);
		next.width = Math.max(
			MIN_SIZE,
			Math.min( DESIGN_WIDTH, snapped.value ) - rect.x
		);
		guideX = snapped.guide;
		sizeLabelX = snapped.label;
	} else if ( dir.x === -1 ) {
		const snapped = freeform
			? { value: rect.x + deltaX, guide: null, label: null }
			: snapResizeEdge(
					rect.x + deltaX,
					candidatesX,
					sizeTagsX,
					lattice,
					'x'
				);
		const edge = Math.max( 0, snapped.value );
		next.x = Math.min( edge, rect.x + rect.width - MIN_SIZE );
		next.width = rect.x + rect.width - next.x;
		guideX = snapped.guide;
		sizeLabelX = snapped.label;
	}

	if ( dir.y === 1 ) {
		const snapped = freeform
			? { value: rect.y + rect.height + deltaY, guide: null, label: null }
			: snapResizeEdge(
					rect.y + rect.height + deltaY,
					candidatesY,
					sizeTagsY,
					lattice,
					'y'
				);
		next.height = Math.max( MIN_SIZE, snapped.value - rect.y );
		guideY = snapped.guide;
		sizeLabelY = snapped.label;
	} else if ( dir.y === -1 ) {
		const snapped = freeform
			? { value: rect.y + deltaY, guide: null, label: null }
			: snapResizeEdge(
					rect.y + deltaY,
					candidatesY,
					sizeTagsY,
					lattice,
					'y'
				);
		const edge = Math.max( 0, snapped.value );
		next.y = Math.min( edge, rect.y + rect.height - MIN_SIZE );
		next.height = rect.y + rect.height - next.y;
		guideY = snapped.guide;
		sizeLabelY = snapped.label;
	}

	next.x = Math.round( next.x );
	next.y = Math.round( next.y );
	next.width = Math.round( next.width );
	next.height = Math.round( next.height );

	return {
		rect: constrainRect( next ),
		guideX,
		guideY,
		sizeLabelX,
		sizeLabelY,
	};
}

/**
 * The gaps worth putting a number on: to each neighbour, or to the canvas edge
 * where a side has no neighbour. Page margins are the distances people eyeball
 * most, so they are measured too.
 *
 * A gap on an axis where a guide line is live is skipped — a measurement line
 * drawn down the same column reads as the guide being broken.
 *
 * @param {Object}   options
 * @param {Object}   options.rect         The rect being measured from.
 * @param {Object[]} options.others       Every other rect on the canvas.
 * @param {number}   options.canvasHeight Canvas height in design units.
 * @param {boolean}  options.isEqualX     Mark the horizontal gaps equal.
 * @param {boolean}  options.isEqualY     Mark the vertical gaps equal.
 * @param {?number}  options.guideX       Live vertical guide, if any.
 * @param {?number}  options.guideY       Live horizontal guide, if any.
 * @return {Object[]} Labels, each with an axis, a start, a distance and the
 *                    cross-axis position to draw it at.
 */
export function getDistanceLabels( {
	rect,
	others = [],
	canvasHeight,
	isEqualX = false,
	isEqualY = false,
	guideX = null,
	guideY = null,
} ) {
	const neighbors = getNeighbors( rect, others );
	const labels = [];

	const isClearOfGuideY = ( position ) =>
		guideY === null || Math.abs( position - guideY ) > 12;
	const isClearOfGuideX = ( position ) =>
		guideX === null || Math.abs( position - guideX ) > 12;

	const addHorizontal = ( start, distance, at, isEqual ) => {
		if ( distance > MIN_LABELLED_GAP && isClearOfGuideY( at ) ) {
			labels.push( {
				axis: 'horizontal',
				start,
				distance,
				at,
				isEqual,
			} );
		}
	};
	const addVertical = ( start, distance, at, isEqual ) => {
		if ( distance > MIN_LABELLED_GAP && isClearOfGuideX( at ) ) {
			labels.push( { axis: 'vertical', start, distance, at, isEqual } );
		}
	};

	if ( neighbors.left ) {
		const { left } = neighbors;
		addHorizontal(
			left.x + left.width,
			rect.x - ( left.x + left.width ),
			( Math.max( rect.y, left.y ) +
				Math.min( rect.y + rect.height, left.y + left.height ) ) /
				2,
			isEqualX
		);
	} else {
		addHorizontal( 0, rect.x, rect.y + rect.height / 2, false );
	}

	if ( neighbors.right ) {
		const { right } = neighbors;
		addHorizontal(
			rect.x + rect.width,
			right.x - ( rect.x + rect.width ),
			( Math.max( rect.y, right.y ) +
				Math.min( rect.y + rect.height, right.y + right.height ) ) /
				2,
			isEqualX
		);
	} else {
		addHorizontal(
			rect.x + rect.width,
			DESIGN_WIDTH - ( rect.x + rect.width ),
			rect.y + rect.height / 2,
			false
		);
	}

	if ( neighbors.top ) {
		const { top } = neighbors;
		addVertical(
			top.y + top.height,
			rect.y - ( top.y + top.height ),
			( Math.max( rect.x, top.x ) +
				Math.min( rect.x + rect.width, top.x + top.width ) ) /
				2,
			isEqualY
		);
	} else {
		addVertical( 0, rect.y, rect.x + rect.width / 2, false );
	}

	if ( neighbors.bottom ) {
		const { bottom } = neighbors;
		addVertical(
			rect.y + rect.height,
			bottom.y - ( rect.y + rect.height ),
			( Math.max( rect.x, bottom.x ) +
				Math.min( rect.x + rect.width, bottom.x + bottom.width ) ) /
				2,
			isEqualY
		);
	} else {
		addVertical(
			rect.y + rect.height,
			canvasHeight - ( rect.y + rect.height ),
			rect.x + rect.width / 2,
			false
		);
	}

	return labels;
}
